import math
from fastapi import APIRouter, Depends, HTTPException, status 
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.complaint import Complaint
from app.models.user import User
from app.models.jurisdiction import Department, Municipality 
from app.api.auth import get_current_user
from app.schemas.complaint_schema import ComplaintCreate, ComplaintResponse
from app.services.ai_service import analyze_complaint_severity

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- HAVERSINE SPATIAL ENGINE ---
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000  
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint: ComplaintCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    print(f"--- NEW REPORT RECEIVED: Frontend sent '{complaint.category}' ---")
    
    # --- BUG FIX 1: SMART DEPARTMENT ROUTING ---
    # Try to find a partial match (e.g. "Infrastructure" matches "Roads & Infrastructure")
    matched_dept = db.query(Department).filter(
        Department.name.ilike(f"%{complaint.category}%")
    ).first()

    # THE SAFETY NET: If the frontend sends "General" or misses, force it to our test department!
    if not matched_dept:
        print("⚠️ Exact category not found, auto-correcting to Roads Department!")
        matched_dept = db.query(Department).filter(Department.name.ilike("%Roads%")).first()
        complaint.category = "Roads & Infrastructure" # Auto-correct the string

    dept_id = matched_dept.id if matched_dept else None

    # Default to Bengaluru South Zone 
    default_zone = db.query(Municipality).filter(Municipality.name == "Bengaluru South Zone").first()
    mun_id = default_zone.id if default_zone else None

    # --- BUG FIX 2: CLUSTER BY DEPARTMENT ID, NOT FRAGILE TEXT ---
    master_id = None
    if complaint.location_lat and complaint.location_lng:
        
        # Now we only check if they belong to the same department!
        active_masters = db.query(Complaint).filter(
            Complaint.department_id == dept_id,
            Complaint.parent_id == None,
            Complaint.status.in_(["Pending", "Submitted", "Assigned", "Open"])
        ).all()

        for master in active_masters:
            if master.location_lat and master.location_lng:
                distance = calculate_distance(
                    complaint.location_lat, complaint.location_lng,
                    master.location_lat, master.location_lng
                )
                
                if distance <= 50: 
                    print(f"⚠️ CLUSTER MATCH! Found identical incident #{master.id} just {int(distance)}m away.")
                    master.report_count += 1
                    master_id = master.id
                    db.commit() 
                    break 

    description_text = complaint.description 
    ai_calculated_severity = analyze_complaint_severity(description_text)

    new_complaint = Complaint(
        title=complaint.title,
        description=description_text,
        category=complaint.category, 
        address=getattr(complaint, 'address', getattr(complaint, 'location', "Location pending GPS")),
        location_lat=getattr(complaint, 'location_lat', None), 
        location_lng=getattr(complaint, 'location_lng', None),
        severity=ai_calculated_severity,  
        status="Open",
        user_id=current_user.id, 
        image_url=complaint.image_url,
        parent_id=master_id,
        department_id=dept_id,      
        municipality_id=mun_id      
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    return new_complaint

@router.get("/", response_model=List[ComplaintResponse])
def read_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() == "citizen":
        complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id).all()
    elif current_user.role.lower() in ["official", "worker"]:
        complaints = db.query(Complaint).filter(
            Complaint.parent_id == None,
            Complaint.municipality_id == current_user.municipality_id,
            Complaint.department_id == current_user.department_id
        ).all()
    else:
        complaints = db.query(Complaint).filter(Complaint.parent_id == None).all()
        
    return complaints

@router.post("/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int, 
    status: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the specific complaint
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Update the status
    complaint.status = status
    db.commit()
    db.refresh(complaint)
    
    return {"message": f"Task {complaint_id} marked as {status}", "status": status}
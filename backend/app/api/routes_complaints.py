import math
from fastapi import APIRouter, Depends, HTTPException, status 
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.complaint import Complaint
from app.models.user import User
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
    """Calculates the great-circle distance in meters between two GPS coordinates."""
    R = 6371000  # Radius of Earth in meters
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
    print("--- NEW CITIZEN REPORT RECEIVED ---")
    
    # 1. SPATIAL DEDUPLICATION (Look for existing Master Tickets)
    master_id = None
    if complaint.location_lat and complaint.location_lng:
        
        # Pull active master tickets in the same category
        active_masters = db.query(Complaint).filter(
            Complaint.category == complaint.category,
            Complaint.parent_id == None,
            Complaint.status.in_(["Pending", "Submitted", "Assigned"])
        ).all()

        for master in active_masters:
            if master.location_lat and master.location_lng:
                distance = calculate_distance(
                    complaint.location_lat, complaint.location_lng,
                    master.location_lat, master.location_lng
                )
                
                # If within 50 meters, we have a cluster!
                if distance <= 50: 
                    print(f"⚠️ CLUSTER MATCH! Found identical incident #{master.id} just {int(distance)}m away.")
                    master.report_count += 1
                    master_id = master.id
                    db.commit() # Save the incremented count on the master ticket
                    break # Stop searching, we found our cluster

    # 2. Wake up the AI! Pass the citizen's description to Hugging Face
    description_text = complaint.description 
    print("Asking AI to analyze severity...")
    ai_calculated_severity = analyze_complaint_severity(description_text)
    print(f"AI returned severity: {ai_calculated_severity}")

    # 3. Save to the database
    new_complaint = Complaint(
        title=complaint.title,
        description=description_text,
        category=complaint.category, 
        address=getattr(complaint, 'address', getattr(complaint, 'location', "Location pending GPS")),
        location_lat=getattr(complaint, 'location_lat', None), 
        location_lng=getattr(complaint, 'location_lng', None),
        severity=ai_calculated_severity,  
        status="Pending",
        user_id=current_user.id, 
        image_url=complaint.image_url,
        parent_id=master_id # If a match was found, this safely hides the new ticket as a child!
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
        # Citizens can see ALL their own reports to track personal history
        complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id).all()
    else:
        # DEPARTMENTS/ADMINS: Filter out the duplicates! Only show Master Tickets.
        complaints = db.query(Complaint).filter(Complaint.parent_id == None).all()
        
    return complaints
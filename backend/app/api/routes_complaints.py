from fastapi import APIRouter, Depends, HTTPException, status 
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.complaint import Complaint
from app.models.user import User
# FIXED: The import now correctly points to your api/auth.py file!
from app.api.auth import get_current_user
from app.schemas.complaint_schema import ComplaintCreate, ComplaintResponse
from app.services.ai_service import analyze_complaint_severity

router = APIRouter()

# This is our database bouncer: it opens a connection for the request and closes it after
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint: ComplaintCreate, 
    db: Session = Depends(get_db),
    # ACTIVATED: We now securely identify the user submitting the form!
    current_user: User = Depends(get_current_user) 
):
    print("--- NEW CITIZEN REPORT RECEIVED ---")
    
    # Wake up the AI! Pass the citizen's description to Hugging Face
    description_text = complaint.description 
    print("Asking AI to analyze severity...")
    
    ai_calculated_severity = analyze_complaint_severity(description_text)
    
    print(f"AI returned severity: {ai_calculated_severity}")

    # Save to the database using the AI's decision
    new_complaint = Complaint(
        title=complaint.title,
        description=description_text,
        category=complaint.category, 
        address=getattr(complaint, 'address', getattr(complaint, 'location', "Location pending GPS")),
        severity=ai_calculated_severity,  
        status="Pending",
        user_id=current_user.id, # <--- CHANGED: Now saves to the actual logged-in user!
        image_url=complaint.image_url
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    return new_complaint


@router.get("/", response_model=List[ComplaintResponse])
def read_complaints(
    db: Session = Depends(get_db),
    # ADDED: Backend now demands a secure token to read the database
    current_user: User = Depends(get_current_user)
):
    # Filter strictly for Citizen accounts
    if current_user.role.lower() == "citizen":
        complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id).all()
    # Admins, Depts, and Workers need to see all records to manage the city
    else:
        complaints = db.query(Complaint).all()
        
    return complaints
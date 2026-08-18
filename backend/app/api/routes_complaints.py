# 1. FIX: Added 'status' to the import list right here!
from fastapi import APIRouter, Depends, HTTPException, status 
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.complaint import Complaint
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
    # 2. FIX: We are using your Pydantic schema now instead of a plain dict!
    complaint: ComplaintCreate, 
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user) # Keep this disabled for now
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
        category=complaint.category, # <--- THIS IS THE MISSING PIECE! 🧩
        # Using getattr as a safety net in case your schema uses 'location' instead of 'address'
        address=getattr(complaint, 'address', getattr(complaint, 'location', "Location pending GPS")),
        severity=ai_calculated_severity,  # <--- The AI is now in control of this field!
        status="Pending",
        user_id=1, # Fake test user ID until Phase 6
        image_url=complaint.image_url
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    return new_complaint

@router.get("/", response_model=List[ComplaintResponse])
def read_complaints(db: Session = Depends(get_db)):
    # This fetches every complaint in the vault and sends it back to the frontend
    complaints = db.query(Complaint).all()
    return complaints
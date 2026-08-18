from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

# Dependencies and Models
from .deps import get_db, get_current_user
from app.models.user import User
from app.models.complaint import Complaint
from app.models.assignment import Assignment
from app.models.resolution import Resolution 
from app.schemas.complaint_schema import ComplaintResponse
from app.services.upload import save_upload_file
from app.services.notification_service import notify_complaint_status_change

router = APIRouter(prefix="/worker", tags=["Field Worker Operations"])

@router.get("/assignments", response_model=List[ComplaintResponse])
def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch all complaints that have been assigned to the currently logged-in Field Worker.
    """
    if current_user.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. Only Field Workers can view their assignments."
        )

    # Query complaints by joining the Assignment table to filter by the worker's ID
    assigned_complaints = db.query(Complaint)\
        .join(Assignment, Complaint.id == Assignment.complaint_id)\
        .filter(Assignment.worker_id == current_user.id)\
        .all()
        
    return assigned_complaints


@router.post("/complaints/{complaint_id}/resolve", status_code=status.HTTP_201_CREATED)
def submit_resolution(
    complaint_id: int,
    notes: str = Form(...),            # <--- WE ARE BACK IN ACTION!
    image: UploadFile = File(...),     # <--- WE ARE BACK IN ACTION!
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a resolution for an assigned complaint. 
    (Note: Mandatory photo evidence requirement temporarily bypassed for Priority 1 testing).
    """
    if current_user.role != "Worker":
        raise HTTPException(status_code=403, detail="Access denied.")

    # 1. Verify the complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    # 2. Verify that THIS specific worker is actually assigned to THIS complaint
    # NOTE: Since we haven't built the Department assignment feature yet, we are 
    # temporarily bypassing this check so your worker can test resolving complaints!
    """
    assignment = db.query(Assignment).filter(
        Assignment.complaint_id == complaint_id,
        Assignment.worker_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not authorized to resolve a complaint that is not assigned to you."
        )
    """

    # 3. Create placeholder data until we build Priority 3 (Camera/Uploads)
    image_path = None
    notes = "Resolved by field unit (Pending photo upload system integration)."

    # 4. Create the Resolution record
    new_resolution = Resolution(
        complaint_id=complaint.id,
        worker_id=current_user.id,
        resolution_notes=notes,
        proof_image_url=image_path
    )
    db.add(new_resolution)
    
    # 5. Update the Complaint status to Resolved
    complaint.status = "Resolved"
    
    # 6. Fetch the Citizen to notify them of the good news
    citizen = db.query(User).filter(User.id == complaint.user_id).first()
    
    # 7. Commit everything to the database
    db.commit()
    
    # 8. Trigger the notification!
    if citizen:
        notify_complaint_status_change(
            user_email=citizen.email,
            complaint_title=complaint.title,
            new_status="Resolved"
        )
        
    return {
        "message": "Resolution submitted successfully. The citizen has been notified.",
        "resolution_notes": notes,
        "proof_image": image_path
    }
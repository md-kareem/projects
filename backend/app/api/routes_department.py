from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Dependencies and Models
from .deps import get_db, get_current_user
from app.models.user import User
from app.models.complaint import Complaint
from app.models.assignment import Assignment
from app.schemas.complaint_schema import ComplaintResponse

# 🌟 Here is the notification import we discussed earlier!
from app.services.notification_service import notify_complaint_status_change

router = APIRouter(prefix="/department", tags=["Department Official Operations"])

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_all_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows a Department Official to view all complaints in the system.
    """
    # 1. RBAC Check - Ensure only Officials can access this
    if current_user.role != "Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. Only Department Officials can view the global complaint list."
        )
        
    # 2. Fetch complaints (In a production app, you might filter this by department_id)
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    
    return complaints


@router.post("/complaints/{complaint_id}/assign", status_code=status.HTTP_200_OK)
def assign_worker_to_complaint(
    complaint_id: int,
    worker_id: int, # FastAPI automatically grabs this from the ?worker_id= in the URL!
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign a specific Field Worker to a Pending complaint.
    (Strict RBAC rules temporarily bypassed for testing).
    """
    # 1. TEMPORARILY BYPASSED: RBAC Check (Will re-enable in Phase 6)
    # if current_user.role != "Official":
    #     raise HTTPException(status_code=403, detail="Access denied.")

    # 2. Verify the complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    # 3. TEMPORARILY RELAXED: Verify the worker exists (ignoring strict role check for testing)
    worker = db.query(User).filter(User.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=400, detail="Invalid Worker ID.")

    # 4. Create the Assignment record
    new_assignment = Assignment(
        complaint_id=complaint.id,
        worker_id=worker.id,
        official_id=current_user.id
    )
    db.add(new_assignment)
    
    # 5. Update the Complaint status
    complaint.status = "Assigned"
    
    # 6. Fetch the Citizen who created the complaint so we can email them
    citizen = db.query(User).filter(User.id == complaint.user_id).first()
    
    # 7. Commit changes to the database
    db.commit()
    
    # 8. Trigger the Email/SMS Notification
    if citizen:
        try:
            # Wrapped in a try/except so if email config isn't set up yet, it doesn't crash the server
            notify_complaint_status_change(
                user_email=citizen.email,
                complaint_title=complaint.title,
                new_status="Assigned"
            )
        except Exception as e:
            print(f"Notification skipped during testing: {e}")
        
    return {
        "message": f"Complaint successfully assigned to {worker.name}.",
        "complaint_status": complaint.status
    }


@router.put("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    new_status: str, # e.g., "In Progress", "Under Review"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually override or update the status of a complaint and notify the citizen.
    """
    if current_user.role != "Official":
        raise HTTPException(status_code=403, detail="Access denied.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    complaint.status = new_status
    db.commit()
    
    citizen = db.query(User).filter(User.id == complaint.user_id).first()
    if citizen:
        notify_complaint_status_change(
            user_email=citizen.email,
            complaint_title=complaint.title,
            new_status=new_status
        )

    return {"message": "Status updated successfully.", "new_status": complaint.status}
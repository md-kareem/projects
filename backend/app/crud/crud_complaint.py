from sqlalchemy.orm import Session
from typing import Optional

# These will be built soon in the models/ and schemas/ directories
from app.models.complaint import Complaint
from app.schemas.complaint_schema import ComplaintCreate

def create_complaint(db: Session, complaint: ComplaintCreate, user_id: int, image_url: str, category: str):
    """
    Insert a new civic issue into the database.
    """
    db_complaint = Complaint(
        title=complaint.title,
        description=complaint.description,
        location_lat=complaint.location_lat,
        location_lng=complaint.location_lng,
        address=complaint.address,
        image_url=image_url,
        category=category,
        user_id=user_id,
        status="Submitted"
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def get_complaint(db: Session, complaint_id: int):
    """
    Fetch a single complaint by its ID.
    """
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()

def get_all_complaints(db: Session, skip: int = 0, limit: int = 100):
    """
    Fetch all complaints for the admin dashboard.
    """
    return db.query(Complaint).offset(skip).limit(limit).all()

def get_complaints_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 10):
    """
    Fetch the complaint history for a specific citizen.
    """
    return db.query(Complaint).filter(Complaint.user_id == user_id).offset(skip).limit(limit).all()

def get_complaints_by_department(db: Session, department_id: int, status: Optional[str] = None, skip: int = 0, limit: int = 50):
    """
    Fetch complaints routed to a specific department, optionally filtered by status.
    """
    query = db.query(Complaint).filter(Complaint.department_id == department_id)
    if status:
        query = query.filter(Complaint.status == status)
    return query.offset(skip).limit(limit).all()

def get_complaints_by_worker(db: Session, worker_id: int, skip: int = 0, limit: int = 50):
    """
    Fetch complaints assigned to a specific field worker.
    """
    return db.query(Complaint).filter(Complaint.worker_id == worker_id).offset(skip).limit(limit).all()

def update_complaint_status(db: Session, complaint_id: int, new_status: str, worker_id: Optional[int] = None):
    """
    Update the status of a complaint (e.g., Assigned, In Progress, Resolved).
    Can also be used to assign a worker.
    """
    db_complaint = get_complaint(db, complaint_id)
    if db_complaint:
        db_complaint.status = new_status
        if worker_id:
            db_complaint.worker_id = worker_id
        db.commit()
        db.refresh(db_complaint)
    return db_complaint

def get_total_count(db: Session):
    """
    Get the total number of complaints for analytics.
    """
    return db.query(Complaint).count()

def get_resolved_count(db: Session):
    """
    Get the total number of resolved complaints for analytics.
    """
    return db.query(Complaint).filter(Complaint.status == "Resolved").count()
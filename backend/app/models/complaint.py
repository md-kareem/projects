from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, default="Unclassified")
    
    # Location data
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Status & Triage
    category = Column(String, index=True, nullable=False) 
    status = Column(String, default="Submitted", index=True) 
    priority = Column(String, default="Medium", index=True) 
    
    # Clustering Engine
    parent_id = Column(Integer, ForeignKey("complaints.id"), nullable=True) 
    report_count = Column(Integer, default=1) 

    # --- PHASE 4: HIERARCHICAL ROUTING ---
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # The Citizen who reported it
    
    # The Backend will auto-fill these based on GPS (Municipality) and Category (Department)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # The specific worker assigned to fix the issue (Assigned by the Officer)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

# Import the Base class from database.py
from app.db.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, default="Unclassified")
    
    # Location data for mapping the issues
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    
    # Media evidence
    image_url = Column(String, nullable=True)
    
    # Categorization, tracking, and AI Triage
    category = Column(String, index=True, nullable=False) # e.g., Road, Water, Electricity
    status = Column(String, default="Submitted", index=True) # e.g., Submitted, Assigned, Resolved
    priority = Column(String, default="Medium", index=True) # ⚡ AI Priority Engine score (High, Medium, Low)
    
    # Foreign Keys linking to other tables
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps to track the lifecycle of the complaint
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ---------------------------------------------------------
    # Relationships (Uncomment once User, Department, and Assignment models are built)
    # ---------------------------------------------------------
    # user = relationship("User", foreign_keys=[user_id], back_populates="complaints_submitted")
    # worker = relationship("User", foreign_keys=[worker_id], back_populates="complaints_assigned")
    # department = relationship("Department", back_populates="complaints")
    # assignments = relationship("Assignment", back_populates="complaint")
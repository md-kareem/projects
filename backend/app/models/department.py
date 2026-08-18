from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

# Import the Base class from database.py
from app.db.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Department details (e.g., "Roads & Traffic", "Water Supply")
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    # ---------------------------------------------------------
    # Relationships (Uncomment once User and Complaint models are built)
    # ---------------------------------------------------------
    # complaints = relationship("Complaint", back_populates="department")
    # users = relationship("User", back_populates="department")
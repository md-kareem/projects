from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal

# Import ALL models so SQLAlchemy registers every table in metadata
from app.models.user import User
from app.models.department import Department
from app.models.complaint import Complaint
from app.models.assignment import Assignment
from app.models.feedback import Feedback
from app.models.resolution import Resolution

from app.services.auth import get_password_hash

# Create all tables in the database based on your SQLAlchemy models
def init_db(db: Session) -> None:
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Check if a default admin already exists to prevent duplicate seeding
    admin_user = db.query(User).filter(User.email == "admin@smartcity.com").first()
    if not admin_user:
        print("🌱 Seeding initial database records...")
        
        # Create default users for testing all roles (using full_name)
        users = [
            User(
                full_name="System Admin",
                email="admin@smartcity.com",
                hashed_password=get_password_hash("adminpassword123"),
                role="Official"
            ),
            User(
                full_name="Road Department Official",
                email="official@smartcity.com",
                hashed_password=get_password_hash("officialpassword123"),
                role="Official"
            ),
            User(
                full_name="John Worker",
                email="worker@smartcity.com",
                hashed_password=get_password_hash("workerpassword123"),
                role="Worker"
            ),
            User(
                full_name="Jane Citizen",
                email="citizen@smartcity.com",
                hashed_password=get_password_hash("citizenpassword123"),
                role="Citizen"
            ),
        ]
        
        db.add_all(users)
        db.commit()
        print("Database seeded successfully with test users!")
    else:
        print("Database already initialized. Skipping seed data.")

if __name__ == "__main__":
    print("Initializing database tables...")
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
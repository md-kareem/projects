import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.complaint import Complaint
from app.models.department import Department
from app.models.assignment import Assignment
from app.models.feedback import Feedback
from app.models.resolution import Resolution

# Rebuild all database tables based on your models
Base.metadata.create_all(bind=engine)

# Set up the password hasher (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_database():
    print("Connecting to the database...")
    db: Session = SessionLocal()
    
    try:
        # ---------------------------------------------------------
        # 1. SEED USERS (Role-Based Access Control)
        # ---------------------------------------------------------
        test_users = [
            {"email": "admin@smartcity.com", "full_name": "Admin User", "password": "password123", "role": "Admin"},
            {"email": "official@smartcity.com", "full_name": "City Official", "password": "password123", "role": "Official"},
            {"email": "worker@smartcity.com", "full_name": "Field Worker", "password": "password123", "role": "Worker"},
            {"email": "citizen@smartcity.com", "full_name": "Local Citizen", "password": "password123", "role": "Citizen"},
        ]

        # Dictionary to store created users so we can link complaints to them
        created_users = {}

        print("Seeding users...")
        for user_data in test_users:
            # Check if user already exists to make the script idempotent
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()

            # We use .get() here to safely grab the name, defaulting to "System User" if missing
            display_name = user_data.get("full_name") or user_data.get("username") or "System User"
    
            # Hash the exact 11-character string "password123"
            safe_hash = get_password_hash(user_data["password"])

            if not existing_user:
                # User does not exist, create a brand new one
                new_user = User(
                    email=user_data["email"],
                    full_name=display_name,
                    hashed_password=safe_hash,
                    role=user_data["role"]
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                created_users[user_data["role"]] = new_user
                print(f"  [+] Created {user_data['role']}: {user_data['email']}")
                
            else: # <--- FIXED INDENTATION: Now aligned perfectly with the 'if' statement!
                # User exists, but might have corrupted data. 
                # Force the database to overwrite the old passcode with the new safe_hash!
                existing_user.hashed_password = safe_hash
                existing_user.full_name = display_name
                existing_user.role = user_data["role"]
        
                db.commit()
                db.refresh(existing_user)
                created_users[user_data["role"]] = existing_user
                print(f"  [*] Repaired & Updated {user_data['role']}: {user_data['email']}")

        # ---------------------------------------------------------
        # 2. SEED COMPLAINTS (AI Triage Examples)
        # ---------------------------------------------------------
        # We assign these to the Citizen we just created
        citizen_id = created_users["Citizen"].id

        test_complaints = [
            {
                "title": "Massive pothole on 5th Avenue",
                "description": "There is a deep pothole in the right lane causing traffic slowdowns and vehicle damage.",
                "category": "Infrastructure",      # AI Classification mock
                "severity": "High",                # AI Classification mock
                "status": "Open",
                "user_id": citizen_id              # Updated to match backend expectations
            },
            {
                "title": "Broken streetlights in park",
                "description": "Three consecutive streetlights are out in the north end of the city park, creating a safety hazard.",
                "category": "Electrical",          # AI Classification mock
                "severity": "Medium",              # AI Classification mock
                "status": "Assigned",
                "user_id": citizen_id              # Updated to match backend expectations
            },
            {
                "title": "Graffiti on bus stop",
                "description": "Someone spray-painted the glass at the main street bus shelter.",
                "category": "Vandalism",           # AI Classification mock
                "severity": "Low",                 # AI Classification mock
                "status": "Resolved",
                "user_id": citizen_id              # Updated to match backend expectations
            }
        ]

        print("\nSeeding complaints...")
        for complaint_data in test_complaints:
            existing_complaint = db.query(Complaint).filter(Complaint.title == complaint_data["title"]).first()
            if not existing_complaint:
                new_complaint = Complaint(**complaint_data)
                db.add(new_complaint)
                print(f"  [+] Created complaint: {complaint_data['title']}")
            else:
                print(f"  [-] Complaint '{complaint_data['title']}' already exists, skipping.")
        
        db.commit()
        print("\nDatabase seeding completed successfully!")

    except Exception as e:
        print(f"\nAn error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
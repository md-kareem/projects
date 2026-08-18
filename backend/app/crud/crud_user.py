from sqlalchemy.orm import Session
from typing import Optional

# These will be built soon in the models/ and schemas/ directories
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.security import get_password_hash

def get_user(db: Session, user_id: int):
    """
    Fetch a single user by their ID.
    """
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """
    Fetch a user by email. This is essential for the login/authentication process.
    """
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate, role: str = "Citizen"):
    """
    Create a new user. The password is hashed before saving to the database.
    By default, new sign-ups are assigned the 'Citizen' role.
    """
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def get_users(db: Session, role_filter: Optional[str] = None, skip: int = 0, limit: int = 100):
    """
    Fetch all users for the admin dashboard, with an optional filter for specific roles.
    """
    query = db.query(User)
    if role_filter:
        query = query.filter(User.role == role_filter)
        
    return query.offset(skip).limit(limit).all()

def update_user_role(db: Session, user_id: int, new_role: str, department_id: Optional[int] = None):
    """
    Used by an Admin to promote/change a user's role and optionally assign them to a department.
    """
    db_user = get_user(db, user_id)
    if db_user:
        db_user.role = new_role
        if department_id is not None:
            db_user.department_id = department_id
            
        db.commit()
        db.refresh(db_user)
        
    return db_user
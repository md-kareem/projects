from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Import database dependency
from app.db.database import get_db

# Import models and schemas
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, Token

# Import your specific Engine!
from app.services import auth as auth_service

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new user in the database with a securely hashed password.
    """
    # 1. Check if the email is already registered
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Hash the raw password using your services/auth.py engine
    hashed_pw = auth_service.get_password_hash(user.password)
    
    # 3. Create the Database User object
    new_user = User(
        email=user.email,
        hashed_password=hashed_pw,
        full_name=user.full_name,
        phone_number=user.phone_number,
        role=user.role,
        department_id=user.department_id
    )
    
    # 4. Save to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 5. Return the user (Pydantic will automatically strip the password here!)
    return new_user


@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Verifies credentials and hands out the Golden Ticket (JWT).
    """
    # OAuth2 strictly uses 'username' in its form structure, but we capture the email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # 1. If user doesn't exist OR password shredder doesn't match, block them!
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 2. If they pass, mint the Golden Ticket!
    # Using your services/auth.py token generator
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    # 3. Hand the ticket to the frontend
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
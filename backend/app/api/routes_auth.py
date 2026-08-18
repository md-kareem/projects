from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# 1. Updated imports to match our established project structure
from app.api.deps import get_db
from app.schemas.user_schema import UserCreate, UserResponse, Token
from app.models.user import User
from app.services.auth import get_password_hash, verify_password, create_access_token
from backend.app.models import user

# Set up the router with a clean prefix
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (Citizen, Department Official, Field Worker, or Admin).
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in the system.",
        )
    
    # Hash the password before saving
    hashed_pwd = get_password_hash(user_in.password)
    
    # Create the new user and save to database
    # FIXED: Changed 'name' to 'full_name' to match our Pydantic schema and Database model
    new_user = User(
        full_name=user_in.full_name, 
        email=user_in.email,
        password_hash=hashed_pwd,
        role=user_in.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login. 
    Verifies credentials and returns a JWT access token for future API requests.
    """
    # Authenticate the user (Note: OAuth2 uses 'username', but we will pass the email here)
    user = db.query(User).filter(User.email == form_data.username).first()

    if len(form_data.password) > 72:
       raise HTTPException(status_code=401, detail="Invalid identification or passcode.")
    
    # 3. Use our verify_password service function
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 4. Generate the JWT Token, embedding the user's email and role
    # matching the format required by our create_access_token function
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

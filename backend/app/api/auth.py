from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import random

# Import database dependency
from app.db.database import get_db

# Import models and schemas
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, Token

# Import your Security Engine and Email Service
from app.services import auth as auth_service
from app.services import email_service


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ---------------------------------------------------------
# 2FA LOGIN OTP STORAGE
# ---------------------------------------------------------
OTP_STORE = {}

class OTPVerifyRequest(BaseModel):
    email: str
    otp_code: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Security guard that intercepts requests, reads JWT, and fetches the user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pw = auth_service.get_password_hash(user.password)
    
    new_user = User(
        email=user.email,
        hashed_password=hashed_pw,
        full_name=user.full_name,
        phone_number=user.phone_number,
        role=user.role,
        department_id=user.department_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # --- 2FA INTERCEPTOR (CITIZENS ONLY) ---
    if user.role.lower() == "citizen" and user.email != "citizen@smartcity.com":
        otp_code = email_service.generate_otp()
        
        OTP_STORE[user.email] = {
            "code": otp_code,
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        }
        
        print(f"--- ⚠️ DEV MODE: Generated OTP for {user.email} is {otp_code} ---")
        email_service.send_otp_email(user.email, otp_code)
        
        return {
            "message": "2FA Verification Required",
            "require_2fa": True,
            "email": user.email
        }

    # --- IMMEDIATE ACCESS ---
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role, "full_name": user.full_name}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/verify-otp", response_model=Token)
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Step 2 of 2FA Login"""
    stored_data = OTP_STORE.get(request.email)
    
    if not stored_data:
        raise HTTPException(status_code=400, detail="OTP expired or no active request found.")
        
    if datetime.utcnow() > stored_data["expires_at"]:
        del OTP_STORE[request.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please log in again.")
        
    if stored_data["code"] != request.otp_code:
        raise HTTPException(status_code=401, detail="Invalid verification code.")
        
    del OTP_STORE[request.email]
    
    user = db.query(User).filter(User.email == request.email).first()
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role, "full_name": user.full_name}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ---------------------------------------------------------
# PASSWORD RECOVERY SYSTEM
# ---------------------------------------------------------
otp_vault = {} 

class PasswordRecoveryRequest(BaseModel):
    email: str

# RENAMED to avoid clashing with 2FA Login schema
class RecoveryOTPVerifyRequest(BaseModel):
    email: str
    otp: str

@router.post("/forgot-password")
def forgot_password(request: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if user:
        # 1. Use your existing email service to generate the code
        otp = email_service.generate_otp()
        
        # 2. Store it in the vault
        otp_vault[request.email] = otp
        
        # 3. DISPATCH THE REAL EMAIL!
        print(f"--- ⚠️ DEV MODE: Generated Password Recovery OTP for {user.email} is {otp} ---")
        try:
            # Re-using the exact same function that works for your 2FA!
            email_service.send_otp_email(user.email, otp)
            print(f"--- OTP securely routed to {request.email} ---")
        except Exception as e:
            print(f"🚨 Email Delivery Failed: {str(e)}")
    
    return {"message": "Protocol Dispatched"}

# RENAMED route to avoid clashing with 2FA Login route
class PasswordResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/reset-password")
def reset_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    # 1. Verify the OTP is correct
    valid_otp = otp_vault.get(request.email)
    
    if not valid_otp or valid_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired secure code."
        )
        
    # 2. Find the user in the database
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in registry.")
        
    # 3. Hash the new password and save it
    user.hashed_password = auth_service.get_password_hash(request.new_password)
    db.commit()
    
    # 4. Clean up the OTP vault so the code can't be reused
    del otp_vault[request.email]
    
    return {"message": "Passcode successfully updated", "status": "success"}
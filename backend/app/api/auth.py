from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

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
# MVP OTP Storage (In-Memory Dictionary)
# In production, this moves to Redis or a Database table
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
    """
    Verifies credentials. Forces 2FA for Citizens, bypasses 2FA for internal staff and test accounts.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # --- 2FA INTERCEPTOR (CITIZENS ONLY) ---
    # FIX: We explicitly bypass 2FA for your fake seed account!
    if user.role.lower() == "citizen" and user.email != "citizen@smartcity.com":
        otp_code = email_service.generate_otp()
        
        OTP_STORE[user.email] = {
            "code": otp_code,
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        }
        
        # PRO-TIP: Print the OTP to your backend terminal! 
        # If you ever use another fake email, you can just read the code here.
        print(f"--- ⚠️ DEV MODE: Generated OTP for {user.email} is {otp_code} ---")
        
        email_service.send_otp_email(user.email, otp_code)
        
        return {
            "message": "2FA Verification Required",
            "require_2fa": True,
            "email": user.email
        }

    # --- IMMEDIATE ACCESS (ADMIN / DEPT / WORKER / SEED ACCOUNTS) ---
    # Internal staff AND your seed account bypass the OTP and immediately receive the Golden Ticket
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/verify-otp", response_model=Token)
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Step 2 of 2FA: Validates the 6-digit code and releases the JWT Access Token.
    """
    stored_data = OTP_STORE.get(request.email)
    
    if not stored_data:
        raise HTTPException(status_code=400, detail="OTP expired or no active request found.")
        
    # Enforce the 5-minute expiration rule
    if datetime.utcnow() > stored_data["expires_at"]:
        del OTP_STORE[request.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please log in again.")
        
    # Validate the code
    if stored_data["code"] != request.otp_code:
        raise HTTPException(status_code=401, detail="Invalid verification code.")
        
    # Code is valid! Clean up the store to prevent reuse
    del OTP_STORE[request.email]
    
    # Mint and release the Golden Ticket (JWT)
    user = db.query(User).filter(User.email == request.email).first()
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
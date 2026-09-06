from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext

# ---------------------------------------------------------
# Security Configuration
# ---------------------------------------------------------
SECRET_KEY = "your-super-secret-key-for-bca-project-do-not-share"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token stays valid for 24 hours

# Set up the Bcrypt hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------
# Password Hashing & Verification
# ---------------------------------------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compares the raw password from the login form against the scrambled 
    password saved in the database.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Scrambles a raw password before saving it to the database for the first time.
    Automatically truncates passwords longer than 72 bytes to comply with bcrypt limits.
    """
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

# ---------------------------------------------------------
# JWT Token Generation
# ---------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a secure JSON Web Token containing user info (like their ID and Role).
    The frontend will attach this token to future requests to prove who they are.
    """
    # Make a copy of the data (e.g., {"sub": "user@email.com", "role": "Citizen"})
    to_encode = data.copy()
    
    # Calculate exactly when this token should expire using your global variable
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # CHANGED: Now correctly uses your 24-hour variable instead of a hardcoded 15 minutes
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    # Add the expiration time to the token's data payload
    to_encode.update({"exp": expire})
    
    # Cryptographically sign the token using our SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt
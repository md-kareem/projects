from datetime import datetime, timedelta, timezone
from typing import Any, Union
import jwt  # Swapped from 'jose' to the standard 'pyjwt' we installed
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Import our settings from config.py
from app.core.config import settings

# Setup for Password Hashing using Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Setup for OAuth2 token extraction from the request header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the provided password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a plain text password."""
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], role: str, expires_delta: timedelta = None) -> str:
    """Generate a JWT token containing the user's ID and Role."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # The payload we embed inside the token
    to_encode = {"exp": expire, "sub": str(subject), "role": role}
    
    # Create the token using the secret key from our .env file
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# --- Role-Based Dependency Injections ---

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Extracts the user data from the JWT token.
    (Later, we will connect this to the database to fetch the full user object).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
    except jwt.InvalidTokenError:  # Updated to use pyjwt's specific exception
        raise credentials_exception
    
    # Mocking a user object for now until our Database models are ready
    class MockUser:
        def __init__(self, id, role):
            self.id = int(id)
            self.role = role

    return MockUser(id=user_id, role=role)

def get_current_citizen(current_user = Depends(get_current_user)):
    if current_user.role != "Citizen" and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not enough privileges. Citizen access required.")
    return current_user

def get_current_department_official(current_user = Depends(get_current_user)):
    if current_user.role != "Official" and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not enough privileges. Department access required.")
    return current_user

def get_current_field_worker(current_user = Depends(get_current_user)):
    if current_user.role != "Worker" and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not enough privileges. Worker access required.")
    return current_user

def get_current_admin(current_user = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not enough privileges. Admin access required.")
    return current_user
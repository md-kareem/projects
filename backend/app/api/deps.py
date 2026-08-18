from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.user import User
from app.services.auth import SECRET_KEY, ALGORITHM

# This tells FastAPI's Swagger UI where to send login requests
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Dependency 1: Get a database session for a request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency 2: Read the JWT token and return the logged-in user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token to see who it belongs to
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    # Find the user in the database
    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception
        
    return user

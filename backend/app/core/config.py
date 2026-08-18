import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT Security Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Database Settings
    DATABASE_URL: str
    
    # Cloudinary Settings
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # AI Model Settings
    HF_TOKEN: Optional[str] = None

    class Config:
        # Tells Pydantic to read from the .env file
        env_file = ".env"
        # Tells Pydantic to safely ignore any extra/unrecognized environment variables
        extra = "ignore"

# Create a global instance of the settings to use across the app
settings = Settings()

# --- BRIDGE FOR HUGGING FACE ---
# This takes the token from your .env file and hands it directly to your operating 
# system so the Hugging Face transformers library can find and use it.
if settings.HF_TOKEN:
    os.environ["HF_TOKEN"] = settings.HF_TOKEN
import os
import shutil
import uuid
from fastapi import UploadFile

# Define the root directory where all uploaded files will be stored.
# In a production app, this might be an AWS S3 bucket, but for this project, 
# storing them in a local folder is perfect.
UPLOAD_DIR = "uploads"

# Ensure the upload directory exists when the application starts
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_upload_file(upload_file: UploadFile, subfolder: str = "general") -> str:
    """
    Saves an uploaded file to the server and returns the file path.
    
    :param upload_file: The FastAPI UploadFile object containing the image.
    :param subfolder: An optional folder name to keep things organized (e.g., 'complaints' or 'resolutions').
    :return: The relative path to the saved file (to be stored in the database).
    """
    # 1. Ensure the specific subfolder exists (e.g., uploads/complaints)
    target_dir = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(target_dir, exist_ok=True)
    
    # 2. Extract the file extension (e.g., '.jpg', '.png')
    # If the file has no extension, we default to empty string
    file_extension = ""
    if "." in upload_file.filename:
        file_extension = f".{upload_file.filename.split('.')[-1]}"
        
    # 3. Generate a completely unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # 4. Construct the full file path where the image will be saved
    file_path = os.path.join(target_dir, unique_filename)
    
    # 5. Save the file to the disk using shutil (efficient streaming)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    # 6. Return the path so we can save it in the database 
    # (Using forward slashes so the URL works cleanly in the frontend)
    return f"/{file_path}".replace("\\", "/")
import cv2
import numpy as np
from fastapi import UploadFile

async def is_image_valid(file: UploadFile, blur_threshold: float = 100.0) -> bool:
    """
    Reads an uploaded image and determines if it is clear enough.
    Returns True if the image is valid, False if it is too blurry.
    """
    contents = await file.read()
    
    # Convert raw bytes into a numpy array for OpenCV
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Reset the file cursor so FastAPI can save the file properly later
    await file.seek(0)
    
    if image is None:
        return False
        
    # Convert image to grayscale to detect edges
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Calculate the variance of the Laplacian (sharpness score)
    sharpness_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    return sharpness_score >= blur_threshold
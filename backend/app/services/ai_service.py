import os
import requests
from dotenv import load_dotenv

# Securely load environment variables from the .env file
load_dotenv()

# Fetch the API token securely without hardcoding it in the script
HF_API_TOKEN = os.getenv("HF_TOKEN") 

# We are using Facebook's BART Zero-Shot Classification model. 
# It is incredibly smart at reading text and sorting it into categories!
API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

def analyze_complaint_severity(description: str) -> str:
    """
    Sends the complaint text to Hugging Face AI to determine if it is High, Medium, or Low priority.
    """
    # Safety check in case the .env file is missing the token
    if not HF_API_TOKEN:
        print("System Alert: HF_TOKEN not found in .env. Defaulting to Medium severity.")
        return "Medium"

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    # We tell the AI to read the description and pick the best matching label
    payload = {
        "inputs": description,
        "parameters": {
            "candidate_labels": ["high priority", "medium priority", "low priority"]
        }
    }
    
    try:
        # Added a timeout so your server doesn't hang forever if the internet is slow
        response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            # --- THE FIX IS HERE ---
            # If Hugging Face returns a list (e.g., [{...}]), we grab the first item
            if isinstance(result, list):
                result = result[0]
                
            # Now we can safely grab the labels list from the dictionary
            labels = result.get('labels', [])
            
            if labels:
                # The AI returns labels sorted by how confident it is. We grab the #1 top label!
                top_label = labels[0].lower()
                
                if "high" in top_label:
                    return "High"
                elif "low" in top_label:
                    return "Low"
                else:
                    return "Medium"
            else:
                return "Medium"
                
        else:
            print(f"Hugging Face API Error: {response.text}")
            return "Medium"  # Fallback if the AI is asleep
            
    except Exception as e:
        print(f"AI Connection Error: {e}")
        return "Medium"  # Fallback if your internet drops
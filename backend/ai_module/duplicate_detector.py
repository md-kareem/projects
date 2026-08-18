from sentence_transformers import SentenceTransformer, util
import torch

# Load a lightweight, ultra-fast embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

def is_duplicate(new_description: str, existing_descriptions: list[str], similarity_threshold: float = 0.85) -> bool:
    """
    Compares a new complaint against a list of recent complaints from the same geographic area.
    Returns True if a duplicate is detected.
    """
    if not existing_descriptions:
        return False
        
    # Convert text strings into vector numbers
    new_embedding = model.encode(new_description, convert_to_tensor=True)
    existing_embeddings = model.encode(existing_descriptions, convert_to_tensor=True)
    
    # Calculate cosine similarity between the new complaint and all existing ones
    cosine_scores = util.cos_sim(new_embedding, existing_embeddings)
    
    # Check if any of the scores exceed our confidence threshold
    for score in cosine_scores[0]:
        if score.item() >= similarity_threshold:
            return True
            
    return False
# Keywords that indicate a severe or time-sensitive civic issue
URGENT_KEYWORDS = [
    "danger", "fire", "flood", "accident", "blood", 
    "urgent", "massive", "burst", "sinkhole", "live wire"
]

def determine_priority(description: str) -> str:
    """
    Analyzes the text to assign a priority level: High, Medium, or Low.
    """
    desc_lower = description.lower()
    
    # 1. Fast heuristic check for critical keywords
    if any(word in desc_lower for word in URGENT_KEYWORDS):
        return "High"
        
    # 2. Contextual checks (e.g., small complaints vs standard issues)
    if len(description) < 20 and "pothole" not in desc_lower:
        return "Low"
        
    # 3. Standard default for standard issues
    return "Medium"
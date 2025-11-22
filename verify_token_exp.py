import sys
import os
from datetime import datetime, timedelta

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), "monday-learn-api"))

from app.core.config import settings
from app.core.security import create_access_token
from jose import jwt

def verify_token_expiration():
    print(f"Configured Expiration Minutes: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
    
    # Create a token
    data = {"sub": "testuser"}
    token = create_access_token(data)
    
    # Decode the token
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    exp_timestamp = payload.get("exp")
    
    if exp_timestamp:
        exp_date = datetime.fromtimestamp(exp_timestamp)
        now = datetime.now()
        diff = exp_date - now
        
        print(f"Token Expiration Date: {exp_date}")
        print(f"Time until expiration: {diff}")
        
        if diff.days > 36500: # > 100 years roughly
            print("SUCCESS: Token expiration is effectively permanent (> 100 years).")
        elif diff.days > 36000: # ~ 100 years
             print("SUCCESS: Token expiration is approx 100 years.")
        else:
            print("WARNING: Token expiration might be shorter than expected.")
    else:
        print("ERROR: No expiration claim found in token.")

if __name__ == "__main__":
    verify_token_expiration()

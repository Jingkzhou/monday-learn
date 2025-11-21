from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None

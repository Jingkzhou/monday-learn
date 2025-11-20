from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MaterialBase(BaseModel):
    filename: str
    file_type: str
    file_size: int

class MaterialCreate(MaterialBase):
    file_path: str

class MaterialResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    upload_date: datetime
    user_id: int

    class Config:
        from_attributes = True

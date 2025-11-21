from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class StudyGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class StudyGroupCreate(StudyGroupBase):
    pass

class StudyGroupUpdate(StudyGroupBase):
    pass

class StudyGroupResponse(StudyGroupBase):
    id: int
    teacher_id: int
    created_at: datetime

    class Config:
        from_attributes = True

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
    teacher_name: str
    join_code: str
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True

class JoinClassRequest(BaseModel):
    join_code: str

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LearningProgressLogBase(BaseModel):
    mode: str
    question_type: Optional[str] = None
    is_correct: bool
    user_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    time_spent_ms: Optional[int] = None
    session_id: Optional[str] = None
    source: Optional[str] = None


class LearningProgressLogCreate(LearningProgressLogBase):
    term_id: int


class LearningProgressLogResponse(LearningProgressLogBase):
    id: int
    user_id: int
    study_set_id: int
    term_id: int
    created_at: datetime

    class Config:
        from_attributes = True

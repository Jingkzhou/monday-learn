from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class LearningStatus(str, Enum):
    NOT_STARTED = "not_started"
    FAMILIAR = "familiar"
    MASTERED = "mastered"

class LearningProgressBase(BaseModel):
    status: LearningStatus
    consecutive_correct: int
    last_reviewed: Optional[datetime]

class LearningProgressUpdate(BaseModel):
    is_correct: bool
    question_type: Optional[str] = None
    user_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    time_spent_ms: Optional[int] = None
    session_id: Optional[str] = None
    source: Optional[str] = None

class LearningProgressResponse(LearningProgressBase):
    id: int
    term_id: int
    study_set_id: int
    
    class Config:
        from_attributes = True

class LearningSession(BaseModel):
    new_count: int
    familiar_count: int
    mastered_count: int
    terms: list # List of TermResponse with progress info attached? Or just Terms.
    # We might need a composite response

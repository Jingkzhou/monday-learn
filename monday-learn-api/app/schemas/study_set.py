from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TermBase(BaseModel):
    term: str = Field(..., min_length=1, max_length=255)
    definition: str = Field(..., min_length=1, max_length=1000)
    image_url: Optional[str] = None
    starred: bool = False
    order: int = 0


class TermCreate(TermBase):
    pass


class TermResponse(TermBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StudySetBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    is_public: bool = Field(default=True)


class StudySetCreate(StudySetBase):
    terms: List[TermCreate] = Field(default_factory=list)


class StudySetUpdate(StudySetBase):
    terms: List[TermCreate] = Field(default_factory=list)


class StudySetResponse(StudySetBase):
    id: int
    author_id: int
    author_username: Optional[str] = None
    is_owner: bool = False
    term_count: int
    view_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]
    terms: List[TermResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class StudySetCloneRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: bool = False

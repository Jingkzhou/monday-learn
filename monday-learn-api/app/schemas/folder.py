from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# Forward reference to avoid circular imports if needed, 
# but here we can probably import StudySetResponse if it doesn't import Folder stuff.
# For now, let's define a simplified StudySet summary for the folder view to avoid bloat.

class FolderBase(BaseModel):
    title: str
    description: Optional[str] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(FolderBase):
    pass

class FolderStudySetSummary(BaseModel):
    id: int
    title: str
    term_count: int
    author_username: str

    class Config:
        from_attributes = True

class FolderResponse(FolderBase):
    id: int
    author_id: int
    author_username: str
    created_at: datetime
    updated_at: datetime
    study_sets: List[FolderStudySetSummary] = []
    set_count: int = 0

    class Config:
        from_attributes = True

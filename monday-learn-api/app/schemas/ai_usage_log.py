from pydantic import BaseModel
from datetime import datetime

class AIUsageLogBase(BaseModel):
    tokens_used: int
    request_type: str
    feature: str | None = None
    user_email: str | None = None

class AIUsageLogCreate(AIUsageLogBase):
    config_id: int

class AIUsageLogResponse(AIUsageLogBase):
    id: int
    config_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

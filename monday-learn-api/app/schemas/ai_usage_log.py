from pydantic import BaseModel
from datetime import datetime

class AIUsageLogBase(BaseModel):
    tokens_used: int
    request_type: str

class AIUsageLogCreate(AIUsageLogBase):
    config_id: int

class AIUsageLogResponse(AIUsageLogBase):
    id: int
    config_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

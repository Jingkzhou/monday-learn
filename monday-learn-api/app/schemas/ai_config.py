from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AIConfigBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    provider: str = Field(..., min_length=1, max_length=50)
    api_key: str = Field(..., min_length=1, max_length=255)
    base_url: Optional[str] = None
    model_name: str = Field(..., min_length=1, max_length=255)
    is_active: bool = False

class AIConfigCreate(AIConfigBase):
    pass

class AIConfigTest(BaseModel):
    config_id: Optional[int] = None
    api_key: str = Field(..., min_length=1)
    base_url: Optional[str] = None
    model_name: str = Field(..., min_length=1)
    provider: Optional[str] = "openai"

class AIConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    provider: Optional[str] = Field(None, min_length=1, max_length=50)
    api_key: Optional[str] = Field(None, min_length=1, max_length=255)
    base_url: Optional[str] = None
    model_name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None

class AIConfigResponse(AIConfigBase):
    id: int
    total_tokens: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

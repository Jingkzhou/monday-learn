from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class AIConfig(Base):
    __tablename__ = "ai_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # e.g., "GPT-4"
    provider = Column(String(50), nullable=False)  # e.g., "openai", "google"
    api_key = Column(String(255), nullable=False)
    base_url = Column(String(255), nullable=True)
    model_name = Column(String(100), nullable=False) # e.g., "gpt-4-turbo"
    total_tokens = Column(Integer, default=0)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

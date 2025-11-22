from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("ai_configs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tokens_used = Column(Integer, default=0)
    request_type = Column(String(50), nullable=False)  # e.g., "test", "generation"
    feature = Column(String(100), nullable=True)  # e.g., "ai_exam", "learning_report"
    user_email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    config = relationship("AIConfig", backref="usage_logs")
    user = relationship("User", backref="ai_usage_logs")

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class LearningReport(Base):
    __tablename__ = "learning_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    raw_stats = Column(JSON, nullable=True)
    suggested_study_set_id = Column(Integer, ForeignKey("study_sets.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="learning_reports")
    suggested_study_set = relationship("StudySet")

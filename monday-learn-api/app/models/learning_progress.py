import enum
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class LearningStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    FAMILIAR = "familiar"
    MASTERED = "mastered"

class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    study_set_id = Column(Integer, ForeignKey("study_sets.id"), nullable=False, index=True)
    term_id = Column(Integer, ForeignKey("terms.id"), nullable=False, index=True)
    
    status = Column(Enum(LearningStatus), default=LearningStatus.NOT_STARTED, nullable=False)
    consecutive_correct = Column(Integer, default=0, nullable=False) # 0 = New/Wrong, 1 = Familiar, 2+ = Mastered
    total_correct = Column(Integer, default=0, nullable=False)
    total_incorrect = Column(Integer, default=0, nullable=False)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="learning_progress")
    term = relationship("Term")
    study_set = relationship("StudySet")

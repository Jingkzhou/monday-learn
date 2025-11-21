from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class LearningProgressLog(Base):
    __tablename__ = "learning_progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    study_set_id = Column(Integer, ForeignKey("study_sets.id"), nullable=False, index=True)
    term_id = Column(Integer, ForeignKey("terms.id"), nullable=False, index=True)

    mode = Column(String(20), nullable=False)  # learn | test | review
    question_type = Column(String(50), nullable=True)  # mc, written, flashcard, true_false, etc.
    is_correct = Column(Boolean, nullable=False)
    user_answer = Column(Text, nullable=True)
    expected_answer = Column(Text, nullable=True)
    time_spent_ms = Column(Integer, nullable=True)
    session_id = Column(String(64), nullable=True)
    source = Column(String(50), nullable=True)  # learn_mode, test_mode, starred_only, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="learning_logs")
    study_set = relationship("StudySet")
    term = relationship("Term")

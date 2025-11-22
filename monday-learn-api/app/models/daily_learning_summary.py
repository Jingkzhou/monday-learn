from sqlalchemy import Column, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class DailyLearningSummary(Base):
    __tablename__ = "daily_learning_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    total_time_ms = Column(Integer, default=0)
    total_words_reviewed = Column(Integer, default=0)
    activity_level = Column(Integer, default=0) # 0-4 scale for heatmap

    user = relationship("User", backref="daily_summaries")

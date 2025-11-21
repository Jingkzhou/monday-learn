from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # student | teacher | admin
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    materials = relationship("Material", back_populates="owner")
    folders = relationship("Folder", back_populates="author")
    learning_progress = relationship("LearningProgress", back_populates="user")

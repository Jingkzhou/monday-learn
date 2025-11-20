from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

folder_sets = Table(
    "folder_sets",
    Base.metadata,
    Column("folder_id", Integer, ForeignKey("folders.id"), primary_key=True),
    Column("study_set_id", Integer, ForeignKey("study_sets.id"), primary_key=True),
)

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="folders")
    study_sets = relationship("StudySet", secondary=folder_sets, backref="folders")

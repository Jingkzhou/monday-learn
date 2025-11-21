from sqlalchemy import Column, Integer, ForeignKey, DateTime, Table
from sqlalchemy.sql import func
from app.db.base import Base

class_members = Table(
    "class_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("study_group_id", Integer, ForeignKey("study_groups.id"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), server_default=func.now()),
)

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Literal

Role = Literal["student", "teacher", "admin"]


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    role: Role = "student"
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    avatar_url: Optional[str] = None
    role: Optional[Literal["student", "teacher", "admin"]] = None


class UserResponse(BaseModel):
    id: int
    email: str  # 放宽返回校验，允许 admin 使用非邮箱格式
    username: str
    role: Role
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

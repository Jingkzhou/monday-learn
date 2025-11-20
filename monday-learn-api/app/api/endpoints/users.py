from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core import deps
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

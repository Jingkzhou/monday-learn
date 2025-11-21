from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core import deps
from app.models.study_group import StudyGroup
from app.models.user import User
from app.schemas.study_group import StudyGroupCreate, StudyGroupResponse

router = APIRouter()

@router.post("/", response_model=StudyGroupResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: StudyGroupCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if current_user.role != "teacher" and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create classes")

    study_group = StudyGroup(
        name=payload.name,
        description=payload.description,
        teacher_id=current_user.id
    )
    db.add(study_group)
    db.commit()
    db.refresh(study_group)
    return study_group

@router.get("/", response_model=List[StudyGroupResponse])
def list_classes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # For now, if teacher, show created classes.
    # If student, show joined classes (not implemented yet, so empty or all public? Let's stick to teacher's created for now)
    if current_user.role == "teacher":
        return db.query(StudyGroup).filter(StudyGroup.teacher_id == current_user.id).all()
    
    # Placeholder for students
    return []

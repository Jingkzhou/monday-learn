import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core import deps
from app.models.study_group import StudyGroup
from app.models.user import User
from app.schemas.study_group import StudyGroupCreate, StudyGroupResponse, JoinClassRequest

router = APIRouter()

def generate_join_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/", response_model=StudyGroupResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: StudyGroupCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if current_user.role != "teacher" and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create classes")

    # Generate unique join code
    while True:
        join_code = generate_join_code()
        if not db.query(StudyGroup).filter(StudyGroup.join_code == join_code).first():
            break

    study_group = StudyGroup(
        name=payload.name,
        description=payload.description,
        teacher_id=current_user.id,
        join_code=join_code
    )
    db.add(study_group)
    db.commit()
    db.refresh(study_group)
    
    study_group.member_count = 0
    study_group.teacher_name = current_user.username
    return study_group

@router.get("/", response_model=List[StudyGroupResponse])
def list_classes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if current_user.role == "teacher":
        groups = db.query(StudyGroup).filter(StudyGroup.teacher_id == current_user.id).all()
    else:
        # For students, show joined classes
        groups = current_user.joined_classes

    # Populate member_count and teacher_name for each group
    for group in groups:
        group.member_count = len(group.members)
        group.teacher_name = group.teacher.username
        
    return groups

@router.post("/join", response_model=StudyGroupResponse)
def join_class(
    payload: JoinClassRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    study_group = db.query(StudyGroup).filter(StudyGroup.join_code == payload.join_code).first()
    if not study_group:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if study_group in current_user.joined_classes:
        raise HTTPException(status_code=400, detail="Already joined this class")
        
    current_user.joined_classes.append(study_group)
    db.commit()
    
    study_group.member_count = len(study_group.members)
    study_group.teacher_name = study_group.teacher.username
    return study_group

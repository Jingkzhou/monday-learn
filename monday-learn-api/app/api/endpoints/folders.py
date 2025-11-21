from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.core import deps
from app.db.session import get_db
from app.models.folder import Folder
from app.models.study_set import StudySet
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderResponse, FolderUpdate, FolderStudySetSummary

router = APIRouter()

def get_folder_or_404(db: Session, folder_id: int, user_id: int) -> Folder:
    folder = db.query(Folder).options(
        selectinload(Folder.study_sets).selectinload(StudySet.terms),
        selectinload(Folder.author)
    ).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    if folder.author_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this folder")
    return folder

def serialize_folder(folder: Folder) -> FolderResponse:
    study_sets = [
        FolderStudySetSummary(
            id=s.id,
            title=s.title,
            term_count=len(s.terms),
            author_username=s.author.username if s.author else "Unknown"
        )
        for s in folder.study_sets
    ]
    
    return FolderResponse(
        id=folder.id,
        title=folder.title,
        description=folder.description,
        author_id=folder.author_id,
        author_username=folder.author.username if folder.author else "Unknown",
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        study_sets=study_sets,
        set_count=len(study_sets)
    )

@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folder = Folder(
        title=payload.title,
        description=payload.description,
        author_id=current_user.id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    # Re-query to load relationships
    folder = get_folder_or_404(db, folder.id, current_user.id)
    return serialize_folder(folder)

@router.get("/", response_model=List[FolderResponse])
def list_folders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folders = (
        db.query(Folder)
        .options(selectinload(Folder.study_sets).selectinload(StudySet.terms), selectinload(Folder.study_sets).selectinload(StudySet.author), selectinload(Folder.author))
        .filter(Folder.author_id == current_user.id)
        .order_by(Folder.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [serialize_folder(f) for f in folders]

@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(
    folder_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folder = get_folder_or_404(db, folder_id, current_user.id)
    return serialize_folder(folder)

@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: int,
    payload: FolderUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folder = get_folder_or_404(db, folder_id, current_user.id)
    
    folder.title = payload.title
    folder.description = payload.description
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    # Re-fetch for serialization
    folder = get_folder_or_404(db, folder_id, current_user.id)
    return serialize_folder(folder)

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folder = get_folder_or_404(db, folder_id, current_user.id)
    db.delete(folder)
    db.commit()
    return None

@router.post("/{folder_id}/sets/{study_set_id}", response_model=FolderResponse)
def add_set_to_folder(
    folder_id: int,
    study_set_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folder = get_folder_or_404(db, folder_id, current_user.id)
    
    study_set = db.query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        raise HTTPException(status_code=404, detail="Study set not found")
        
    # Check if already in folder
    if study_set not in folder.study_sets:
        folder.study_sets.append(study_set)
        db.commit()
        
    folder = get_folder_or_404(db, folder_id, current_user.id)
    return serialize_folder(folder)

@router.delete("/{folder_id}/sets/{study_set_id}", response_model=FolderResponse)
def remove_set_from_folder(
    folder_id: int,
    study_set_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    folder = get_folder_or_404(db, folder_id, current_user.id)
    
    study_set = db.query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        raise HTTPException(status_code=404, detail="Study set not found")
        
    if study_set in folder.study_sets:
        folder.study_sets.remove(study_set)
        db.commit()
        
    folder = get_folder_or_404(db, folder_id, current_user.id)
    return serialize_folder(folder)

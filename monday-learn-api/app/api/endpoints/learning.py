from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime

from app.core import deps
from app.models.user import User
from app.models.study_set import StudySet, Term
from app.models.learning_progress import LearningProgress, LearningStatus
from app.schemas.learning_progress import LearningProgressUpdate, LearningProgressResponse, LearningSession
from app.schemas.study_set import TermResponse

router = APIRouter()

@router.get("/{study_set_id}/session", response_model=LearningSession)
def get_learning_session(
    study_set_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # 1. Verify Study Set exists
    study_set = db.query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        raise HTTPException(status_code=404, detail="Study set not found")

    # 2. Get all terms
    terms = db.query(Term).filter(Term.study_set_id == study_set_id).all()
    term_map = {t.id: t for t in terms}
    
    # 3. Get existing progress
    progress_records = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.study_set_id == study_set_id
        )
        .all()
    )
    progress_map = {p.term_id: p for p in progress_records}

    # 4. Bucket terms
    familiar_terms = []
    new_terms = []
    mastered_count = 0

    for term in terms:
        progress = progress_map.get(term.id)
        if progress:
            if progress.status == LearningStatus.MASTERED:
                mastered_count += 1
            elif progress.status == LearningStatus.FAMILIAR:
                familiar_terms.append(term)
            else: # NOT_STARTED
                new_terms.append(term)
        else:
            new_terms.append(term)

    # 5. Select Batch (Target 7 terms)
    BATCH_SIZE = 7
    session_terms = []
    
    # Prioritize Familiar terms (Review loop)
    session_terms.extend(familiar_terms[:BATCH_SIZE])
    
    # Fill with New terms if space remains
    remaining_slots = BATCH_SIZE - len(session_terms)
    if remaining_slots > 0:
        session_terms.extend(new_terms[:remaining_slots])

    # Construct response
    # We need to attach progress info to terms for the frontend
    response_terms = []
    for term in session_terms:
        progress = progress_map.get(term.id)
        consecutive = progress.consecutive_correct if progress else 0
        status = progress.status if progress else LearningStatus.NOT_STARTED
        
        # Create a composite dict/object. 
        # Since TermResponse doesn't have progress fields, we might need a custom schema or just return a list of dicts if Pydantic allows.
        # Let's use a dynamic structure or extend TermResponse in the schema. 
        # For now, let's return a custom dict structure that matches what frontend needs.
        t_dict = TermResponse.model_validate(term).model_dump()
        t_dict['learning_status'] = status
        t_dict['consecutive_correct'] = consecutive
        response_terms.append(t_dict)

    return {
        "new_count": len(new_terms),
        "familiar_count": len(familiar_terms),
        "mastered_count": mastered_count,
        "terms": response_terms
    }

@router.post("/{study_set_id}/update/{term_id}", response_model=LearningProgressResponse)
def update_progress(
    study_set_id: int,
    term_id: int,
    payload: LearningProgressUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Get or create progress record
    progress = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.term_id == term_id
        )
        .first()
    )

    if not progress:
        progress = LearningProgress(
            user_id=current_user.id,
            study_set_id=study_set_id,
            term_id=term_id,
            status=LearningStatus.NOT_STARTED,
            consecutive_correct=0,
            total_correct=0,
            total_incorrect=0
        )
        db.add(progress)
    
    # Update logic
    # Current Status
    current_status = progress.status
    
    if payload.is_correct:
        # Correct Answer Logic
        if current_status == LearningStatus.NOT_STARTED:
            # Transition: Not Started -> Familiar
            progress.status = LearningStatus.FAMILIAR
            progress.consecutive_correct = 1
        elif current_status == LearningStatus.FAMILIAR:
            # Transition: Familiar -> Mastered
            progress.status = LearningStatus.MASTERED
            progress.consecutive_correct = 2 # Or increment, but logically it's mastered now
        else:
            # Already Mastered (shouldn't happen usually, but keep as is)
            progress.consecutive_correct += 1
            
        progress.total_correct = (progress.total_correct or 0) + 1
            
    else:
        # Incorrect Answer Logic
        # If already Familiar, stay Familiar (don't demote to Gray)
        if current_status == LearningStatus.FAMILIAR:
            progress.status = LearningStatus.FAMILIAR
        else:
            progress.status = LearningStatus.NOT_STARTED
            
        progress.consecutive_correct = 0
        progress.total_incorrect = (progress.total_incorrect or 0) + 1
    
    progress.last_reviewed = datetime.now()
    
    db.commit()
    db.refresh(progress)
    return progress

@router.post("/{study_set_id}/reset", status_code=200)
def reset_progress(
    study_set_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Reset learning progress for a specific study set.
    Deletes all LearningProgress records for the current user and study set.
    """
    # Delete all progress records for this user and study set
    db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.study_set_id == study_set_id
    ).delete()
    
    db.commit()
    return {"message": "Progress reset successfully"}

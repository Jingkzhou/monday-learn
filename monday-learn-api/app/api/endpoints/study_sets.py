from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.study_set import StudySet, Term
from app.schemas.study_set import (
    StudySetCreate,
    StudySetResponse,
    StudySetUpdate,
    TermResponse,
)


router = APIRouter()


def serialize_study_set(study_set: StudySet) -> StudySetResponse:
    term_items = sorted(study_set.terms, key=lambda t: t.order or 0)
    return StudySetResponse(
        id=study_set.id,
        title=study_set.title,
        description=study_set.description,
        author_id=study_set.author_id,
        author_username=study_set.author.username if study_set.author else None,
        term_count=len(term_items),
        created_at=study_set.created_at,
        updated_at=study_set.updated_at,
        terms=[
            TermResponse(
                id=term.id,
                term=term.term,
                definition=term.definition,
                image_url=term.image_url,
                order=term.order or 0,
                created_at=term.created_at,
            )
            for term in term_items
        ],
    )


@router.post("", response_model=StudySetResponse, status_code=status.HTTP_201_CREATED)
def create_study_set(
    payload: StudySetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    study_set = StudySet(
        title=payload.title,
        description=payload.description,
        author_id=current_user.id,
    )
    db.add(study_set)
    db.flush()

    for idx, term_payload in enumerate(payload.terms):
        term = Term(
            study_set_id=study_set.id,
            term=term_payload.term,
            definition=term_payload.definition,
            image_url=term_payload.image_url,
            order=term_payload.order if term_payload.order is not None else idx,
        )
        db.add(term)

    db.commit()

    study_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.id == study_set.id)
        .first()
    )

    return serialize_study_set(study_set)


@router.get("/{study_set_id}", response_model=StudySetResponse)
def get_study_set(
    study_set_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    study_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.id == study_set_id)
        .first()
    )
    if not study_set or study_set.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    return serialize_study_set(study_set)


@router.get("", response_model=list[StudySetResponse])
def list_study_sets(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    study_sets = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.author_id == current_user.id)
        .order_by(StudySet.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [serialize_study_set(study_set) for study_set in study_sets]


@router.put("/{study_set_id}", response_model=StudySetResponse)
def update_study_set(
    study_set_id: int,
    payload: StudySetUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    study_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms))
        .filter(StudySet.id == study_set_id)
        .first()
    )

    if not study_set or study_set.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    study_set.title = payload.title
    study_set.description = payload.description

    db.query(Term).filter(Term.study_set_id == study_set.id).delete()
    db.flush()

    for idx, term_payload in enumerate(payload.terms):
        term = Term(
            study_set_id=study_set.id,
            term=term_payload.term,
            definition=term_payload.definition,
            image_url=term_payload.image_url,
            order=term_payload.order if term_payload.order is not None else idx,
        )
        db.add(term)

    db.commit()

    study_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.id == study_set.id)
        .first()
    )

    return serialize_study_set(study_set)

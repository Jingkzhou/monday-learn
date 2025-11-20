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
    StudySetCloneRequest,
)


router = APIRouter()


def serialize_study_set(study_set: StudySet, current_user=None) -> StudySetResponse:
    is_owner = bool(current_user and study_set.author_id == current_user.id)
    term_items = sorted(study_set.terms, key=lambda t: t.order or 0)
    return StudySetResponse(
        id=study_set.id,
        title=study_set.title,
        description=study_set.description,
        author_id=study_set.author_id,
        author_username=study_set.author.username if study_set.author else None,
        is_owner=is_owner,
        is_public=study_set.is_public,
        view_count=study_set.view_count or 0,
        term_count=len(term_items),
        created_at=study_set.created_at,
        updated_at=study_set.updated_at,
        terms=[
            TermResponse(
                id=term.id,
                term=term.term,
                definition=term.definition,
                image_url=term.image_url,
                starred=term.starred,
                order=term.order or 0,
                created_at=term.created_at,
            )
            for term in term_items
        ],
    )


@router.get("/public/top", response_model=list[StudySetResponse])
def get_public_top_study_sets(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    limit = max(1, min(limit, 50))
    study_sets = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.is_public.is_(True))
        .order_by(StudySet.view_count.desc(), StudySet.created_at.desc())
        .limit(limit)
        .all()
    )
    return [serialize_study_set(study_set, current_user) for study_set in study_sets]


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
        is_public=payload.is_public,
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

    return serialize_study_set(study_set, current_user)


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
    if not study_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    is_owner = study_set.author_id == current_user.id
    if not is_owner and not study_set.is_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    study_set.view_count = (study_set.view_count or 0) + 1
    db.add(study_set)
    db.commit()
    db.refresh(study_set)

    return serialize_study_set(study_set, current_user)


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
    return [serialize_study_set(study_set, current_user) for study_set in study_sets]


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
    study_set.is_public = payload.is_public

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

    return serialize_study_set(study_set, current_user)


@router.post("/{study_set_id}/clone", response_model=StudySetResponse, status_code=status.HTTP_201_CREATED)
def clone_study_set(
    study_set_id: int,
    payload: StudySetCloneRequest | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payload = payload or StudySetCloneRequest()
    source_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.id == study_set_id, StudySet.is_public.is_(True))
        .first()
    )

    if not source_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found or not public")

    new_set = StudySet(
        title=payload.title or f"{source_set.title}（副本）",
        description=payload.description if payload.description is not None else source_set.description,
        author_id=current_user.id,
        is_public=payload.is_public,
        view_count=0,
    )
    db.add(new_set)
    db.flush()

    for idx, term_payload in enumerate(source_set.terms):
        term = Term(
            study_set_id=new_set.id,
            term=term_payload.term,
            definition=term_payload.definition,
            image_url=term_payload.image_url,
            order=term_payload.order if term_payload.order is not None else idx,
        )
        db.add(term)

    db.commit()

    new_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .filter(StudySet.id == new_set.id)
        .first()
    )

    return serialize_study_set(new_set, current_user)


@router.patch("/terms/{term_id}/star", response_model=TermResponse)
def toggle_term_star(
    term_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    term = db.query(Term).filter(Term.id == term_id).first()
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Term not found")

    # Check if user has access to the study set (owner or public)
    # For starring, maybe we allow anyone to star if it's public?
    # But wait, starring modifies the term in the DB.
    # If starring is global (modifies the term itself), only the owner should be able to do it.
    # If starring is per-user, we need a separate table.
    # The requirement implies "mark the record", and since I added `starred` to `Term` table, it is GLOBAL.
    # So only the owner can star.

    study_set = db.query(StudySet).filter(StudySet.id == term.study_set_id).first()
    if not study_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    if study_set.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can star terms")

    term.starred = not term.starred
    db.add(term)
    db.commit()
    db.refresh(term)

    return TermResponse(
        id=term.id,
        term=term.term,
        definition=term.definition,
        image_url=term.image_url,
        starred=term.starred,
        order=term.order or 0,
        created_at=term.created_at,
    )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from datetime import datetime
import json
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
from app.schemas.ai_exam import ExamPaper
from app.api.endpoints.learning import call_active_ai


router = APIRouter()


from app.models.learning_progress import LearningProgress, LearningStatus
from app.models.learning_progress_log import LearningProgressLog
from sqlalchemy import func, case, cast, Integer

def serialize_study_set(study_set: StudySet, current_user=None, db: Session = None) -> StudySetResponse:
    is_owner = bool(current_user and study_set.author_id == current_user.id)
    term_items = sorted(study_set.terms, key=lambda t: t.order or 0)
    
    mastered_count = 0
    last_reviewed = None
    
    if current_user and db:
        # Calculate progress
        # MySQL doesn't support FILTER, use CASE instead
        # Cast sum to Integer to avoid Decimal type issues
        try:
            # SQLAlchemy 2.0 case syntax expects positional whens, not list
            progress_stats = (
                db.query(
                    cast(func.sum(case((LearningProgress.status == LearningStatus.MASTERED, 1), else_=0)), Integer).label("mastered"),
                    func.max(LearningProgress.last_reviewed).label("last_reviewed")
                )
                .filter(
                    LearningProgress.study_set_id == study_set.id,
                    LearningProgress.user_id == current_user.id
                )
                .first()
            )
            
            if progress_stats:
                # Ensure strictly int
                mastered_count = int(progress_stats.mastered) if progress_stats.mastered is not None else 0
                last_reviewed = progress_stats.last_reviewed
        except Exception as e:
            print(f"Error calculating progress: {e}")
            mastered_count = 0
            last_reviewed = None

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
        mastered_count=mastered_count,
        last_reviewed=last_reviewed,
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
    return [serialize_study_set(study_set, current_user, db) for study_set in study_sets]


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

    return serialize_study_set(study_set, current_user, db)


@router.get("/{study_set_id:int}", response_model=StudySetResponse)
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
    
    # Update LearningProgress last_reviewed
    if current_user:
        try:
            progress = (
                db.query(LearningProgress)
                .filter(
                    LearningProgress.study_set_id == study_set.id,
                    LearningProgress.user_id == current_user.id
                )
                .order_by(LearningProgress.last_reviewed.desc()) # Get the most recently reviewed term's progress
                .first()
            )
            
            if not progress:
                # If no progress record exists for this user and study set,
                # create one for the first term (if terms exist) to track activity.
                if study_set.terms:
                    first_term = sorted(study_set.terms, key=lambda t: t.order or 0)[0]
                    progress = LearningProgress(
                        user_id=current_user.id,
                        study_set_id=study_set.id,
                        term_id=first_term.id,
                        status=LearningStatus.NOT_STARTED,
                        last_reviewed=datetime.now()
                    )
                    db.add(progress)
            else:
                # Update the existing progress record's last_reviewed timestamp
                progress.last_reviewed = datetime.now()
                db.add(progress)
        except Exception as e:
            print(f"Error updating learning progress: {e}")
            # Don't fail the request if progress update fails

    db.commit()
    db.refresh(study_set)

    return serialize_study_set(study_set, current_user, db)


@router.get("/library", response_model=list[StudySetResponse])
def get_library_study_sets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Fetch sets where user is author OR has learning progress
    # We need to join with LearningProgress to get the last_reviewed time
    # And sort by that time.
    
    # Subquery to get the max last_reviewed for each study set for the current user
    latest_progress = (
        db.query(
            LearningProgress.study_set_id,
            func.max(LearningProgress.last_reviewed).label("last_active")
        )
        .filter(LearningProgress.user_id == current_user.id)
        .group_by(LearningProgress.study_set_id)
        .subquery()
    )
    
    # Main query
    # We want sets that are either authored by user OR have progress
    # And we want to sort by the latest activity (or created_at/updated_at if no activity)
    
    # Join StudySet with the subquery
    study_sets = (
        db.query(StudySet, latest_progress.c.last_active)
        .options(selectinload(StudySet.terms), selectinload(StudySet.author))
        .outerjoin(latest_progress, StudySet.id == latest_progress.c.study_set_id)
        .filter(
            (StudySet.author_id == current_user.id) | 
            (latest_progress.c.study_set_id.isnot(None))
        )
        .all() # Fetch all matching sets
    )
    
    # Sort in Python:
    # Priority: last_active > updated_at > created_at
    def get_sort_key(item):
        study_set, last_active = item
        ts = last_active or study_set.updated_at or study_set.created_at
        return ts or datetime.min.replace(tzinfo=None) # Fallback

    sorted_items = sorted(study_sets, key=get_sort_key, reverse=True)
    
    return [serialize_study_set(item[0], current_user, db) for item in sorted_items]


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
        # Show most recently updated first so the home page recent list reflects latest activity
        .order_by(StudySet.updated_at.desc(), StudySet.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [serialize_study_set(study_set, current_user, db) for study_set in study_sets]


@router.put("/{study_set_id:int}", response_model=StudySetResponse)
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

    return serialize_study_set(study_set, current_user, db)


@router.post("/{study_set_id:int}/clone", response_model=StudySetResponse, status_code=status.HTTP_201_CREATED)
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

    return serialize_study_set(new_set, current_user, db)


@router.post("/{study_set_id:int}/ai-exam", response_model=ExamPaper)
def generate_ai_exam(
    study_set_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    study_set = (
        db.query(StudySet)
        .options(selectinload(StudySet.terms))
        .filter(StudySet.id == study_set_id)
        .first()
    )
    if not study_set:
        raise HTTPException(status_code=404, detail="Study set not found")

    is_owner = study_set.author_id == current_user.id
    if not is_owner and not study_set.is_public:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this study set")

    terms = study_set.terms or []
    if not terms:
        raise HTTPException(status_code=400, detail="Study set has no terms to generate an exam")

    term_pairs = [f"{t.term}（{t.definition}）" for t in terms]
    context_preview = "；".join(term_pairs)[:4000]

    prompt = f"""
你是一名资深命题专家，请基于以下学习集内容生成一份正式试卷，必须用 JSON 输出，遵循提供的 Schema。

学习集标题: "{study_set.title}"
描述: "{study_set.description or ''}"
术语示例: {context_preview}

要求：
1. 严格使用中文命题，匹配术语语言。
2. 结构固定为 3 个部分：
   - Section 1: multiple_choice（4 个选项，1 个正确）
   - Section 2: true_false（判断题）
   - Section 3: written（填空/简答）
3. 每个部分生成 3-5 道高质量“变形题”，不要直接问释义。
4. 题目要给出正确答案与简短解释，填在 correctAnswer 字段。
5. 返回值必须是纯 JSON，符合以下 Schema，不能包含 Markdown、额外文字或代码块：
{{
  "title": "string",
  "gradeLevel": "string",
  "subject": "string",
  "sections": [
    {{
      "title": "string",
      "description": "string",
      "questions": [
        {{
          "id": "string",
          "text": "string",
          "type": "multiple_choice|true_false|written",
          "options": ["string"], // 仅 multiple_choice 提供
          "correctAnswer": "string"
        }}
      ]
    }}
  ]
}}
"""

    raw = call_active_ai(
        db,
        current_user,
        messages=[
            {
                "role": "system",
                "content": "你是一名考试命题专家，请只输出 JSON，符合给定的 Schema，不要添加额外说明。",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=900,
        request_type="ai_exam",
    )

    def _clean_json(text: str) -> str:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.lstrip("`")
            cleaned = cleaned.replace("json", "", 1).strip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
        return cleaned

    try:
        parsed = json.loads(_clean_json(raw))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse AI response: {e}")

    return ExamPaper(**parsed)


@router.patch("/terms/{term_id:int}/star", response_model=TermResponse)
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


@router.post("/{study_set_id:int}/reset-progress", status_code=status.HTTP_200_OK)
def reset_study_set_progress(
    study_set_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Reset the learning progress for the current user on the specified study set.
    This deletes all LearningProgress records for this user and study set.
    """
    # Check if study set exists
    study_set = db.query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    # Delete progress
    db.query(LearningProgress).filter(
        LearningProgress.study_set_id == study_set_id,
        LearningProgress.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": "Progress reset successfully"}


@router.delete("/{study_set_id:int}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_set(
    study_set_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    study_set = db.query(StudySet).filter(StudySet.id == study_set_id).first()
    if not study_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    if study_set.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can delete this study set")

    # Clean up dependent records first to avoid FK issues
    db.query(LearningProgress).filter(LearningProgress.study_set_id == study_set_id).delete()
    db.query(LearningProgressLog).filter(LearningProgressLog.study_set_id == study_set_id).delete()

    db.delete(study_set)
    db.commit()

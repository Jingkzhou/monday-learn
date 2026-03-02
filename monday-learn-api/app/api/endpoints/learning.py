from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Dict
from datetime import datetime, timedelta
from loguru import logger

from app.core import deps
from app.models.user import User
from app.models.study_set import StudySet, Term
from app.models.learning_progress import LearningProgress, LearningStatus
from app.models.learning_progress_log import LearningProgressLog
from app.models.ai_config import AIConfig
from app.models.ai_usage_log import AIUsageLog
from app.models.learning_report import LearningReport
from app.models.daily_learning_summary import DailyLearningSummary
from app.schemas.learning_progress import (
    LearningProgressUpdate,
    LearningProgressResponse,
    LearningSession,
)
from app.schemas.learning_progress_log import (
    LearningProgressLogCreate,
    LearningProgressLogResponse,
)
from app.schemas.learning_report import LearningReportRequest, LearningReportResponse
import httpx
from app.schemas.study_set import TermResponse

router = APIRouter()


def record_learning_log(
    db: Session,
    *,
    user_id: int,
    study_set_id: int,
    term_id: int,
    mode: str,
    is_correct: bool,
    question_type: str | None = None,
    user_answer: str | None = None,
    expected_answer: str | None = None,
    time_spent_ms: int | None = None,
    session_id: str | None = None,
    source: str | None = None,
    commit: bool = True,
):
    log = LearningProgressLog(
        user_id=user_id,
        study_set_id=study_set_id,
        term_id=term_id,
        mode=mode,
        is_correct=is_correct,
        question_type=question_type,
        user_answer=user_answer,
        expected_answer=expected_answer,
        time_spent_ms=time_spent_ms,
        session_id=session_id,
        source=source,
    )
    db.add(log)

    # Update Daily Summary
    today = datetime.now().date()
    summary = (
        db.query(DailyLearningSummary)
        .filter(
            DailyLearningSummary.user_id == user_id, DailyLearningSummary.date == today
        )
        .first()
    )
    if not summary:
        summary = DailyLearningSummary(
            user_id=user_id,
            date=today,
            total_time_ms=0,
            total_words_reviewed=0,
            activity_level=0,
        )
        db.add(summary)

    # Update stats
    if time_spent_ms:
        summary.total_time_ms += time_spent_ms

    summary.total_words_reviewed += 1

    # Simple logic for activity level (0-4)
    # Level 1: > 0 mins (Started)
    # Level 2: > 10 mins OR > 20 words
    # Level 3: > 30 mins OR > 50 words
    # Level 4: > 60 mins OR > 100 words

    total_mins = summary.total_time_ms / 60000
    words = summary.total_words_reviewed

    if total_mins > 60 or words > 100:
        summary.activity_level = 4
    elif total_mins > 30 or words > 50:
        summary.activity_level = 3
    elif total_mins > 10 or words > 20:
        summary.activity_level = 2
    else:
        summary.activity_level = 1

    if commit:
        db.commit()
        db.refresh(log)
    else:
        db.flush()
    return log


def call_active_ai(
    db: Session,
    current_user: User,
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 600,
    request_type: str = "generic",
    feature: str | None = None,
    extra_payload: dict | None = None,
    require_json_object: bool = False,
) -> str:
    config = db.query(AIConfig).filter(AIConfig.is_active.is_(True)).first()
    if not config:
        raise HTTPException(status_code=503, detail="No active AI model configured")

    # Enforce token limit if set
    if config.token_limit is not None and config.token_limit > 0:
        projected = (config.total_tokens or 0) + (
            extra_payload.get("max_tokens", max_tokens) if extra_payload else max_tokens
        )
        if projected >= config.token_limit:
            raise HTTPException(
                status_code=429, detail="AI token quota reached for this model"
            )

    base_url = config.base_url or "https://api.openai.com/v1"
    trimmed = base_url.rstrip("/")
    url = (
        trimmed
        if trimmed.endswith("/chat/completions")
        else f"{trimmed}/chat/completions"
    )
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": config.model_name,
        "messages": messages,
        "max_tokens": max_tokens,
    }
    if extra_payload:
        payload.update(extra_payload)

    # For Ark/OpenAI-compatible JSON mode
    if require_json_object:
        payload["response_format"] = {"type": "json_object"}

    prompt_preview = " | ".join(
        [f"{m.get('role')}:{str(m.get('content'))[:500]}" for m in messages]
    )

    logger.info(
        "AI request",
        provider=config.provider,
        model=config.model_name,
        url=url,
        request_type=request_type,
        prompt_preview=prompt_preview,
        prompt_messages=messages,
    )

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, json=payload, headers=headers)
    except Exception as e:
        logger.error(f"AI provider request failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI provider request failed: {e}")

    if response.status_code != 200:
        logger.error(
            "AI provider error",
            status=response.status_code,
            body=response.text[:1000],
            url=url,
        )
        raise HTTPException(
            status_code=502, detail=f"AI provider error: {response.text}"
        )

    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    logger.info(
        "AI provider response",
        status=response.status_code,
        request_type=request_type,
        content=content,
    )

    # Track token usage if returned
    usage = data.get("usage", {})
    total_tokens = usage.get("total_tokens", 0)
    if total_tokens:
        config.total_tokens = (config.total_tokens or 0) + total_tokens
        log = AIUsageLog(
            config_id=config.id,
            user_id=current_user.id,
            tokens_used=total_tokens,
            request_type=request_type,
            feature=feature or request_type,
            user_email=getattr(current_user, "email", None),
        )
        db.add(log)
        db.add(config)
        db.commit()

    return content or "未能生成报告内容。"


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
            LearningProgress.study_set_id == study_set_id,
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
            else:  # NOT_STARTED
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
        t_dict["learning_status"] = status
        t_dict["consecutive_correct"] = consecutive
        response_terms.append(t_dict)

    return {
        "new_count": len(new_terms),
        "familiar_count": len(familiar_terms),
        "mastered_count": mastered_count,
        "terms": response_terms,
    }


def _sm2_schedule(progress: LearningProgress, is_correct: bool) -> None:
    """
    Apply SM-2 spaced repetition algorithm to update review scheduling.

    SM-2 core logic:
    - Correct: interval grows (1d -> 6d -> prev * EF)
    - Incorrect: interval resets to 1d, EF decreases (min 1.3)
    - next_review_at = now + interval
    """
    now = datetime.now()
    ef = progress.easiness_factor or 2.5
    n = progress.review_count or 0

    if is_correct:
        n += 1
        # SM-2 interval calculation
        if n == 1:
            interval = 1  # First correct: review in 1 day
        elif n == 2:
            interval = 6  # Second correct: review in 6 days
        else:
            prev_interval = progress.review_interval_days or 6
            interval = max(1, round(prev_interval * ef))

        # SM-2 EF adjustment (quality q=4 for correct, simplified)
        # EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        # With q=4: EF' = EF + 0.1 - 0.08 - 0.02 = EF + 0.0
        # With q=5: EF' = EF + 0.1
        # We use q=4 for normal correct, keeping EF stable
        ef = max(1.3, ef + 0.0)
    else:
        # Incorrect: reset interval, decrease EF
        n = 0
        interval = 1  # Review again tomorrow
        # SM-2: q=1 penalty → EF' = EF + (0.1 - 4*0.28) = EF - 1.02
        # We use a gentler penalty to avoid too-rapid EF collapse
        ef = max(1.3, ef - 0.2)

    progress.review_count = n
    progress.easiness_factor = round(ef, 2)
    progress.review_interval_days = interval
    progress.next_review_at = now + timedelta(days=interval)


@router.post(
    "/{study_set_id}/update/{term_id}", response_model=LearningProgressResponse
)
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
            LearningProgress.term_id == term_id,
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
            total_incorrect=0,
            easiness_factor=2.5,
            review_interval_days=0,
            review_count=0,
        )
        db.add(progress)

    # Update status logic
    current_status = progress.status

    if payload.is_correct:
        if current_status == LearningStatus.NOT_STARTED:
            progress.status = LearningStatus.FAMILIAR
            progress.consecutive_correct = 1
        elif current_status == LearningStatus.FAMILIAR:
            progress.status = LearningStatus.MASTERED
            progress.consecutive_correct = 2
        else:
            progress.consecutive_correct += 1

        progress.total_correct = (progress.total_correct or 0) + 1
    else:
        if current_status == LearningStatus.FAMILIAR:
            progress.status = LearningStatus.FAMILIAR
        else:
            progress.status = LearningStatus.NOT_STARTED

        progress.consecutive_correct = 0
        progress.total_incorrect = (progress.total_incorrect or 0) + 1

    previous_status = current_status
    progress.last_reviewed = datetime.now()
    became_mastered = (
        previous_status != LearningStatus.MASTERED
        and progress.status == LearningStatus.MASTERED
    )
    if became_mastered and not progress.mastered_at:
        progress.mastered_at = progress.last_reviewed

    # Apply SM-2 SRS scheduling
    _sm2_schedule(progress, payload.is_correct)

    record_learning_log(
        db,
        user_id=current_user.id,
        study_set_id=study_set_id,
        term_id=term_id,
        mode="learn",
        is_correct=payload.is_correct,
        question_type=payload.question_type,
        user_answer=payload.user_answer,
        expected_answer=payload.expected_answer,
        time_spent_ms=payload.time_spent_ms,
        session_id=payload.session_id,
        source=payload.source or "learn_mode",
        commit=False,
    )

    db.commit()
    db.refresh(progress)
    return progress


@router.get("/review-queue")
def get_review_queue(
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    获取今日待复习队列：next_review_at <= now 的所有词汇，
    按紧急程度排序（过期最久的优先）。
    """
    now = datetime.now()

    due_items = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.next_review_at.isnot(None),
            LearningProgress.next_review_at <= now,
        )
        .order_by(LearningProgress.next_review_at.asc())
        .limit(limit)
        .all()
    )

    # Batch load terms
    term_ids = [p.term_id for p in due_items]
    terms = db.query(Term).filter(Term.id.in_(term_ids)).all() if term_ids else []
    term_map = {t.id: t for t in terms}

    # Batch load study sets for context
    set_ids = list({p.study_set_id for p in due_items})
    sets = db.query(StudySet).filter(StudySet.id.in_(set_ids)).all() if set_ids else []
    set_map = {s.id: s for s in sets}

    result = []
    for p in due_items:
        term = term_map.get(p.term_id)
        study_set = set_map.get(p.study_set_id)
        if not term:
            continue

        overdue_hours = (
            (now - p.next_review_at).total_seconds() / 3600 if p.next_review_at else 0
        )

        result.append(
            {
                "progress_id": p.id,
                "term_id": p.term_id,
                "term": term.term,
                "definition": term.definition,
                "study_set_id": p.study_set_id,
                "study_set_title": study_set.title if study_set else "未知学习集",
                "status": p.status,
                "easiness_factor": p.easiness_factor,
                "review_interval_days": p.review_interval_days,
                "review_count": p.review_count,
                "next_review_at": (
                    p.next_review_at.isoformat() if p.next_review_at else None
                ),
                "overdue_hours": round(overdue_hours, 1),
            }
        )

    return {
        "total": len(result),
        "items": result,
    }


@router.get("/daily-plan")
def get_daily_plan(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    获取今日学习计划摘要：
    - 待复习: next_review_at <= now 的词汇数
    - 需巩固: status = familiar 且无 next_review_at 的词汇数
    - 新学习: status = not_started 的词汇数（来自用户拥有的学习集）
    - 预估时间(分钟)
    """
    now = datetime.now()

    # Count due reviews
    review_count = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.next_review_at.isnot(None),
            LearningProgress.next_review_at <= now,
        )
        .count()
    )

    # Count familiar but not yet scheduled (legacy data)
    consolidate_count = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.status == LearningStatus.FAMILIAR,
            LearningProgress.next_review_at.is_(None),
        )
        .count()
    )

    # Count new terms (not_started) across user's study sets
    user_set_ids = (
        db.query(StudySet.id).filter(StudySet.author_id == current_user.id).all()
    )
    user_set_ids = [s[0] for s in user_set_ids]

    new_count = 0
    if user_set_ids:
        # Terms user hasn't started yet
        started_term_ids = (
            db.query(LearningProgress.term_id)
            .filter(LearningProgress.user_id == current_user.id)
            .subquery()
        )
        new_count = (
            db.query(Term)
            .filter(
                Term.study_set_id.in_(user_set_ids),
                ~Term.id.in_(started_term_ids),
            )
            .count()
        )

    # Suggest max 10 new terms per day
    suggested_new = min(new_count, 10)

    # Estimate time: ~30s per review, ~60s per new term
    total_items = review_count + consolidate_count + suggested_new
    estimated_minutes = max(
        1, round((review_count * 30 + consolidate_count * 30 + suggested_new * 60) / 60)
    )

    return {
        "review_count": review_count,
        "consolidate_count": consolidate_count,
        "new_count": new_count,
        "suggested_new": suggested_new,
        "total_items": total_items,
        "estimated_minutes": estimated_minutes,
    }


@router.get("/weak-terms")
def get_weak_terms(
    limit: int = 10,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    薄弱项智能识别：分析用户答题日志，找出高错误率 + 长时间未复习的词汇。
    返回按"薄弱程度"排序的词汇列表，每个词附带错误率、上次复习时间、学习集信息。
    """
    from sqlalchemy import func, case

    # Step 1: Aggregate error stats per term from logs (last 500 logs)
    term_stats_q = (
        db.query(
            LearningProgressLog.term_id,
            LearningProgressLog.study_set_id,
            func.count(LearningProgressLog.id).label("total_attempts"),
            func.sum(case((LearningProgressLog.is_correct == False, 1), else_=0)).label(
                "error_count"
            ),
        )
        .filter(LearningProgressLog.user_id == current_user.id)
        .group_by(LearningProgressLog.term_id, LearningProgressLog.study_set_id)
        .having(func.count(LearningProgressLog.id) >= 2)  # At least 2 attempts
        .subquery()
    )

    # Step 2: Join with LearningProgress for review timing
    results = (
        db.query(
            term_stats_q.c.term_id,
            term_stats_q.c.study_set_id,
            term_stats_q.c.total_attempts,
            term_stats_q.c.error_count,
            LearningProgress.status,
            LearningProgress.last_reviewed,
            LearningProgress.easiness_factor,
        )
        .outerjoin(
            LearningProgress,
            (LearningProgress.term_id == term_stats_q.c.term_id)
            & (LearningProgress.user_id == current_user.id),
        )
        .all()
    )

    if not results:
        return {"total": 0, "items": []}

    # Step 3: Score each term by weakness
    now = datetime.now()
    scored = []
    for row in results:
        error_rate = (row.error_count or 0) / max(row.total_attempts, 1)
        # Hours since last review (longer = weaker memory)
        if row.last_reviewed:
            hours_since = (now - row.last_reviewed).total_seconds() / 3600
        else:
            hours_since = 999  # Never reviewed → very weak

        # Weakness score = error_rate * 0.6 + time_decay * 0.4
        time_decay = min(1.0, hours_since / 168)  # Normalize to 1 week
        weakness_score = error_rate * 0.6 + time_decay * 0.4

        scored.append(
            {
                "term_id": row.term_id,
                "study_set_id": row.study_set_id,
                "total_attempts": row.total_attempts,
                "error_count": row.error_count or 0,
                "error_rate": round(error_rate * 100, 1),
                "status": row.status or "not_started",
                "last_reviewed": (
                    row.last_reviewed.isoformat() if row.last_reviewed else None
                ),
                "hours_since_review": round(hours_since, 1),
                "weakness_score": round(weakness_score, 3),
            }
        )

    # Sort by weakness score descending
    scored.sort(key=lambda x: x["weakness_score"], reverse=True)
    top = scored[:limit]

    # Enrich with term text and study set title
    term_ids = [t["term_id"] for t in top]
    set_ids = list({t["study_set_id"] for t in top})

    terms = db.query(Term).filter(Term.id.in_(term_ids)).all() if term_ids else []
    term_map = {t.id: t for t in terms}

    sets = db.query(StudySet).filter(StudySet.id.in_(set_ids)).all() if set_ids else []
    set_map = {s.id: s for s in sets}

    for item in top:
        term = term_map.get(item["term_id"])
        study_set = set_map.get(item["study_set_id"])
        item["term"] = term.term if term else f"术语#{item['term_id']}"
        item["definition"] = term.definition if term else ""
        item["study_set_title"] = study_set.title if study_set else "未知学习集"

    return {"total": len(top), "items": top}


@router.get("/smart-recommend")
def get_smart_recommend(
    limit: int = 6,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    智能学习路径推荐：基于用户学习历史，推荐接下来应该学习什么。
    返回三类推荐：
    1. needs_work: 掌握度最低的已开始学习集（优先攻克）
    2. not_started: 用户拥有但尚未开始的学习集（新目标）
    3. popular: 热门公开学习集（探索发现）
    """
    from sqlalchemy import func

    # --- 1. Needs Work: Study sets with lowest mastery percentage ---
    # Get user's progress grouped by study_set
    progress_stats = (
        db.query(
            LearningProgress.study_set_id,
            func.count(LearningProgress.id).label("total"),
            func.sum(func.IF(LearningProgress.status == "mastered", 1, 0)).label(
                "mastered"
            ),
        )
        .filter(LearningProgress.user_id == current_user.id)
        .group_by(LearningProgress.study_set_id)
        .all()
    )

    needs_work = []
    for stat in progress_stats:
        mastered = stat.mastered or 0
        total = stat.total or 1
        mastery_pct = (mastered / total) * 100
        if mastery_pct < 100:  # Not fully mastered
            needs_work.append(
                {
                    "study_set_id": stat.study_set_id,
                    "mastery_percentage": round(mastery_pct, 1),
                    "mastered_count": mastered,
                    "total_terms": total,
                }
            )

    needs_work.sort(key=lambda x: x["mastery_percentage"])
    needs_work = needs_work[:limit]

    # Enrich with study set info
    nw_set_ids = [n["study_set_id"] for n in needs_work]
    nw_sets = (
        db.query(StudySet).filter(StudySet.id.in_(nw_set_ids)).all()
        if nw_set_ids
        else []
    )
    nw_set_map = {s.id: s for s in nw_sets}
    for item in needs_work:
        s = nw_set_map.get(item["study_set_id"])
        if s:
            item["title"] = s.title
            item["description"] = s.description
            item["author_id"] = s.author_id
            item["term_count"] = len(s.terms) if s.terms else item["total_terms"]
        else:
            item["title"] = "未知学习集"
            item["description"] = ""
        item["reason"] = "needs_work"

    # --- 2. Not Started: User's own sets with no progress ---
    user_sets = db.query(StudySet).filter(StudySet.author_id == current_user.id).all()
    started_set_ids = {
        p.study_set_id
        for p in db.query(LearningProgress.study_set_id)
        .filter(LearningProgress.user_id == current_user.id)
        .distinct()
        .all()
    }
    # Also include sets with 0 terms in progress (i.e. not in started_set_ids)
    started_set_ids = {
        sid
        for (sid,) in db.query(LearningProgress.study_set_id)
        .filter(LearningProgress.user_id == current_user.id)
        .distinct()
        .all()
    }

    not_started = []
    for s in user_sets:
        if s.id not in started_set_ids and s.terms:
            not_started.append(
                {
                    "study_set_id": s.id,
                    "title": s.title,
                    "description": s.description,
                    "author_id": s.author_id,
                    "term_count": len(s.terms),
                    "mastery_percentage": 0,
                    "reason": "not_started",
                }
            )
    not_started = not_started[:limit]

    # --- 3. Popular: public sets not owned by user (fallback) ---
    popular = []
    exclude_ids = set(nw_set_ids) | {s["study_set_id"] for s in not_started}
    pop_sets = (
        db.query(StudySet)
        .filter(
            StudySet.is_public == True,
            StudySet.author_id != current_user.id,
            ~StudySet.id.in_(exclude_ids) if exclude_ids else True,
        )
        .order_by(StudySet.view_count.desc())
        .limit(limit)
        .all()
    )
    for s in pop_sets:
        popular.append(
            {
                "study_set_id": s.id,
                "title": s.title,
                "description": s.description,
                "author_id": s.author_id,
                "term_count": len(s.terms) if s.terms else 0,
                "mastery_percentage": 0,
                "view_count": s.view_count,
                "reason": "popular",
            }
        )

    return {
        "needs_work": needs_work,
        "not_started": not_started,
        "popular": popular,
    }


@router.post("/{study_set_id}/log", response_model=LearningProgressLogResponse)
def create_progress_log(
    study_set_id: int,
    payload: LearningProgressLogCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Validate that term belongs to this study set to avoid orphaned logs
    term = (
        db.query(Term)
        .filter(Term.id == payload.term_id, Term.study_set_id == study_set_id)
        .first()
    )
    if not term:
        raise HTTPException(status_code=404, detail="Term not found in study set")

    log = record_learning_log(
        db,
        user_id=current_user.id,
        study_set_id=study_set_id,
        term_id=payload.term_id,
        mode=payload.mode,
        is_correct=payload.is_correct,
        question_type=payload.question_type,
        user_answer=payload.user_answer,
        expected_answer=payload.expected_answer,
        time_spent_ms=payload.time_spent_ms,
        session_id=payload.session_id,
        source=payload.source or "test_mode",
    )
    return log


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
        LearningProgress.study_set_id == study_set_id,
    ).delete()

    db.commit()
    return {"message": "Progress reset successfully"}


def _timeframe_window(timeframe: str) -> datetime | None:
    mapping = {
        "本周": 7,
        "本月": 30,
        "半年": 180,
        "本年": 365,
    }
    days = mapping.get(timeframe, 30)
    return datetime.now() - timedelta(days=days)


@router.post("/report", response_model=LearningReportResponse)
def generate_learning_report(
    payload: LearningReportRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    start_at = _timeframe_window(payload.timeframe)

    query = db.query(LearningProgressLog).filter(
        LearningProgressLog.user_id == current_user.id
    )
    if start_at:
        query = query.filter(LearningProgressLog.created_at >= start_at)

    logs = query.order_by(LearningProgressLog.created_at.desc()).limit(500).all()
    if not logs:
        return LearningReportResponse(
            content=f"{payload.timeframe}暂无学习记录可供分析，请先完成几次练习或测试。",
            raw_stats={},
        )

    total = len(logs)
    correct = sum(1 for l in logs if l.is_correct)
    accuracy = round((correct / total) * 100, 1) if total else 0.0

    # per-term aggregates
    term_stats: Dict[int, Dict[str, Any]] = {}
    for log in logs:
        stats = term_stats.setdefault(
            log.term_id, {"total": 0, "incorrect": 0, "question_types": {}}
        )
        stats["total"] += 1
        if not log.is_correct:
            stats["incorrect"] += 1
        if log.question_type:
            stats["question_types"][log.question_type] = (
                stats["question_types"].get(log.question_type, 0) + 1
            )

    # enrich term info
    term_ids = list(term_stats.keys())
    terms = db.query(Term).filter(Term.id.in_(term_ids)).all() if term_ids else []
    term_map = {t.id: t for t in terms}

    top_mistakes = sorted(
        [
            {
                "term_id": tid,
                "term": term_map[tid].term if tid in term_map else f"术语#{tid}",
                "definition": term_map[tid].definition if tid in term_map else "",
                "incorrect": data["incorrect"],
                "total": data["total"],
            }
            for tid, data in term_stats.items()
            if data["incorrect"] > 0
        ],
        key=lambda x: x["incorrect"],
        reverse=True,
    )[
        :10
    ]  # Increased to top 10 for better analysis

    # global question type stats
    q_type_stats = {}
    for log in logs:
        if log.question_type:
            qt = log.question_type
            if qt not in q_type_stats:
                q_type_stats[qt] = {"total": 0, "correct": 0}
            q_type_stats[qt]["total"] += 1
            if log.is_correct:
                q_type_stats[qt]["correct"] += 1

    prompt_lines = [
        f"分析时间范围: {payload.timeframe}",
        f"总答题数: {total}",
        f"正确数: {correct}",
        f"总体正确率: {accuracy}%",
    ]

    if q_type_stats:
        q_lines = []
        for qt, stats in q_type_stats.items():
            acc = round((stats["correct"] / stats["total"]) * 100, 1)
            q_lines.append(f"{qt}: {acc}% ({stats['correct']}/{stats['total']})")
        prompt_lines.append("题型表现: " + "; ".join(q_lines))

    if top_mistakes:
        prompt_lines.append(
            "高频错题 (术语/错误次数/总次数): "
            + "; ".join(
                [
                    f"{m['term']}({m['incorrect']}/{m['total']})"
                    for m in top_mistakes[:10]
                ]
            )
        )

    prompt_lines.append(
        """
请扮演一位专业的学习教练，基于以上数据生成一份详细的学习诊断报告。
请使用 Markdown 格式，包含以下部分（请严格使用中文）：

### 📊 整体表现
简要评价用户的当前水平和答题状态。

### ⚠️ 学习进度问题
分析用户是否存在特定的学习障碍（如：特定题型薄弱、记忆混淆、新词掌握慢等）。

### 🎯 主要薄弱点
列出具体的薄弱术语或概念，并分析可能的原因。

### 💡 训练建议
提供3条具体、可执行的改进建议（例如：建议使用哪种模式复习，重点关注哪些内容）。

### 🌟 鼓励
一句简短温暖的鼓励。
"""
    )
    prompt = "\n".join(prompt_lines)

    ai_content = call_active_ai(
        db,
        current_user,
        messages=[
            {
                "role": "system",
                "content": "你是一名学习数据分析师，使用简洁的中文输出，并提供可执行的学习建议。",
            },
            {"role": "user", "content": prompt},
        ],
        request_type="learning_report",
        feature="learning_report",
    )

    # Determine if we should suggest creating a study set
    # Logic: If there are at least 3 terms with mistakes
    suggestion_create_set = len(top_mistakes) >= 3

    raw_stats = {
        "timeframe": payload.timeframe,
        "total": total,
        "correct": correct,
        "accuracy": accuracy,
        "top_mistakes": top_mistakes,
    }

    # Save report to DB
    report = LearningReport(
        user_id=current_user.id,
        content=ai_content,
        raw_stats=raw_stats,
        suggested_study_set_id=None,  # Will be updated if user creates one
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return LearningReportResponse(
        content=ai_content,
        raw_stats=raw_stats,
        report_id=report.id,
        suggestion_create_set=suggestion_create_set,
    )

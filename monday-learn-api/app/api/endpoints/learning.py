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
from app.schemas.learning_progress import LearningProgressUpdate, LearningProgressResponse, LearningSession
from app.schemas.learning_progress_log import LearningProgressLogCreate, LearningProgressLogResponse
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
            DailyLearningSummary.user_id == user_id,
            DailyLearningSummary.date == today
        )
        .first()
    )
    if not summary:
        summary = DailyLearningSummary(
            user_id=user_id,
            date=today,
            total_time_ms=0,
            total_words_reviewed=0,
            activity_level=0
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

    base_url = config.base_url or "https://api.openai.com/v1"
    trimmed = base_url.rstrip("/")
    url = trimmed if trimmed.endswith("/chat/completions") else f"{trimmed}/chat/completions"
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
        raise HTTPException(status_code=502, detail=f"AI provider error: {response.text}")

    data = response.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
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
    
    previous_status = current_status
    progress.last_reviewed = datetime.now()
    became_mastered = previous_status != LearningStatus.MASTERED and progress.status == LearningStatus.MASTERED
    if became_mastered and not progress.mastered_at:
        progress.mastered_at = progress.last_reviewed
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
        LearningProgress.study_set_id == study_set_id
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

    query = db.query(LearningProgressLog).filter(LearningProgressLog.user_id == current_user.id)
    if start_at:
        query = query.filter(LearningProgressLog.created_at >= start_at)

    logs = query.order_by(LearningProgressLog.created_at.desc()).limit(500).all()
    if not logs:
        return LearningReportResponse(content=f"{payload.timeframe}暂无学习记录可供分析，请先完成几次练习或测试。", raw_stats={})

    total = len(logs)
    correct = sum(1 for l in logs if l.is_correct)
    accuracy = round((correct / total) * 100, 1) if total else 0.0

    # per-term aggregates
    term_stats: Dict[int, Dict[str, Any]] = {}
    for log in logs:
        stats = term_stats.setdefault(log.term_id, {"total": 0, "incorrect": 0, "question_types": {}})
        stats["total"] += 1
        if not log.is_correct:
            stats["incorrect"] += 1
        if log.question_type:
            stats["question_types"][log.question_type] = stats["question_types"].get(log.question_type, 0) + 1

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
    )[:10]  # Increased to top 10 for better analysis

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
        prompt_lines.append("高频错题 (术语/错误次数/总次数): " + "; ".join([f"{m['term']}({m['incorrect']}/{m['total']})" for m in top_mistakes[:10]]))

    prompt_lines.append("""
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
""")
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
        suggested_study_set_id=None, # Will be updated if user creates one
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

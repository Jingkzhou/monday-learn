from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import date, datetime, timedelta
from app.core import deps
from app.models.user import User
from app.models.daily_learning_summary import DailyLearningSummary
from app.models.learning_progress_log import LearningProgressLog
from app.models.learning_progress import LearningProgress, LearningStatus
from pydantic import BaseModel

router = APIRouter()

class DailySummaryResponse(BaseModel):
    date: date
    count: int # activity_level for heatmap (0-4)
    total_time_ms: int
    total_words: int

class DailyDetailItem(BaseModel):
    id: int
    time: str
    action: str # "Studied [Set Name]"
    mode: str
    details: str # "20/20 words" or "Score: 92"

class DailyDetailResponse(BaseModel):
    date: date
    total_time_ms: int
    items: List[DailyDetailItem]
    mastered_count: int

@router.get("/monthly", response_model=List[DailySummaryResponse])
def get_monthly_calendar(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        # End of current month
        next_month = start_date.replace(day=28) + timedelta(days=4)
        end_date = next_month - timedelta(days=next_month.day)

    summaries = (
        db.query(DailyLearningSummary)
        .filter(
            DailyLearningSummary.user_id == current_user.id,
            DailyLearningSummary.date >= start_date,
            DailyLearningSummary.date <= end_date
        )
        .all()
    )

    return [
        DailySummaryResponse(
            date=s.date,
            count=s.activity_level,
            total_time_ms=s.total_time_ms,
            total_words=s.total_words_reviewed
        )
        for s in summaries
    ]

@router.get("/daily/{target_date}", response_model=DailyDetailResponse)
def get_daily_detail(
    target_date: date,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # 1. Get Summary
    summary = (
        db.query(DailyLearningSummary)
        .filter(
            DailyLearningSummary.user_id == current_user.id,
            DailyLearningSummary.date == target_date
        )
        .first()
    )

    # 2. Get Logs
    # We need to filter by date. Since created_at is datetime, we cast to date.
    logs = (
        db.query(LearningProgressLog)
        .filter(
            LearningProgressLog.user_id == current_user.id,
            func.date(LearningProgressLog.created_at) == target_date
        )
        .order_by(LearningProgressLog.created_at.asc())
        .all()
    )

    # Aggregate realistic time spent: prefer explicit time_spent_ms, fallback to session window
    time_spent_ms = sum(log.time_spent_ms or 0 for log in logs)
    if logs:
        start_time = logs[0].created_at
        end_time = logs[-1].created_at
        if start_time and end_time:
            session_ms = int((end_time - start_time).total_seconds() * 1000)
            # Avoid 0 when only one log exists
            if session_ms <= 0:
                session_ms = 60_000
            time_spent_ms = max(time_spent_ms, session_ms)

    # Respect any pre-aggregated summary time if higher
    if summary and summary.total_time_ms:
        time_spent_ms = max(time_spent_ms, summary.total_time_ms)

    # Group logs by study set and mode to avoid one-row-per-card noise
    grouped: Dict[tuple, Dict[str, Any]] = {}
    for log in logs:
        key = (log.study_set_id, log.mode)
        if key not in grouped:
            grouped[key] = {
                "count": 0,
                "correct": 0,
                "mode": log.mode,
                "set_name": log.study_set.title if log.study_set else "Unknown Set",
                "last_time": log.created_at,
            }
        grouped[key]["count"] += 1
        grouped[key]["correct"] += 1 if log.is_correct else 0
        grouped[key]["last_time"] = max(grouped[key]["last_time"], log.created_at)

    items = []
    for idx, group in enumerate(sorted(grouped.values(), key=lambda g: g["last_time"], reverse=True), start=1):
        time_str = group["last_time"].strftime("%H:%M")
        mode_label = "考试" if group["mode"] == "test" else "学习"
        action = f"{mode_label} · [{group['set_name']}]"
        accuracy = int((group["correct"] / group["count"]) * 100) if group["count"] else 0
        details = f"{group['count']} 次，正确率 {accuracy}%"

        items.append(DailyDetailItem(
            id=idx,
            time=time_str,
            action=action,
            mode=group["mode"],
            details=details
        ))

    # 3. Mastered Count: terms that first became mastered on this date
    mastered_count = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.status == LearningStatus.MASTERED,
            LearningProgress.mastered_at.isnot(None),
            func.date(LearningProgress.mastered_at) == target_date,
        )
        .count()
    )

    return DailyDetailResponse(
        date=target_date,
        total_time_ms=time_spent_ms,
        items=items,
        mastered_count=mastered_count
    )

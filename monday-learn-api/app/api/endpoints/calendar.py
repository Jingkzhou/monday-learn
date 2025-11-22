from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import date, datetime, timedelta
from app.core import deps
from app.models.user import User
from app.models.daily_learning_summary import DailyLearningSummary
from app.models.learning_progress_log import LearningProgressLog
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
    total_time = summary.total_time_ms if summary else 0

    # 2. Get Logs
    # We need to filter by date. Since created_at is datetime, we cast to date.
    logs = (
        db.query(LearningProgressLog)
        .filter(
            LearningProgressLog.user_id == current_user.id,
            func.date(LearningProgressLog.created_at) == target_date
        )
        .order_by(LearningProgressLog.created_at.desc())
        .all()
    )

    items = []
    for log in logs:
        time_str = log.created_at.strftime("%I:%M %p")
        set_name = log.study_set.title if log.study_set else "Unknown Set"
        
        action = f"Studied [{set_name}]"
        details = ""
        
        if log.mode == "learn":
            details = f"Correct: {1 if log.is_correct else 0}"
        elif log.mode == "test":
             details = f"Score: {log.user_answer}" # Simplified
        elif log.mode == "flashcard":
             details = "Reviewed"
        
        items.append(DailyDetailItem(
            id=log.id,
            time=time_str,
            action=action,
            mode=log.mode,
            details=details
        ))

    # 3. Mastered Count (Mock logic or complex query)
    # For now return 0 or implement real logic if needed
    mastered_count = 0 

    return DailyDetailResponse(
        date=target_date,
        total_time_ms=total_time,
        items=items,
        mastered_count=mastered_count
    )

from pydantic import BaseModel
from typing import Optional


class LearningReportRequest(BaseModel):
    timeframe: str = "本周"


class LearningReportResponse(BaseModel):
    content: str
    raw_stats: Optional[dict] = None

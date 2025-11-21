import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import routes
from app.core.logger import setup_logging
from app.db.session import get_db, engine
from app.db.base import Base
# Import models to ensure they are registered
from app.models.user import User
from app.models.login_log import LoginLog
from app.models.study_set import StudySet, Term
from app.models.material import Material
from app.models.folder import Folder
from app.models.learning_progress import LearningProgress
from app.models.study_group import StudyGroup
from app.models.class_member import class_members
from app.models.ai_config import AIConfig
from app.models.ai_usage_log import AIUsageLog

# Create tables
Base.metadata.create_all(bind=engine)

# Setup logging
setup_logging()

app = FastAPI(title="Monday Learn API")

# Configure CORS
env_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
origins = [o.strip() for o in env_origins.split(",") if o.strip()]
# Allow common LAN IPs by default so 192.168.x.x / 10.x.x.x hosts can call the API
origin_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.config import settings

app.include_router(routes.api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Monday Learn API"}

@app.get("/health/db")
async def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

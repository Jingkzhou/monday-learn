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

# Create tables
Base.metadata.create_all(bind=engine)

# Setup logging
setup_logging()

app = FastAPI(title="Monday Learn API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.config import settings

app.include_router(routes.router, prefix=settings.API_V1_STR)

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

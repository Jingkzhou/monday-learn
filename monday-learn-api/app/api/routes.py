from fastapi import APIRouter
from app.api.endpoints import auth, study_sets

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(study_sets.router, prefix="/study-sets", tags=["study_sets"])

@router.get("/health")
async def health_check():
    return {"status": "ok"}

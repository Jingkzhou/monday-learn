from fastapi import APIRouter
from app.api.endpoints import auth, study_sets, folders, learning, study_groups, ai_configs, analysis, calendar, materials

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(study_sets.router, prefix="/study-sets", tags=["study-sets"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(study_groups.router, prefix="/classes", tags=["classes"])
api_router.include_router(ai_configs.router, prefix="/admin/ai-configs", tags=["ai-configs"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

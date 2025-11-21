from fastapi import APIRouter
from app.api.endpoints import auth, users, study_sets, folders, materials, learning, study_groups

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(study_sets.router, prefix="/study-sets", tags=["study-sets"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(study_groups.router, prefix="/classes", tags=["classes"])

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

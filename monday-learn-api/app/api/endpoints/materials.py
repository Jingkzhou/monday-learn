import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core import deps
from app.models.user import User
from app.models.material import Material
from app.schemas.material import MaterialResponse, MaterialCreate

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=MaterialResponse)
async def upload_material(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    try:
        # Generate a unique filename or keep original (simple for now)
        # Ideally use UUID to avoid collisions
        file_location = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        file_size = os.path.getsize(file_location)
        
        material = Material(
            filename=file.filename,
            file_path=file_location,
            file_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            user_id=current_user.id
        )
        
        db.add(material)
        db.commit()
        db.refresh(material)
        
        return material
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")

@router.get("/", response_model=List[MaterialResponse])
def read_materials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    materials = db.query(Material).filter(Material.user_id == current_user.id).offset(skip).limit(limit).all()
    return materials

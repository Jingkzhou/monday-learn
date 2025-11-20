import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
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

@router.get("/{material_id}/file")
def get_material_file(
    material_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    if material.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")
        
    if not os.path.exists(material.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(
        path=material.file_path, 
        filename=material.filename,
        media_type=material.file_type
    )

@router.delete("/{material_id}", status_code=204)
def delete_material(
    material_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    if material.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
        
    # Delete file from filesystem
    if os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except Exception as e:
            # Log error but continue to delete DB record? 
            # Or fail? Let's fail for now to be safe.
            raise HTTPException(status_code=500, detail=f"Could not delete file from disk: {str(e)}")
            
    db.delete(material)
    db.commit()
    return None

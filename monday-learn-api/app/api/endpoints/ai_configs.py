from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.ai_config import AIConfig
from app.schemas.ai_config import AIConfigCreate, AIConfigUpdate, AIConfigResponse, AIConfigTest
from app.schemas.ai_usage_log import AIUsageLogResponse

router = APIRouter()

def check_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )

@router.get("", response_model=List[AIConfigResponse])
def list_ai_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    return db.query(AIConfig).all()

@router.post("", response_model=AIConfigResponse, status_code=status.HTTP_201_CREATED)
def create_ai_config(
    payload: AIConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    
    # If setting as active, disable others
    if payload.is_active:
        db.query(AIConfig).update({AIConfig.is_active: False})
        db.flush()

    config = AIConfig(**payload.dict())
    db.add(config)
    db.commit()
    db.refresh(config)
    return config

@router.put("/{config_id}", response_model=AIConfigResponse)
def update_ai_config(
    config_id: int,
    payload: AIConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    # If setting as active, disable others
    if payload.is_active:
        db.query(AIConfig).filter(AIConfig.id != config_id).update({AIConfig.is_active: False})
        db.flush()

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    return config

@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    db.delete(config)
    db.commit()

@router.post("/{config_id}/enable", response_model=AIConfigResponse)
def enable_ai_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    # Disable all others
    db.query(AIConfig).update({AIConfig.is_active: False})
    
    # Enable this one
    config.is_active = True
    db.add(config)
    db.commit()
    db.refresh(config)
    return config

@router.post("/test", status_code=status.HTTP_200_OK)
async def test_connection(
    payload: AIConfigTest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    
    import httpx
    
    # Default to OpenAI format
    base_url = payload.base_url or "https://api.openai.com/v1"
    if base_url.endswith("/"):
        base_url = base_url[:-1]
        
    # Adjust for specific providers if needed, but most support /chat/completions
    if base_url.endswith("/chat/completions"):
        url = base_url
    else:
        url = f"{base_url}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {payload.api_key}",
        "Content-Type": "application/json"
    }
    
    # For some providers like Azure or others, headers might differ, but we stick to standard OpenAI for now
    # Volcengine might need specific handling if not standard compatible, but usually they have an OpenAI compatible endpoint
    
    data = {
        "model": payload.model_name,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 5
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                # Calculate tokens (simple estimation if not provided)
                resp_data = response.json()
                usage = resp_data.get("usage", {})
                total_tokens = usage.get("total_tokens", 0)
                
                # If usage not provided, estimate: input + output (rough char count / 4)
                if total_tokens == 0:
                    input_tokens = len(str(data)) // 4
                    output_tokens = len(response.text) // 4
                    total_tokens = input_tokens + output_tokens

                # Log usage
                # We need to find the config ID. Since this is a test with raw payload, 
                # we might not have a saved config yet. 
                # But if we are testing an existing config (edit mode), we might want to log it?
                # Actually, the requirement is "record each model's used tokens". 
                # Usually we test BEFORE saving, or test an existing one. 
                # Let's try to find if this config exists by API key or just log it if we can match it.
                # For simplicity in this "Test" feature, we might only log if we can find a matching active config or if we pass the ID.
                # However, the user asked for "record each model's used tokens". 
                # Let's assume this is primarily for the actual usage (generation), but testing also consumes tokens.
                # Let's try to find the config by API Key to attribute the cost.
                
                config = db.query(AIConfig).filter(AIConfig.api_key == payload.api_key).first()
                if config:
                    config.total_tokens += total_tokens
                    
                    from app.models.ai_usage_log import AIUsageLog
                    log = AIUsageLog(
                        config_id=config.id,
                        user_id=current_user.id,
                        tokens_used=total_tokens,
                        request_type="test"
                    )
                    db.add(log)
                    db.commit()

                return {"status": "success", "message": "Connection successful", "latency": f"{response.elapsed.total_seconds() * 1000:.2f}ms", "tokens": total_tokens}
            else:
                return {
                    "status": "error", 
                    "message": f"Failed with status {response.status_code}", 
                    "details": response.text
                }
    except Exception as e:
        return {"status": "error", "message": f"Connection failed: {str(e)}"}

@router.get("/{config_id}/logs", response_model=List[AIUsageLogResponse])
def list_ai_usage_logs(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    from app.models.ai_usage_log import AIUsageLog
    from app.schemas.ai_usage_log import AIUsageLogResponse
    
    logs = db.query(AIUsageLog).filter(AIUsageLog.config_id == config_id).order_by(AIUsageLog.created_at.desc()).limit(100).all()
    return logs

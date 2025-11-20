from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.login_log import LoginLog
from app.core.deps import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Find user by email or username
    user = db.query(User).filter((User.email == form_data.username) | (User.username == form_data.username)).first()
    
    # Prepare log data
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Log failed attempt
        log = LoginLog(
            user_id=user.id if user else None,
            ip_address=ip_address,
            user_agent=user_agent,
            status="failed"
        )
        db.add(log)
        db.commit()
        
        raise HTTPException(status_code=400, detail="Incorrect email/username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    # Log success
    log = LoginLog(
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        status="success"
    )
    db.add(log)
    db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter((User.email == user.email) | (User.username == user.username)).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

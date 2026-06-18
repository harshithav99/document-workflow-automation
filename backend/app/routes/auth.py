from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app import schemas, models
from ..database import get_db
from .. import models, auth
from fastapi import Request

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
async def register_user(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email is already registered."
        )
    raw_data = await request.json()
    actual_role = raw_data.get("role", "both")

    hashed_password = pwd_context.hash(user.password)
    auto_username = user.email.split("@")[0]

    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        password=hashed_password,
        username=auto_username,
        role=actual_role # "author", "reviewer", or "both"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print("THE DATABASE JUST SAVED THIS ROLE:", new_user.role)

    return {"message": "User registered successfully", "user_id": new_user.id}

@router.post("/login")
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_credentials.username).first()
    
    if not user or not auth.verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    

    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    
    return {"access_token": access_token, "token_type": "bearer"}
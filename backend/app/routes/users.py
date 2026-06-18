from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import SessionLocal
from .. import models, schemas
from app import auth

router = APIRouter(prefix="/users", tags=["Users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = models.User(
        username=user.username, 
        password=hashed_password,  
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
@router.get("/", response_model=List[schemas.UserResponse])
def read_users(db: Session = Depends(get_db)):
    valid_users = db.query(models.User).filter(
        models.User.username != None,
        models.User.role != None
    ).all()
    
    return valid_users

@router.get("/reviewers", response_model=List[schemas.UserResponse])
def get_reviewers(db: Session = Depends(get_db)):
    
    reviewers = db.query(models.User).filter(
        models.User.role.in_(["reviewer", "both", "Reviewer", "Both"])
    ).all()
    
    return reviewers


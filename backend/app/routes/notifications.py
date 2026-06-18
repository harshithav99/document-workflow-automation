from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import SessionLocal, get_db
from .. import models, schemas, database


router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_my_notifications(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.timestamp.desc()).all()

@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = 1
    db.commit()
    return {"message": "Notification marked as read"}
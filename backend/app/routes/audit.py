from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import SessionLocal
from .. import models, schemas
from datetime import datetime
from sqlalchemy import DateTime

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import SessionLocal, get_db
from .. import models, schemas, database

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == task.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "Pending"
    new_task = models.Task(**task.model_dump())
    db.add(new_task)
    db.flush()
    new_notif = models.Notification(
        user_id=task.reviewer_id, 
        message=f"New Task: Document '{doc.title}' is ready for your review. Status: {new_task.status}."
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()

@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task_status(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(database.get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    Reviewer= db.query(models.User).filter(models.User.id == db_task.reviewer_id).first()
    if not Reviewer or Reviewer.role != "reviewer":
        raise HTTPException(
            status_code=403, 
            detail="Only users with the 'reviewer' role can approve documents."
        )
    doc = db_task.document
    db_task.status = task_update.status
    if task_update.status.lower() == "approved":
        doc.status = "Approved"
        notification_msg = f"Your document '{doc.title}' has been Approved."
    
    elif task_update.status.lower() == "rejected":
        doc.status = "Draft" 
        notification_msg = f"Revision required: Your document '{doc.title}' was Rejected and moved back to Draft."
    
    else: 
        doc.status = task_update.status
        notification_msg = f"Update: Your document '{doc.title}' status is now {task_update.status}."

    new_notif = models.Notification(
        user_id=doc.owner_id,
        message=notification_msg
    )
    db.add(new_notif)

    new_log = models.AuditLog(
        action=f"Task {task_update.status}",
        user_id=db_task.reviewer_id,
        document_id=db_task.document_id
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(db_task)
    return db_task
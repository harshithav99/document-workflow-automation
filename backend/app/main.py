from fastapi import FastAPI
from .database import engine
from fastapi.middleware.cors import CORSMiddleware
from .models import Base, Document, User, Task, AuditLog
from .routes import users, documents, tasks, audit, notifications, auth
from app.database import SessionLocal
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from sqlalchemy import or_

def auto_submit_expired_documents():
    print("Checking for expired documents...")
    db = SessionLocal()
    try:
        now = datetime.datetime.now() 
        expired_docs = db.query(Document).filter(
            Document.status == "Draft",
            Document.due_date != None,
            Document.due_date < now
        ).all()

        for doc in expired_docs:
            doc.status = "In Review" 
            doc.assigned_reviewer_id = None 
            
            all_reviewers = db.query(User).filter(
                or_(User.role == "reviewer", User.role == "both")
            ).all()
            
            if all_reviewers:
                for reviewer in all_reviewers:
                    existing = db.query(Task).filter(
                        Task.document_id == doc.id,
                        Task.reviewer_id == reviewer.id,
                        Task.status == "Pending"
                    ).first()
                    
                    if not existing:
                        new_task = Task(
                            document_id=doc.id,
                            reviewer_id=reviewer.id,
                            status="Pending" 
                        )
                        db.add(new_task)
                        
                print(f"Auto-submitted Doc ID {doc.id} and assigned to {len(all_reviewers)} reviewers.")
            else:
                print(f"Auto-submitted Doc ID {doc.id}, but NO reviewers exist in the database yet!")

            new_log = AuditLog(
                user_name="System", 
                action="Document In Review", 
                details="Automatically routed to All Reviers due to deadline is passed.",
                document_name=doc.title 
            )
            db.add(new_log) 
        if expired_docs:
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(auto_submit_expired_documents, 'interval', minutes=1)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.include_router(users.router)
app.include_router(documents.router)
app.include_router(tasks.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(auth.router)

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)


@app.get("/")
def read_root():
    return {"message": "Document Workflow System API is running"}




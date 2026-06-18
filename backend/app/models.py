import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import DateTime
from .database import Base

class UserRole(str, enum.Enum):
    AUTHOR = "author"
    REVIEWER = "reviewer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="author")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    status = Column(String, default="Draft")
    owner_id = Column(Integer, ForeignKey("users.id"))
    createdDate = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String, nullable=True)
    file_hash = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    version = Column(Integer, default=1)
    due_date = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    owner = relationship("User")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="Pending")
    document = relationship("Document")
    reviewer = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    is_read = Column(Integer, default=0)
    timestamp= Column(DateTime, default=datetime.utcnow())
    user = relationship("User")
    

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)  
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_name = Column(String) 
    details = Column(String, nullable=True)
    document_name = Column(String)
    document_type = Column(String)
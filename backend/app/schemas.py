from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# USER SCHEMAS 
class UserBase(BaseModel):
    username: str
    role: str
    email: Optional[str] = None

class UserCreate(BaseModel):   
    email: EmailStr
    full_name: str
    password: str
    role: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class UserBasicInfo(BaseModel):
    username: str
    role: str

# DOCUMENT SCHEMAS
class DocumentBase(BaseModel):
    title: str
    status: Optional[str] = "Draft"

class DocumentCreate(DocumentBase):
    owner_id: int

class DocumentUpdate(DocumentBase):
    title: str
    status: str

class DocumentResponse(DocumentBase):
    id: int
    owner_id: int
    createdDate: datetime
    file_path: str | None = None 
    file_hash: Optional[str] = None
    summary: Optional[str] = None
    version: int = 1
    assigned_reviewer_id: int | None = None
    reviewer_name: str | None = None
    owner_name: str | None = None
    due_date: Optional[datetime] = None
    assigned_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    class Config:
        from_attributes = True

#Task Schemas

class TaskBase(BaseModel):
    document_id: int
    reviewer_id: int
    status: Optional[str] = "Pending"
    owner_name: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    status: str

#Audit Schemas
class AuditLogResponse(BaseModel):
    id: int
    action: str
    timestamp: datetime
    user_name: Optional[str] = None
    details: Optional[str] = None
    document_name: str
    document_type: Optional[str] = None
  
    class Config:
        from_attributes = True

#Notification Schema
class NotificationResponse(BaseModel):
    id: int
    message: str
    is_read: int
    timestamp: datetime

    class Config:
        from_attribute=True
        
class StatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None
    reviewer_id: Optional[int] = None

class DeadlineUpdate(BaseModel):
    due_date_str: str
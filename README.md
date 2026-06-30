# Document Workflow Automation

A full-stack, automated document review and task tracking system built to replace manual, email-based document approval workflows in regulated industries (e.g. life sciences). The system manages the complete document lifecycle, from draft to approval, using role-based access control, automated deadline-based state transitions, and AI-assisted summarization.

Built as part of an M.Tech dissertation at BITS Pilani (Software Engineering, Full Stack Development), in collaboration with Accenture.

## Why this project

Most enterprise document management tools are either rigid, pre-configured platforms with little flexibility, or manual processes (email, shared drives) prone to missed deadlines and version confusion. This project explores a lightweight, fully custom alternative: an open, configurable workflow engine built from scratch, with full transparency into every automation rule and state transition.

## Features

- **Automated state management** - documents move through Draft → In Review → Approved/Rejected automatically based on actions and deadlines, with no manual tracking required
- **Role-based access control (RBAC)** - secure JWT-based authentication with distinct Author and Reviewer permissions; a hybrid role is also supported
- **Automated version control** - every re-upload is automatically versioned (v1.0 → v2.0) so reviewers can track revision history
- **Deadline-based task automation** - a background scheduler (APScheduler) checks every 60 seconds for documents past their review deadline and automatically transitions their state and notifies reviewers, with no manual intervention
- **AI-assisted summarization** - integrates PyPDF2 to extract and summarize document content (up to 3,000 words) directly in the UI
- **Secure in-browser document viewer** - PDF documents are rendered via a temporary Blob URL (fetched over HTTPS) rather than a traditional iframe, so reviewers can view files without downloading them
- **Immutable audit log** - every action (upload, status change, approval, rejection) is logged with user, timestamp, and action type for full traceability
- **Real-time notifications** - authors are notified of approval/rejection outcomes; reviewers are notified when a document is assigned to them

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python, FastAPI |
| Database | PostgreSQL (migrated from SQLite — see Design Decisions) |
| ORM / Validation | SQLAlchemy, Pydantic |
| Authentication | JWT |
| Background Scheduling | APScheduler (in-process, no external message broker) |
| Document Parsing | PyPDF2 |
| API Testing | Postman |

## Architecture

The system is a decoupled client-server application. The React frontend communicates with the FastAPI backend exclusively via REST APIs.

```
Frontend (React)  <-->  Backend (FastAPI)  <-->  Database (PostgreSQL)
                              |
                      APScheduler (in-process)
                      — polls every 60s for
                        deadline-based transitions
```

**Core modules:**
- **Users** — registration, login, role management
- **Documents** — file metadata, version control, lifecycle status
- **Tasks** — automatic creation and assignment of review tasks
- **Audit** — read-only, immutable log of all system activity
- **Notifications** — real-time alerts for task assignment and approval/rejection

**Document lifecycle (state machine):**

```
Draft → (Author submits) → In Review → (Reviewer approves) → Approved
                                |
                                └─ (Reviewer rejects) → back to Draft
                                   (Author revises and resubmits)
```

A document can only move to `Approved` if explicitly approved by a user with the Reviewer role - authors cannot self-approve their own documents.

## Design Decisions

**Why an in-process scheduler instead of Celery/RabbitMQ?**
For the scale this system targets, a dedicated message broker adds infrastructure complexity without proportional benefit. APScheduler running inside the same server process handles deadline-based automation reliably with a much simpler deployment footprint.

**Why PostgreSQL over SQLite?**
The project started on SQLite during early development, but SQLite struggled with concurrent writes - specifically when a background scheduler task and a live user action tried to update the same document status simultaneously, leading to database locks. Migrating to PostgreSQL resolved this and made the system reliable under concurrent load.

**Why Blob URLs instead of an iframe for document rendering?**
Rendering PDFs via a fetched Blob URL is more secure than embedding documents in an iframe and avoids exposing direct file links.

## Known Challenges Solved

- **Concurrent write handling** - resolved via the SQLite 
- **File + metadata uploads** - sending a binary PDF alongside form metadata (title, deadline) required switching the frontend to `multipart/form-data` requests, with corresponding backend logic to parse both the file bytes and form fields
- **Real-time UI sync** - actions like approval need the frontend to reflect updated state without a manual page refresh, handled via re-fetching document status after each action

## Testing

Tested using a combination of Postman (API-level validation) and manual UI testing across both Author and Reviewer roles. Sample test coverage included: login validation, document upload, role-based access restriction (e.g. authors blocked from self-approval), deadline-triggered auto-transitions, and automated task assignment — all passed.

## Future Scope

- Migrate background processing to a distributed task queue (Celery + RabbitMQ/Redis) for horizontal scaling
- Add Alembic for automated, version-controlled database migrations
- Expand the in-browser viewer to support Word (.docx) and Excel (.xlsx) files
- Integrate LLMs for deeper compliance-aware summarization and semantic search, beyond basic text extraction

## Project Report

A detailed dissertation report covering literature review, full architecture, sequence diagrams, and test cases is included in this repo: [`Final_Report (1).pdf`](./Final_Report%20(1).pdf)

---
Built by [Harshitha V](https://github.com/harshithav99) as part of the M.Tech Software Engineering program at BITS Pilani.

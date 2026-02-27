# EduConnect Algeria 🇩🇿

**A comprehensive school management platform for Algerian educational institutions**

EduConnect is a multi-tenant SaaS platform built with Django REST Framework and Flutter, designed specifically for Algeria's educational system with full support for the national curriculum structure.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 5.1, Django REST Framework, PostgreSQL, Redis |
| **Real-time** | Django Channels (WebSocket) |
| **Task Queue** | Celery + Redis |
| **Mobile** | Flutter 3.29+, BLoC, GoRouter |
| **AI Chatbot** | LangChain, OpenAI, Pinecone (RAG) |
| **PDF Reports** | WeasyPrint |
| **Push Notifications** | Firebase Cloud Messaging (pyfcm) |
| **Containerization** | Docker, Docker Compose |

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Flutter    │────▶│  Django API  │────▶│ PostgreSQL│
│   Mobile     │     │  (DRF + JWT) │     └───────────┘
└─────────────┘     │              │     ┌───────────┐
                    │              │────▶│   Redis   │
                    │              │     └───────────┘
                    │              │     ┌───────────┐
                    │              │────▶│  Celery   │
                    └──────────────┘     └───────────┘
```

**Multi-Tenant Model**: Single database, all tables scoped by `school_id`. JWT tokens carry the school context, extracted via `TenantMiddleware`.

---

## Project Structure

```
ECOLE/
├── backend/                    # Django API
│   ├── apps/
│   │   ├── accounts/           # Users, profiles, authentication
│   │   ├── schools/            # School & academic year management
│   │   ├── academics/          # Levels, classrooms, subjects
│   │   ├── grades/             # Grades, report cards, rankings
│   │   ├── homework/           # Homework assignments & submissions
│   │   ├── announcements/      # School announcements & events
│   │   ├── attendance/         # Daily attendance tracking
│   │   ├── chat/               # Real-time messaging (WebSocket)
│   │   ├── finance/            # Fee management & payments
│   │   ├── notifications/      # Push notification dispatch
│   │   └── ai_chatbot/         # RAG-powered AI assistant
│   ├── core/                   # Shared utilities, mixins, validators
│   ├── educonnect/             # Django project settings
│   ├── templates/              # WeasyPrint HTML templates
│   ├── conftest.py             # Pytest fixtures
│   └── pytest.ini              # Test configuration
├── mobile/                     # Flutter app
│   ├── lib/
│   │   ├── core/               # Theme, DI, constants, networking
│   │   ├── data/               # Models & repositories
│   │   ├── features/           # Auth, admin, teacher, student, parent, shared
│   │   └── routes/             # GoRouter configuration
│   └── test/                   # Widget & unit tests
├── reports/                    # Documentation & comprehensive report
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # Backend container
└── README.md                   # This file
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Flutter 3.29+
- Node.js (for some build tools)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Set up a school
python manage.py setup_school \
  --name "Lycée Example" \
  --admin-email admin@school.dz \
  --type middle

# Seed sample data
python manage.py seed_data --school-id <uuid> --students 50

# Start development server
python manage.py runserver
```

### Mobile Setup

```bash
cd mobile

# Get dependencies
flutter pub get

# Run on device/emulator
flutter run

# Run tests
flutter test
```

### Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Run migrations inside container
docker-compose exec web python manage.py migrate
```

---

## Django Apps Overview

| App | Purpose |
|-----|---------|
| **accounts** | User management (admin, teacher, student, parent), JWT auth, profile auto-creation via signals |
| **schools** | School CRUD, academic year management |
| **academics** | Levels (1AM–4AM etc.), classrooms, subjects with coefficients, teacher assignments |
| **grades** | Grade entry, weighted average calculation, report card PDF generation, class rankings |
| **homework** | Assignment creation, file submissions, deadline reminders |
| **announcements** | School-wide announcements, events with calendar |
| **attendance** | Daily session tracking, absence notifications to parents, excessive absence alerts |
| **chat** | Real-time WebSocket messaging between users |
| **finance** | Fee structures, payment tracking, receipt PDF generation |
| **notifications** | FCM push notification dispatch |
| **ai_chatbot** | RAG-powered chatbot using Pinecone + OpenAI for curriculum Q&A |

---

## Key Features

- **Algerian Curriculum Support**: Levels (1AP–3AS), subjects with national coefficients, trimester system, Devoir/Composition exam types
- **Multi-Role Access**: Admin, Teacher, Student, Parent — each with role-specific dashboards
- **Grade Management**: Weighted average calculation, class rankings, PDF report cards (Arabic RTL)
- **Attendance Tracking**: Per-session marking, auto-parent notifications, excessive absence alerts
- **Real-time Chat**: WebSocket-powered messaging via Django Channels
- **AI Chatbot**: RAG pipeline (LangChain + Pinecone) for answering curriculum questions
- **Finance**: Fee tracking, payment recording, receipt generation (WeasyPrint)
- **Push Notifications**: FCM integration for homework deadlines, grade publications, absences
- **Multi-Tenant SaaS**: Single deployment serves multiple schools, fully isolated by `school_id`

---

## Testing

### Backend

```bash
cd backend
pytest                          # Run all tests
pytest -m "not slow"            # Skip slow tests
pytest --cov=apps               # With coverage
pytest apps/grades/tests/       # Specific app
```

### Mobile

```bash
cd mobile
flutter test                    # All tests
flutter test test/widget_test.dart  # Specific file
```

---

## API Documentation

The API follows RESTful conventions. Once the server is running:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Schema**: `http://localhost:8000/api/schema/`

### Authentication

All endpoints require JWT authentication (except login/register):

```
Authorization: Bearer <access_token>
```

Obtain tokens via `POST /api/v1/auth/token/`

---

## Management Commands

| Command | Description |
|---------|-------------|
| `setup_school` | Create a school with admin, academic year, exam types, and level structure |
| `seed_data` | Populate a school with sample teachers, students, grades, and attendance |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SECRET_KEY` | Django secret key | — |
| `DEBUG` | Debug mode | `False` |
| `OPENAI_API_KEY` | OpenAI API key (for chatbot) | — |
| `PINECONE_API_KEY` | Pinecone API key (for RAG) | — |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key | — |

---

## License

This project is developed for educational purposes as part of the EduConnect Algeria initiative.

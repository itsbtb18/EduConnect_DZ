# 🎓 ILMI

> Full-featured e-learning & school management platform for Algerian private schools  
> **Django REST API** + **Flutter Mobile App** + **React Admin Panel** (planned)

---

## 📁 Project Structure

```
ECOLE/
├── backend/                    # Django 5.1 REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── ilmi/             # Project settings & config
│   │   ├── settings/           # Split settings (base/dev/prod)
│   │   ├── urls.py             # Main URL router
│   │   ├── asgi.py             # ASGI + WebSocket config
│   │   ├── celery.py           # Celery task queue
│   │   └── wsgi.py
│   ├── core/                   # Shared utilities
│   │   ├── middleware/         # Tenant isolation middleware
│   │   ├── permissions.py      # Role-based permissions
│   │   ├── pagination.py       # DRF pagination classes
│   │   └── utils.py            # Helpers
│   └── apps/                   # Feature apps (11 total)
│       ├── accounts/           # Users, JWT auth, roles
│       ├── schools/            # School tenants, academic years
│       ├── academics/          # Levels, classrooms, schedules, lessons
│       ├── grades/             # Marks, report cards, workflows
│       ├── homework/           # Tasks, submissions
│       ├── announcements/      # Announcements, calendar events
│       ├── attendance/         # Attendance, absence excuses
│       ├── chat/               # Real-time messaging (WebSocket)
│       ├── finance/            # Fees & payments (CCP/BaridiMob)
│       ├── notifications/      # Push notifications (FCM)
│       └── ai_chatbot/         # RAG chatbot (LangChain + Pinecone)
│
├── mobile/                     # Flutter 3.x Mobile App
│   ├── pubspec.yaml            # Dependencies
│   └── lib/
│       ├── main.dart           # App entry point
│       ├── app.dart            # MaterialApp with theme & routing
│       ├── core/               # Theme, constants, network, DI, storage
│       ├── data/               # Models, repositories, API services
│       ├── features/           # Feature modules
│       │   ├── auth/           # Login (email + PIN for kids)
│       │   ├── student/        # Student dashboard, grades, schedule, homework
│       │   ├── teacher/        # Teacher dashboard
│       │   ├── parent/         # Parent dashboard
│       │   └── shared/         # Splash, profile, announcements, chat, notifications
│       └── routes/             # GoRouter navigation config
│
├── docker-compose.yml          # PostgreSQL + Redis + API + Celery + Nginx
├── nginx/                      # Nginx reverse proxy config
├── .github/workflows/ci.yml   # GitHub Actions CI pipeline
├── .env.example                # Environment variable template
├── .gitignore
└── README.md                   # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites
- **Python** 3.12+
- **PostgreSQL** 16+
- **Redis** 7+
- **Flutter** 3.29+ (SDK ^3.11.0)
- **Docker** & Docker Compose (optional, recommended)

### Option A: Docker (Recommended)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your values

# 2. Start all services
docker compose up -d

# 3. Run migrations and create superuser
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser

# 4. API available at http://localhost:8000/api/v1/
# 5. API Docs at http://localhost:8000/api/docs/
```

### Option B: Local Development

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp ../.env.example ../.env
# Edit .env — set DB_NAME, DB_USER, DB_PASSWORD

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

#### Mobile Setup
```bash
cd mobile

# Install Flutter dependencies
flutter pub get

# Run code generation (for serializers if needed)
# flutter pub run build_runner build --delete-conflicting-outputs

# Run on device/emulator
flutter run
```

---

## 🏗️ Architecture

### Backend — Django REST Framework
| Feature | Technology |
|---------|-----------|
| API Framework | Django REST Framework 3.15 |
| Authentication | JWT via `djangorestframework-simplejwt` |
| Real-time | Django Channels + Daphne (WebSocket) |
| Task Queue | Celery + Redis + django-celery-beat |
| Database | PostgreSQL 16 with UUID primary keys |
| Multi-tenancy | School-based data isolation (middleware + model mixin) |
| API Docs | drf-spectacular (Swagger + ReDoc) |
| PDF Generation | WeasyPrint |
| AI Chatbot | LangChain + Pinecone + OpenAI GPT |
| Push Notifications | Firebase Cloud Messaging (pyfcm) |
| File Storage | S3/R2 compatible (django-storages) |
| Monitoring | Sentry |

### Mobile — Flutter
| Feature | Technology |
|---------|-----------|
| State Management | flutter_bloc |
| HTTP Client | Dio with JWT interceptor auto-refresh |
| Navigation | GoRouter (declarative) |
| DI | get_it |
| Local Storage | Hive + flutter_secure_storage |
| Charts | fl_chart |
| Calendar | table_calendar |
| Real-time Chat | web_socket_channel |
| Internationalization | flutter_localizations (FR / AR / EN) |

---

## 👤 User Roles

| Role | Description |
|------|-------------|
| **superadmin** | Platform owner — manages all schools |
| **admin** | School administrator — full school management |
| **teacher** | Manages classes, grades, homework, attendance |
| **parent** | Views child's grades, attendance, payments |
| **student** | Views schedule, grades, homework, chat |

Young students can log in with **Phone + 4-digit PIN** instead of email/password.

---

## 🇩🇿 Algeria-Specific Features

- **School week**: Sunday → Thursday
- **Languages**: French (primary), Arabic, English
- **Timezone**: Africa/Algiers
- **58 Wilayas** support for school location
- **Grading system**: /20 scale with coefficient-weighted averages
- **Payment methods**: CCP, BaridiMob, bank transfer, cash
- **Trimester system**: 3 semesters per academic year

---

## 📋 Development Roadmap — Next Steps

### Phase 1: Foundation (Weeks 1-3) ← **CURRENT**
- [x] Project scaffolding (Django + Flutter + Docker)
- [x] Database models and migrations
- [x] JWT authentication with role-based access
- [x] Multi-tenant data isolation
- [ ] **→ Run `python manage.py migrate` to create all tables**
- [ ] **→ Run `flutter pub get` to install mobile dependencies**
- [ ] **→ Write seed/fixture data for testing**
- [ ] Complete Django admin customization
- [ ] Write unit tests for all models and serializers

### Phase 2: Core Features (Weeks 4-8)
- [ ] Student dashboard with grade visualization
- [ ] Teacher grade entry with admin approval workflow
- [ ] Weekly schedule display (timetable grid)
- [ ] Homework submission with file upload
- [ ] Attendance marking and parent notification
- [ ] Report card PDF generation (WeasyPrint)

### Phase 3: Communication (Weeks 9-11)
- [ ] Real-time chat (WebSocket via Django Channels)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Announcement system with priority levels
- [ ] Calendar events and holidays

### Phase 4: Payments & Finance (Weeks 12-13)
- [ ] Fee structure with installment plans
- [ ] Payment tracking (CCP/BaridiMob/cash)
- [ ] Payment reminders via notification
- [ ] Finance reports for admin

### Phase 5: AI & Advanced (Weeks 14-16)
- [ ] RAG chatbot with school knowledge base
- [ ] LangChain + Pinecone vector search
- [ ] Smart notifications and analytics
- [ ] Offline mode with data sync

### Phase 6: Polish & Launch (Weeks 17-20)
- [ ] React admin panel
- [ ] Performance optimization
- [ ] Security audit
- [ ] App Store / Play Store submission
- [ ] Production deployment (Docker + CI/CD)

---

## 🔑 API Endpoints (v1)

Base URL: `http://localhost:8000/api/v1/`

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /accounts/login/`, `POST /accounts/pin-login/`, `POST /accounts/token/refresh/` |
| Users | `GET /accounts/me/`, `GET /accounts/users/`, `POST /accounts/change-password/` |
| Schools | `/schools/schools/`, `/schools/academic-years/`, `/schools/semesters/` |
| Academics | `/academics/levels/`, `/academics/classrooms/`, `/academics/subjects/`, `/academics/schedule/`, `/academics/lessons/`, `/academics/resources/` |
| Grades | `/grades/exam-types/`, `/grades/grades/`, `/grades/report-cards/` |
| Homework | `/homework/tasks/`, `/homework/submissions/` |
| Announcements | `/announcements/announcements/`, `/announcements/events/` |
| Attendance | `/attendance/records/`, `/attendance/excuses/` |
| Chat | `/chat/conversations/`, `/chat/messages/` |
| Finance | `/finance/fee-structures/`, `/finance/payments/` |
| Notifications | `/notifications/notifications/` |
| AI Chatbot | `/ai/query/`, `/ai/sessions/` |
| API Docs | `GET /api/docs/` (Swagger), `GET /api/redoc/` |

WebSocket: `ws://localhost:8000/ws/chat/<conversation_id>/`

---

## 🧪 Running Tests

```bash
# Backend
cd backend
python -m pytest --tb=short

# Mobile
cd mobile
flutter test
```

---

## 📄 Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL credentials |
| `REDIS_URL` | Redis connection URL |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key |
| `OPENAI_API_KEY` | OpenAI API key (for AI chatbot) |
| `PINECONE_API_KEY` | Pinecone vector DB key |
| `SENTRY_DSN` | Sentry error tracking |

---

## 📜 License

Private — ILMI © 2024

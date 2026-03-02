# Madrassa (Madrassa-DZ)

**A comprehensive multi-tenant SaaS school management platform for Algerian private educational institutions**

Madrassa is a full-stack platform (Django + React + Flutter) designed for Algeria's educational system, supporting the national curriculum structure (Primaire, Moyen, Secondaire), trimester grading, and Arabic RTL report cards.

> **Repository**: `itsbtb18/EduConnect_DZ` | **Branch**: `dev` (default: `main`)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [What Has Been Built](#what-has-been-built)
- [Implementation Status](#implementation-status)
- [Issues Found & Fixed](#issues-found--fixed)
- [Remaining Known Issues](#remaining-known-issues)
- [Next Steps](#next-steps)
- [Recommendations](#recommendations)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Django, Django REST Framework, SimpleJWT | 5.1.15, 3.15 |
| **Database** | PostgreSQL | 16 |
| **Cache/Broker** | Redis | 7 |
| **Real-time** | Django Channels (WebSocket) | 4.1 |
| **ASGI Server** | Daphne | — |
| **Task Queue** | Celery + Redis | 5.4 |
| **Admin Panel** | React, TypeScript, Vite, Ant Design | 18, 5.9, 5.4, 6.x |
| **State Management** | TanStack React Query | 5.x |
| **Charts** | Recharts | 3.x |
| **Mobile** | Flutter, Dart | 3.11 |
| **Mobile State** | flutter_bloc, get_it | 9.0, 8.0 |
| **Mobile Routing** | GoRouter | 14.6 |
| **Mobile HTTP** | Dio | 5.7 |
| **Mobile Storage** | Hive, flutter_secure_storage | — |
| **AI Chatbot** | LangChain, OpenAI, Pinecone (RAG) | — |
| **PDF Reports** | WeasyPrint | — |
| **Push Notifications** | Firebase Cloud Messaging (pyfcm) | — |
| **Containerization** | Docker, Docker Compose | — |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   React Admin   │────▶│   Django API    │────▶│  PostgreSQL  │
│  (Vite + AntD)  │     │ (DRF + JWT +    │     │     16       │
└─────────────────┘     │  Channels)      │     └─────────────┘
                        │                 │     ┌─────────────┐
┌─────────────────┐     │                 │────▶│    Redis     │
│  Flutter Mobile │────▶│                 │     │     7        │
│  (BLoC + Dio)   │     │                 │     └─────────────┘
└─────────────────┘     │                 │     ┌─────────────┐
                        │                 │────▶│   Celery     │
                        └─────────────────┘     │  Worker/Beat │
                                                └─────────────┘
```

**Docker Compose Services** (7 total):
- `db` — PostgreSQL 16
- `redis` — Redis 7
- `api` — Django/Daphne ASGI
- `celery_worker` — Async task processing
- `celery_beat` — Scheduled tasks
- `admin_panel` — React/Vite (dev) or Nginx (prod)
- `nginx` — Reverse proxy

**Multi-Tenancy**: Single database, all models scoped by `school_id` via `TenantModel`. JWT tokens carry school context, extracted by `TenantMiddleware`. Every query is automatically filtered by school.

---

## Project Structure

```
ECOLE/
├── backend/                    # Django REST API (Python)
│   ├── apps/
│   │   ├── accounts/           # User model, JWT auth, profiles, signals
│   │   ├── schools/            # School CRUD, sections, academic years
│   │   ├── academics/          # Classes, subjects, teacher assignments, schedules
│   │   ├── grades/             # Grades, report cards, averages, rankings
│   │   ├── homework/           # Homework posts, attachments
│   │   ├── announcements/      # School-wide announcements
│   │   ├── attendance/         # Attendance tracking, absence excuses
│   │   ├── chat/               # WebSocket messaging (Django Channels)
│   │   ├── finance/            # Fee structures, payment tracking
│   │   ├── notifications/      # Push notification dispatch
│   │   └── ai_chatbot/         # RAG-powered AI assistant (partial)
│   ├── core/                   # Shared: models, permissions, mixins, validators
│   ├── madrassa/             # Django settings, URLs, ASGI/WSGI
│   └── templates/              # WeasyPrint HTML templates (grades, report cards)
├── admin/                      # React Admin Panel (TypeScript)
│   └── src/
│       ├── api/                # Axios client + 10 API service modules
│       ├── hooks/              # 30+ React Query hooks
│       ├── pages/              # 17 route pages
│       ├── components/         # Layout, sidebar, header, guards
│       ├── context/            # AuthContext (JWT + state)
│       └── styles/             # Global CSS, theme variables
├── mobile/                     # Flutter Mobile App (Dart)
│   └── lib/
│       ├── core/               # Theme, DI, constants, networking (Dio + 3 interceptors)
│       ├── features/           # Auth, Student, Teacher, Parent, Shared (clean arch)
│       └── routes/             # GoRouter configuration
├── nginx/                      # Reverse proxy configuration
├── Reports/                    # Documentation & specifications
├── docker-compose.yml          # Production orchestration
└── docker-compose.override.yml # Development overrides
```

---

## What Has Been Built

### Backend (11 Django Apps)

| App | Models | Endpoints | Status |
|-----|--------|-----------|--------|
| **accounts** | User (phone_number as USERNAME), roles: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT | 9 endpoints: login, refresh, logout, me, users CRUD, change-password, reset-password, platform-stats | **Complete** |
| **schools** | School, Section, AcademicYear | 3 ViewSets + my-school action | **Complete** |
| **academics** | Class, StudentProfile, ParentProfile, TeacherProfile, Subject, TeacherAssignment, ScheduleSlot, Lesson, Resource | 6 ViewSets | **Complete** |
| **grades** | Subject, TrimesterConfig, Grade (DRAFT→SUBMITTED→PUBLISHED/RETURNED workflow), ReportCard | CRUD + services for average/rank calculations | **Complete** |
| **homework** | HomeworkPost, HomeworkAttachment, HomeworkView | 4 endpoints | **Complete** |
| **announcements** | Announcement, AnnouncementAttachment, AnnouncementRead | 4 endpoints | **Complete** |
| **attendance** | AttendanceRecord, AbsenceExcuse | Bulk mark + excuse management | **Complete** |
| **chat** | ChatRoom, Message, MessageRead | REST + WebSocket consumer with JWT auth | **Complete** |
| **finance** | FeeStructure, Payment | 2 ViewSets | **Complete** |
| **notifications** | Notification, DeviceToken | 5 endpoints | **Complete** |
| **ai_chatbot** | KnowledgeBase, ChatSession, ChatMessage | RAGService coded (334 lines: Pinecone + OpenAI) | **Partial** — view returns stub |

**Core Framework:**
- `TenantModel` — Auto-scoping by school
- `AuditModel` — Soft delete + created/modified tracking
- 6 permission classes: `IsSuperAdmin`, `IsSchoolAdmin`, `IsTeacher`, `IsParent`, `IsStudent`, `IsSameSchool`
- `TenantAwareViewSet` — Auto-filters queries by school
- `TenantMiddleware` — Extracts school context from JWT
- Pagination classes: Standard (20), Small (10), Large (50)

### Admin Panel (React — 17 Pages)

| Page | Functionality | Status |
|------|--------------|--------|
| **LoginPage** | JWT auth, error handling | **Complete** |
| **Dashboard** | Stats cards, activity feed | **Complete** |
| **UserManagement** | Full CRUD for all user roles | **Complete** |
| **SchoolManagement** | School CRUD + sections | **Complete** |
| **GradeManagement** | Grade entry, update, submission | **Complete** |
| **AttendancePage** | Attendance marking + history | **Complete** |
| **MessagingPage** | Chat rooms + message history | **Complete** |
| **FinancialPage** | Payment tracking + creation | **Complete** |
| **AnalyticsPage** | Charts (Recharts) for performance | **Complete** |
| **SuperAdminDashboard** | Platform-wide stats | **Complete** |
| **PlanManagement** | Subscription plans | **Complete** |
| **NotificationsPage** | View + mark as read | **Complete** |
| **StudentList** | Student list with search, pagination, CRUD | **Fixed** (was stub) |
| **TeacherList** | Teacher list with search, pagination, CRUD | **Fixed** (was stub) |
| **StudentDetail** | Student profile, grades, attendance | **Fixed** (was placeholder) |
| **AnnouncementsPage** | Create, edit, delete announcements | **Fixed** (edit was missing) |
| **SettingsPage** | Profile, password, notifications, general | **Fixed** (was simulated) |

### Mobile App (Flutter — Clean Architecture + BLoC)

| Feature Area | Data Layer | BLoC/Logic | UI Screens | Status |
|-------------|-----------|-----------|------------|--------|
| **Auth** | 100% | 100% | 100% (login, PIN, biometric) | **Complete** |
| **Core** | 100% | — | — (DI, Dio, interceptors, storage) | **Complete** |
| **Student** | 100% (datasource + repos) | 50% | 20% (scaffolded) | Data-UI disconnect |
| **Teacher** | 100% | 50% (attendance BLoC) | 40% (hardcoded data) | Data-UI disconnect |
| **Parent** | 100% | 100% (finance BLoC) | 40% (hardcoded data) | Data-UI disconnect |
| **Shared** | 100% | — | Splash ✅, Profile ✅, Chat/Announcements/Notifications scaffolded | Mixed |
| **AI Chatbot** | — | — | UI done (mock responses) | UI-only |

---

## Implementation Status

### Completion Summary

| Component | Implemented | Partial | Total |
|-----------|:---------:|:------:|:-----:|
| Backend Apps | 10 | 1 (ai_chatbot) | 11 |
| Admin Pages | 17 | 0 | 17 |
| Mobile Features | 2 (auth, core) | 4 (student, teacher, parent, shared) | 6 |
| API Services | 10 | 0 | 10 |
| React Query Hooks | 35+ | 0 | 35+ |
| Docker Services | 7 | 0 | 7 |

### What Works End-to-End
1. User authentication (login, JWT refresh, logout) — all three platforms
2. School management (create, edit, delete, list)
3. User management (create, edit, delete, role assignment)
4. Class management via academic module
5. Grade entry, update, and submission workflow
6. Attendance marking and history
7. Real-time chat via WebSocket
8. Payment tracking and creation
9. Announcement publish/delete
10. Push notification dispatch
11. Super admin platform-wide management

### What's Partially Implemented
1. **AI Chatbot** — RAGService fully coded (Pinecone + OpenAI + LangChain) but the view returns a hardcoded "Fonctionnalite bientot disponible" response
2. **Report Card PDF** — WeasyPrint templates exist but generation not fully wired
3. **Mobile screens** — Data layer (datasources, repositories, models) is 100% complete, but most screens use hardcoded placeholder data instead of dispatching BLoC events

---

## Issues Found & Fixed

### Critical Fixes Applied

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `admin/src/api/services.ts` | `studentsAPI` and `teachersAPI` only had `list` and `get` — missing create/update/delete | Added `create`, `update`, `delete` methods to both |
| 2 | `admin/src/pages/students/StudentList.tsx` | `handleDelete` called `studentsAPI.get(id)` instead of delete; `handleSubmit` never called API | Wired to `useDeleteStudent`, `useCreateStudent`, `useUpdateStudent` mutation hooks |
| 3 | `admin/src/pages/teachers/TeacherList.tsx` | All CRUD operations were stubs (success toast without API calls); delete showed "Suppression non disponible" | Wired to `useCreateTeacher`, `useUpdateTeacher`, `useDeleteTeacher` mutation hooks |
| 4 | `admin/src/pages/announcements/AnnouncementsPage.tsx` | Edit button had no `onClick` handler | Added edit flow with `useUpdateAnnouncement` hook, pre-fills form with existing data |
| 5 | `admin/src/pages/settings/SettingsPage.tsx` | Profile save was simulated with `setTimeout`; password change showed success without API call | Wired to `useUpdateProfile` and `useChangePassword` hooks with real API calls |
| 6 | `admin/src/pages/students/StudentDetail.tsx` | Edit button had no `onClick`; grades/attendance cards showed placeholder text | Added navigation to edit; replaced placeholders with real data tables using `useGrades` and `useAttendance` hooks |
| 7 | `admin/src/hooks/useApi.ts` | Missing mutation hooks for student/teacher CRUD, announcement update, profile update, password change | Added 9 new hooks: `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`, `useCreateTeacher`, `useUpdateTeacher`, `useDeleteTeacher`, `useUpdateAnnouncement`, `useUpdateProfile`, `useChangePassword` |
| 8 | `admin/src/data/mockData.ts` | 200+ lines of dead mock data (never imported anywhere) | Cleared file with deprecation notice |

---

## Remaining Known Issues

### Medium Priority
| # | Issue | Location | Details |
|---|-------|----------|---------|
| 1 | AI chatbot view returns stub response | `backend/apps/ai_chatbot/views.py` | RAGService is fully coded but not wired to the view endpoint |
| 2 | Report card PDF generation not fully wired | `backend/apps/grades/` | WeasyPrint templates exist in `templates/` but the generation endpoint needs completion |
| 3 | Hardcoded DB password in docker-compose | `docker-compose.yml` | Should use `.env` file for all secrets |
| 4 | TimetablePage is read-only | `admin/src/pages/timetable/` | Displays schedule but no CRUD for schedule slots |
| 5 | PlatformSettings page is decorative | `admin/src/pages/platform/` | Toggle switches don't persist state |

### Mobile-Specific
| # | Issue | Details |
|---|-------|---------|
| 1 | Data-UI disconnect | Most screens have full data layer (datasources + repos) but display hardcoded/placeholder data instead of fetching from BLoC |
| 2 | Duplicate Announcement model | Exists in two separate model files under different feature directories |
| 3 | No push notification handling | `DeviceToken` model exists in backend but FCM token registration not implemented in mobile |
| 4 | Unused dependencies | Some packages in `pubspec.yaml` are declared but never used |

---

## Next Steps

### Phase 1 — Immediate (1-2 weeks)
1. **Wire AI Chatbot view** — Connect the existing `RAGService` to the chatbot API endpoint so it returns real RAG responses instead of a stub
2. **Complete report card PDF** — Wire the WeasyPrint templates to a `/grades/report-cards/{id}/pdf/` endpoint
3. **Move secrets to `.env`** — Remove hardcoded passwords from `docker-compose.yml`, create `.env.example`
4. **Add Excel import/export** — The backend has `openpyxl` in requirements but no import/export endpoints exist yet

### Phase 2 — Mobile App (2-4 weeks)
5. **Connect mobile screens to BLoC** — Replace hardcoded data in Student/Teacher/Parent screens with real BLoC event dispatching
6. **Implement FCM token registration** — Register device tokens on login, handle incoming push notifications
7. **Fix duplicate Announcement model** — Consolidate into a single shared model
8. **Wire chatbot mobile UI** — Connect the existing chat UI to the backend chatbot endpoint

### Phase 3 — Production Readiness (2-3 weeks)
9. **Write comprehensive tests** — Backend: pytest for all 11 apps (currently only tenant isolation test exists); Frontend: React Testing Library for key pages; Mobile: widget + integration tests
10. **Add CI/CD pipeline** — GitHub Actions for lint, test, build, deploy
11. **SSL/HTTPS configuration** — Add Certbot/Let's Encrypt to nginx
12. **Database backups** — Automated PostgreSQL backups with pg_dump cron job
13. **Rate limiting** — Add DRF throttling to auth endpoints
14. **Logging & monitoring** — Sentry for error tracking, structured logging

### Phase 4 — Advanced Features (4-6 weeks)
15. **Offline mode for mobile** — Use Hive local cache for read data when offline
16. **Multi-language support** — Arabic (RTL) and French for the admin panel
17. **Parent/Student role-specific dashboards** in admin panel
18. **Discipline & behavior module** — Referenced in specs but not yet built
19. **Student gamification system** — Points, badges, leaderboards
20. **Multi-branch support** — Multiple campuses under one school

---

## Recommendations

### Architecture
- **Keep the current clean architecture approach** — The feature-first structure in mobile and hook-based patterns in React are well-organized
- **Standardize error handling** — Add a global error boundary in React and a consistent error interceptor in mobile Dio
- **API versioning** — Current URLs are unversioned (`/api/auth/`). Consider adding `/api/v1/` prefix for future compatibility

### Security
- **Environment variables** — URGENT: Move all secrets (DB passwords, secret keys, API keys) to `.env` files; never commit them
- **Rate limiting** — Add throttling to `login`, `refresh`, and `reset-password` endpoints
- **CORS hardening** — Currently allows all origins in dev; restrict in production
- **Input validation** — Add Django REST Serializer validators for phone numbers (Algerian format: `0[5-7]\d{8}`)

### Code Quality
- **Remove dead code** — `mockData.ts` (cleaned) and `types/index.ts` are no longer needed
- **TypeScript strict mode** — Enable `strict: true` in tsconfig for better type safety
- **Consistent naming** — Some backend `related_name` attributes may collide between `grades.Subject` and `academics.Subject` — audit and prefix them
- **API response types** — Create TypeScript interfaces for all API responses instead of using `Record<string, unknown>` everywhere

### Performance
- **Database indexing** — Add indexes on `school_id`, `created_at`, and frequently-filtered fields
- **Query optimization** — Use `select_related` and `prefetch_related` in ViewSets to reduce N+1 queries
- **Frontend pagination** — Already implemented with React Query; add infinite scroll option for mobile lists
- **Redis caching** — Cache frequently-accessed read-only data (schedule slots, subjects, school info)

### Testing Strategy
- **Backend**: Aim for 80%+ coverage. Priority: auth flows, grade calculations, tenant isolation, permissions
- **Frontend**: Test critical user journeys (login, grade entry, student CRUD) with React Testing Library
- **Mobile**: BLoC tests for all state machines, widget tests for form validations
- **E2E**: Consider Cypress (web) and integration_test (Flutter) for critical paths

### Deployment
- **Use Docker Compose profiles** for staging vs production
- **Add health check endpoints** — `system_health_check.py` exists but needs integration into Docker health checks
- **Blue-green deployment** — Prepare for zero-downtime releases
- **CDN for static assets** — Serve admin panel via CloudFlare or similar

---

## Quick Start

### Prerequisites
- Python 3.11+ | PostgreSQL 16+ | Redis 7+ | Node.js 18+ | Flutter 3.11+

### Docker (Recommended)

```bash
# Clone and start all services
git clone https://github.com/itsbtb18/EduConnect_DZ.git
cd ECOLE
docker-compose up --build

# Run migrations
docker-compose exec api python manage.py migrate

# Create a superadmin
docker-compose exec api python manage.py createsuperuser

# Access:
# - Admin Panel:  http://localhost:5173
# - API:          http://localhost:8001/api/
# - Django Admin: http://localhost:8001/admin/
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

**Admin Panel:**
```bash
cd admin
npm install
npm run dev  # http://localhost:5173
```

**Mobile:**
```bash
cd mobile
flutter pub get
flutter run
```

---

## API Documentation

Base URL: `http://localhost:8001/api/`

### Authentication
```
POST /auth/login/           # Login (phone_number + password) → JWT tokens
POST /auth/refresh/         # Refresh access token
POST /auth/logout/          # Blacklist refresh token
GET  /auth/me/              # Current user info
```

### Core Endpoints
```
GET|POST        /auth/users/              # List / Create users
GET|PATCH|DEL   /auth/users/{id}/         # User detail / update / delete
GET|POST        /schools/                 # School management
GET|POST        /academics/classes/       # Class management
GET|POST        /academics/students/      # Student profiles
GET|POST        /academics/teachers/      # Teacher profiles
GET|POST        /grades/                  # Grade management
POST            /attendance/              # Mark attendance
GET|POST        /announcements/           # Announcements
GET|POST        /finance/payments/        # Payments
GET             /chat/rooms/              # Chat rooms
GET             /notifications/           # Notifications
```

All endpoints require `Authorization: Bearer <access_token>` header (except login).

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `SECRET_KEY` | Django secret key | Yes |
| `DEBUG` | Debug mode (True/False) | No |
| `OPENAI_API_KEY` | OpenAI API key (chatbot) | For AI features |
| `PINECONE_API_KEY` | Pinecone API key (RAG) | For AI features |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key | For push notifications |

---

## Management Commands

| Command | Description |
|---------|-------------|
| `python manage.py createsuperuser` | Create a super admin user |
| `python manage.py setup_school` | Create a school with admin user |
| `python manage.py seed_data` | Populate sample data |
| `python manage.py fix_passwords` | Fix unhashed passwords in database |

---

## License

This project is developed for educational purposes as part of the Madrassa initiative.

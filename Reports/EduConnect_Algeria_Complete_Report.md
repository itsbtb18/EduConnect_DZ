# 📚 EduConnect Algeria — Complete Product Conception & Technical Blueprint

> **A Multi-Tenant SaaS E-Learning & School Management Platform for Algerian Private Schools**  
> Version 3.0 — February 2026 | Confidential  
> Status: Foundation Phase — Django Backend + Flutter Mobile scaffolded

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [⭐ Multi-Tenant SaaS — The Core Concept](#2--multi-tenant-saas--the-core-concept)
3. [Market Opportunity & Business Context](#3-market-opportunity--business-context)
4. [Project Structure & Quick Start](#4-project-structure--quick-start)
5. [Platform Overview & Architecture](#5-platform-overview--architecture)
6. [Algerian Educational System Reference](#6-algerian-educational-system-reference)
7. [Algerian Legal & Regulatory Compliance](#7-algerian-legal--regulatory-compliance)
8. [User Roles & Hierarchy](#8-user-roles--hierarchy)
9. [Authentication & Account Management](#9-authentication--account-management)
10. [School Structure & Section Management](#10-school-structure--section-management)
11. [Feature Specification — Admin Panel](#11-feature-specification--admin-panel)
12. [Feature Specification — Teacher App](#12-feature-specification--teacher-app)
13. [Feature Specification — Parent App](#13-feature-specification--parent-app)
14. [Feature Specification — Student App](#14-feature-specification--student-app)
15. [Grading System Design](#15-grading-system-design)
16. [Advanced Academic Analytics](#16-advanced-academic-analytics)
17. [Timetable & Scheduling Engine](#17-timetable--scheduling-engine)
18. [Discipline & Behavior Module](#18-discipline--behavior-module)
19. [Messaging & Communication System](#19-messaging--communication-system)
20. [RAG Chatbot System](#20-rag-chatbot-system)
21. [Premium Content & Payment System](#21-premium-content--payment-system)
22. [Student Gamification](#22-student-gamification)
23. [Multi-Branch Support](#23-multi-branch-support)
24. [Database Schema & Models](#24-database-schema--models)
25. [API Design](#25-api-design)
26. [Technology Stack](#26-technology-stack)
27. [Security & Data Protection](#27-security--data-protection)
28. [Multi-Tenancy Design](#28-multi-tenancy-design)
29. [Notifications System](#29-notifications-system)
30. [Offline Mode & Mobile Enhancements](#30-offline-mode--mobile-enhancements)
31. [File Storage & Media Management](#31-file-storage--media-management)
32. [Performance & Scalability Engineering](#32-performance--scalability-engineering)
33. [Disaster Recovery Plan](#33-disaster-recovery-plan)
34. [Business Model & Pricing](#34-business-model--pricing)
35. [Team Structure & Timeline](#35-team-structure--timeline)
36. [Development Roadmap](#36-development-roadmap)
37. [Testing Strategy & Quality Assurance](#37-testing-strategy--quality-assurance)
38. [Go-To-Market Strategy](#38-go-to-market-strategy)
39. [Critical Success Factors](#39-critical-success-factors)
40. [Features NOT to Build Yet](#40-features-not-to-build-yet)
41. [Hidden Technical Decisions](#41-hidden-technical-decisions)
42. [Competitive Advantage Strategy](#42-competitive-advantage-strategy)
43. [Personal Action Plan](#43-personal-action-plan)
44. [Open Questions & Decisions Pending](#44-open-questions--decisions-pending)
45. [Glossary](#45-glossary)
46. [Appendix A — Naming Conventions](#appendix-a--naming-conventions)
47. [Appendix B — Environment Variables](#appendix-b--environment-variables)

---

## 1. Executive Summary

**EduConnect Algeria** is a multi-tenant SaaS e-learning and school management platform designed specifically for private primary, middle, and high schools in Algeria. The platform addresses a critical gap in the Algerian private education market: fragmented communication, manual administrative work, and a complete lack of digital infrastructure connecting administration, teachers, parents, and students.

This document consolidates every feature, architecture decision, technology choice, legal consideration, team structure, timeline, and business model required to build and commercialize this product professionally. The goal is to create a platform so complete, so easy to use, and so valuable that private schools cannot afford not to adopt it.

### The Five Applications

| Application | Users | Primary Purpose |
|---|---|---|
| **Admin Web Panel** | School directors, secretaries, accountants | Full school management, configuration, reports |
| **Teacher Mobile App** | All teachers | Class management, homework, marks, messaging |
| **Parent Mobile App** | All parents/guardians | Monitor children, receive communications, chatbot |
| **Student Mobile App** | All students (ages 5–18) | View resources, homework, marks, messages |
| **Super Admin Panel** | Platform owner (developer) | Multi-school SaaS management, billing, support |

```
┌─────────────────────────────────────────────────────────┐
│                  EduConnect Algeria                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Admin   │  │ Teacher  │  │  Parent  │  │Student │ │
│  │Web Panel │  │Mobile App│  │Mobile App│  │Mobile  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│              ┌──────────────────┐                       │
│              │  Super Admin     │                       │
│              │  Panel (You)     │                       │
│              └──────────────────┘                       │
│                                                         │
│          Shared Django REST API Backend                  │
└─────────────────────────────────────────────────────────┘
```

### What the Platform Solves

| Current Problem | Our Solution |
|---|---|---|
| Marks communicated by paper or WhatsApp | Digital grade entry, review, and publication workflow |
| Homework assignments lost or forgotten | Homework posts with push notifications and due dates |
| Parents have no visibility into child's studies | Dedicated parent app with full academic dashboard |
| Administration drowns in paperwork | One-click report card generation, attendance tracking |
| No structured teacher-parent communication | Private dedicated chat channels per student |
| School knowledge is scattered | AI-powered RAG chatbot answering any question |
| No performance analytics for directors | Advanced analytics, risk detection, predictive alerts |
| Manual fee tracking and physical receipts | Digital payment tracking and receipt generation |

---

## 2. ⭐ Multi-Tenant SaaS — The Core Concept

> **This is the single most important architectural decision in the entire project. Understand this section before reading anything else.**

EduConnect Algeria is built as a **Multi-Tenant SaaS (Software as a Service)** platform. This means you deploy the system **ONE time** in the cloud, and **ALL schools** use the exact same system. You never redeploy for each new school.

### 2.1 How It Works After Deployment

You deploy:

- **1 Backend** (Django API)
- **1 Database** (PostgreSQL)
- **1 Admin Panel** (React)
- **1 Mobile App** (Flutter — published once on Play Store & App Store)

All hosted on: **AWS / Hetzner / DigitalOcean** — or any VPS + Docker.

Then: each school has its own account **inside the same system**.

### 2.2 What Happens When a New School Subscribes?

You do **NOT** redeploy. You simply:

1. Create a new `School` record in the database
2. Assign them a Plan (Starter / Pro / Pro+AI)
3. Create their initial admin user account
4. **Done.** The school is live.

That's it. No new servers. No new code. No new app builds.

### 2.3 Think Like This

You are **NOT** building 3 different apps for 3 different schools. You are building:

> **1 big system → with many isolated schools inside it**

Just like:

| Platform | Reality |
|---|---|
| **Shopify** | Thousands of online stores → one system |
| **Slack** | Thousands of companies → one system |
| **Google Workspace** | Millions of organizations → one system |
| **EduConnect Algeria** | Hundreds of Algerian schools → one system |

Same idea. Same architecture. Same power.

### 2.4 How Data Is Separated Between Schools

Every single table in the database includes a `school_id` column:

```
┌────┬────────────────┬───────────┐
│ id │ student_name   │ school_id │
├────┼────────────────┼───────────┤
│ 1  │ Ahmed          │ 1         │
│ 2  │ Sara           │ 1         │
│ 3  │ Karim          │ 2         │
│ 4  │ Fatima         │ 2         │
└────┴────────────────┴───────────┘
```

- **School 1** only sees Ahmed and Sara → their students
- **School 2** only sees Karim and Fatima → their students
- **They can NEVER see each other's data**

This is enforced at the Django backend level — every single API query is automatically filtered by the authenticated user's `school_id`:

```python
class TenantAwareViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'SUPER_ADMIN':
            return qs  # Platform owner sees everything
        return qs.filter(school=self.request.user.school)  # Everyone else: their school only
```

This is called **Multi-Tenant Architecture**.

### 2.5 The Deployment Flow

```
Step 1 → Deploy backend ONCE (Django + PostgreSQL + Redis + Celery)
Step 2 → Deploy admin panel ONCE (React web app)
Step 3 → Upload mobile app to Play Store / App Store ONCE
Step 4 → Onboard schools INSIDE the system (create records, not servers)

✅ No new hosting needed per school
✅ No redeployment per school
✅ No separate databases per school (at MVP stage)
```

### 2.6 Why This Is Powerful

**Without SaaS (the wrong way):**
- Deploy separately for each school → More servers, more bugs, more maintenance, more cost, more chaos
- 100 schools = 100 deployments = nightmare

**With SaaS (the right way):**
- One server cluster for all schools
- **Centralized updates** → update once, all schools get it instantly
- Near-zero marginal cost per additional school
- Scale by adding infrastructure capacity, not deployments

### 2.7 Feature Flags by Plan

Different schools pay for different plans. Features are controlled dynamically:

```python
# In views or permissions:
if school.subscription_plan == 'PRO_AI':
    enable_ai_chatbot()
elif school.subscription_plan == 'PRO':
    enable_premium_content()
else:  # STARTER
    basic_features_only()
```

You do NOT deploy different code for different schools. One codebase, feature flags.

### 2.8 When You Grow to 100+ Schools

You don't create 100 deployments. You **scale infrastructure**:

```
1 school:     1 server is enough
10 schools:   Add Redis caching
50 schools:   Add a load balancer + 2 backend instances
100 schools:  Add PostgreSQL read replicas
300 schools:  Add CDN + more workers + monitoring
```

But still **ONE system**. Always.

### 2.9 SaaS Isolation Models

There are two approaches to multi-tenancy:

| Model | Description | Cost | Security |
|---|---|---|---|
| **Shared Database** (our choice) | All schools in one database, separated by `school_id` | Cheaper | Strong (with proper isolation) |
| **Separate Database per School** | Each school gets its own PostgreSQL schema/database | Expensive | Strongest |

**For Algerian private schools → Start with shared database + strict ORM-level isolation.** This is what Shopify, Slack, and most SaaS companies use. Upgrade to separate schemas later only if a large school group demands it.

> **Bottom Line:** You deploy once. You create schools inside the system. You assign plans. You enable features dynamically. You scale infrastructure when user base grows. That's how real SaaS businesses work.

---

## 3. Market Opportunity & Business Context

### 2.1 Primary Market

Algeria has over **3,000 private schools** across all 58 wilayas with limited or no digital tools for school management. A well-executed SaaS product targeting this market at an affordable price point has massive potential. These range from small single-level schools (primary only) to large multi-level institutions combining primary, middle, and high school under one roof.

### 2.2 Key Market Insight: Schools Are Not All the Same

A critical design decision is that schools come in different configurations:

- **Single-level schools** — Primary only, Middle only, or High School only
- **Dual-level schools** — Primary + Middle, or Middle + High School
- **Full schools** — Primary + Middle + High School combined

The platform must handle all of these configurations cleanly, with each section (primary / middle / high school) managed independently within the same school tenant.

### 2.3 Business Model

- **SaaS subscription** per school, billed monthly or annually
- Pricing tiered by number of active students
- Schools can optionally monetize premium content to their own students/parents through the platform (school earns revenue, platform takes a small fee)

### 2.4 Revenue Projection

| Milestone | Schools | Avg Monthly/School | Total Monthly Revenue |
|---|---|---|---|
| 6 months (pilot phase) | 3–5 schools | 0 DZD (free pilots) | Testimonials & learning |
| 12 months | 15–20 schools | 18,000 DZD | 270,000–360,000 DZD (~2,000–2,600 USD) |
| 18 months | 50–100 schools | 19,000–20,000 DZD | 950,000–2,000,000 DZD (~7,000–14,500 USD) |
| 24 months | 120 schools | 20,000 DZD | 2,400,000 DZD (~17,500 USD) |
| 36 months | 300 schools | 22,000 DZD | 6,600,000 DZD (~48,000 USD) |

At scale, this is a high-margin business — near-zero marginal cost per additional school.

---

## 4. Project Structure & Quick Start

### 3.1 Repository Structure

```
ECOLE/
├── backend/                    # Django 5.1 REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── educonnect/             # Project settings & config
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
├── README.md
└── Reports/                    # This report and supporting documentation
```

### 3.2 Prerequisites

- **Python** 3.12+
- **PostgreSQL** 16+
- **Redis** 7+
- **Flutter** 3.29+ (SDK ^3.11.0)
- **Docker** & Docker Compose (optional, recommended)

### 3.3 Quick Start — Docker (Recommended)

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

### 3.4 Quick Start — Local Development

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

### 3.5 Running Tests

```bash
# Backend
cd backend
python -m pytest --tb=short

# Mobile
cd mobile
flutter test
```

---

## 5. Platform Overview & Architecture

### 4.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  Admin Web (React)  Teacher App  Parent App  Student App        │
│                       (Flutter)   (Flutter)   (Flutter)         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                       │
│              SSL Termination + Static File Serving               │
└──────────┬─────────────────────────────┬────────────────────────┘
           │                             │
┌──────────▼──────────┐      ┌──────────▼──────────┐
│   Django + Daphne   │      │   FastAPI Chatbot    │
│   (Main Backend)    │      │   (RAG Service)      │
│   REST API          │      │   LLM Orchestration  │
│   WebSocket (Chat)  │      │                      │
└──────────┬──────────┘      └──────────┬──────────┘
           │                             │
┌──────────▼─────────────────────────────▼────────────────────────┐
│                         DATA LAYER                               │
│  PostgreSQL    Redis      Qdrant         Elasticsearch           │
│  (Primary DB)  (Cache +   (Vector DB     (Full-text              │
│                Sessions + for RAG)       search)                 │
│                Channels)                                         │
└──────────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                      ASYNC LAYER                                 │
│              Celery Workers (Background Tasks)                   │
│   PDF Generation | Bulk Import | Push Notifications | Emails    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Tenant Architecture

One deployment serves all schools. Each school's data is completely isolated. When a new school subscribes, a new tenant is created — no new servers, no new deployments. Schools can never see each other's data under any circumstances.

The Django backend extracts the school from the authenticated user's JWT token and automatically applies it as a filter to every query. No school can ever see another school's data.

```python
# Every ViewSet inherits this — no exceptions
class TenantAwareViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'SUPER_ADMIN':
            return qs  # Super admin sees all
        return qs.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
```

### 4.3 Algeria-Specific Platform Features

- **School week**: Sunday → Thursday
- **Languages**: French (primary), Arabic, English
- **Timezone**: Africa/Algiers
- **58 Wilayas** support for school location
- **Grading system**: /10 scale (Primary) and /20 scale (Middle & High) with coefficient-weighted averages
- **Payment methods**: CCP, BaridiMob, CIB, bank transfer, cash
- **Trimester system**: 3 semesters per academic year
- **National exams**: BEP (5AP), BEM (4AM), BAC (3AS) tracking

---

## 6. Algerian Educational System Reference

The platform is built around the official Algerian Ministry of National Education structure. Private schools follow this structure with minor internal variations allowed.

### 5.1 Educational Levels

#### 🟢 Primary School (École Primaire) — 6 Years

| Year | Name | Grade Scale | Pass Threshold | End Exam |
|---|---|---|---|---|
| Year 0 | Preparatory (CP1) | /10 | 5/10 | — |
| Year 1 | 1AP | /10 | 5/10 | — |
| Year 2 | 2AP | /10 | 5/10 | — |
| Year 3 | 3AP | /10 | 5/10 | — |
| Year 4 | 4AP | /10 | 5/10 | — |
| Year 5 | 5AP | /10 | 5/10 | **BEP (National Exam)** |

**Progression to:** Middle School (CEM)

**Subjects per year:**

| Subject | CP1 | 1AP | 2AP | 3AP | 4AP | 5AP |
|---|---|---|---|---|---|---|
| Arabic Language | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mathematics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Islamic Education | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Civic Education | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Artistic Education | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Physical Education | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| French Language | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| History & Geography | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Natural Sciences | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

#### 🟡 Middle School (CEM — Collège d'Enseignement Moyen) — 4 Years

| Year | Name | Grade Scale | Pass Threshold | End Exam |
|---|---|---|---|---|
| Year 1 | 1AM | /20 | 10/20 | — |
| Year 2 | 2AM | /20 | 10/20 | — |
| Year 3 | 3AM | /20 | 10/20 | — |
| Year 4 | 4AM | /20 | 10/20 | **BEM (National Exam)** |

**Progression to:** High School (Lycée)

**Subjects (all years):** Arabic, Mathematics, Islamic Education, Civic Education, French, English, History, Geography, Natural Sciences, Physics, Technology, Physical Education, Artistic Education

---

#### 🔴 High School (Lycée) — 3 Years

| Year | Name | Grade Scale | Pass Threshold | End Exam |
|---|---|---|---|---|
| Year 1 | 1AS (Common Core) | /20 | 10/20 | — |
| Year 2 | 2AS (Specialized) | /20 | 10/20 | — |
| Year 3 | 3AS (Specialized) | /20 | 10/20 | **BAC (National Exam)** |

**Progression to:** University

**Specialization Streams (2AS & 3AS):**

| Stream | Key Subjects |
|---|---|
| Sciences | Advanced Math, Physics, Natural Sciences |
| Mathematics | Advanced Math, Physics |
| Technical Mathematics | Math, Physics, Technology |
| Literature & Philosophy | Philosophy, Arabic Literature, History |
| Foreign Languages | French, English, other languages |
| Management & Economics | Economics, Accounting, Law, Management |

---

### 5.2 Academic Year Structure & Grading

All levels follow a **trimester system**:

```
September ──► October/November ──► January
     [Trimester 1]

February ──► March/April
     [Trimester 2]

April/May ──► June
     [Trimester 3]
```

Each trimester includes:
- Continuous Assessment (participation, quizzes, homework)
- First Test
- Second Test
- Final Examination

**Default exam weighting within a trimester (configurable per school):**

| Component | Default Weight |
|---|---|
| Continuous Assessment | 20% |
| First Test | 20% |
| Second Test | 20% |
| Final Exam | 40% |

**Grade calculation formulas:**

```
Trimester Average = Σ(Subject Grade × Coefficient) ÷ Σ(Coefficients)

Yearly Average = (Trimester1 Average + Trimester2 Average + Trimester3 Average) ÷ 3
```

> ⚠️ **Design Note:** All weights and coefficients MUST be configurable per school and per level from the admin panel. Some private schools use different weighting policies internally.

---

## 7. Algerian Legal & Regulatory Compliance

Since private schools operate under the authority of the Ministry of National Education, the app must support legal compliance.

### 6.1 Official Exam Tracking

Schools must prepare students for: **BEP (5AP)**, **BEM (4AM)**, **BAC (3AS)**.

Required features:
- Official exam preparation tracking per student
- Mock exam management (mock BEM, mock BAC)
- BAC candidate status tracking and stream assignment
- Export of student data in **official Ministry format** (Excel template matching Algerian requirements)
- Pre-exam performance report per student

### 6.2 Long-Term Archiving Requirements

Algerian schools are legally required to keep student academic records and attendance records for multiple years.

Required features:
- **Long-term academic archiving** (minimum 5–10 years of data retention)
- **"Graduated" student status**: read-only profile accessible after graduation — data never deleted
- **"Transferred" student status**: data locked but accessible for reference
- **Secure exportable archives**: ZIP backup per academic year, downloadable by admin
- **Archive viewer**: search any past student by name, year, or student ID
- **Automatic yearly archiving** Celery task at end of academic year
- Ministry export: generate official student data file in Ministry-required format

---

## 8. User Roles & Hierarchy

### 7.1 Role Definitions

```
SUPER_ADMIN (Developer / Platform Owner)
│   ├── Creates and manages all School tenants
│   ├── Manages billing and subscriptions
│   └── Can impersonate any school admin for support

SCHOOL_ADMIN (School Director / Secretary)
│   ├── Manages everything within their school
│   ├── Creates Teacher, Parent, and Student accounts
│   └── Multiple admin accounts allowed per school (different devices/secretaries)

SECTION_ADMIN (Optional — for large combined schools)
│   ├── Admin limited to one section (e.g., Primary only)
│   └── Cannot see data from other sections of the same school

TEACHER
│   ├── Assigned to specific subjects and classes
│   ├── Can only see data for their assigned classes
│   └── Submits grades to admin for review and publication

PARENT
│   ├── Can have multiple children linked to their account
│   ├── Switches between children's profiles in the app
│   └── Receives data only about their own children

STUDENT
│   ├── Belongs to one class
│   ├── Age-adaptive interface based on school level
│   └── Can only see their own data
```

Young students can log in with **Phone + 4–6 digit PIN** instead of email/password.

### 7.2 Permission Matrix

| Action | Super Admin | School Admin | Section Admin | Teacher | Parent | Student |
|---|---|---|---|---|---|---|
| Create school tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create admin accounts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create teacher accounts | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create student/parent accounts | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Post announcements | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Enter grades | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Publish grades | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Post homework | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View child's grades | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View own grades | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Generate report cards | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure grading weights | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View analytics dashboard | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| File discipline report | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Build timetable | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 9. Authentication & Account Management

### 8.1 Core Principle

> **Nobody self-registers. Every account is created by a higher authority in the hierarchy.** This guarantees identity integrity — the school already verified every student and parent identity physically during enrollment. The system leverages that existing trust.

### 8.2 Account Creation Flow

```
┌─────────────────────────────────────────────────────┐
│  You (Super Admin) creates School Admin accounts    │
│  → Delivers credentials via email or direct handoff │
└─────────────────────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────┐
│  School Admin creates Teacher accounts              │
│  → System generates temp password                   │
│  → Admin delivers via SMS or printed sheet          │
│  → Teacher forced to change password on first login │
└─────────────────────────────────┬───────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────┐
│  School Admin creates Student + Parent accounts     │
│  → Admin fills form: student name, DOB, class,      │
│    parent phone number                              │
│  → System auto-creates linked Student + Parent      │
│    accounts simultaneously                          │
│  → Parent receives SMS with credentials             │
│  → Student receives printed card at school          │
│  → Both forced to change password on first login    │
└─────────────────────────────────────────────────────┘
```

### 8.3 One Parent → Multiple Children

When admin creates a second student with a phone number that already exists in the system:

```
Admin creates Student B with parent phone: 0555123456

System checks: Does phone 0555123456 already exist?
  YES → Link Student B to existing Parent account
        (no new account created, no duplicate)
  NO  → Create new Parent account, link to Student B
```

The parent sees a **child switcher** on the home screen of their app, similar to how Netflix lets you switch profiles. Each child's data is completely separate.

Additionally, both father and mother can each have their own parent account linked to the same student, by registering with different phone numbers.

### 8.4 Bulk Import Flow

For onboarding a school with hundreds of students at year start:

1. Admin downloads the Excel template from the admin panel
2. Admin fills it with student + parent data
3. Admin uploads the filled Excel file
4. Celery background task processes the file:
   - Creates student accounts
   - Creates or links parent accounts (no duplicates)
   - Generates credentials
   - Queues SMS notifications to all parents
5. Admin sees a progress bar and a summary report when done (X accounts created, Y errors)

**Excel Template Columns:**
```
student_first_name | student_last_name | date_of_birth | class_name | section
parent_first_name | parent_last_name | parent_phone | parent_email (optional)
second_parent_phone (optional)
```

### 8.5 Authentication Features

- **JWT access tokens** (15-min expiry) + **refresh tokens** (30-day expiry) with rotation — each refresh issues a new refresh token and invalidates the old one
- **`is_first_login` flag** → redirects user to forced password change screen on first login
- **Biometric login** (fingerprint / Face ID) after initial password setup
- **PIN login** (4–6 digit) for primary school students ages 5–11 who struggle with passwords
- **Account lockout** after 5 failed attempts → automatic unlock after 30 minutes
- Admin can remotely **revoke any user's session** from the admin panel

### 8.6 User Base Model

```python
class User(AbstractBaseUser):
    # Identity
    id = UUIDField(primary_key=True, default=uuid4)
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    phone_number = CharField(max_length=20, unique=True)
    email = EmailField(blank=True, null=True)
    photo = ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Role & Tenant
    role = CharField(choices=ROLE_CHOICES)  # SUPER_ADMIN/ADMIN/SECTION_ADMIN/TEACHER/PARENT/STUDENT
    school = ForeignKey('School', null=True, on_delete=CASCADE)
    section = ForeignKey('Section', null=True, blank=True)  # for Section Admin
    
    # Account State
    is_active = BooleanField(default=True)
    is_first_login = BooleanField(default=True)
    created_by = ForeignKey('self', null=True, on_delete=SET_NULL)
    created_at = DateTimeField(auto_now_add=True)
    last_login = DateTimeField(null=True)
    
    USERNAME_FIELD = 'phone_number'
```

---

## 10. School Structure & Section Management

### 9.1 Flexible School Configuration

A school subscribes to EduConnect and chooses which sections they operate. The platform fully supports:

| School Type | Sections Enabled |
|---|---|
| Primary school only | ✅ Primary |
| Middle school only | ✅ Middle |
| High school only | ✅ High School |
| Primary + Middle | ✅ Primary + ✅ Middle |
| Middle + High | ✅ Middle + ✅ High School |
| Full school | ✅ Primary + ✅ Middle + ✅ High School |

Each section is managed **independently** with its own:
- Classes and students
- Teachers and subject assignments
- Grading scale (Primary uses /10, Middle and High use /20)
- Academic year configuration (though usually shared)
- Streams (High School only)

### 9.2 Core Models (Python/Django)

```python
class School(Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=200)
    logo = ImageField()
    address = TextField()
    phone = CharField()
    email = EmailField()
    subdomain = CharField(unique=True)  # e.g., "lycee-ibn-khaldoun"
    subscription_plan = CharField()
    subscription_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)

class Section(Model):
    SECTION_TYPES = [
        ('PRIMARY', 'École Primaire'),
        ('MIDDLE', 'CEM'),
        ('HIGH', 'Lycée'),
    ]
    school = ForeignKey(School, on_delete=CASCADE)
    section_type = CharField(choices=SECTION_TYPES)
    name = CharField(max_length=100)  # e.g., "École Primaire Ibn Badis"
    director = ForeignKey(User, null=True)  # Section head if different from main admin
    is_active = BooleanField(default=True)
    
    class Meta:
        unique_together = ['school', 'section_type']

class AcademicYear(Model):
    school = ForeignKey(School)
    section = ForeignKey(Section)
    name = CharField()  # "2025-2026"
    start_date = DateField()
    end_date = DateField()
    is_current = BooleanField(default=True)

class Class(Model):
    section = ForeignKey(Section)
    academic_year = ForeignKey(AcademicYear)
    name = CharField()         # "3AP-A", "1AM-B", "2AS-Sciences"
    level = CharField()        # "3AP", "1AM", "2AS"
    stream = CharField(null=True, blank=True)  # "Sciences", "Math" (High School only)
    homeroom_teacher = ForeignKey(User, null=True)
    max_students = IntegerField(default=35)
    
class StudentProfile(Model):
    user = OneToOneField(User)
    current_class = ForeignKey(Class)
    student_id = CharField()   # School's internal ID (e.g., "2025-0042")
    date_of_birth = DateField()
    enrollment_date = DateField()
    
class ParentProfile(Model):
    user = OneToOneField(User)
    children = ManyToManyField(StudentProfile, related_name='parents')
    # A parent can have multiple children; a student can also have multiple parents
    # (father and mother both with accounts)
    relationship = CharField()  # "Father", "Mother", "Guardian"

class TeacherProfile(Model):
    user = OneToOneField(User)
    section = ForeignKey(Section)
    specialization = CharField()  # Subject they are specialized in
```

---

## 11. Feature Specification — Admin Panel

The admin panel is a **React.js web application** accessible from any browser, designed for non-technical users. The UI must be achievable through forms and buttons — no technical knowledge required.

### 10.1 Dashboard

- **Live statistics:** total students per section, active teachers, pending grade submissions, unread messages, upcoming events
- **Risk alert panel:** students flagged as at-risk (see Section 16)
- **Quick action buttons:** Post announcement, Add student, Generate report cards, View attendance alerts
- **Recent activity feed:** last 20 actions with full audit trail — who did what and when
- **Academic calendar widget:** shows current trimester, days until next exam period, upcoming events

### 10.2 School Configuration

- Edit school profile: name, logo, address, contacts, motto
- Activate/deactivate sections (Primary, Middle, High School)
- Configure academic year: start date, end date, trimester dates
- Set school-wide holidays and special events
- Configure grading weights per section (Continuous %, Test 1 %, Test 2 %, Final %)
- Configure working days and school hours

### 10.3 User Management

**Teachers:**
- Add teacher: name, phone, email, section, assigned subjects and classes
- Edit teacher profile and class assignments
- Deactivate/reactivate teacher account
- View teacher's submitted grades and activity log
- Bulk import teachers via Excel

**Students & Parents:**
- Add student with automatic parent account creation
- Search students by name, class, section, or student ID
- View full student profile: personal info, current class, all grades history, attendance, discipline record
- Transfer student to different class (with reason and date logged)
- Link additional parent to a student (father + mother both registered)
- Deactivate student at year end → enters "graduated" or "transferred" archive status
- Bulk import students and parents via Excel

### 10.4 Class & Subject Management

- Create classes per section and academic year with a name and level
- Assign homeroom teacher to each class
- Define subjects per class with coefficients
- Assign a teacher to each subject within each class
- For High School: assign specialization streams to 2AS and 3AS classes

### 10.5 Grade Management

This is one of the highest-value features. The grade flow:

```
Teacher enters grades (draft)
  → Teacher submits to admin
    → Admin reviews
      → Admin publishes
        → Instantly visible to student and parent
```

Admin functions:
- View all pending grade submissions from all teachers
- Filter by section, class, subject, trimester
- View submitted marks with automatic average pre-calculation
- Add reviewer comments or correction notes before publishing
- Publish with one click (or reject and send back to teacher with note)
- View full grade history with audit trail (who entered, who published, timestamps)
- Bulk publish all grades for a trimester once all teachers have submitted

### 10.6 Report Card Generation

- Generate individual student report card as a formatted PDF (one click)
- Generate all report cards for an entire class (ZIP file)
- Generate all report cards for the entire school (ZIP, processed by Celery background task)
- Report card includes: student info, photo, class, all subjects with grades and coefficients, trimester average, yearly average, class rank, teacher comments, director signature field
- Customizable design per school (logo, colors, footer text)

### 10.7 Attendance Management

- Real-time dashboard: daily absence summary per class
- Mark attendance done by teachers from their app; admin sees it in real time
- Absence justification workflow: parent submits excuse → admin approves/rejects
- Monthly and yearly attendance reports per student
- Configurable absence alert threshold (e.g., alert admin if student misses 3+ days in a week)
- Automatic parent push notification when child is marked absent

### 10.8 Announcement & News System

- Rich text editor with images, attachments, links
- Target audience selection:
  - All users (everyone in the school)
  - Parents only / Students only / Teachers only
  - Specific section (Primary only, Middle only, etc.)
  - Specific class
- Schedule announcements for future publication
- Pin important announcements to the top of the feed
- Track how many users have seen each announcement (read receipt tracking)

### 10.9 School Event Calendar

- Create events: name, date, time, location, description, target audience
- Event types: exam period, parent meeting, school trip, holiday, ceremony
- Events appear in all user apps in their respective calendars
- Push notification 24 hours before important events

### 10.10 Financial Module (Optional/Premium)

- Configure fee amounts per section and per academic year
- Payment tracking per student (paid / partial / unpaid)
- Record payments with: amount, date, payment method, receipt number
- Payment receipt generation (PDF)
- Payment reminder push notifications to parents
- Monthly revenue report for school administration
- Export financial data to Excel

### 10.11 Premium Content Management

- Create and manage premium content categories
- Set pricing for premium access (per content, per subject, or full access pass)
- Track which students/parents have paid for premium access
- View revenue from premium content sales
- See content engagement statistics

### 10.12 Long-Term Archive Access

- Search and view any past student (graduated, transferred) by name or year
- View historical report cards, grades, attendance — read only
- Download archive ZIP per academic year
- Ministry export: generate official student data file in Ministry-required format

---

## 12. Feature Specification — Teacher App

The teacher app (Flutter mobile) must save teachers time and replace the scattered WhatsApp groups and paper notebooks they currently use.

### 11.1 Home Dashboard

- Today's schedule: which classes they teach today and at what times
- Pending tasks: grades not yet submitted, homework with upcoming due dates
- Recent messages requiring response
- Quick action buttons: Post homework, Enter grades, Upload resource

### 11.2 My Classes

- View list of all assigned classes with subject
- Enter any class to see the full student list with photos
- Immediately identify students by photo (very useful for new teachers)

### 11.3 Homework & Task Management

- Create homework post: title, description, due date, attached files (PDF, images, Word, video links)
- Target: specific class or specific subject within a class
- Edit or delete homework before students view it
- Mark homework as "corrected and returned"
- View which students have viewed the homework post (read receipts)

### 11.4 Course Resources

- Upload course materials: PDFs, PowerPoint files, images, Word documents, video links
- Organize by subject and chapter/unit
- Resources instantly available to all students in the assigned class
- Set resources as free or premium (if the school has the premium module enabled)
- View download statistics for each resource

### 11.5 Grade Entry

- Select: class → subject → trimester → exam type
- Enter grades for all students in a clean list interface
- Support for both /10 (Primary) and /20 (Middle and High) scales automatically based on section
- Save as draft: teacher can review before submitting
- Submit to admin: sends a notification to admin that grades are ready for review
- View status of previous submissions: pending review / published / sent back with comments

### 11.6 Attendance Marking

- Mark attendance for each class at the start of each session
- Options per student: Present / Absent / Late
- Add optional note for an absence (e.g., "called sick")
- Once submitted, admin and parent are notified automatically

### 11.7 Teacher → Parent Private Chat

This channel is for formal professional communication between teacher and parent about a specific student.

- Select student → opens dedicated chat with that student's parent(s)
- Send text messages, images, PDF attachments (for formal letters/reports)
- Pre-written message templates:
  - **Academic concern:** "I would like to discuss [student]'s performance in [subject]..."
  - **Behavior concern:** "[Student] has shown some behavioral challenges recently..."
  - **Positive feedback:** "I am pleased to inform you that [student] has shown great improvement..."
  - **Absence follow-up:** "[Student] was absent on [date]. Please provide a justification..."
- Full conversation history preserved for the academic year
- Admin can see that conversations exist (count) but cannot read content (privacy)

### 11.8 Teacher → Class Broadcast

- Send a message to all students in a class simultaneously
- Example: "Exam is postponed to Thursday", "Please bring your books tomorrow"
- Students receive as push notification + in-app message

### 11.9 Student Questions Inbox

- Students send questions about courses to the teacher
- Teacher sees all questions in one organized inbox, filtered by class and subject
- Reply with text, images, or short explanations
- Mark questions as answered

---

## 13. Feature Specification — Parent App

The parent app is the most emotionally valuable product. A parent opening the app and seeing their child's grade in real time is the moment that sells the entire platform to the next school.

### 12.1 Child Switcher

If a parent has multiple children at the same school, a switcher is prominently displayed at the top of the home screen. Tapping it shows all linked children. All data updates immediately when switching between children. A parent can have children in different sections (e.g., one in Primary, one in Middle).

```
┌─────────────────────────────┐
│  [Photo] Amira ▼            │  ← tap to switch child
│  3AP - Class A              │
└─────────────────────────────┘
```

### 12.2 Home Dashboard

- Current trimester average for selected child (large, prominently displayed)
- Recent marks (last 3 entered)
- Attendance status: present / absent today
- Upcoming homework due dates
- Unread messages from teachers
- Latest school announcement and next school event
- **Risk alert:** if child's average drops below passing threshold

### 12.3 Academic Monitoring

**Grades:**
- All published marks per subject, per trimester
- Trimester average with class average for comparison
- Subject coefficients displayed
- Yearly average and class rank (e.g., 4th out of 32 students)
- Performance graph: trimester-by-trimester progress per subject
- Color coding: green (above average), orange (at risk), red (below passing threshold)

**Report Cards:**
- View, download, and share generated report cards as PDF
- Push notification when new report card is published

**Homework & Resources:**
- View all current and past homework assignments with due dates
- Browse course materials uploaded by teachers
- Download resources for offline use
- Note: parents view homework but do not submit it (student's responsibility)

### 12.4 Attendance

- Full attendance calendar view: color-coded days (present=green, absent=red, late=orange)
- Monthly and yearly absence count
- Submit absence justification directly through the app with optional photo attachment (doctor's note)
- View status of submitted justifications (pending / approved / rejected)
- Receive immediate push notification when child is marked absent

### 12.5 Communication

- Private chat with homeroom teacher and any subject teacher
- Receive school announcements and event calendar
- Receive payment reminders (if financial module enabled)
- Emergency alerts from administration

### 12.6 AI Chatbot (RAG-Powered)

The parent chatbot understands questions in Arabic, French, and English. Examples:

**School information questions:**
- "متى تبدأ العطلة الشتوية؟" (When does the winter holiday start?)
- "Quel est le numéro de la secrétaire ?" (What is the secretary's phone number?)
- "What time does school start?"

**Child-specific questions:**
- "Quelle est la moyenne de mon fils ce trimestre ?"
- "كم مرة غاب ولدي هذا الشهر؟" (How many times was my son absent this month?)
- "Does my daughter have any homework due this week?"
- "What is my child's rank in the class?"

**Advisory questions:**
- "How can I help my child improve in Mathematics?"
- "My child failed Physics, what should I do?"

**Scope limitations:**
- Chatbot only reads data, never modifies anything
- Cannot answer questions about other students
- Cannot access unpublished grades
- Falls back to "Please contact the school administration" for sensitive questions

### 12.7 Premium Features

- Weekly auto-generated digest: grades received, homework completed, attendance summary
- Detailed academic analytics with performance trends
- Parent education library: articles and videos on study habits, exam preparation, BAC stress management
- Priority chatbot: more detailed and personalized AI responses

---

## 14. Feature Specification — Student App

The student app adapts its interface based on the student's section (Primary / Middle / High School).

### 13.1 Age-Adaptive Interface

| Section | Age Range | Interface Mode |
|---|---|---|
| Primary | 5–11 years | Simplified: large buttons, icons with labels, bright colors, minimal text, no complex navigation |
| Middle | 11–15 years | Standard: normal app layout, full features, some guided navigation |
| High School | 15–18 years | Full: complete interface, detailed statistics, calendar view, advanced features |

### 13.2 Home Dashboard

- Today's homework due
- Current grades (published only)
- Next upcoming event
- Unread messages from teachers
- Latest class and school announcements

### 13.3 Academic Features

- View all homework with due dates, descriptions, and attached files
- Status per homework: upcoming / due today / overdue
- Download course resources organized by subject and chapter
- View published marks (Primary: out of 10, Middle/High: out of 20)
- View trimester averages, yearly average, and personal timetable
- View report card when published by admin

### 13.4 Student AI Chatbot

Personalized to the individual student. Examples:

- "Do I have any homework due tomorrow?"
- "What is my average in Arabic this trimester?"
- "What resources did the Math teacher upload this week?"
- "When is the next exam?"
- "What did we study last week in Physics?"

Scope: student can only query their own data. No information about other students.

### 13.5 Communication

- Send questions to subject teachers (one-on-one)
- Receive teacher broadcast messages
- Receive school and class announcements
- Receive push notifications for new homework, grade publications, and events

### 13.6 Premium Content (if school enables it)

- Browse available premium content for their class
- View content unlocked by parent's payment
- Access video lessons, interactive exercises, past exam papers, revision sheets
- For primary students: gamified learning exercises presented as mini-games

---

## 15. Grading System Design

### 14.1 Grade Model

```python
class Grade(Model):
    EXAM_TYPES = [
        ('CONTINUOUS', 'Continuous Assessment'),
        ('TEST_1', 'First Test'),
        ('TEST_2', 'Second Test'),
        ('FINAL', 'Final Exam'),
    ]
    STATUS = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted to Admin'),
        ('PUBLISHED', 'Published'),
        ('RETURNED', 'Returned for Correction'),
    ]
    
    student = ForeignKey(StudentProfile)
    subject = ForeignKey(Subject)
    trimester = IntegerField(choices=[1, 2, 3])
    academic_year = ForeignKey(AcademicYear)
    exam_type = CharField(choices=EXAM_TYPES)
    value = DecimalField(max_digits=4, decimal_places=2)  # e.g., 14.50
    max_value = DecimalField()  # 10.00 or 20.00 depending on section
    
    # Workflow
    status = CharField(choices=STATUS, default='DRAFT')
    submitted_by = ForeignKey(User)  # Teacher
    submitted_at = DateTimeField(null=True)
    reviewed_by = ForeignKey(User, null=True)  # Admin
    published_at = DateTimeField(null=True)
    admin_comment = TextField(blank=True)

class Subject(Model):
    section = ForeignKey(Section)
    class_obj = ForeignKey(Class)
    name = CharField()
    coefficient = DecimalField()
    teacher = ForeignKey(User)
    is_mandatory = BooleanField(default=True)

class TrimesterConfig(Model):
    """Configurable grade weights per school per section"""
    school = ForeignKey(School)
    section = ForeignKey(Section)
    continuous_weight = DecimalField(default=0.20)  # 20%
    test1_weight = DecimalField(default=0.20)
    test2_weight = DecimalField(default=0.20)
    final_weight = DecimalField(default=0.40)
```

### 14.2 Automatic Calculations

All averages are computed server-side by the Django backend, never on the client:

```python
def calculate_subject_trimester_average(student, subject, trimester):
    config = TrimesterConfig.objects.get(school=student.school, section=student.section)
    grades = Grade.objects.filter(
        student=student, subject=subject, 
        trimester=trimester, status='PUBLISHED'
    )
    
    weights = {
        'CONTINUOUS': config.continuous_weight,
        'TEST_1': config.test1_weight,
        'TEST_2': config.test2_weight,
        'FINAL': config.final_weight,
    }
    
    weighted_sum = sum(g.value * weights[g.exam_type] for g in grades)
    total_weight = sum(weights[g.exam_type] for g in grades)
    return weighted_sum / total_weight if total_weight > 0 else None

def calculate_trimester_overall_average(student, trimester):
    subjects = Subject.objects.filter(class_obj=student.current_class)
    numerator = sum(
        calculate_subject_trimester_average(student, s, trimester) * s.coefficient
        for s in subjects
    )
    denominator = sum(s.coefficient for s in subjects)
    return numerator / denominator if denominator > 0 else None
```

### 14.3 Calculation Rules

- All averages computed server-side, never on the client
- Grades are **immutable once published** — amendments create a new record, old one is archived
- Class rank computed at publication time and stored as a snapshot
- Coefficient weighting applies at trimester average level
- Grade decimal precision: 2 decimal places (e.g., 14.50/20) — Algerian standard

---

## 16. Advanced Academic Analytics

Directors love statistics. This is one of the most powerful selling points.

### 15.1 School-Level Analytics

- Average per subject across all classes
- Pass/fail rate per class and per section
- Performance comparison between classes of the same level
- Top 10 students per level and per section
- Teacher performance analytics: class averages per teacher (internal to admin only)
- Grade submission timeliness per teacher

### 15.2 Risk Detection (Automated)

- Students below 8/20 (or 4/10 for Primary) flagged automatically in the dashboard
- **"This student is at risk of repeating the year"** alert
- **"Attendance dropped 30% this trimester"** alert
- Students with 3+ consecutive absences flagged for follow-up
- Subject-specific weakness detection

### 15.3 Predictive Alerts

- System predicts end-of-year average based on current trimester performance
- Alert admin and parent when trajectory is negative
- Alert when student's performance suddenly drops significantly between trimesters

### 15.4 Automatic Notifications (Triggered by Analytics)

- Parent notification when child's average falls below configured threshold
- Parent notification when child has 3 consecutive absences
- Director notification when a class average is significantly below school average

### 15.5 Exportable Reports

- Downloadable Excel reports per trimester: class averages, subject averages, pass/fail counts
- Year-end comparison: this year vs last year performance per class
- Ministry-compatible export format for official reporting

---

## 17. Timetable & Scheduling Engine

This saves hours of manual work for administration every academic year.

### 16.1 Timetable Builder

- Drag-and-drop interface in the admin panel
- Define time slots (days, hours)
- Assign teacher + subject + class + classroom to each slot
- **Conflict detection**: real-time alert if a teacher is double-booked
- **Classroom conflict detection**: alert if same room assigned to two classes
- Teacher availability configuration: mark which hours a teacher is unavailable
- Substitute teacher assignment when a teacher is absent

### 16.2 Timetable Output

- Students and parents see their class timetable in the app (read-only)
- Teachers see their personal teaching schedule
- Admin can export any timetable as formatted PDF (for printing and posting on classroom doors)
- Push notification to students when timetable is modified

---

## 18. Discipline & Behavior Module

A major selling point for school directors.

### 17.1 Behavior Tracking

- Per-student behavior record: **Good** / **Warning** / **Serious**
- Incident reports filed by teachers or admin, with date, description, severity, and filed-by fields
- Parent notification for every Warning or Serious incident
- Accumulated warning system: when a student reaches X warnings in a trimester, automatic alert to admin and parent

### 17.2 Disciplinary Records

- Full discipline history per student accessible to admin
- Printable disciplinary record (PDF) for formal parent meetings
- Disciplinary record included in graduated student archive (long-term retention)
- Admin can add resolution notes to each incident

### 17.3 Behavior in Report Cards

- Admin can optionally include a conduct grade in the report card
- Configurable: some schools include it as a subject with coefficient, others as a separate section

---

## 19. Messaging & Communication System

### 18.1 Chat Room Types

| Room Type | Participants | Purpose |
|---|---|---|
| `TEACHER_PARENT` | 1 teacher + 1–2 parents of a specific student | Formal private communication about that student |
| `TEACHER_STUDENT` | 1 teacher + 1 student | Course questions and answers |
| `CLASS_BROADCAST` | Teacher → all students in a class | Class-wide announcements |
| `ADMIN_PARENT` | Admin + specific parent | Administrative matters |
| `ADMIN_BROADCAST` | Admin → all users / specific group | School-wide announcements |

### 18.2 Real-Time Architecture

```
Client (Flutter/React) 
    → WebSocket connection (Django Channels)
        → Channel Layer (Redis)
            → Message stored in PostgreSQL
                → Push notification via FCM (if recipient offline)
```

### 18.3 Chat Models

```python
class ChatRoom(Model):
    ROOM_TYPES = ['TEACHER_PARENT', 'TEACHER_STUDENT', 'CLASS_BROADCAST', 
                  'ADMIN_PARENT', 'ADMIN_BROADCAST']
    room_type = CharField(choices=ROOM_TYPES)
    school = ForeignKey(School)
    related_student = ForeignKey(StudentProfile, null=True)  # for teacher-parent rooms
    related_class = ForeignKey(Class, null=True)  # for broadcast rooms
    participants = ManyToManyField(User)
    created_at = DateTimeField(auto_now_add=True)

class Message(Model):
    room = ForeignKey(ChatRoom)
    sender = ForeignKey(User)
    content = TextField(blank=True)
    attachment = FileField(null=True, blank=True)
    attachment_type = CharField(null=True)  # 'image', 'pdf', 'document'
    sent_at = DateTimeField(auto_now_add=True)
    read_by = ManyToManyField(User, through='MessageRead')

class MessageRead(Model):
    message = ForeignKey(Message)
    user = ForeignKey(User)
    read_at = DateTimeField(auto_now_add=True)
```

### 18.4 Message Templates

Pre-written in Arabic and French, configurable per school from admin panel:

```python
class MessageTemplate(Model):
    school = ForeignKey(School)
    title = CharField()   # "Academic Concern"
    body = TextField()    # "I would like to discuss [student_name]'s performance in [subject]..."
    category = CharField()  # 'concern', 'positive', 'absence', 'general'
    language = CharField()  # 'ar', 'fr', 'en'
```

Template categories: academic concern, positive feedback, absence follow-up, behavior report, exam results, parent meeting request

---

## 20. RAG Chatbot System

### 19.1 Architecture

```
User Question (text, in any language: Arabic / French / English)
        │
        ▼
FastAPI Chatbot Service
        │
        ├──► 1. Intent Classification
        │         Is this a static school question or a dynamic data question?
        │
        ├──► Static: Semantic search in Qdrant (vector DB)
        │         → Retrieve top-K relevant chunks from school knowledge base
        │         → Inject into LLM prompt as context
        │
        ├──► Dynamic: Query Django REST API
        │         → GET /api/v1/chatbot/student-data/ (authenticated)
        │         → Retrieve: grades, homework, attendance, schedule (live)
        │         → Inject as structured context into LLM prompt
        │
        ▼
LLM (Groq / llama-3.3-70b-versatile)
        │
        ▼
Natural Language Answer → returned to user
```

### 19.2 Knowledge Base (Per School Tenant)

**Static knowledge — managed by admin through admin panel:**
- School name, address, contacts, opening hours
- Academic calendar: semester dates, exam periods, holidays
- Teacher directory: names, subjects, contact information
- School rules and regulations
- Frequently Asked Questions (admin writes these manually)
- Fee structure and payment information

**Dynamic knowledge — queried live from database:**
- Student's marks (filtered to authenticated user's child only)
- Homework and assignments
- Attendance records
- Upcoming events from school calendar

### 19.3 Embedding & Indexing Pipeline

```
Admin uploads/edits school knowledge document
        │
        ▼
Django signals Celery task
        │
        ▼
Celery task: chunk text → generate embeddings (sentence-transformers multilingual model)
        │
        ▼
Store vectors in Qdrant (namespace = school_id for tenant isolation)
        │
        ▼
Knowledge base updated — chatbot now has the new information
```

### 19.4 Example Chatbot Interactions

**Parent chatbot:**
- "Quelle est la moyenne de mon fils ce trimestre ?"
- "Does my daughter have homework due this week?"
- "How can I help my child improve in Mathematics?"
- "When does the winter holiday start?"

**Student chatbot:**
- "Do I have any homework due tomorrow?"
- "What is my average in Arabic this trimester?"
- "What resources did the Math teacher upload this week?"
- "When is the next exam?"

### 19.5 Safety & Scope Guardrails

```python
SYSTEM_PROMPT = """
You are the school assistant for {school_name}. 
You help parents and students with questions about school life and academics.

Rules:
1. Only answer questions about {school_name} and the specific student you are helping.
2. Never reveal information about other students.
3. Never modify any data — you are read-only.
4. If you don't know the answer, say: "Please contact the school administration."
5. Always respond in the same language the user writes in.
6. Be respectful, warm, and professional.

Context about this school:
{retrieved_context}

Context about this student/parent:
{student_data}
"""
```

### 19.6 Multilingual Support

The `paraphrase-multilingual-mpnet-base-v2` embedding model handles Arabic, French, and English in the same vector space. The LLM responds in whatever language the user writes in — including Algerian dialect (Darija, approximately).

### 19.7 Cost Estimation

GPT-4o mini: ~$0.00015 per 1K tokens. Typical query: ~1,500 tokens = $0.000225. At 10,000 queries/month per school → **under $3/school/month**. Completely negligible. Groq API is even cheaper and faster for LLM inference.

---

## 21. Premium Content & Payment System

### 20.1 Premium Content for Students

| Content Type | Description | Target Level |
|---|---|---|
| Video Lessons | Teacher-recorded chapter explanations, rewatchable at home | All levels |
| Interactive Exercises | Auto-corrected quizzes with instant feedback | All levels |
| Past Exam Papers | BEP, BEM, BAC past papers with model answers | 5AP, 4AM, 3AS |
| Revision Summary Sheets | Teacher-prepared condensed chapter notes | Middle & High |
| Oral Comprehension | Audio exercises for French & English | All levels |
| Gamified Learning Modules | Math & language exercises as mini-games with points | Primary (5–11) |

### 20.2 Premium Content for Parents

| Content Type | Description |
|---|---|
| Weekly Child Reports | Auto-generated digest: grades, homework, attendance |
| Detailed Analytics | Performance trends, subject breakdown, class comparison |
| Parent Education Library | Articles/videos on study habits, exam prep, BAC stress management |
| Priority Chatbot | More detailed and personalized AI responses |

### 20.3 Revenue Model

```
School Admin configures premium content in admin panel
  → Sets content as Free or Premium
  → Sets price (per item OR monthly pass OR yearly pass)
  → School earns 90% of revenue / Platform takes 10% fee

Parent pays through app
  → Admin confirms payment (manual for MVP)
    → System unlocks access for linked student(s)
```

### 20.4 Payment Integration (Algeria)

**MVP (Phase 1) — Manual confirmation:**
- Parent pays via bank transfer / CIB card / cash at school
- Admin marks payment as confirmed in admin panel
- Access unlocked automatically

**Phase 2 — Semi-automatic:**
- Integration with Baridimob or SATIM CIB online payment gateway
- Automatic payment confirmation and access unlocking

### 20.5 Premium Content Models

```python
class PremiumContent(Model):
    CONTENT_TYPES = ['VIDEO', 'EXERCISE', 'DOCUMENT', 'EXAM_PAPER', 'GAME']
    school = ForeignKey(School)
    subject = ForeignKey(Subject, null=True)
    class_level = CharField()  # "3AP", "1AM", "2AS-Sciences" etc.
    title = CharField()
    description = TextField()
    content_type = CharField(choices=CONTENT_TYPES)
    file_url = CharField()
    price = DecimalField()
    is_active = BooleanField(default=True)
    created_by = ForeignKey(User)

class PremiumAccess(Model):
    student = ForeignKey(StudentProfile)
    content = ForeignKey(PremiumContent, null=True)  # null = full pass
    access_type = CharField()  # 'SINGLE_ITEM' or 'FULL_PASS'
    paid_amount = DecimalField()
    payment_confirmed_by = ForeignKey(User)
    valid_until = DateField()
    created_at = DateTimeField(auto_now_add=True)
```

---

## 22. Student Gamification

For primary school students (ages 5–11), gamification increases engagement and makes parents willing to pay for the platform.

### 21.1 Features

- **Points system**: earn points for completed homework, quizzes, or exercises
- **Badges**: "Math Star", "Reading Champion", "Perfect Attendance", "Science Explorer"
- **Class leaderboard**: friendly ranking within the class (configurable — can be disabled)
- **Reward certificates**: auto-generated printable certificate at badge milestones
- **Level progression**: Beginner → Explorer → Champion → Master
- **Weekly challenge**: special exercise posted every Monday with bonus points

### 21.2 Impact

Transforms the student app from a "homework reminder" into something children want to open every day. Gives parents a reason to pay for premium content.

---

## 23. Multi-Branch Support

Some private school groups in Algeria operate multiple campuses under the same brand.

### 22.1 Branch Architecture

```
School Group (e.g., "Groupe Scolaire El Fath")
  |── Branch A: Blida Campus
  |     |── Primary Section
  |     |── Middle Section
  |── Branch B: Medea Campus
  |     |── High School Section
  |── Central Director View (sees all branches)
```

### 22.2 Features

- Branch entity under School (School → Branch → Section → Class)
- Branch-specific users: each campus has its own admins and teachers
- Branch-specific reporting
- Central director dashboard: aggregate statistics across all branches
- Cross-branch student transfer with full record migration

### 22.3 Business Model

Multi-branch is a **premium tier** feature. A school group with 3 campuses pays more than a single-campus school. This is a natural upsell opportunity.

---

## 24. Database Schema & Models

### 23.1 Complete Model Map

```
School (tenant root)
  |── Branch (optional, for multi-campus groups)
  |── Section (PRIMARY / MIDDLE / HIGH)
  |     |── AcademicYear
  |     |     |── Class
  |     |     |     |── Subject → Grade → TrimesterConfig
  |     |     |     |── HomeworkPost
  |     |     |     |── Resource
  |     |     |── Timetable → TimetableSlot
  |     |── TrimesterConfig
  |── User
  |     |── StudentProfile
  |     |     |── ParentProfile (M2M — multiple parents per student)
  |     |     |── Attendance
  |     |     |── DisciplineRecord
  |     |     |── PremiumAccess
  |     |     |── GamificationProfile (points, badges, level)
  |     |── TeacherProfile
  |     |── AdminProfile
  |── Announcement
  |── SchoolEvent
  |── ChatRoom → Message → MessageRead
  |── Notification
  |── PremiumContent → PremiumAccess
  |── ChatbotKnowledge (RAG documents, per-school namespace in Qdrant)
  |── AcademicArchive (graduated/transferred students, read-only)
```

### 23.2 Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Primary keys | UUID everywhere | Prevents enumeration attacks, better for distributed systems |
| Deletes | Soft delete only (`is_deleted` + `deleted_at`) | Legal archiving requirement — never hard delete student data |
| Audit trail | `created_by`, `created_at`, `updated_by`, `updated_at` on all models | Legal requirement + accountability |
| Grade history | Immutable once published | Amendments create new record; original preserved |
| Tenant isolation | `school` FK on every model, enforced at ViewSet level | Never trusted from client |
| Archive | Separate AcademicArchive model | Past students locked as read-only but always accessible |
| Section isolation | Queries scoped first to school, then to section | Teachers and section admins cannot see other sections |

---

## 25. API Design

### 24.1 Versioning & Structure

```
Base URL: https://api.educonnect.dz/api/v1/
```

All endpoints prefixed `/api/v1/`. Breaking changes go to `/api/v2/` without breaking existing app versions.

### 24.2 Tenant Isolation Pattern

```python
class TenantAwareViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'SUPER_ADMIN':
            return qs
        return qs.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
```

### 24.3 Complete Endpoint Reference

**Authentication:**
```
POST   /api/v1/auth/login/
POST   /api/v1/auth/pin-login/
POST   /api/v1/auth/refresh/
POST   /api/v1/auth/change-password/
POST   /api/v1/auth/logout/
```

**Users & Accounts:**
```
GET    /api/v1/accounts/me/
GET    /api/v1/accounts/users/
POST   /api/v1/users/students/               ← auto-creates parent account
POST   /api/v1/users/students/bulk-import/
GET    /api/v1/users/teachers/
POST   /api/v1/users/teachers/
GET    /api/v1/users/parents/{id}/children/
PATCH  /api/v1/users/{id}/deactivate/
```

**Schools & Structure:**
```
GET    /api/v1/school/profile/
PATCH  /api/v1/school/profile/
GET    /api/v1/schools/schools/
GET    /api/v1/schools/academic-years/
GET    /api/v1/schools/semesters/
GET    /api/v1/sections/
POST   /api/v1/sections/
GET    /api/v1/sections/{id}/classes/
```

**Academics:**
```
GET    /api/v1/academics/levels/
GET    /api/v1/academics/classrooms/
GET    /api/v1/academics/subjects/
GET    /api/v1/academics/schedule/
GET    /api/v1/academics/lessons/
GET    /api/v1/academics/resources/
```

**Grades:**
```
POST   /api/v1/grades/                       ← teacher submits (batch)
GET    /api/v1/grades/exam-types/
GET    /api/v1/grades/grades/
GET    /api/v1/grades/pending/               ← admin reviews
PATCH  /api/v1/grades/{id}/publish/
PATCH  /api/v1/grades/{id}/return/
GET    /api/v1/students/{id}/grades/
GET    /api/v1/students/{id}/averages/
GET    /api/v1/grades/report-cards/
```

**Homework:**
```
GET    /api/v1/homework/tasks/
POST   /api/v1/homework/
GET    /api/v1/classes/{id}/homework/
PATCH  /api/v1/homework/{id}/
DELETE /api/v1/homework/{id}/
GET    /api/v1/homework/submissions/
```

**Timetable:**
```
GET    /api/v1/timetable/class/{id}/
POST   /api/v1/timetable/slots/
GET    /api/v1/timetable/conflicts/
GET    /api/v1/timetable/export/{class_id}/  ← PDF export
```

**Announcements & Events:**
```
GET    /api/v1/announcements/announcements/
POST   /api/v1/announcements/
PATCH  /api/v1/announcements/{id}/
GET    /api/v1/announcements/events/
```

**Attendance:**
```
POST   /api/v1/attendance/mark/
GET    /api/v1/attendance/records/
GET    /api/v1/students/{id}/attendance/
POST   /api/v1/attendance/justify/
GET    /api/v1/attendance/excuses/
PATCH  /api/v1/attendance/justify/{id}/approve/
```

**Chat & Messaging:**
```
GET    /api/v1/chat/conversations/
POST   /api/v1/chat/rooms/
GET    /api/v1/chat/rooms/{id}/messages/
POST   /api/v1/chat/rooms/{id}/messages/
WS     /ws/chat/{room_id}/                   ← WebSocket endpoint
```

**Finance:**
```
GET    /api/v1/finance/fee-structures/
GET    /api/v1/finance/payments/
```

**Notifications:**
```
GET    /api/v1/notifications/notifications/
```

**Discipline:**
```
POST   /api/v1/discipline/incidents/
GET    /api/v1/discipline/students/{id}/
PATCH  /api/v1/discipline/incidents/{id}/resolve/
```

**Report Cards:**
```
POST   /api/v1/report-cards/generate/{student_id}/
POST   /api/v1/report-cards/generate-class/{class_id}/
GET    /api/v1/report-cards/{student_id}/download/
```

**Analytics:**
```
GET    /api/v1/analytics/class/{id}/
GET    /api/v1/analytics/section/{id}/risks/
```

**Archive:**
```
GET    /api/v1/archive/students/
GET    /api/v1/archive/students/{id}/
POST   /api/v1/archive/export/{academic_year_id}/
GET    /api/v1/archive/ministry-export/{class_id}/
```

**AI Chatbot:**
```
POST   /api/v1/chatbot/query/               ← parent/student sends question
GET    /api/v1/chatbot/history/             ← conversation history
POST   /api/v1/chatbot/knowledge/           ← admin uploads knowledge doc
DELETE /api/v1/chatbot/knowledge/{id}/
GET    /api/v1/ai/query/
GET    /api/v1/ai/sessions/
```

**API Documentation:**
```
GET    /api/docs/                            ← Swagger UI
GET    /api/redoc/                           ← ReDoc
```

---

## 26. Technology Stack

### 25.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12+ | Language |
| Django | 5.x | Main web framework |
| Django REST Framework | 3.15+ | REST API |
| Django Channels | 4.x | WebSocket / real-time chat |
| Daphne | 4.x | ASGI server for Django |
| Celery | 5.x | Background tasks (PDF, bulk import, push) |
| django-celery-beat | — | Periodic task scheduler |
| FastAPI | 0.115+ | Chatbot microservice |
| Uvicorn | 0.32+ | ASGI server for FastAPI |
| djangorestframework-simplejwt | — | JWT authentication |
| drf-spectacular | — | API documentation (Swagger + ReDoc) |
| WeasyPrint | — | PDF report card generation |
| pyfcm | — | Firebase Cloud Messaging |
| django-storages | — | S3/R2 file storage |
| Sentry SDK | — | Error monitoring |

### 25.2 Databases & Storage

| Technology | Purpose |
|---|---|
| PostgreSQL 16 + pgvector | Primary relational database with UUID PKs |
| Redis 7 | Cache, sessions, Celery broker, Django Channels layer |
| Qdrant | Vector DB for RAG chatbot (per-school namespace isolation) |
| Elasticsearch | Full-text search for students, announcements, resources |
| AWS S3 / Cloudflare R2 | File storage (R2 is cheaper, no egress fees) |

### 25.3 AI / ML

| Technology | Purpose |
|---|---|
| Groq API (llama-3.3-70b) | LLM for chatbot (fast and cheap) |
| paraphrase-multilingual-mpnet-base-v2 | Multilingual embeddings (Arabic, French, English) |
| LangChain | RAG pipeline orchestration |

### 25.4 Mobile (Flutter)

| Package | Purpose |
|---|---|
| flutter_bloc | State management |
| dio | HTTP client with JWT interceptor auto-refresh |
| GoRouter | Declarative navigation |
| get_it | Dependency injection |
| hive + flutter_secure_storage | Local storage & secure token storage |
| firebase_messaging | Push notifications (FCM) |
| flutter_local_notifications | In-app notification display |
| web_socket_channel | WebSocket for real-time chat |
| fl_chart | Academic performance charts |
| table_calendar | Calendar widgets |
| cached_network_image | Image caching and loading |
| flutter_pdfview | In-app PDF viewer |
| flutter_localizations / easy_localization | AR / FR / EN + RTL support |

### 25.5 Admin Panel (React)

| Package | Purpose |
|---|---|
| React 18 + TypeScript | Framework |
| Ant Design | UI component library (tables, forms, modals) |
| Recharts | Academic charts and graphs |
| Axios / React Query | HTTP client + server state management |
| React Router v6 | Navigation |
| i18next | Multilingual (AR/FR/EN) + RTL support |

### 25.6 Infrastructure

| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy, SSL termination, static files |
| GitHub Actions | CI/CD pipeline |
| Sentry | Error monitoring |
| Firebase Cloud Messaging | Push notifications |
| Let's Encrypt | Free SSL certificates |
| Hetzner / DigitalOcean | Cloud hosting (best price for Algeria) |

---

## 27. Security & Data Protection

### 26.1 Authentication Security

- JWT access tokens: 15-min expiry; refresh tokens: 30-day expiry with rotation
- HTTPS enforced — HTTP redirected to HTTPS via Nginx
- Rate limiting: 5 failed logins → 30-minute lockout
- Passwords hashed with **argon2** (stronger than Django's default pbkdf2)
- Admin can remotely invalidate any user's all sessions
- Session revocation from admin panel

### 26.2 Data Isolation

- Every query filtered by `school` from JWT — server-side, never client-side
- Section-level isolation for section admins and teachers
- Students cannot query other students' data — enforced at view level
- Parents can only see their own linked children
- Discipline records only visible to admin and the involved teacher

### 26.3 File Security

- All files in private S3 buckets — not publicly accessible
- Files served via signed URLs with 1-hour expiry
- MIME type + extension validation on every upload
- Maximum file sizes enforced per file type (see Section 31)

### 26.4 API Security

- CORS: only allow requests from registered app origins and admin panel domain
- All sensitive endpoints require authentication
- Input validation and sanitization on all POST/PATCH endpoints
- SQL injection: impossible with Django ORM (no raw SQL queries)
- XSS: React and Flutter both escape content by default

### 26.5 Infrastructure Security

- Database port 5432 NOT exposed to internet — internal Docker network only
- Redis NOT exposed to internet
- All secrets in environment variables — never in codebase or Git
- Daily automated database backups, retained 30 days
- CORS: only allow requests from registered origins
- Dependency vulnerability scanning in GitHub Actions CI pipeline

---

## 28. Multi-Tenancy Design

### 27.1 Isolation Strategy

Every school-scoped model has a `school` FK. All ViewSets inherit `TenantAwareViewSet`. Super admin sees all; every other role sees only their school.

### 27.2 Qdrant Namespace Isolation

```python
# Each school has its own isolated vector collection
collection_name = f"school_{school.id}_knowledge"
```

A school's chatbot can never retrieve vectors from another school.

### 27.3 Super Admin Panel

- View all schools and subscription status
- Activate / deactivate any school instantly
- Create new school tenant with initial admin account
- Impersonate any school admin for support (fully logged in audit trail)
- Platform-wide usage statistics and revenue dashboard

---

## 29. Notifications System

### 28.1 Notification Triggers

| Event | Who Gets Notified | Channel |
|---|---|---|
| Grade published | Student + Parent | Push + In-app |
| New homework posted | Students in class | Push + In-app |
| Student marked absent | Parent | Push + In-app + SMS |
| Average drops below threshold | Parent | Push + In-app |
| 3 consecutive absences | Parent + Admin | Push + In-app |
| New announcement | Target audience | Push + In-app |
| New message received | Recipient | Push + In-app |
| Report card available | Parent | Push + In-app |
| Discipline incident filed | Parent | Push + In-app |
| School event tomorrow | All users | Push + In-app |
| New premium content | Students in class | Push + In-app |
| Payment reminder | Parent | Push + In-app |
| Grade submitted (by teacher) | Admin | In-app only |

### 28.2 Notification Model

```python
class Notification(Model):
    TYPES = ['GRADE', 'HOMEWORK', 'ATTENDANCE', 'ANNOUNCEMENT', 
             'MESSAGE', 'REPORT_CARD', 'PAYMENT', 'EVENT', 'DISCIPLINE']
    
    user = ForeignKey(User)
    school = ForeignKey(School)
    title = CharField()
    body = TextField()
    notification_type = CharField(choices=TYPES)
    related_object_id = UUIDField(null=True)  # ID of the grade/homework/etc.
    related_object_type = CharField(null=True)  # 'Grade', 'HomeworkPost', etc.
    is_read = BooleanField(default=False)
    read_at = DateTimeField(null=True)
    created_at = DateTimeField(auto_now_add=True)
```

### 28.3 Delivery Flow

```
Event occurs in Django (e.g., admin publishes grades)
    │
    ▼
Django signal fires → Celery task queued
    │
    ▼
Celery task:
    1. Create Notification record in DB (in-app)
    2. Send FCM push notification to user's device tokens
    3. Send SMS if event is high-priority (absent student)
```

### 28.4 Smart Notification Features

- **Notification categories**: Academic / Attendance / Behavior / Administrative / Messages
- **Customizable preferences**: users can enable/disable each category
- **Silent hours mode**: no push notifications between 10pm and 7am
- **Weekly digest**: optional weekly summary instead of individual notifications
- **Read receipts**: admin can see which users opened announcements

---

## 30. Offline Mode & Mobile Enhancements

Internet connectivity in Algeria can be unreliable. The apps must work under poor conditions.

### 29.1 Offline Capabilities

| Feature | Offline Behavior |
|---|---|
| View grades | Cached locally — always accessible |
| View homework | Cached locally |
| View resources | Previously downloaded files accessible |
| Mark attendance (teacher) | Saved locally, synced when connection restored |
| Enter grades (teacher) | Draft saved locally, submitted when online |
| Send chat messages | Queued locally, sent when online |
| View announcements | Cached locally |

### 29.2 Implementation

- Use **Hive** (Flutter) for local key-value storage of cached data
- Background sync service runs when internet connection is restored
- Offline indicator shown in the UI when no internet detected
- Conflict resolution: check server state before syncing offline changes

---

## 31. File Storage & Media Management

### 30.1 File Categories & Limits

| Category | Access | Max Size |
|---|---|---|
| Homework attachments | Signed URL (1h expiry) | 20MB |
| Course resources (PDF/slides) | Signed URL (1h expiry) | 100MB |
| Premium content videos | Signed URL (1h expiry) | 500MB |
| Student photos | Signed URL (24h expiry) | 5MB |
| School logo | Public CDN URL | 2MB |
| Generated report cards (PDF) | Signed URL (1h expiry) | 10MB |
| Absence justifications | Signed URL (1h expiry) | 10MB |

### 30.2 Accepted File Types

- **Documents**: PDF, DOCX, PPTX, XLSX
- **Images**: JPG, PNG, WEBP
- **Videos**: MP4, MOV (premium content only)
- **Audio**: MP3, M4A (oral exercises only)

---

## 32. Performance & Scalability Engineering

Plan this from day one.

### 31.1 Database Strategy

- **Indexes**: on all FK columns, all filter columns, all `order_by` columns
- Critical compound indexes: `(school, student, trimester)` on Grade, `(school, class, date)` on Attendance
- **Read replicas**: add PostgreSQL read replica for analytics queries when load grows
- **Connection pooling**: use PgBouncer between Django and PostgreSQL

### 31.2 Caching Strategy

- **Redis caching**: grade dashboards (5-min cache), class averages (invalidated on new grade), school analytics (1-hour cache)
- **CDN (Cloudflare)**: serve all static files through CDN
- **API response caching**: cache expensive list endpoints for 2–5 minutes

### 31.3 Background Jobs

- All PDF generation via Celery (never blocks API requests)
- All bulk imports via Celery
- All push notifications dispatched via Celery
- Monitor Celery health via Flower dashboard

### 31.4 Rate Limiting Per Tenant

- Per-tenant API rate limits (e.g., max 1,000 requests/minute per school)
- Per-user rate limits on chatbot queries (e.g., max 20 queries/hour)
- File upload rate limits

---

## 33. Disaster Recovery Plan

Schools will ask "What if your servers crash?" Have a clear, documented answer.

### 32.1 Backup Strategy

| Backup Type | Frequency | Retention | Location |
|---|---|---|---|
| PostgreSQL incremental | Every 6 hours | 7 days | Same region |
| PostgreSQL full dump | Daily | 30 days | Same region |
| PostgreSQL full dump | Weekly | 1 year | Different region |
| File storage (S3/R2) | Continuous versioning | 90 days | Built into S3/R2 |

### 32.2 Recovery Guarantees

- **RTO (Recovery Time Objective)**: 24 hours maximum to restore service
- **RPO (Recovery Point Objective)**: 6 hours maximum data loss
- Communicate this clearly to schools in the contract

### 32.3 Monitoring

- **UptimeRobot** (free) or Better Uptime for uptime monitoring with SMS/email alerts
- **Sentry**: catch all application errors in real time
- **Flower dashboard**: monitor Celery background job queue health
- Public status page where schools can check platform health

---

## 34. Business Model & Pricing

### 33.1 Pricing Plans

| Plan | Students | Monthly (DZD) | Annual (DZD) | Includes |
|---|---|---|---|---|
| **Starter** | Up to 100 | 30,000 DZD (~115$) | 300,000 DZD (~1,170$) | Core features, no chatbot, 5GB storage |
| **Pro** | Up to 300 | 50,000 DZD (~190$) | 485,000 DZD (~1,900$) | All features + premium content, no AI chatbot, 20GB storage |
| **Pro + AI** | 300+ students | 64,000 DZD (~250$) | 620,000 DZD (~2,500$) | All features + AI chatbot + unlimited storage + priority support + custom branding |

- **20% discount** for annual payment upfront
- **Multi-branch premium**: add 50% to plan price per additional campus
- **Premium content marketplace**: school earns 90%, platform takes 10%

### 33.2 Maximum Students Per Tenant

- Capped by plan (100 / 300 / unlimited) — enforced at account creation
- Prevents abuse and enforces plan tiers
- Storage cost calculated flat by plan for simplicity in MVP

---

## 35. Team Structure & Timeline

### 34.1 Minimum Viable Team

| Role | Responsibilities | Engagement |
|---|---|---|
| Backend Developer (You) | Django API, database, RAG chatbot, DevOps, admin panel API | Full-time |
| Flutter Developer | All 4 mobile apps, UI/UX implementation | Full-time |
| React Frontend Developer | Admin web panel, super admin panel | Full-time (first 6 months) |
| UI/UX Designer | Figma designs, user flows, design system, age-adaptive interfaces | Part-time / Freelance |
| QA Tester | Manual and automated testing across all 5 apps | Part-time (starts month 4) |

> **Absolute minimum to start:** You + one Flutter developer + part-time designer. Replace React admin with Django Admin (Jazzmin theme) for MVP if budget is tight.

### 34.2 Development Phases Summary

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 0: Design & Architecture | 3–4 weeks | Figma designs, database schema, API contract, environment setup |
| Phase 1: Backend Foundation | 5–6 weeks | Auth, multi-tenant, core models, file storage, push, WebSocket |
| Phase 2: Admin Panel MVP | 5–6 weeks | School setup, user management, grade publishing, announcements |
| Phase 3: Teacher App | 4–5 weeks | Classes, homework, resources, grades, attendance, messaging |
| Phase 4: Parent & Student Apps | 5–6 weeks | Grade viewing, homework, attendance, chat, child switcher, age-adaptive UI |
| Phase 5: AI Chatbot | 3–4 weeks | RAG pipeline, Qdrant indexing, chatbot UI, multilingual testing |
| Phase 6: Advanced Features | 4–5 weeks | Analytics, timetable builder, discipline module, archiving |
| Phase 7: Polish & Testing | 4–5 weeks | Full QA, security audit, PDF generation, offline mode, Arabic RTL |
| Phase 8: Pilot Deployment | 2–3 weeks | Deploy with 1 real school, collect feedback, fix critical issues |
| Phase 9: App Store Launch | 2–3 weeks | App Store + Play Store submission, marketing website |

**Total with 3–4 people: 9–11 months**

---

## 36. Development Roadmap

### Phase 0 — Design & Planning (Weeks 1–4)
- [ ] Visit 3–5 target schools, interview directors and teachers
- [ ] Complete Figma designs for Admin Panel and Parent App
- [ ] Finalize API contract document
- [ ] Set up monorepo: Django backend + Flutter + React admin
- [ ] Configure Docker development environment
- [ ] Set up GitHub Actions CI pipeline

### Phase 1 — Backend Foundation (Weeks 5–10) ← **CURRENT**
- [x] Project scaffolding (Django + Flutter + Docker)
- [x] Database models and migrations
- [x] JWT authentication with role-based access
- [x] Multi-tenant data isolation
- [ ] **→ Run `python manage.py migrate` to create all tables**
- [ ] **→ Write seed/fixture data for testing**
- [ ] Complete Django admin customization
- [ ] Write unit tests for all models and serializers
- [ ] Bulk import system (student + parent)
- [ ] File storage integration (S3/R2)
- [ ] Push notification infrastructure (FCM + Celery)
- [ ] Django Channels WebSocket setup

### Phase 2 — Admin Panel MVP (Weeks 11–16)
- [ ] School configuration UI
- [ ] User management (teachers, students, parents)
- [ ] Class and subject management
- [ ] Announcement system
- [ ] Grade review and publication workflow
- [ ] Attendance overview dashboard

### Phase 3 — Teacher App (Weeks 17–21)
- [ ] Authentication + forced password change
- [ ] Class and student list views
- [ ] Homework posting
- [ ] Resource upload
- [ ] Grade entry and submission
- [ ] Attendance marking
- [ ] Teacher-parent private chat
- [ ] Teacher-student chat

### Phase 4 — Parent & Student Apps (Weeks 22–27)
- [ ] Child switcher (multiple children support)
- [ ] Grade and report card views
- [ ] Homework and resource views
- [ ] Attendance view + justification submission
- [ ] Announcement feed
- [ ] Parent-teacher chat
- [ ] Student-teacher chat
- [ ] Age-adaptive UI for Primary students

### Phase 5 — AI Chatbot (Weeks 28–31)
- [ ] FastAPI chatbot service integration
- [ ] Admin knowledge base management UI
- [ ] Qdrant vector indexing pipeline
- [ ] Parent chatbot UI
- [ ] Student chatbot UI
- [ ] Multilingual testing (Arabic, French, English)

### Phase 6 — Report Cards & Advanced (Weeks 32–38)
- [ ] Report card PDF template design
- [ ] Individual and bulk PDF generation
- [ ] Download in parent and student app
- [ ] Premium content upload and management (admin)
- [ ] Premium content browsing (parent/student app)
- [ ] Manual payment confirmation flow (MVP)
- [ ] Access unlock system
- [ ] Analytics dashboard
- [ ] Timetable builder
- [ ] Discipline module
- [ ] Long-term archiving system

### Phase 7 — Polish, Testing & Pilot (Weeks 39–44)
- [ ] Full QA testing across all 5 apps
- [ ] Performance optimization and load testing
- [ ] Security audit
- [ ] RTL Arabic layout review across all apps
- [ ] Offline mode testing (poor connectivity scenarios)
- [ ] Deploy with 1 pilot school
- [ ] Collect feedback and iterate

### Phase 8 — Launch (Weeks 45–48)
- [ ] App Store and Google Play submission
- [ ] Marketing website in Arabic and French
- [ ] Onboarding documentation for schools
- [ ] Support workflow setup (WhatsApp + ticketing)
- [ ] Production deployment (Docker + CI/CD)

---

## 37. Testing Strategy & Quality Assurance

> **A feature is NOT done until it is tested. Period.** Testing is not optional — it is the difference between a product that schools trust and a product that loses their data.

### 37.1 Backend Testing (Django)

Django has a built-in test runner. You write tests in `tests.py` inside each app.

**Unit test example — testing grade average calculation:**

```python
from django.test import TestCase
from .services import calculate_trimester_average

class GradeCalculationTest(TestCase):
    def test_weighted_average_correct(self):
        grades = {
            'CONTINUOUS': 14.0,
            'TEST_1': 12.0,
            'TEST_2': 16.0,
            'FINAL': 18.0,
        }
        weights = {
            'CONTINUOUS': 0.20,
            'TEST_1': 0.20,
            'TEST_2': 0.20,
            'FINAL': 0.40,
        }
        result = calculate_trimester_average(grades, weights)
        self.assertAlmostEqual(result, 16.0, places=2)

    def test_returns_none_when_no_grades(self):
        result = calculate_trimester_average({}, {})
        self.assertIsNone(result)
```

**Integration test example — testing an API endpoint:**

```python
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import SchoolFactory, StudentFactory, GradeFactory

class GradePublishTest(APITestCase):
    def setUp(self):
        self.school = SchoolFactory()
        self.admin = get_user_model().objects.create_user(
            phone_number='0551000001',
            password='testpass',
            role='ADMIN',
            school=self.school
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_publish_submitted_grade(self):
        grade = GradeFactory(status='SUBMITTED', school=self.school)
        response = self.client.patch(f'/api/v1/grades/{grade.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        grade.refresh_from_db()
        self.assertEqual(grade.status, 'PUBLISHED')

    def test_teacher_cannot_publish_grade(self):
        teacher = get_user_model().objects.create_user(
            phone_number='0551000002',
            password='testpass',
            role='TEACHER',
            school=self.school
        )
        self.client.force_authenticate(user=teacher)
        grade = GradeFactory(status='SUBMITTED', school=self.school)
        response = self.client.patch(f'/api/v1/grades/{grade.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_parent_from_other_school_cannot_see_grades(self):
        other_school = SchoolFactory()
        parent = get_user_model().objects.create_user(
            phone_number='0551000003',
            password='testpass',
            role='PARENT',
            school=other_school
        )
        self.client.force_authenticate(user=parent)
        student = StudentFactory(school=self.school)
        response = self.client.get(f'/api/v1/students/{student.id}/grades/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
```

**Run your tests with:**

```bash
python manage.py test
# or for a specific app:
python manage.py test grades
# with coverage:
pip install coverage
coverage run manage.py test
coverage report
```

**Install `factory_boy` for test data factories:**

```bash
pip install factory_boy
```

```python
import factory

class SchoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = School
    name = factory.Sequence(lambda n: f"School {n}")
    subdomain = factory.Sequence(lambda n: f"school-{n}")
```

---

### 37.2 What to Test for Each Feature

This is the practical answer to **"when is a feature done."** For every feature you build, you must write tests that cover these **four scenarios**:

| Scenario | Description |
|---|---|
| **The Happy Path** | It works correctly when used properly |
| **The Sad Path** | It fails correctly when given wrong input |
| **The Permission Test** | The wrong user role gets blocked |
| **The Tenant Test** | Data from another school is invisible |

For example, for the "teacher submits grades" feature:

```
HAPPY PATH:    Teacher submits valid grades -> status becomes SUBMITTED -> admin sees it
SAD PATH:      Teacher submits grade of 25/20 -> API returns 400 validation error
PERMISSION:    Parent tries to submit grades -> 403 Forbidden
TENANT:        Teacher from School B cannot submit grades to School A's class
```

> **A feature is done when all four scenarios pass.**

---

### 37.3 Testing Checklist Per Feature

Use this as a literal checklist. Check a box only when the test is written AND passing:

```
Feature: Grade Entry by Teacher
  [ ] Teacher can enter grade and save as draft
  [ ] Teacher can edit draft grade
  [ ] Teacher can submit grades to admin
  [ ] Admin receives notification when grades submitted
  [ ] Teacher cannot enter grade > max_value (e.g., 21/20)
  [ ] Teacher cannot enter negative grade
  [ ] Teacher cannot submit grades for a class they are not assigned to
  [ ] Parent cannot enter grades
  [ ] Student cannot enter grades
  [ ] Teacher from School B cannot see School A's students
  [ ] Grade average recalculates correctly after submission
```

**When every checkbox is ticked, the feature is done.**

---

### 37.4 Using Postman for Manual API Testing

Before writing automated tests, use Postman to explore and verify each endpoint manually. This is faster for catching obvious issues.

Create a **Postman Collection** called "EduConnect API" with folders: Auth, Grades, Homework, Chat, Chatbot, etc. For each endpoint, save:

- The request (method, URL, headers, body)
- An example of a successful response
- An example of a 403 or 400 error response

Save **environment variables** in Postman: `base_url`, `access_token`, `school_id`, `student_id`. This way you test one endpoint, copy the token, and it automatically fills in for every other request.

---

### 37.5 Testing Multi-Tenancy Specifically

This is the **most critical thing to test** for your app. One mistake here means a parent from School A can see School B's students' grades — a **catastrophic privacy violation**.

Write a dedicated test file `tests/test_tenant_isolation.py`:

```python
class TenantIsolationTest(APITestCase):
    def setUp(self):
        self.school_a = SchoolFactory()
        self.school_b = SchoolFactory()
        self.admin_a = AdminFactory(school=self.school_a)
        self.admin_b = AdminFactory(school=self.school_b)
        self.student_a = StudentFactory(school=self.school_a)
        self.student_b = StudentFactory(school=self.school_b)

    def test_admin_cannot_see_other_schools_students(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get(f'/api/v1/students/{self.student_b.id}/')
        # Must return 404, not 403 — never confirm the resource exists
        self.assertEqual(response.status_code, 404)

    def test_grade_list_only_returns_own_school_grades(self):
        GradeFactory(school=self.school_a, student=self.student_a)
        GradeFactory(school=self.school_b, student=self.student_b)
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get('/api/v1/grades/')
        ids = [g['id'] for g in response.data]
        # School A admin must never see School B's grade IDs
        self.assertNotIn(str(self.student_b.id), str(ids))
```

> ⚠️ **Security Note:** Always return **404 (Not Found)** instead of 403 (Forbidden) when a user tries to access another tenant's resource. A 403 tells the attacker the resource exists. A 404 reveals nothing.

---

### 37.6 When Is a Feature "Done"?

Use this strict definition for every single feature:

```
A feature is DONE when:
  1. The happy path works and is tested
  2. Error cases return correct status codes and messages
  3. Wrong user roles are blocked (tested)
  4. Other schools cannot see the data (tested)
  5. The feature works with no internet (if applicable — mobile)
  6. A non-technical person can use it without instructions
```

That last point is your **user acceptance test**. Show the feature to someone who has never seen it — your parent, a friend, anyone. If they can complete the task without you explaining anything, the feature is done. If they get confused, the UX is broken and it is **not done** regardless of what the tests say.

---

### 37.7 CI/CD — Automatic Testing on Every Push

Set up GitHub Actions so that every time you or your collaborator pushes code, the tests run automatically. If a test fails, the push is blocked.

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: python manage.py test
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost/test_db
          SECRET_KEY: test-secret-key
          DEBUG: True
```

Now every Pull Request shows a **green checkmark** (all tests pass) or **red X** (something broke). You will never merge broken code again.

---

### 37.8 The Complete Testing Workflow

```
1. Pick a feature from your backlog
2. Write the test first (or immediately after coding)
3. Test covers: happy path, sad path, permissions, tenant isolation
4. Run: python manage.py test
5. Test with Postman manually
6. Show it to a non-technical person
7. All pass? -> Feature is DONE. Move to the next one.
```

---

## 38. Go-To-Market Strategy

The Algerian private school market is relationship-driven. Cold emails alone will not work.

| Phase | Strategy |
|---|---|
| **Phase 1 — Pilots** | Free 3-month pilot for 2–3 schools in your wilaya. Be physically present during onboarding. These become your case studies and references. |
| **Phase 2 — Referrals** | Go to every director that your pilot schools know. Offer referral discount: "Refer a school, get one month free." |
| **Phase 3 — Events** | Attend education fairs and teachers' union events. Create a 2-minute demo video. |
| **Phase 4 — Online Presence** | Landing page in Arabic and French with pricing, screenshots, and testimonials. |
| **Phase 5 — Associations** | Contact private school associations (fédérations des écoles privées) in major wilayas for group deals. |

---

## 39. Critical Success Factors

- **User experience is everything**: test with real non-technical users before launch. If anyone struggles, you lose that school.
- **Offline support**: build offline-first from day one. Marks and homework must always be accessible.
- **Arabic & RTL support**: build RTL from day one, not as an afterthought.
- **Fast customer support**: WhatsApp response under 2 hours during school hours is your biggest competitive advantage.
- **Data migration**: the bulk import feature eliminates the biggest barrier to adoption.
- **Ship fast, learn fast**: MVP = Authentication + Grades + Homework + Announcements + Basic messaging. Get this in front of real schools immediately.

---

## 40. Features NOT to Build Yet

Avoid these in the first 12 months:

| Feature | Reason to Avoid |
|---|---|
| Complex ERP payroll system | Out of scope, requires accounting expertise |
| Full LMS like Moodle | Too complex, slows you down |
| Video conferencing system | Use Zoom/Google Meet links instead |
| Too many AI features beyond the chatbot | Distraction from core product |
| Complex workflow engine | Over-engineering for current scale |

**Focus on: Grades + Communication + Parent visibility.** These three alone make the product sellable.

---

## 41. Hidden Technical Decisions

Decide these now before writing code. Changing them later is very painful.

| Decision | Recommendation | Reason |
|---|---|---|
| Soft delete vs hard delete | Soft delete always | Legal archiving requirement |
| Audit logging | Django signals writing to AuditLog table | Full accountability |
| Row-level security | ORM-level isolation for now; PostgreSQL RLS as backup | Simpler to maintain |
| File size limits | Per file type (defined in Section 31) | Flexible and enforceable |
| Message retention policy | Per academic year — archive at year end | Manageable storage costs |
| Maximum students per tenant | Cap by plan (100/300/unlimited) | Prevents abuse |
| Storage cost calculation | Flat by plan for simplicity in MVP | Easier billing |
| Grade decimal precision | 2 decimal places (e.g., 14.50/20) | Algerian school standard |
| Class rank visibility | Configurable per school | Some schools prefer not to show rank |
| UUID vs integer PKs | UUID — prevents enumeration, better for multi-tenant | Security best practice |

---

## 42. Competitive Advantage Strategy

- **Perfect Arabic UX**: be the only product that feels native to Algerian schools
- **Physical presence**: be at the school during onboarding — no competitor will do this
- **Free data migration**: offer to import existing student data for free
- **Fast WhatsApp support**: respond in under 2 hours during school hours
- **Emotional attachment**: when a parent sees their child's grade on their phone for the first time, they will demand their school keep using the app forever
- **Built for Algeria**: BEP, BEM, BAC tracking, coefficient-weighted averages, trimester structure — not adapted from a foreign product
- **Relationships**: the Algerian school director community is small and interconnected — one happy director is worth 10 future clients

---

## 43. Personal Action Plan

| Timeline | Action | Goal |
|---|---|---|
| Week 1–2 | Visit 3–5 private schools. Talk to directors, teachers, parents. Take notes on frustrations. | Validate the problem before building. |
| Week 3–4 | Hire or partner with a Flutter developer. Most critical hire. | Secure mobile development. |
| Week 5–6 | Commission UI/UX designer for Figma mockups (admin panel + parent app). | Define exactly what to build. |
| Week 7–8 | Set up Django project: multi-tenant, PostgreSQL, JWT auth, core models. No feature code yet. | Solid foundation first. |
| Week 9–14 | Build admin panel + teacher app. Priority: grade management → homework → announcements → messaging. | Get to a demoable product fast. |
| Week 15–18 | Build parent app. A parent seeing their child's grade sells the product. | Create emotional impact. |
| Week 19–20 | Deploy to real server. Set up pilot school. Onboard them personally. | Real-world validation. |
| Month 6+ | Add student app, chatbot, analytics, timetable builder — based on pilot feedback. | Feedback-driven expansion. |

> **The most important advice**: Give two schools a completely free subscription for 3–6 months. Be physically present at the school for the first week of onboarding. Sit with the director, the secretary, and two teachers and watch them use your app. Every moment of confusion they show you is worth more than any line of code you could write. Build what real schools need, not what you imagine they need.

---

## 44. Open Questions & Decisions Pending

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Default admin panel language? | Arabic / French / Both | French first, Arabic in v2 |
| 2 | Can a student have more than 2 parent accounts? | Yes / No | Max 2 (father + mother) — use M2M with relationship field |
| 3 | Should teachers see other teachers' submitted grades? | Yes / No | No — isolated by subject |
| 4 | Voice input for chatbot? | Yes / No | No for MVP, add in v2 |
| 5 | Class rank visible to students or parents only? | Both / Parents only | Configurable per school |
| 6 | Algerian SMS gateway? | Twilio / Local provider | Research local providers (cheaper, better delivery) |
| 7 | Video hosting for premium content? | Self-hosted S3 / YouTube / Vimeo | S3 for privacy and control |
| 8 | Should timetable builder detect teacher availability automatically? | Yes / No | Yes — saves admin time |
| 9 | Should discipline incidents be visible to parents immediately or after admin review? | Immediately / After review | After admin review (professional control) |
| 10 | What format does the Ministry require for student data export? | — | Contact Ministry before building this feature |
| 11 | Should admin be able to message students directly? | Yes / No | Yes, but only broadcast |
| 12 | Payment gateway for premium content? | Manual / SATIM / Baridimob | Manual for MVP |
| 13 | Should the super admin panel be built first? | Yes / No | Yes — needed to onboard pilot schools |

---

## 45. Glossary

| Term | Definition |
|---|---|
| **Tenant** | A single school in the multi-tenant system |
| **Section** | A level division within a school (Primary / Middle / High) |
| **Trimester** | One of three academic periods in the Algerian school year |
| **BEP** | Brevet d'Enseignement Primaire — Primary school final national exam (5AP) |
| **BEM** | Brevet d'Enseignement Moyen — Middle school final national exam (4AM) |
| **BAC** | Baccalauréat — High school final national exam (3AS), grants university access |
| **Coefficient** | Weight factor applied to a subject when calculating trimester averages |
| **RAG** | Retrieval-Augmented Generation — AI technique powering the chatbot |
| **FCM** | Firebase Cloud Messaging — service for mobile push notifications |
| **JWT** | JSON Web Token — stateless authentication token format |
| **DRF** | Django REST Framework — Django library for building REST APIs |
| **RTL** | Right-to-Left — text direction for Arabic language |
| **SaaS** | Software as a Service — subscription-based software business model |
| **RTO** | Recovery Time Objective — max time to restore service after a failure |
| **RPO** | Recovery Point Objective — max data loss acceptable in a failure event |
| **Soft Delete** | Mark a record as deleted without removing it from the database |
| **Audit Trail** | Log of all actions: who did what, when, and on which record |
| **CDN** | Content Delivery Network — distributed servers for fast static file delivery |

---

## Appendix A — Naming Conventions

**Backend (Python/Django):**
- Models: `PascalCase` (e.g., `StudentProfile`, `AcademicYear`)
- Variables & functions: `snake_case`
- API endpoints: `kebab-case` (e.g., `/bulk-import/`)
- Environment variables: `UPPER_SNAKE_CASE`

**Mobile (Flutter/Dart):**
- Classes: `PascalCase`
- Variables & functions: `camelCase`
- Files: `snake_case.dart`

**Database:**
- Tables: `snake_case` (auto-generated by Django)
- All foreign keys: `related_model_id`

**Git:**
- Feature branches: `feature/short-description`
- Bug fixes: `fix/short-description`
- Commit messages: `feat: add bulk import for students`

---

## Appendix B — Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `REDIS_URL` | Redis connection URL |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key |
| `OPENAI_API_KEY` | OpenAI API key (for AI chatbot) |
| `PINECONE_API_KEY` | Pinecone/Qdrant vector DB key |
| `SENTRY_DSN` | Sentry error tracking DSN |
| `AWS_ACCESS_KEY_ID` | S3/R2 file storage access key |
| `AWS_SECRET_ACCESS_KEY` | S3/R2 file storage secret key |
| `AWS_STORAGE_BUCKET_NAME` | S3/R2 bucket name |

---

*EduConnect Algeria — Complete Product Conception & Technical Blueprint*  
*Version 3.0 — February 2026 | Confidential*  
*Merged from: README.md, Full_Report.md, Algerian_schools_system.md*

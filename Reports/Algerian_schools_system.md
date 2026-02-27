# 📚 EduConnect Algeria — Full Application Conception Report

> **A Multi-Tenant SaaS E-Learning & School Management Platform for Algerian Private Schools**  
> Version 1.0 — February 2026  
> Status: Pre-Development Conception Phase

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Target Market & Business Context](#2-target-market--business-context)
3. [Algerian Educational System Reference](#3-algerian-educational-system-reference)
4. [Platform Architecture](#4-platform-architecture)
5. [User Roles & Hierarchy](#5-user-roles--hierarchy)
6. [Authentication & Account Management](#6-authentication--account-management)
7. [School Structure & Section Management](#7-school-structure--section-management)
8. [Feature Specification — Admin Panel](#8-feature-specification--admin-panel)
9. [Feature Specification — Teacher App](#9-feature-specification--teacher-app)
10. [Feature Specification — Parent App](#10-feature-specification--parent-app)
11. [Feature Specification — Student App](#11-feature-specification--student-app)
12. [Grading System Design](#12-grading-system-design)
13. [Messaging & Communication System](#13-messaging--communication-system)
14. [RAG Chatbot System](#14-rag-chatbot-system)
15. [Premium Content & Payment System](#15-premium-content--payment-system)
16. [Database Schema & Models](#16-database-schema--models)
17. [API Design](#17-api-design)
18. [Technology Stack](#18-technology-stack)
19. [Security & Data Protection](#19-security--data-protection)
20. [Multi-Tenancy Design](#20-multi-tenancy-design)
21. [Notifications System](#21-notifications-system)
22. [File Storage & Media Management](#22-file-storage--media-management)
23. [Development Roadmap](#23-development-roadmap)
24. [Open Questions & Decisions Pending](#24-open-questions--decisions-pending)

---

## 1. Project Overview

**EduConnect Algeria** is a full-stack multi-tenant SaaS platform designed specifically for private schools in Algeria. It digitalizes and centralizes the daily operations of school administration, teachers, parents, and students into a single connected ecosystem.

### What the Platform Solves

| Current Problem | Our Solution |
|---|---|
| Marks communicated by paper or WhatsApp | Digital grade entry, review, and publication flow |
| Homework assignments lost or forgotten | Homework posts with push notifications and due dates |
| Parents have no visibility into child's studies | Dedicated parent app with full academic dashboard |
| Administration drowns in paperwork | One-click report card generation, attendance tracking |
| No structured teacher-parent communication | Private dedicated chat channels per student |
| School knowledge is scattered | AI-powered RAG chatbot that answers any question |
| Manual fee tracking and physical receipts | Digital payment tracking and receipt generation |

### The Five Applications

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

---

## 2. Target Market & Business Context

### Primary Market
Private schools in Algeria across all 58 wilayas. Algeria has over 3,000 private educational institutions, ranging from small single-level schools (primary only) to large multi-level institutions combining primary, middle, and high school under one roof.

### Key Insight: Schools Are Not All the Same
A critical design decision is that schools come in different configurations:

- **Single-level schools** — Primary only, Middle only, or High School only
- **Dual-level schools** — Primary + Middle, or Middle + High School
- **Full schools** — Primary + Middle + High School combined

The platform must handle all of these configurations cleanly, with each section (primary / middle / high school) managed independently within the same school tenant.

### Business Model
- **SaaS subscription** per school, billed monthly or annually
- Pricing tiered by number of active students
- Schools can optionally monetize premium content to their own students/parents through the platform (school earns revenue, platform takes a small fee)

### Revenue Projection Example

| Schools | Avg Monthly/School | Monthly Revenue |
|---|---|---|
| 5 schools (pilot) | 0 DZD (free pilots) | Testimonials |
| 20 schools | 18,000 DZD | 360,000 DZD |
| 100 schools | 20,000 DZD | 2,000,000 DZD |
| 300 schools | 22,000 DZD | 6,600,000 DZD |

---

## 3. Algerian Educational System Reference

The platform is built around the official Algerian Ministry of National Education structure. Private schools follow this structure with minor internal variations allowed.

### 3.1 Educational Levels

#### 🟢 Primary School (École Primaire) — 6 Years

| Year | Name | Grade Scale | Pass Threshold |
|---|---|---|---|
| Year 0 | Preparatory (CP1) | /10 | 5/10 |
| Year 1 | 1AP | /10 | 5/10 |
| Year 2 | 2AP | /10 | 5/10 |
| Year 3 | 3AP | /10 | 5/10 |
| Year 4 | 4AP | /10 | 5/10 |
| Year 5 | 5AP | /10 | 5/10 |

**End of cycle exam:** BEP (Brevet d'Enseignement Primaire) — 5AP national exam  
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
| History | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Geography | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Natural Sciences | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

#### 🟡 Middle School (CEM — Collège d'Enseignement Moyen) — 4 Years

| Year | Name | Grade Scale | Pass Threshold |
|---|---|---|---|
| Year 1 | 1AM | /20 | 10/20 |
| Year 2 | 2AM | /20 | 10/20 |
| Year 3 | 3AM | /20 | 10/20 |
| Year 4 | 4AM | /20 | 10/20 |

**End of cycle exam:** BEM (Brevet d'Enseignement Moyen) — 4AM national exam  
**Progression to:** High School (Lycée)

**Subjects (all years):** Arabic, Mathematics, Islamic Education, Civic Education, French, English, History, Geography, Natural Sciences, Physics, Technology, Physical Education, Artistic Education

---

#### 🔴 High School (Lycée) — 3 Years

| Year | Name | Grade Scale | Pass Threshold |
|---|---|---|---|
| Year 1 | 1AS (Common Core) | /20 | 10/20 |
| Year 2 | 2AS (Specialized) | /20 | 10/20 |
| Year 3 | 3AS (Specialized) | /20 | 10/20 |

**End of cycle exam:** BAC (Baccalauréat) — 3AS national exam  
**Progression to:** University

**Specialization Streams (2AS & 3AS):**

| Stream | Key Subjects |
|---|---|
| Sciences | Advanced Math, Physics, Natural Sciences |
| Mathematics | Advanced Math, Physics |
| Technical Mathematics | Math, Physics, Technology |
| Literature & Philosophy | Philosophy, Arabic Lit, History |
| Foreign Languages | French, English, other languages |
| Management & Economics | Economics, Accounting, Law, Management |

---

### 3.2 Academic Year Structure

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

### 3.3 Grade Calculation Formula

```
Trimester Average = Σ(Subject Grade × Coefficient) ÷ Σ(Coefficients)

Yearly Average = (T1 Average + T2 Average + T3 Average) ÷ 3
```

**Default exam weighting within a trimester (configurable by school):**

| Component | Default Weight |
|---|---|
| Continuous Assessment | 20% |
| First Test | 20% |
| Second Test | 20% |
| Final Exam | 40% |

> ⚠️ **Design Note:** These weights MUST be configurable per school and per level from the admin panel. Some private schools use different weighting internally.

---

## 4. Platform Architecture

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

### 4.2 Multi-Tenant Strategy

Every school is a **tenant**. All data is isolated by tenant at the database query level. The Django backend extracts the school from the authenticated user's JWT token and automatically applies it as a filter to every query. No school can ever see another school's data.

```python
# Every ViewSet inherits this — no exceptions
class TenantAwareViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return super().get_queryset().filter(school=self.request.user.school)
```

---

## 5. User Roles & Hierarchy

```
SUPER_ADMIN (Developer / You)
│   ├── Creates and manages all School tenants
│   ├── Manages billing and subscriptions
│   └── Can impersonate any school admin for support

SCHOOL_ADMIN (School Director / Secretary)
│   ├── Manages everything within their school
│   ├── Creates Teacher, Parent, and Student accounts
│   └── Multiple admin accounts allowed per school (different devices)

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

### Permission Matrix

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

---

## 6. Authentication & Account Management

### 6.1 Core Principle

> **Nobody self-registers. Every account is created by a higher authority in the hierarchy.**

This guarantees identity integrity — the school already verified every student and parent identity physically during enrollment. We leverage that existing trust.

### 6.2 Account Creation Flow

```
┌─────────────────────────────────────────────────────┐
│  You (Super Admin) creates School Admin accounts    │
│  → Delivers credentials via email or direct handoff │
└─────────────────────────────┬───────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────┐
│  School Admin creates Teacher accounts              │
│  → System generates temp password                   │
│  → Admin delivers via SMS or printed sheet          │
│  → Teacher forced to change password on first login │
└─────────────────────────────┬───────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────┐
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

### 6.3 One Parent → Multiple Children

When admin creates a second student with a phone number that already exists in the system:

```
Admin creates Student B with parent phone: 0555123456

System checks: Does phone 0555123456 already exist?
  YES → Link Student B to existing Parent account
        (no new account created, no duplicate)
  NO  → Create new Parent account, link to Student B
```

The parent sees a **child switcher** on the home screen of their app, similar to how Netflix lets you switch profiles. Each child's data is completely separate.

### 6.4 Bulk Import Flow

For onboarding a school with hundreds of students at year start:

1. Admin downloads the Excel template from the admin panel
2. Admin fills it with: student name, DOB, class, parent name, parent phone
3. Admin uploads the filled Excel file
4. Celery background task processes the file:
   - Creates student accounts
   - Creates or links parent accounts
   - Generates credentials
   - Queues SMS notifications to all parents
5. Admin sees a progress bar and a summary report when done (X accounts created, Y errors)

**Excel Template Columns:**
```
student_first_name | student_last_name | date_of_birth | 
class_name | section | parent_first_name | parent_last_name | 
parent_phone | parent_email (optional)
```

### 6.5 Authentication Method

- **JWT Authentication** with access token (15 min expiry) + refresh token (30 days)
- **Refresh token rotation** — each refresh issues a new refresh token and invalidates the old one
- **is_first_login flag** — redirects user to forced password change screen on first login
- **Biometric login** — after initial password setup, users can enable fingerprint/Face ID on mobile apps
- **PIN login** — for primary school students (ages 5–11) who struggle with passwords, a simple 4–6 digit PIN is supported as an alternative

### 6.6 User Base Model

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
    role = CharField(choices=ROLE_CHOICES)  # SUPER_ADMIN/ADMIN/TEACHER/PARENT/STUDENT
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

## 7. School Structure & Section Management

### 7.1 Flexible School Configuration

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

### 7.2 Section Model

```python
class School(Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=200)
    logo = ImageField()
    address = TextField()
    phone = CharField()
    email = EmailField()
    subscription_plan = CharField()
    subscription_active = BooleanField(default=True)
    subdomain = CharField(unique=True)  # e.g., "lycee-ibn-khaldoun"
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
```

### 7.3 Class Structure

```python
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
    level = CharField()        # "3AP", "1AM", "2AS" etc.
    stream = CharField(null=True, blank=True)  # "Sciences", "Math" etc. (High School only)
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

## 8. Feature Specification — Admin Panel

The admin panel is a **web application** (React.js) accessible from any browser. It is the command center of the school. The UI must be designed for non-technical users — everything must be achievable through forms and buttons, no technical knowledge required.

### 8.1 Dashboard

- **Live statistics:** total students per section, active teachers, pending grade submissions, unread messages, upcoming events
- **Quick actions:** Post announcement, Add student, Generate report cards, View attendance alerts
- **Recent activity feed:** last 20 actions in the system with who did what and when
- **Academic calendar widget:** shows current trimester, days until next exam period, upcoming school events

### 8.2 School Configuration

- Edit school profile: name, logo, address, contacts, motto
- Activate/deactivate sections (Primary, Middle, High School)
- Configure academic year: start date, end date, trimester dates
- Set school-wide holidays and special events
- Configure grading weights per section (Continuous Assessment %, First Test %, etc.)
- Configure working days and school hours

### 8.3 User Management

#### Teachers
- Add teacher: name, phone, email, section, assigned subjects and classes
- Edit teacher profile and class assignments
- Deactivate/reactivate teacher account
- View teacher's submitted grades and activity log
- Bulk import teachers via Excel

#### Students & Parents
- Add student with automatic parent account creation
- Search students by name, class, section, or student ID
- View full student profile: personal info, current class, all grades history, attendance
- Transfer student to different class (with reason and date logged)
- Link additional parent to a student (some families have both parents registered)
- Deactivate student (end of year, transfer to another school)
- Bulk import students and parents via Excel

### 8.4 Class & Subject Management

- Create classes per section and academic year with a name and level
- Assign homeroom teacher to each class
- Define subjects per class with coefficients
- Assign a teacher to each subject within each class
- For High School: assign specialization streams to 2AS and 3AS classes

### 8.5 Grade Management

This is one of the highest-value features. The grade flow is:

```
Teacher enters grades (draft) 
    → Teacher submits to admin 
        → Admin reviews 
            → Admin publishes 
                → Visible to student and parent instantly
```

Admin functions:
- View all pending grade submissions from all teachers
- Filter by section, class, subject, trimester
- View the submitted marks with automatic average pre-calculation
- Add reviewer comments or correction notes before publishing
- Publish with one click (or reject and send back to teacher with note)
- View full grade history with audit trail (who entered, who published, timestamps)
- Bulk publish all grades for a trimester once all teachers have submitted

### 8.6 Report Card Generation

- Generate individual student report card as a formatted PDF
- Generate all report cards for an entire class in one operation (downloaded as ZIP)
- Generate all report cards for the entire school in one batch (ZIP, processed by Celery)
- Report card includes: student info, photo, class, all subjects with grades and coefficients, trimester average, yearly average, class rank, teacher comments, director signature field
- Report card design is customizable per school (colors, logo placement, footer)

### 8.7 Attendance Management

- View attendance dashboard: daily summary of absences per class
- Mark attendance is done by teachers from their app; admin sees it in real time
- Absence justification workflow: parents submit excuse → admin approves/rejects
- Generate monthly and yearly attendance report per student
- Set absence alert threshold (e.g., alert admin if student misses 3+ days in a week)
- Automatic parent push notification when child is marked absent

### 8.8 Announcement & News System

- Rich text editor for announcements (text, images, attachments, links)
- Target audience selection:
  - All users (everyone in the school)
  - Parents only
  - Students only
  - Teachers only
  - Specific section (Primary only, Middle only, etc.)
  - Specific class
- Schedule announcements for future publication
- Pin important announcements to the top of the feed
- Track how many users have seen each announcement

### 8.9 School Event Calendar

- Create events: name, date, time, location, description, target audience
- Event types: exam period, parent meeting, school trip, holiday, ceremony
- Events appear in all user apps in their respective calendars
- Send push notification 24 hours before important events

### 8.10 Financial Module (Optional / Premium)

- Configure fee amounts per section and per academic year
- Track payment status per student (paid / partial / unpaid)
- Record payments with: amount, date, payment method, receipt number
- Send payment reminders to parents via push notification
- Generate individual payment receipt as PDF
- Monthly revenue report for the school administration
- Export financial data to Excel

### 8.11 Premium Content Management

- Create and manage premium content categories
- Set pricing for premium access (per content, per subject, or full access pass)
- Track which students/parents have paid for premium access
- View revenue from premium content sales
- See content engagement statistics

---

## 9. Feature Specification — Teacher App

The teacher app (Flutter mobile) must save teachers time and replace the scattered WhatsApp groups and paper notebooks they currently use.

### 9.1 Home Dashboard

- Today's schedule: which classes they teach today and at what times
- Pending tasks: grades not yet submitted, homework with upcoming due dates
- Recent messages requiring response
- Quick action buttons: Post homework, Enter grades, Upload resource

### 9.2 My Classes

- View list of all assigned classes with subject
- Enter any class to see the full student list with photos
- Immediately identify students by photo (very useful for new teachers)

### 9.3 Homework & Task Management

- Create homework post: title, description, due date, attached files (PDF, images, Word, video links)
- Target: specific class or specific subject within a class
- Edit or delete homework before students view it
- Mark homework as "corrected and returned"
- View which students have viewed the homework post (read receipts)

### 9.4 Course Resources

- Upload course materials: PDFs, PowerPoint files, images, Word documents, video links
- Organize by subject and chapter/unit
- Resources are instantly available to all students in the assigned class
- Set resources as free or premium (if the school has the premium module enabled)
- View download statistics for each resource

### 9.5 Grade Entry

- Select: class → subject → trimester → exam type
- Enter grades for all students in a clean list interface
- Support for both /10 (Primary) and /20 (Middle and High) scales automatically based on section
- Save as draft: teacher can review before submitting
- Submit to admin: sends a notification to the admin that grades are ready for review
- View status of previous submissions: pending review / published / sent back with comments

### 9.6 Attendance Marking

- Mark attendance for each of their classes at the start of each session
- Options per student: Present / Absent / Late
- Add optional note for an absence (e.g., "called sick")
- Once submitted, admin and parent are notified automatically

### 9.7 Teacher → Parent Private Chat

This channel is for formal professional communication between teacher and parent about a specific student.

- Select student → opens dedicated chat with that student's parent(s)
- Send text messages, images, PDF attachments (for formal letters/reports)
- Pre-written message templates:
  - Academic concern: "I would like to discuss [student]'s performance in [subject]..."
  - Behavior concern: "[Student] has shown some behavioral challenges recently..."
  - Positive feedback: "I am pleased to inform you that [student] has shown great improvement..."
  - Absence follow-up: "[Student] was absent on [date]. Please provide a justification..."
- Full conversation history preserved for the academic year
- Admin can see that conversations exist (count) but cannot read content (privacy)

### 9.8 Teacher → Class Broadcast

- Send a message to all students in a class simultaneously
- Example: "Exam is postponed to Thursday", "Please bring your books tomorrow"
- Students receive as a push notification + in-app message

### 9.9 Student Questions Inbox

- Students send questions about courses to the teacher
- Teacher sees all questions in one organized inbox, filtered by class and subject
- Reply with text, images, or short explanations
- Mark questions as answered

---

## 10. Feature Specification — Parent App

The parent app is the most emotionally valuable product. A parent opening the app and seeing their child's grade in real time is the moment that sells the entire platform to the next school.

### 10.1 Child Switcher

If a parent has multiple children at the same school, a switcher is prominently displayed at the top of the home screen. Tapping it shows all linked children. The parent selects which child to view. All data below updates immediately for the selected child.

```
┌─────────────────────────────┐
│  [Photo] Amira ▼            │  ← tap to switch child
│  3AP - Class A              │
└─────────────────────────────┘
```

### 10.2 Home Dashboard

- Current trimester average for selected child (large, prominently displayed)
- Recent marks (last 3 entered)
- Attendance status: present / absent today
- Upcoming homework due dates
- Unread messages from teachers
- Latest school announcement
- Next school event

### 10.3 Academic Monitoring

**Grades:**
- All published marks per subject, per trimester
- Trimester average with class average for comparison
- Subject coefficients displayed
- Yearly average when all three trimesters are complete
- Class rank (e.g., 4th out of 32 students)
- Performance graph: trimester-by-trimester progress per subject
- Color coding: green (above average), orange (at risk), red (below passing threshold)

**Report Cards:**
- View generated report cards as formatted PDF
- Download and share report cards
- Receive push notification when new report card is published

**Homework:**
- View all current and past homework assignments
- See due dates and status (pending / past due)
- View teacher's notes and attached files
- Note: parents view homework but do not submit it (that is the student's responsibility)

**Resources:**
- Browse course materials uploaded by teachers
- Download resources for offline use

### 10.4 Attendance

- Full attendance calendar view: color-coded days (present=green, absent=red, late=orange)
- Monthly and yearly absence count
- Submit absence justification directly through the app with optional photo attachment (doctor's note, etc.)
- View status of submitted justifications (pending / approved / rejected)
- Receive immediate push notification when child is marked absent

### 10.5 Communication

- Private chat with homeroom teacher
- Private chat with any subject teacher
- Receive school announcements
- View school event calendar
- Receive payment reminders (if financial module enabled)
- Emergency alerts from administration

### 10.6 AI Chatbot (RAG-Powered)

The parent chatbot understands questions in Arabic, French, and Algerian dialect (Darija, approximately). Examples:

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

### 10.7 Premium Content Access

- Browse available premium content for their child's level
- Purchase access via in-app payment
- View purchased content immediately after payment confirmation
- Receive notification when new premium content is added for their child's class

---

## 11. Feature Specification — Student App

The student app adapts its interface based on the student's section (Primary / Middle / High School).

### 11.1 Age-Adaptive Interface

| Section | Age Range | Interface Mode |
|---|---|---|
| Primary | 5–11 years | Simplified: large buttons, icons, bright colors, minimal text, no complex navigation |
| Middle | 11–15 years | Standard: normal app layout, all features, some guided navigation |
| High School | 15–18 years | Full: complete interface, detailed statistics, calendar view, advanced features |

### 11.2 Home Dashboard

- Today's homework due
- Current grades (published only)
- Next upcoming event
- Unread messages from teachers
- Latest class announcement from teacher
- Latest school announcement

### 11.3 Academic Features

- View all homework with due dates, descriptions, and attached files
- Status per homework: upcoming / due today / overdue
- Download course resources organized by subject and chapter
- View published marks (Primary: out of 10, Middle/High: out of 20)
- View trimester averages and yearly average
- View report card when published by admin

### 11.4 Student AI Chatbot

Personalized to the individual student. Examples:

- "Do I have any homework due tomorrow?"
- "What is my average in Arabic this trimester?"
- "What resources did the Math teacher upload this week?"
- "When is the next exam?"
- "What did we study last week in Physics?"

Scope: student can only query their own data. No information about other students.

### 11.5 Communication

- Send questions to subject teachers (one-on-one or to a class group)
- Receive teacher broadcast messages
- Receive school and class announcements
- Receive push notifications for new homework, grade publications, and events

### 11.6 Premium Content (if school enables it)

- Browse available premium content for their class
- View content unlocked by parent's payment
- Access video lessons, interactive exercises, past exam papers, revision sheets
- For primary students: gamified learning exercises presented as mini-games

---

## 12. Grading System Design

### 12.1 Grade Model

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
    max_value = DecimalField()  # 10 or 20 depending on section
    
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

### 12.2 Automatic Calculations

All averages are calculated server-side by the Django backend, never on the client:

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

---

## 13. Messaging & Communication System

### 13.1 Chat Room Types

| Room Type | Participants | Purpose |
|---|---|---|
| `TEACHER_PARENT` | 1 teacher + 1-2 parents of a specific student | Formal private communication about that student |
| `TEACHER_STUDENT` | 1 teacher + 1 student | Course questions and answers |
| `CLASS_BROADCAST` | Teacher → all students in a class | Announcements to the whole class |
| `ADMIN_PARENT` | Admin + specific parent | Administrative communication |
| `ADMIN_BROADCAST` | Admin → all users / specific group | School-wide announcements |

### 13.2 Real-Time Architecture

```
Client (Flutter/React) 
    → WebSocket connection (Django Channels)
        → Channel Layer (Redis)
            → Message stored in PostgreSQL
                → Push notification via FCM (if recipient offline)
```

```python
class ChatRoom(Model):
    ROOM_TYPES = ['TEACHER_PARENT', 'TEACHER_STUDENT', 'CLASS_BROADCAST', 'ADMIN_PARENT', 'ADMIN_BROADCAST']
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

### 13.3 Message Templates (Teacher Pre-written)

Stored per school, configurable from admin panel:

```python
class MessageTemplate(Model):
    school = ForeignKey(School)
    title = CharField()   # "Academic Concern"
    body = TextField()    # "I would like to discuss [student_name]'s performance in [subject]..."
    category = CharField()  # 'concern', 'positive', 'absence', 'general'
    language = CharField()  # 'ar', 'fr', 'en'
```

---

## 14. RAG Chatbot System

### 14.1 Architecture

```
User Question (text, in any language)
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
        ├──► Dynamic: Query Django API
        │         → GET /api/v1/chatbot/student-data/ (authenticated)
        │         → Retrieve: grades, homework, attendance, schedule
        │         → Inject as structured context into LLM prompt
        │
        ▼
LLM (Groq / llama-3.3-70b-versatile)
        │
        ▼
Natural Language Answer → returned to user
```

### 14.2 Knowledge Base (Per School Tenant)

Static knowledge — managed by admin through admin panel:

- School name, address, contacts, opening hours
- Academic calendar: semester dates, exam periods, holidays
- Teacher directory: names, subjects, contact information
- School rules and regulations
- Frequently Asked Questions (admin writes these manually)
- Fee structure and payment information

Dynamic knowledge — queried live from database:
- Student's marks (filtered to authenticated user's child)
- Homework and assignments
- Attendance records
- Upcoming events from school calendar

### 14.3 Embedding & Indexing Pipeline

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

### 14.4 Multilingual Support

The system supports Arabic, French, and English natively. The LLM responds in whatever language the user writes in. The multilingual sentence transformer model (`paraphrase-multilingual-mpnet-base-v2`) handles Arabic, French, and English embeddings in the same vector space.

### 14.5 Safety & Scope Guardrails

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

---

## 15. Premium Content & Payment System

### 15.1 What Premium Content Includes

**For Students:**

| Content Type | Description | Best For |
|---|---|---|
| Video Lessons | Teacher-recorded chapter explanations, rewatchable | All levels |
| Interactive Exercises | Auto-corrected quizzes with instant feedback | All levels |
| Past Exam Papers | BEP, BEM, BAC past papers with model answers | 5AP, 4AM, 3AS |
| Revision Summary Sheets | Teacher-prepared condensed notes | Middle & High |
| Oral Comprehension | Audio exercises for French & English | All levels |
| Gamified Learning | Math & language exercises as mini-games with rewards | Primary (5–11) |

**For Parents:**

| Content Type | Description |
|---|---|
| Detailed Analytics | Performance trends, subject breakdown, comparison to class average |
| Parenting Guides | Expert-written guides on study habits, exam preparation, learning difficulties |
| Priority Chatbot | More detailed and personalized AI responses |

### 15.2 Access Model

```
School Admin configures premium content in admin panel
        │
        ├── Sets content as Free or Premium
        ├── Sets price (per item OR monthly pass OR yearly pass)
        └── School earns 90% of revenue / Platform takes 10% fee

Parent pays through app
        │
        └── Admin confirms payment (manual for MVP)
                │
                └── System unlocks access for linked student(s)
```

### 15.3 Payment Integration (Algeria)

**MVP (Phase 1) — Manual confirmation:**
- Parent pays via bank transfer / CIB card / cash at school
- Admin marks payment as confirmed in admin panel
- Access unlocked automatically

**Phase 2 — Semi-automatic:**
- Integration with Baridimob or SATIM CIB online payment gateway
- Automatic payment confirmation and access unlocking

### 15.4 Premium Content Models

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

## 16. Database Schema & Models

### 16.1 Complete Model Map

```
School (tenant root)
├── Section (PRIMARY / MIDDLE / HIGH)
│   ├── AcademicYear
│   ├── Class → Subject → Grade
│   │              └── TeacherProfile
│   └── TrimesterConfig
├── User
│   ├── StudentProfile → ParentProfile (M2M)
│   ├── TeacherProfile
│   └── AdminProfile
├── Announcement
├── SchoolEvent
├── ChatRoom → Message
├── Notification
├── PremiumContent → PremiumAccess
└── ChatbotKnowledge (RAG documents)
```

### 16.2 Key Design Decisions

- **UUIDs as primary keys** everywhere — prevents enumeration attacks and is better for distributed systems
- **Soft deletes** on all critical models (students, teachers, grades) — add `is_deleted` and `deleted_at` fields, never actually delete
- **Audit trail** — `created_by`, `created_at`, `updated_by`, `updated_at` on all models
- **Section isolation** — queries always scoped first to school, then to section
- **Immutable grade history** — once a grade is published, it can only be amended with a new record, never overwritten

---

## 17. API Design

### 17.1 Versioning & Structure

```
https://api.educonnect.dz/api/v1/
```

All endpoints are prefixed with `/api/v1/` from day one. Future breaking changes go to `/api/v2/`.

### 17.2 Key Endpoint Groups

**Authentication:**
```
POST   /api/v1/auth/login/
POST   /api/v1/auth/refresh/
POST   /api/v1/auth/logout/
POST   /api/v1/auth/change-password/
```

**School & Section Management:**
```
GET    /api/v1/school/profile/
PATCH  /api/v1/school/profile/
GET    /api/v1/sections/
POST   /api/v1/sections/
GET    /api/v1/sections/{id}/classes/
```

**Users:**
```
GET    /api/v1/users/teachers/
POST   /api/v1/users/teachers/
GET    /api/v1/users/students/
POST   /api/v1/users/students/           ← auto-creates parent account
POST   /api/v1/users/students/bulk-import/
GET    /api/v1/users/parents/{id}/children/
PATCH  /api/v1/users/{id}/deactivate/
```

**Grades:**
```
POST   /api/v1/grades/                   ← teacher submits
GET    /api/v1/grades/pending/           ← admin views submissions
PATCH  /api/v1/grades/{id}/publish/      ← admin publishes
PATCH  /api/v1/grades/{id}/return/       ← admin sends back
GET    /api/v1/students/{id}/grades/     ← student/parent views
GET    /api/v1/students/{id}/averages/   ← computed averages
```

**Homework:**
```
GET    /api/v1/classes/{id}/homework/
POST   /api/v1/homework/
PATCH  /api/v1/homework/{id}/
DELETE /api/v1/homework/{id}/
```

**Report Cards:**
```
POST   /api/v1/report-cards/generate/{student_id}/
POST   /api/v1/report-cards/generate-class/{class_id}/
GET    /api/v1/report-cards/{student_id}/download/
```

**Chat:**
```
GET    /api/v1/chat/rooms/
POST   /api/v1/chat/rooms/
GET    /api/v1/chat/rooms/{id}/messages/
POST   /api/v1/chat/rooms/{id}/messages/
WS     /ws/chat/{room_id}/              ← WebSocket endpoint
```

**Announcements:**
```
GET    /api/v1/announcements/
POST   /api/v1/announcements/
PATCH  /api/v1/announcements/{id}/
```

**Attendance:**
```
POST   /api/v1/attendance/mark/
GET    /api/v1/students/{id}/attendance/
POST   /api/v1/attendance/justify/
PATCH  /api/v1/attendance/justify/{id}/approve/
```

**Chatbot:**
```
POST   /api/v1/chatbot/query/           ← parent/student sends question
GET    /api/v1/chatbot/history/         ← conversation history
POST   /api/v1/chatbot/knowledge/       ← admin uploads knowledge doc
DELETE /api/v1/chatbot/knowledge/{id}/
```

---

## 18. Technology Stack

### 18.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12+ | Language |
| Django | 5.x | Main web framework |
| Django REST Framework | 3.15+ | REST API |
| Django Channels | 4.x | WebSocket / real-time chat |
| Celery | 5.x | Async background tasks |
| FastAPI | 0.115+ | Separate chatbot microservice |
| Daphne | 4.x | ASGI server for Django |
| Uvicorn | 0.32+ | ASGI server for FastAPI |

### 18.2 Databases & Storage

| Technology | Purpose |
|---|---|
| PostgreSQL 16 + pgvector | Primary relational database |
| Redis 7 | Cache, sessions, Celery broker, Django Channels layer |
| Qdrant | Vector database for RAG chatbot embeddings |
| Elasticsearch | Full-text search for students, announcements, resources |
| AWS S3 / Cloudflare R2 | File storage (homework files, resources, report card PDFs) |

### 18.3 AI / ML

| Technology | Purpose |
|---|---|
| Groq API (llama-3.3-70b) | LLM for chatbot responses (fast, cheap) |
| sentence-transformers/paraphrase-multilingual-mpnet-base-v2 | Multilingual text embeddings (Arabic, French, English) |
| LangChain | RAG pipeline orchestration |

### 18.4 Mobile (Flutter)

| Package | Purpose |
|---|---|
| flutter_bloc / riverpod | State management |
| dio | HTTP client with interceptors |
| firebase_messaging | Push notifications (FCM) |
| hive / sqflite | Local caching for offline support |
| flutter_local_notifications | In-app notification display |
| web_socket_channel | WebSocket connection for chat |
| cached_network_image | Image caching and loading |
| flutter_pdfview | In-app PDF viewer for resources and report cards |
| easy_localization | Multilingual support (AR, FR, EN) + RTL |

### 18.5 Admin Panel (React)

| Package | Purpose |
|---|---|
| React 18 + TypeScript | Framework |
| Ant Design | UI component library (tables, forms, modals) |
| Recharts | Academic performance charts |
| Axios | HTTP client |
| React Query | Server state management and caching |
| React Router v6 | Navigation |
| i18next | Multilingual (AR/FR/EN) + RTL support |

### 18.6 Infrastructure

| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy, SSL, static files |
| GitHub Actions | CI/CD pipeline |
| Sentry | Error monitoring |
| Firebase Cloud Messaging | Push notifications |
| Let's Encrypt | Free SSL certificates |

---

## 19. Security & Data Protection

### 19.1 Authentication Security

- JWT access tokens: 15-minute expiry
- Refresh tokens: 30-day expiry with rotation (each use invalidates old token)
- HTTPS enforced — HTTP redirected to HTTPS in Nginx
- Rate limiting: max 5 failed logins → 30 minute lockout
- Passwords hashed with **argon2** (Django default pbkdf2 is weaker)
- Session revocation: admin can invalidate all tokens of any user from admin panel

### 19.2 Data Isolation

- Every database query filtered by `school` extracted from JWT — server-side, never client-side
- Section-level isolation: teachers and section admins cannot see other sections' data
- Students cannot query other students' data — enforced at view level
- Parents can only see data about their own linked children

### 19.3 File Security

- All uploaded files stored in private S3 buckets (not publicly accessible URLs)
- Files served via signed URLs with 1-hour expiry
- File type validation on upload (MIME type + extension check)
- Maximum file size enforced: 20MB per file

### 19.4 API Security

- CORS: only allow requests from registered app origins and admin panel domain
- All sensitive endpoints require authentication
- Input validation and sanitization on all POST/PATCH endpoints
- SQL injection: impossible with Django ORM (no raw SQL queries)
- XSS: React and Flutter both escape content by default

### 19.5 Infrastructure Security

- Database port (5432) NOT exposed to internet — internal Docker network only
- Redis port NOT exposed to internet
- All secrets in environment variables — never in codebase
- Daily automated database backups retained for 30 days
- Dependency vulnerability scanning in GitHub Actions CI pipeline

---

## 20. Multi-Tenancy Design

### 20.1 Tenant Isolation Strategy

Every model that belongs to a school has a direct `school` foreign key. All ViewSets inherit from a base class that automatically applies tenant filtering:

```python
class TenantAwareViewSet(viewsets.ModelViewSet):
    """All school-scoped ViewSets must inherit this."""
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'SUPER_ADMIN':
            return qs  # Super admin sees all
        return qs.filter(school=self.request.user.school)
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
```

### 20.2 Qdrant Namespace Isolation (Chatbot)

Each school has its own namespace in Qdrant for vector isolation:

```python
collection_name = f"school_{school.id}_knowledge"
```

A school's chatbot can never retrieve vectors from another school.

### 20.3 Super Admin Capabilities

The super admin panel allows:
- View all schools and their subscription status
- Activate / deactivate any school
- Create new school tenant with initial admin account
- Impersonate any school admin for support (with full audit log)
- View platform-wide usage statistics
- Manage subscription plans and pricing

---

## 21. Notifications System

### 21.1 Notification Types

| Event | Who Gets Notified | Channel |
|---|---|---|
| Grade published | Student + Parent | Push + In-app |
| New homework posted | Students in class | Push + In-app |
| Student marked absent | Parent | Push + In-app + SMS |
| New announcement | Target audience | Push + In-app |
| New message received | Recipient | Push + In-app |
| Report card available | Parent | Push + In-app |
| Payment reminder | Parent | Push + In-app |
| New premium content | Students in class | Push + In-app |
| School event tomorrow | All users | Push + In-app |
| Grade submitted (by teacher) | Admin | In-app only |

### 21.2 Notification Model

```python
class Notification(Model):
    TYPES = ['GRADE', 'HOMEWORK', 'ATTENDANCE', 'ANNOUNCEMENT', 
             'MESSAGE', 'REPORT_CARD', 'PAYMENT', 'EVENT']
    
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

### 21.3 Delivery Flow

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

---

## 22. File Storage & Media Management

### 22.1 File Categories

| Category | Location | Access | Max Size |
|---|---|---|---|
| Homework attachments | S3 private | Signed URL (1h expiry) | 20MB |
| Course resources | S3 private | Signed URL (1h expiry) | 100MB |
| Premium content videos | S3 private | Signed URL (1h expiry) | 500MB |
| Student photos | S3 private | Signed URL (24h expiry) | 5MB |
| School logo | S3 public | Direct CDN URL | 2MB |
| Generated report cards (PDF) | S3 private | Signed URL (1h expiry) | 10MB |
| Absence justifications | S3 private | Signed URL (1h expiry) | 10MB |

### 22.2 Accepted File Types

- **Documents:** PDF, DOCX, PPTX, XLSX
- **Images:** JPG, PNG, WEBP
- **Videos:** MP4, MOV (premium content only)
- **Audio:** MP3, M4A (oral exercises only)

---

## 23. Development Roadmap

### Phase 0 — Design & Planning (Weeks 1–4)
- [ ] Visit 3–5 target schools, interview directors and teachers
- [ ] Complete Figma designs for Admin Panel and Parent App
- [ ] Finalize API contract document
- [ ] Set up monorepo: Django backend + Flutter + React admin
- [ ] Configure Docker development environment
- [ ] Set up GitHub Actions CI pipeline

### Phase 1 — Backend Foundation (Weeks 5–10)
- [ ] Multi-tenant School and Section models
- [ ] User model with all roles and JWT authentication
- [ ] Bulk import system (student + parent)
- [ ] Core models: Class, Subject, AcademicYear
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

### Phase 6 — Report Cards & PDF Generation (Weeks 32–34)
- [ ] Report card PDF template design
- [ ] Individual and bulk generation
- [ ] Download in parent and student app

### Phase 7 — Premium Content & Payments (Weeks 35–38)
- [ ] Premium content upload and management (admin)
- [ ] Premium content browsing (parent/student app)
- [ ] Manual payment confirmation flow (MVP)
- [ ] Access unlock system

### Phase 8 — Polish, Testing & Pilot (Weeks 39–44)
- [ ] Full QA testing across all 5 apps
- [ ] Performance optimization and load testing
- [ ] Security audit
- [ ] RTL Arabic layout review across all apps
- [ ] Offline mode testing (poor connectivity scenarios)
- [ ] Deploy with pilot school
- [ ] Collect feedback and iterate

### Phase 9 — Launch (Weeks 45–48)
- [ ] App Store and Google Play submission
- [ ] Marketing website in Arabic and French
- [ ] Onboarding documentation for schools
- [ ] Support workflow setup (WhatsApp + ticketing)

---

## 24. Open Questions & Decisions Pending

These are design questions that need a decision before implementation begins:

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | What language should the admin panel be in by default? | Arabic / French / Both from start | French first, Arabic in v2 |
| 2 | Should a student be able to have more than one parent account? | Yes (father + mother) / No (one parent only) | Yes — use M2M with relationship field |
| 3 | Should teachers be able to see other teachers' grades? | Yes / No | No — isolated by subject |
| 4 | Should the chatbot support voice input? | Yes (future) / No | No for MVP, add in v2 |
| 5 | Should class rank be visible to students or parents only? | Both / Parents only / Neither | Configurable per school |
| 6 | SMS gateway for Algeria? | Twilio / Local Algerian SMS provider | Research local providers (cheaper) |
| 7 | Should admin be able to message students directly? | Yes / No | Yes, but only broadcast |
| 8 | Payment gateway for premium content? | Manual (MVP) / SATIM / Baridimob | Manual for MVP |
| 9 | Should the super admin panel be built first? | Yes / No | Yes — needed to onboard pilot schools |
| 10 | Video hosting for premium content? | Self-hosted S3 / YouTube unlisted / Vimeo | S3 for privacy and control |

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| Tenant | A single school in the multi-tenant system |
| Section | A level division within a school (Primary / Middle / High) |
| Trimester | One of three academic periods in the Algerian school year |
| BEP | Brevet d'Enseignement Primaire — Primary school final exam |
| BEM | Brevet d'Enseignement Moyen — Middle school final exam |
| BAC | Baccalauréat — High school final exam, grants university access |
| Coefficient | Weight factor applied to a subject when calculating averages |
| RAG | Retrieval-Augmented Generation — AI technique powering the chatbot |
| FCM | Firebase Cloud Messaging — service for push notifications |
| JWT | JSON Web Token — authentication token format |
| DRF | Django REST Framework |
| RTL | Right-to-Left — text direction for Arabic language |
| SaaS | Software as a Service — subscription-based software model |

---

## Appendix B — Naming Conventions

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

*EduConnect Algeria — Conception Document v1.0*  
*Last updated: February 2026*  
*Status: Pre-Development*

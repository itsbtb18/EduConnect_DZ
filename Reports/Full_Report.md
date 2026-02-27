# 📚 EduConnect Algeria — Complete Product Conception & Technical Blueprint

> **A Multi-Tenant SaaS E-Learning & School Management Platform for Algerian Private Schools**  
> Version 2.0 — February 2026 | Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Opportunity](#2-market-opportunity)
3. [Platform Overview & Architecture](#3-platform-overview--architecture)
4. [Algerian Educational System Reference](#4-algerian-educational-system-reference)
5. [Algerian Legal & Regulatory Compliance](#5-algerian-legal--regulatory-compliance)
6. [User Roles & Hierarchy](#6-user-roles--hierarchy)
7. [Authentication & Account Management](#7-authentication--account-management)
8. [School Structure & Section Management](#8-school-structure--section-management)
9. [Feature Specification — Admin Panel](#9-feature-specification--admin-panel)
10. [Feature Specification — Teacher App](#10-feature-specification--teacher-app)
11. [Feature Specification — Parent App](#11-feature-specification--parent-app)
12. [Feature Specification — Student App](#12-feature-specification--student-app)
13. [Advanced Academic Analytics](#13-advanced-academic-analytics)
14. [Timetable & Scheduling Engine](#14-timetable--scheduling-engine)
15. [Discipline & Behavior Module](#15-discipline--behavior-module)
16. [Grading System Design](#16-grading-system-design)
17. [Messaging & Communication System](#17-messaging--communication-system)
18. [RAG Chatbot System](#18-rag-chatbot-system)
19. [Premium Content & Payment System](#19-premium-content--payment-system)
20. [Student Gamification](#20-student-gamification)
21. [Multi-Branch Support](#21-multi-branch-support)
22. [Database Schema & Models](#22-database-schema--models)
23. [API Design](#23-api-design)
24. [Technology Stack](#24-technology-stack)
25. [Security & Data Protection](#25-security--data-protection)
26. [Multi-Tenancy Design](#26-multi-tenancy-design)
27. [Notifications System](#27-notifications-system)
28. [Offline Mode & Mobile Enhancements](#28-offline-mode--mobile-enhancements)
29. [File Storage & Media Management](#29-file-storage--media-management)
30. [Performance & Scalability Engineering](#30-performance--scalability-engineering)
31. [Disaster Recovery Plan](#31-disaster-recovery-plan)
32. [Business Model & Pricing](#32-business-model--pricing)
33. [Team Structure & Timeline](#33-team-structure--timeline)
34. [Go-To-Market Strategy](#34-go-to-market-strategy)
35. [Critical Success Factors](#35-critical-success-factors)
36. [Features NOT to Build Yet](#36-features-not-to-build-yet)
37. [Hidden Technical Decisions](#37-hidden-technical-decisions)
38. [Competitive Advantage Strategy](#38-competitive-advantage-strategy)
39. [Personal Action Plan](#39-personal-action-plan)
40. [Open Questions & Decisions Pending](#40-open-questions--decisions-pending)
41. [Glossary](#41-glossary)

---

## 1. Executive Summary

**EduConnect Algeria** is a multi-tenant SaaS e-learning and school management platform designed specifically for private primary, middle, and high schools in Algeria. The platform addresses a critical gap in the Algerian private education market: fragmented communication, manual administrative work, and a complete lack of digital infrastructure connecting administration, teachers, parents, and students.

This document consolidates every feature, architecture decision, technology choice, legal consideration, team structure, timeline, and business model required to build and commercialize this product professionally. The goal is to create a platform so complete, so easy to use, and so valuable that private schools cannot afford not to adopt it.

### The Five Applications

| Application | Users | Primary Purpose |
|---|---|---|
| Admin Web Panel | School directors, secretaries, accountants | Full school management, configuration, reports |
| Teacher Mobile App | All teachers | Class management, homework, marks, messaging |
| Parent Mobile App | All parents/guardians | Monitor children, receive communications, chatbot |
| Student Mobile App | All students (ages 5-18) | View resources, homework, marks, messages |
| Super Admin Panel | You (the developer) | Multi-school SaaS management, billing, support |

### What the Platform Solves

| Current Problem | Our Solution |
|---|---|
| Marks communicated by paper or WhatsApp | Digital grade entry, review, and publication workflow |
| Homework assignments lost or forgotten | Homework posts with push notifications and due dates |
| Parents have no visibility into child's studies | Dedicated parent app with full academic dashboard |
| Administration drowns in paperwork | One-click report card generation, attendance tracking |
| No structured teacher-parent communication | Private dedicated chat channels per student |
| School knowledge is scattered | AI-powered RAG chatbot answering any question |
| No performance analytics for directors | Advanced analytics, risk detection, predictive alerts |

---

## 2. Market Opportunity

Algeria has over **3,000 private schools** with limited or no digital tools for school management. A well-executed SaaS product targeting this market at an affordable price point has massive potential.

- At 50 schools paying 15,000 DZD/month: **750,000 DZD/month (~5,500 USD)**
- Scaling to 200 schools: **22,000 USD/month with near-zero marginal cost**

### Revenue Projection

| Milestone | Schools | Avg Monthly/School | Total Monthly Revenue |
|---|---|---|---|
| 6 months (pilot phase) | 3-5 schools | 0 DZD (free pilots) | Testimonials & learning |
| 12 months | 15 schools | 18,000 DZD | 270,000 DZD (~2,000 USD) |
| 18 months | 50 schools | 19,000 DZD | 950,000 DZD (~7,000 USD) |
| 24 months | 120 schools | 20,000 DZD | 2,400,000 DZD (~17,500 USD) |
| 36 months | 300 schools | 22,000 DZD | 6,600,000 DZD (~48,000 USD) |

---

## 3. Platform Overview & Architecture

### 3.1 System Architecture

```
CLIENTS
  Admin Web (React) | Teacher App (Flutter) | Parent App (Flutter) | Student App (Flutter)
                                    |
                              NGINX (Reverse Proxy + SSL)
                           /                              \
                Django + Daphne                    FastAPI Chatbot
                (REST API + WebSocket)             (RAG + LLM Service)
                           |                              |
          PostgreSQL | Redis | Qdrant | Elasticsearch (Data Layer)
                           |
                    Celery Workers
          (PDF | Bulk Import | Push Notifications)
```

### 3.2 Multi-Tenant Architecture

One deployment serves all schools. Each school's data is completely isolated. When a new school subscribes, a new tenant is created — no new servers, no new deployments. Schools can never see each other's data under any circumstances.

---

## 4. Algerian Educational System Reference

### 4.1 Primary School (Ecole Primaire) — 6 Years

| Year | Name | Grade Scale | Pass Threshold | End Exam |
|---|---|---|---|---|
| Year 0 | CP1 (Preparatory) | /10 | 5/10 | - |
| Year 1 | 1AP | /10 | 5/10 | - |
| Year 2 | 2AP | /10 | 5/10 | - |
| Year 3 | 3AP | /10 | 5/10 | - |
| Year 4 | 4AP | /10 | 5/10 | - |
| Year 5 | 5AP | /10 | 5/10 | **BEP (National Exam)** |

**Subjects by year:**

| Subject | CP1 | 1AP | 2AP | 3AP | 4AP | 5AP |
|---|---|---|---|---|---|---|
| Arabic Language | YES | YES | YES | YES | YES | YES |
| Mathematics | YES | YES | YES | YES | YES | YES |
| Islamic Education | YES | YES | YES | YES | YES | YES |
| Civic Education | YES | YES | YES | YES | YES | YES |
| Artistic Education | YES | YES | YES | YES | YES | YES |
| Physical Education | YES | YES | YES | YES | YES | YES |
| French Language | NO | NO | NO | YES | YES | YES |
| History & Geography | NO | NO | NO | NO | YES | YES |
| Natural Sciences | NO | NO | NO | NO | YES | YES |

### 4.2 Middle School (CEM) — 4 Years

| Year | Name | Grade Scale | Pass Threshold | End Exam |
|---|---|---|---|---|
| Year 1 | 1AM | /20 | 10/20 | - |
| Year 2 | 2AM | /20 | 10/20 | - |
| Year 3 | 3AM | /20 | 10/20 | - |
| Year 4 | 4AM | /20 | 10/20 | **BEM (National Exam)** |

**Subjects (all years):** Arabic, Mathematics, Islamic Education, Civic Education, French, English, History, Geography, Natural Sciences, Physics, Technology, Physical Education, Artistic Education

### 4.3 High School (Lycee) — 3 Years

| Year | Name | Grade Scale | Pass Threshold | End Exam |
|---|---|---|---|---|
| Year 1 | 1AS (Common Core) | /20 | 10/20 | - |
| Year 2 | 2AS (Specialized) | /20 | 10/20 | - |
| Year 3 | 3AS (Specialized) | /20 | 10/20 | **BAC (National Exam)** |

**Specialization Streams (2AS & 3AS):**

| Stream | Key Subjects |
|---|---|
| Sciences | Advanced Math, Physics, Natural Sciences |
| Mathematics | Advanced Math, Physics |
| Technical Mathematics | Math, Physics, Technology |
| Literature & Philosophy | Philosophy, Arabic Literature, History |
| Foreign Languages | French, English, other languages |
| Management & Economics | Economics, Accounting, Law, Management |

### 4.4 Academic Year & Grading

The school year is divided into **3 trimesters** (September to June).

Each trimester includes: Continuous Assessment, First Test, Second Test, Final Exam.

**Default exam weighting (configurable per school):**

| Component | Default Weight |
|---|---|
| Continuous Assessment | 20% |
| First Test | 20% |
| Second Test | 20% |
| Final Exam | 40% |

**Grade formula:**

```
Trimester Average = Sum(Subject Grade x Coefficient) / Sum(Coefficients)
Yearly Average = (Trimester1 + Trimester2 + Trimester3) / 3
```

> All weights and coefficients MUST be configurable from the admin panel. Private schools may use different internal policies.

---

## 5. Algerian Legal & Regulatory Compliance

Since private schools operate under the authority of the Ministry of National Education, the app must support legal compliance.

### 5.1 Official Exam Tracking

Schools must prepare students for: **BEP (5AP)**, **BEM (4AM)**, **BAC (3AS)**.

Required features:
- Official exam preparation tracking per student
- Mock exam management (mock BEM, mock BAC)
- BAC candidate status tracking and stream assignment
- Export of student data in **official Ministry format** (Excel template matching Algerian requirements)
- Pre-exam performance report per student

### 5.2 Long-Term Archiving Requirements

Algerian schools are legally required to keep student academic records and attendance records for multiple years.

Required features:
- **Long-term academic archiving** (minimum 5-10 years of data retention)
- **"Graduated" student status**: read-only profile accessible after graduation — data never deleted
- **"Transferred" student status**: data locked but accessible for reference
- **Secure exportable archives**: ZIP backup per academic year, downloadable by admin
- **Archive viewer**: search any past student by name, year, or student ID
- Automatic yearly archiving Celery task at end of academic year

---

## 6. User Roles & Hierarchy

```
SUPER_ADMIN (Developer / You)
    Creates and manages all School tenants
    Manages billing and subscriptions
    Can impersonate any school admin for support

SCHOOL_ADMIN
    Manages everything within their school
    Creates Teacher, Parent, and Student accounts
    Multiple admin accounts allowed (different devices/secretaries)

SECTION_ADMIN (Optional for large combined schools)
    Admin limited to one section (Primary only, etc.)
    Cannot access data from other sections

TEACHER
    Assigned to specific subjects and classes
    Only sees data for their assigned classes
    Submits grades to admin for review and publication

PARENT
    Can have MULTIPLE children linked to their account
    Switches between children's profiles in the app
    Receives data only about their own children

STUDENT
    Belongs to one class
    Age-adaptive interface based on school level
    Can only see their own data
```

### Permission Matrix

| Action | Super Admin | School Admin | Section Admin | Teacher | Parent | Student |
|---|---|---|---|---|---|---|
| Create school tenant | YES | NO | NO | NO | NO | NO |
| Create admin accounts | YES | NO | NO | NO | NO | NO |
| Create teacher accounts | NO | YES | YES | NO | NO | NO |
| Create student/parent accounts | NO | YES | YES | NO | NO | NO |
| Post announcements | NO | YES | YES | NO | NO | NO |
| Enter grades | NO | NO | NO | YES | NO | NO |
| Publish grades | NO | YES | YES | NO | NO | NO |
| Post homework | NO | NO | NO | YES | NO | NO |
| View child's grades | NO | NO | NO | NO | YES | NO |
| View own grades | NO | NO | NO | NO | NO | YES |
| Generate report cards | NO | YES | YES | NO | NO | NO |
| View analytics dashboard | NO | YES | YES | NO | NO | NO |
| File discipline report | NO | YES | YES | YES | NO | NO |
| Build timetable | NO | YES | YES | NO | NO | NO |

---

## 7. Authentication & Account Management

### 7.1 Core Principle

> Nobody self-registers. Every account is created by a higher authority in the hierarchy. The school already verified every student and parent identity physically during enrollment. The system leverages that existing trust.

### 7.2 Account Creation Flow

```
You (Super Admin) creates School Admin accounts
  -> Delivered by email or direct handoff

School Admin creates Teacher accounts
  -> System generates temp password
  -> Delivered by SMS or printed sheet
  -> Teacher forced to change password on first login

School Admin creates Student + Parent accounts simultaneously
  -> Admin fills form: student name, DOB, class, parent phone
  -> System auto-creates linked Student AND Parent accounts
  -> Parent receives SMS with credentials
  -> Student receives printed card at school
  -> Both forced to change password on first login
```

### 7.3 One Parent - Multiple Children

When admin creates a student with a phone number that already exists in the system:

```
Phone 0555123456 already exists?
  YES -> Link new student to existing Parent account (no duplicate)
  NO  -> Create new Parent account, link to this student
```

The parent sees a **child switcher** on their home screen. Each child's data is completely separate.

Additionally, both father and mother can each have their own parent account linked to the same student, by registering with different phone numbers.

### 7.4 Bulk Import

Admin downloads Excel template -> fills with student + parent data -> uploads -> Celery processes -> all accounts created -> parents notified by SMS.

**Excel Template Columns:**
```
student_first_name | student_last_name | date_of_birth | class_name | section
parent_first_name | parent_last_name | parent_phone | parent_email (optional)
second_parent_phone (optional)
```

### 7.5 Authentication Features

- JWT access tokens (15-min expiry) + refresh tokens (30-day expiry) with rotation
- `is_first_login` flag -> forced password change screen
- Biometric login (fingerprint / Face ID) after initial password setup
- PIN login (4-6 digit) for primary school students ages 5-11
- Account lockout after 5 failed attempts -> automatic unlock after 30 minutes
- Admin can remotely revoke any user's session from the admin panel

---

## 8. School Structure & Section Management

### 8.1 Flexible School Configuration

| School Type | Sections Active |
|---|---|
| Primary only | Primary |
| Middle only | Middle |
| High School only | High School |
| Primary + Middle | Primary + Middle |
| Middle + High | Middle + High School |
| Full school | Primary + Middle + High School |

Each section is managed independently with its own classes, teachers, subjects, grading scale, streams, and configuration.

### 8.2 Core Models (Python/Django)

```python
class School(Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=200)
    logo = ImageField()
    address = TextField()
    phone = CharField()
    subdomain = CharField(unique=True)
    subscription_plan = CharField()
    subscription_active = BooleanField(default=True)

class Section(Model):
    TYPES = [('PRIMARY', 'Ecole Primaire'), ('MIDDLE', 'CEM'), ('HIGH', 'Lycee')]
    school = ForeignKey(School)
    section_type = CharField(choices=TYPES)
    name = CharField()
    is_active = BooleanField(default=True)
    class Meta:
        unique_together = ['school', 'section_type']

class AcademicYear(Model):
    school = ForeignKey(School)
    section = ForeignKey(Section)
    name = CharField()   # "2025-2026"
    start_date = DateField()
    end_date = DateField()
    is_current = BooleanField(default=True)

class Class(Model):
    section = ForeignKey(Section)
    academic_year = ForeignKey(AcademicYear)
    name = CharField()        # "3AP-A", "1AM-B", "2AS-Sciences"
    level = CharField()       # "3AP", "1AM", "2AS"
    stream = CharField(null=True)  # "Sciences", "Math" (High School only)
    homeroom_teacher = ForeignKey(User, null=True)
    max_students = IntegerField(default=35)
```

---

## 9. Feature Specification — Admin Panel

The admin panel is a **React.js web application** accessible from any browser, designed for non-technical users.

### 9.1 Dashboard

- Live statistics: students per section, active teachers, pending grade submissions, unread messages
- Risk alert panel: students flagged as at-risk (see Section 13)
- Quick action buttons: Post announcement, Add student, Generate report cards
- Recent activity feed with full audit trail
- Academic calendar widget

### 9.2 School Configuration

- Edit school profile: name, logo, address, contacts, motto
- Activate/deactivate sections
- Configure academic year: trimester dates, holidays, events
- Set grading weights per section (Continuous %, Test 1 %, Test 2 %, Final %)
- Configure working days and school hours

### 9.3 User Management

**Teachers:** add, edit, assign to subjects and classes, deactivate, bulk import via Excel

**Students & Parents:**
- Add student with automatic parent account creation
- Search by name, class, section, or student ID
- View full profile: personal info, class, all grades history, attendance, discipline record
- Transfer student to different class (logged with reason and date)
- Link additional parent to a student (father + mother both registered)
- Deactivate at year end -> student enters "graduated" or "transferred" archive status
- Bulk import via Excel

### 9.4 Grade Management

**Grade flow:**
```
Teacher enters grades (draft)
  -> Teacher submits to admin
    -> Admin reviews
      -> Admin publishes
        -> Instantly visible to student and parent
```

Admin functions:
- View all pending grade submissions filtered by section/class/subject/trimester
- Pre-calculated averages shown before publishing
- Add reviewer comments, publish or reject (with note back to teacher)
- Full audit trail: who entered, who published, timestamps
- Bulk publish all grades for a trimester

### 9.5 Report Card Generation

- Individual student report card -> formatted PDF (one click)
- Entire class report cards -> ZIP file
- Entire school report cards -> ZIP file (Celery background task)
- Report card contains: student info, photo, class, all subjects + grades + coefficients, trimester average, yearly average, class rank, teacher comments, director signature field
- Customizable design per school (logo, colors, footer text)

### 9.6 Attendance Management

- Real-time dashboard: daily absence summary per class
- Absence justification workflow: parent submits -> admin approves/rejects
- Monthly and yearly attendance reports per student
- Configurable absence alert threshold
- Automatic parent push notification on absence

### 9.7 Announcement & News System

- Rich text editor with images, attachments, links
- Target audience: all users / parents only / students only / teachers only / specific section / specific class
- Schedule announcements for future publication
- Pin important announcements
- Read receipt tracking

### 9.8 Financial Module (Optional/Premium)

- Configure fees per section per academic year
- Payment tracking per student (paid / partial / unpaid)
- Payment receipt generation (PDF)
- Monthly revenue reports
- Payment reminder push notifications to parents
- Excel export of financial data

### 9.9 Long-Term Archive Access

- Search and view any past student (graduated, transferred) by name or year
- View historical report cards, grades, attendance -- read only
- Download archive ZIP per academic year
- Ministry export: generate official student data file in Ministry-required format

---

## 10. Feature Specification — Teacher App

### 10.1 Home Dashboard

- Today's schedule with class times
- Pending tasks: unsubmitted grades, homework with upcoming due dates
- Recent messages requiring response
- Quick actions: Post homework, Enter grades, Upload resource

### 10.2 My Classes

- List of assigned classes and subjects with photos of each student
- Full student list per class for easy identification

### 10.3 Homework & Task Management

- Create homework: title, description, due date, file attachments (PDF, images, Word, video links)
- Target specific class or subject within a class
- Edit/delete before students view it
- Mark homework as "corrected and returned"
- Read receipts: see which students have viewed the post

### 10.4 Course Resources

- Upload materials: PDFs, PowerPoints, images, Word docs, video links
- Organize by subject and chapter/unit
- Instantly available to all students in the class
- Set as free or premium
- View download statistics per resource

### 10.5 Grade Entry

- Select class -> subject -> trimester -> exam type
- Enter grades for all students in a clean list
- /10 or /20 scale applied automatically based on section
- Save as draft, review, then submit to admin
- View status of previous submissions: pending / published / returned with comment

### 10.6 Attendance Marking

- Mark attendance at session start: Present / Absent / Late
- Add optional note per student
- Admin and parents notified automatically

### 10.7 Teacher-Parent Private Chat

- Select student -> dedicated private chat with that student's parent(s)
- Text, images, PDF attachments
- Pre-written message templates: academic concern, positive feedback, absence follow-up, behavior
- Full conversation history for the academic year

### 10.8 Teacher-Class Broadcast

- Send message to all students in a class simultaneously
- Students receive as push notification + in-app message

### 10.9 Student Questions Inbox

- Students send course questions to teacher
- Organized inbox by class and subject
- Reply with text, images, or explanations
- Mark questions as answered

---

## 11. Feature Specification — Parent App

### 11.1 Child Switcher

Prominently displayed at the top of the home screen for parents with multiple children. All data updates immediately when switching between children. A parent can have children in different sections (e.g., one in Primary, one in Middle).

### 11.2 Home Dashboard

- Current trimester average (large, prominently displayed)
- Recent marks, attendance status, upcoming homework due dates
- Unread messages from teachers
- Latest school announcement and next school event
- Risk alert: if child's average drops below passing threshold

### 11.3 Academic Monitoring

**Grades:**
- All published marks per subject per trimester
- Trimester average with class average for comparison
- Yearly average and class rank
- Performance graph: progress per subject across trimesters
- Color coding: green (above average), orange (at risk), red (below passing)

**Report Cards:**
- View, download, and share as PDF
- Push notification when published

**Homework & Resources:**
- View all homework assignments with due dates
- Browse course materials uploaded by teachers

### 11.4 Attendance

- Color-coded calendar view
- Submit absence justification with photo attachment (doctor's note)
- Push notification immediately when child marked absent

### 11.5 Communication

- Private chat with homeroom teacher and subject teachers
- School announcements and event calendar
- Payment reminders and emergency alerts

### 11.6 AI Chatbot

The chatbot answers questions in Arabic, French, and English. Examples:

- "Quelle est la moyenne de mon fils ce trimestre ?"
- "Does my daughter have homework due this week?"
- "How can I help my child improve in Mathematics?"
- "When does the winter holiday start?"

The chatbot only reads data, never modifies anything. Falls back to "Please contact the school administration" for questions it cannot answer.

### 11.7 Premium Features

- Weekly auto-generated digest: grades received, homework, attendance summary
- Detailed academic analytics with performance trends
- Parent education library: articles and videos on study habits, exam preparation, BAC stress management

---

## 12. Feature Specification — Student App

### 12.1 Age-Adaptive Interface

| Section | Age | Interface Mode |
|---|---|---|
| Primary | 5-11 years | Large buttons, icons with labels, bright colors, minimal text, simple navigation |
| Middle | 11-15 years | Standard app layout, full features, guided navigation |
| High School | 15-18 years | Full interface, detailed statistics, calendar view |

### 12.2 Academic Features

- View all homework with due dates, descriptions, and attached files
- Download course resources organized by subject and chapter
- View published marks and report cards (/10 for Primary, /20 for Middle/High)
- View trimester averages, yearly average, and personal timetable

### 12.3 Student AI Chatbot

Personalized to the individual student:
- "Do I have any homework due tomorrow?"
- "What is my average in Arabic this trimester?"
- "When is the next exam?"
- Student can only query their own data

### 12.4 Communication

- Send questions to subject teachers
- Receive teacher broadcast messages
- Receive school and class announcements

---

## 13. Advanced Academic Analytics

Directors love statistics. This is one of the most powerful selling points.

### 13.1 School-Level Analytics

- Average per subject across all classes
- Pass/fail rate per class and per section
- Performance comparison between classes of the same level
- Top 10 students per level and per section
- Teacher performance analytics: class averages per teacher (internal to admin only)
- Grade submission timeliness per teacher

### 13.2 Risk Detection (Automated)

- Students below 8/20 (or 4/10 for Primary) flagged automatically in the dashboard
- "This student is at risk of repeating the year" alert
- "Attendance dropped 30% this trimester" alert
- Students with 3+ consecutive absences flagged for follow-up
- Subject-specific weakness detection

### 13.3 Predictive Alerts

- System predicts end-of-year average based on current trimester performance
- Alert admin and parent when trajectory is negative
- Alert when student's performance suddenly drops significantly between trimesters

### 13.4 Automatic Notifications (Triggered by Analytics)

- Parent notification when child's average falls below configured threshold
- Parent notification when child has 3 consecutive absences
- Director notification when a class average is significantly below school average

### 13.5 Exportable Reports

- Downloadable Excel reports per trimester: class averages, subject averages, pass/fail counts
- Year-end comparison: this year vs last year performance per class
- Ministry-compatible export format for official reporting

---

## 14. Timetable & Scheduling Engine

This saves hours of manual work for administration every academic year.

### 14.1 Timetable Builder

- Drag-and-drop interface in the admin panel
- Define time slots (days, hours)
- Assign teacher + subject + class + classroom to each slot
- **Conflict detection**: real-time alert if a teacher is double-booked
- **Classroom conflict detection**: alert if same room assigned to two classes
- Teacher availability configuration: mark which hours a teacher is unavailable
- Substitute teacher assignment when a teacher is absent

### 14.2 Timetable Output

- Students and parents see their class timetable in the app (read-only)
- Teachers see their personal teaching schedule
- Admin can export any timetable as formatted PDF (for printing and posting on classroom doors)
- Push notification to students when timetable is modified

---

## 15. Discipline & Behavior Module

A major selling point for school directors.

### 15.1 Behavior Tracking

- Per-student behavior record: **Good** / **Warning** / **Serious**
- Incident reports filed by teachers or admin, with date, description, severity, and filed-by fields
- Parent notification for every Warning or Serious incident
- Accumulated warning system: when a student reaches X warnings in a trimester, automatic alert to admin and parent

### 15.2 Disciplinary Records

- Full discipline history per student accessible to admin
- Printable disciplinary record (PDF) for formal parent meetings
- Disciplinary record included in graduated student archive (long-term retention)
- Admin can add resolution notes to each incident

### 15.3 Behavior in Report Cards

- Admin can optionally include a conduct grade in the report card
- Configurable: some schools include it as a subject with coefficient, others as a separate section

---

## 16. Grading System Design

### 16.1 Grade Model

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
    value = DecimalField(max_digits=4, decimal_places=2)   # e.g., 14.50
    max_value = DecimalField()   # 10.00 or 20.00 based on section
    status = CharField(choices=STATUS, default='DRAFT')
    submitted_by = ForeignKey(User)
    submitted_at = DateTimeField(null=True)
    reviewed_by = ForeignKey(User, null=True)
    published_at = DateTimeField(null=True)
    admin_comment = TextField(blank=True)

class TrimesterConfig(Model):
    school = ForeignKey(School)
    section = ForeignKey(Section)
    continuous_weight = DecimalField(default=0.20)
    test1_weight = DecimalField(default=0.20)
    test2_weight = DecimalField(default=0.20)
    final_weight = DecimalField(default=0.40)
```

### 16.2 Calculation Rules

- All averages computed server-side, never on the client
- Grades are **immutable once published** -- amendments create a new record, old one is archived
- Class rank computed at publication time and stored as a snapshot
- Coefficient weighting applies at trimester average level

---

## 17. Messaging & Communication System

### 17.1 Chat Room Types

| Room Type | Participants | Purpose |
|---|---|---|
| TEACHER_PARENT | 1 teacher + 1-2 parents of specific student | Formal private communication about that student |
| TEACHER_STUDENT | 1 teacher + 1 student | Course questions |
| CLASS_BROADCAST | Teacher -> all students in a class | Class-wide announcements |
| ADMIN_PARENT | Admin + specific parent | Administrative matters |
| ADMIN_BROADCAST | Admin -> all users / specific group | School-wide announcements |

### 17.2 Real-Time Architecture

```
Flutter/React Client
  -> WebSocket (Django Channels)
    -> Redis Channel Layer
      -> Message stored in PostgreSQL
        -> FCM Push Notification (if recipient offline)
```

### 17.3 Message Templates

Pre-written in Arabic and French, configurable per school:
- Academic concern, positive feedback, absence follow-up, behavior report, exam results, parent meeting request

---

## 18. RAG Chatbot System

### 18.1 Architecture

```
User Question (Arabic / French / English)
  |
FastAPI Chatbot Service
  |
  |-- Static question? -> Semantic search in Qdrant
  |     -> Retrieve top-K chunks from school knowledge base
  |     -> Inject into LLM prompt
  |
  |-- Dynamic question? -> Query Django REST API
        -> Retrieve: grades, homework, attendance (live)
        -> Inject as structured context into LLM prompt
  |
LLM (Groq / llama-3.3-70b) -> Natural Language Answer
```

### 18.2 Knowledge Base (Per School)

**Static (managed by admin):**
- School name, address, contacts, opening hours
- Academic calendar, exam periods, holidays
- Teacher directory: names, subjects
- School rules, FAQ, fee structure

**Dynamic (live from database):**
- Student grades (authenticated user's child only)
- Homework and assignments
- Attendance records
- Upcoming events

### 18.3 Example Chatbot Questions

**Parent chatbot:**
- "Quelle est la moyenne de mon fils ce trimestre ?"
- "Does my daughter have homework due this week?"
- "How can I help my child improve in Mathematics?"

**Student chatbot:**
- "Do I have any homework due tomorrow?"
- "What is my average in Arabic this trimester?"
- "When is the next exam?"

### 18.4 Safety Guardrails

```
System prompt rules:
1. Only answer questions about this school and the authenticated user.
2. Never reveal information about other students.
3. Never modify data -- read-only.
4. Fall back to "Please contact administration" for unknown questions.
5. Respond in the same language the user writes in.
```

### 18.5 Cost Estimation

GPT-4o mini: ~$0.00015 per 1K tokens. Typical query: ~1,500 tokens = $0.000225. At 10,000 queries/month per school -> **under $3/school/month**. Completely negligible.

### 18.6 Multilingual Support

The `paraphrase-multilingual-mpnet-base-v2` embedding model handles Arabic, French, and English in the same vector space. The LLM responds in whatever language the user writes in.

---

## 19. Premium Content & Payment System

### 19.1 Premium Content for Students

| Content Type | Description | Target Level |
|---|---|---|
| Video Lessons | Teacher-recorded chapter explanations, rewatchable at home | All levels |
| Interactive Exercises | Auto-corrected quizzes with instant feedback | All levels |
| Past Exam Papers | BEP, BEM, BAC past papers with model answers | 5AP, 4AM, 3AS |
| Revision Summary Sheets | Teacher-prepared condensed chapter notes | Middle & High |
| Oral Comprehension | Audio exercises for French & English | All levels |
| Gamified Learning Modules | Math & language exercises as mini-games with points | Primary (5-11) |

### 19.2 Premium Content for Parents

| Content Type | Description |
|---|---|
| Weekly Child Reports | Auto-generated digest: grades, homework, attendance |
| Detailed Analytics | Performance trends, subject breakdown, class comparison |
| Parent Education Library | Articles/videos on study habits, exam prep, BAC stress management, discipline guidance |
| Priority Chatbot | More detailed and personalized AI responses |

### 19.3 Revenue Model

```
School Admin configures premium content -> sets price
Parent pays (via app or cash at school)
Admin confirms payment -> System unlocks access
School keeps 90% / Platform fee: 10%
```

### 19.4 Payment Integration (Algeria)

**MVP Phase 1 -- Manual confirmation:**
- Parent pays via bank transfer / CIB card / cash at school
- Admin marks as confirmed in admin panel -> access unlocked automatically

**Phase 2 -- Semi-automatic:**
- Integration with Baridimob or SATIM CIB online payment gateway

---

## 20. Student Gamification

For primary school students (ages 5-11), gamification increases engagement and makes parents willing to pay for the platform.

### 20.1 Features

- **Points system**: earn points for completed homework, quizzes, or exercises
- **Badges**: "Math Star", "Reading Champion", "Perfect Attendance", "Science Explorer"
- **Class leaderboard**: friendly ranking within the class (configurable -- can be disabled)
- **Reward certificates**: auto-generated printable certificate at badge milestones
- **Level progression**: Beginner -> Explorer -> Champion -> Master
- **Weekly challenge**: special exercise posted every Monday with bonus points

### 20.2 Impact

Transforms the student app from a "homework reminder" into something children want to open every day. Gives parents a reason to pay for premium content.

---

## 21. Multi-Branch Support

Some private school groups in Algeria operate multiple campuses under the same brand.

### 21.1 Branch Architecture

```
School Group (e.g., "Groupe Scolaire El Fath")
  |-- Branch A: Blida Campus
  |     |-- Primary Section
  |     |-- Middle Section
  |-- Branch B: Medea Campus
  |     |-- High School Section
  |-- Central Director View (sees all branches)
```

### 21.2 Features

- Branch entity under School (School -> Branch -> Section -> Class)
- Branch-specific users: each campus has its own admins and teachers
- Branch-specific reporting
- Central director dashboard: aggregate statistics across all branches
- Cross-branch student transfer with full record migration

### 21.3 Business Model

Multi-branch is a **premium tier** feature. A school group with 3 campuses pays more than a single-campus school. This is a natural upsell opportunity.

---

## 22. Database Schema & Models

### 22.1 Complete Model Map

```
School (tenant root)
  |-- Branch (optional, for multi-campus groups)
  |-- Section (PRIMARY / MIDDLE / HIGH)
  |     |-- AcademicYear
  |     |     |-- Class
  |     |     |     |-- Subject -> Grade -> TrimesterConfig
  |     |     |     |-- HomeworkPost
  |     |     |     |-- Resource
  |     |     |-- Timetable -> TimetableSlot
  |     |-- TrimesterConfig
  |-- User
  |     |-- StudentProfile
  |     |     |-- ParentProfile (M2M - multiple parents per student)
  |     |     |-- Attendance
  |     |     |-- DisciplineRecord
  |     |     |-- PremiumAccess
  |     |     |-- GamificationProfile (points, badges, level)
  |     |-- TeacherProfile
  |     |-- AdminProfile
  |-- Announcement
  |-- SchoolEvent
  |-- ChatRoom -> Message -> MessageRead
  |-- Notification
  |-- PremiumContent -> PremiumAccess
  |-- ChatbotKnowledge (RAG documents, per-school namespace in Qdrant)
  |-- AcademicArchive (graduated/transferred students, read-only)
```

### 22.2 Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Primary keys | UUID everywhere | Prevents enumeration attacks |
| Deletes | Soft delete only | Legal archiving requirement -- never hard delete student data |
| Audit trail | created_by, created_at, updated_by, updated_at on all models | Legal requirement + accountability |
| Grade history | Immutable once published | Amendments create new record; original preserved |
| Tenant isolation | school FK on every model, enforced at ViewSet level | Never trusted from client |
| Archive | Separate AcademicArchive model | Past students locked as read-only but always accessible |

---

## 23. API Design

### 23.1 Versioning

```
Base URL: https://api.educonnect.dz/api/v1/
```

All endpoints prefixed `/api/v1/`. Breaking changes go to `/api/v2/` without breaking existing app versions.

### 23.2 Tenant Isolation Pattern

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

### 23.3 Key Endpoint Groups

**Auth:**
```
POST   /api/v1/auth/login/
POST   /api/v1/auth/refresh/
POST   /api/v1/auth/change-password/
POST   /api/v1/auth/logout/
```

**Users:**
```
POST   /api/v1/users/students/               <- auto-creates parent account
POST   /api/v1/users/students/bulk-import/
GET    /api/v1/users/parents/{id}/children/
PATCH  /api/v1/users/{id}/deactivate/
```

**Grades:**
```
POST   /api/v1/grades/                       <- teacher submits (batch)
GET    /api/v1/grades/pending/               <- admin reviews
PATCH  /api/v1/grades/{id}/publish/
PATCH  /api/v1/grades/{id}/return/
GET    /api/v1/students/{id}/grades/
GET    /api/v1/students/{id}/averages/
GET    /api/v1/analytics/class/{id}/
GET    /api/v1/analytics/section/{id}/risks/
```

**Timetable:**
```
GET    /api/v1/timetable/class/{id}/
POST   /api/v1/timetable/slots/
GET    /api/v1/timetable/conflicts/
GET    /api/v1/timetable/export/{class_id}/  <- PDF export
```

**Discipline:**
```
POST   /api/v1/discipline/incidents/
GET    /api/v1/discipline/students/{id}/
PATCH  /api/v1/discipline/incidents/{id}/resolve/
```

**Archive:**
```
GET    /api/v1/archive/students/
GET    /api/v1/archive/students/{id}/
POST   /api/v1/archive/export/{academic_year_id}/
GET    /api/v1/archive/ministry-export/{class_id}/
```

**Chat:**
```
GET    /api/v1/chat/rooms/
POST   /api/v1/chat/rooms/{id}/messages/
WS     /ws/chat/{room_id}/
```

**Chatbot:**
```
POST   /api/v1/chatbot/query/
GET    /api/v1/chatbot/history/
POST   /api/v1/chatbot/knowledge/            <- admin uploads knowledge doc
```

---

## 24. Technology Stack

### 24.1 Backend

| Technology | Purpose |
|---|---|
| Python 3.12+ | Language |
| Django 5.x | Main framework |
| Django REST Framework 3.15+ | REST API |
| Django Channels 4.x | WebSocket / real-time chat |
| Celery 5.x | Background tasks |
| FastAPI 0.115+ | Chatbot microservice |
| Daphne 4.x | ASGI server for Django |
| Uvicorn 0.32+ | ASGI server for FastAPI |

### 24.2 Databases & Storage

| Technology | Purpose |
|---|---|
| PostgreSQL 16 + pgvector | Primary relational database |
| Redis 7 | Cache, sessions, Celery broker, Django Channels |
| Qdrant | Vector DB for RAG chatbot (per-school namespace) |
| Elasticsearch | Full-text search for students, announcements |
| AWS S3 / Cloudflare R2 | File storage (R2 is cheaper, no egress fees) |

### 24.3 AI / ML

| Technology | Purpose |
|---|---|
| Groq API (llama-3.3-70b) | LLM for chatbot (fast and cheap) |
| paraphrase-multilingual-mpnet-base-v2 | Multilingual embeddings (Arabic, French, English) |
| LangChain | RAG pipeline orchestration |

### 24.4 Mobile (Flutter)

| Package | Purpose |
|---|---|
| flutter_bloc / riverpod | State management |
| dio | HTTP client with token refresh interceptor |
| firebase_messaging | Push notifications (FCM) |
| hive / sqflite | Local caching for offline mode |
| flutter_local_notifications | In-app notifications |
| web_socket_channel | WebSocket for real-time chat |
| cached_network_image | Image loading and caching |
| flutter_pdfview | In-app PDF viewer |
| easy_localization | AR / FR / EN + RTL support |

### 24.5 Admin Panel (React)

| Package | Purpose |
|---|---|
| React 18 + TypeScript | Framework |
| Ant Design | UI component library |
| Recharts | Academic charts and graphs |
| React Query | Server state management |
| i18next | Multilingual + RTL |

### 24.6 Infrastructure

| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy, SSL, static files |
| GitHub Actions | CI/CD pipeline |
| Sentry | Error monitoring |
| Firebase Cloud Messaging | Push notifications |
| Let's Encrypt | Free SSL certificates |
| Hetzner / DigitalOcean | Cloud hosting (best price for Algeria) |

---

## 25. Security & Data Protection

### 25.1 Authentication

- JWT access tokens: 15-min expiry; refresh tokens: 30-day expiry with rotation
- HTTPS enforced -- HTTP redirected to HTTPS via Nginx
- Rate limiting: 5 failed logins -> 30-minute lockout
- Passwords hashed with **argon2** (stronger than Django's default pbkdf2)
- Admin can remotely invalidate any user's all sessions

### 25.2 Data Isolation

- Every query filtered by `school` from JWT -- server-side, never client-side
- Section-level isolation for section admins and teachers
- Students cannot query other students' data
- Parents can only see their own linked children
- Discipline records only visible to admin and the involved teacher

### 25.3 File Security

- All files in private S3 buckets -- not publicly accessible
- Files served via signed URLs with 1-hour expiry
- MIME type + extension validation on every upload
- 20MB max per file (500MB for premium videos)

### 25.4 Infrastructure Security

- Database port 5432 NOT exposed to internet -- internal Docker network only
- Redis NOT exposed to internet
- All secrets in environment variables -- never in codebase or Git
- Daily automated database backups, retained 30 days
- CORS: only allow requests from registered origins

---

## 26. Multi-Tenancy Design

### 26.1 Isolation Strategy

Every school-scoped model has a `school` FK. All ViewSets inherit `TenantAwareViewSet`. Super admin sees all; every other role sees only their school.

### 26.2 Qdrant Namespace Isolation

```python
# Each school has its own isolated vector collection
collection_name = f"school_{school.id}_knowledge"
```

### 26.3 Super Admin Panel

- View all schools and subscription status
- Activate / deactivate any school instantly
- Create new school tenant with initial admin account
- Impersonate any school admin for support (fully logged in audit trail)
- Platform-wide usage statistics and revenue dashboard

---

## 27. Notifications System

### 27.1 Notification Triggers

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

### 27.2 Smart Notification Features

- **Notification categories**: Academic / Attendance / Behavior / Administrative / Messages
- **Customizable preferences**: users can enable/disable each category
- **Silent hours mode**: no push notifications between 10pm and 7am
- **Weekly digest**: optional weekly summary instead of individual notifications
- **Read receipts**: admin can see which users opened announcements

---

## 28. Offline Mode & Mobile Enhancements

Internet connectivity in Algeria can be unreliable. The apps must work under poor conditions.

### 28.1 Offline Capabilities

| Feature | Offline Behavior |
|---|---|
| View grades | Cached locally -- always accessible |
| View homework | Cached locally |
| View resources | Previously downloaded files accessible |
| Mark attendance (teacher) | Saved locally, synced when connection restored |
| Enter grades (teacher) | Draft saved locally, submitted when online |
| Send chat messages | Queued locally, sent when online |
| View announcements | Cached locally |

### 28.2 Implementation

- Use **Hive** (Flutter) for local key-value storage of cached data
- Background sync service runs when internet connection is restored
- Offline indicator shown in the UI when no internet detected
- Conflict resolution: check server state before syncing offline changes

---

## 29. File Storage & Media Management

### 29.1 File Categories & Limits

| Category | Access | Max Size |
|---|---|---|
| Homework attachments | Signed URL (1h expiry) | 20MB |
| Course resources (PDF/slides) | Signed URL (1h expiry) | 100MB |
| Premium content videos | Signed URL (1h expiry) | 500MB |
| Student photos | Signed URL (24h expiry) | 5MB |
| School logo | Public CDN URL | 2MB |
| Generated report cards (PDF) | Signed URL (1h expiry) | 10MB |
| Absence justifications | Signed URL (1h expiry) | 10MB |

### 29.2 Accepted File Types

- **Documents**: PDF, DOCX, PPTX, XLSX
- **Images**: JPG, PNG, WEBP
- **Videos**: MP4, MOV (premium content only)
- **Audio**: MP3, M4A (oral exercises only)

---

## 30. Performance & Scalability Engineering

Plan this from day one.

### 30.1 Database Strategy

- **Indexes**: on all FK columns, all filter columns, all order_by columns
- Critical indexes: `(school, student, trimester)` on Grade, `(school, class, date)` on Attendance
- **Read replicas**: add PostgreSQL read replica for analytics queries when load grows
- **Connection pooling**: use PgBouncer between Django and PostgreSQL

### 30.2 Caching Strategy

- **Redis caching**: grade dashboards (5-min cache), class averages (invalidated on new grade), school analytics (1-hour cache)
- **CDN (Cloudflare)**: serve all static files through CDN
- **API response caching**: cache expensive list endpoints for 2-5 minutes

### 30.3 Background Jobs

- All PDF generation via Celery (never blocks API requests)
- All bulk imports via Celery
- All push notifications dispatched via Celery
- Monitor Celery health via Flower dashboard

### 30.4 Rate Limiting Per Tenant

- Per-tenant API rate limits (e.g., max 1000 requests/minute per school)
- Per-user rate limits on chatbot queries (e.g., max 20 queries/hour)
- File upload rate limits

---

## 31. Disaster Recovery Plan

Schools will ask "What if your servers crash?" Have a clear, documented answer.

### 31.1 Backup Strategy

| Backup Type | Frequency | Retention | Location |
|---|---|---|---|
| PostgreSQL incremental | Every 6 hours | 7 days | Same region |
| PostgreSQL full dump | Daily | 30 days | Same region |
| PostgreSQL full dump | Weekly | 1 year | Different region |
| File storage (S3/R2) | Continuous versioning | 90 days | Built into S3/R2 |

### 31.2 Recovery Guarantees

- **RTO (Recovery Time Objective)**: 24 hours maximum to restore service
- **RPO (Recovery Point Objective)**: 6 hours maximum data loss
- Communicate this clearly to schools in the contract

### 31.3 Monitoring

- **UptimeRobot** (free) or Better Uptime for uptime monitoring with SMS/email alerts
- **Sentry**: catch all application errors in real time
- **Flower dashboard**: monitor Celery background job queue health
- Public status page where schools can check platform health

---

## 32. Business Model & Pricing

### 32.1 Pricing Plans

| Plan | Students | Monthly (DZD) | Annual (DZD) | Includes |
|---|---|---|---|---|
| Starter | Up to 100 | 30,000 DZD (~115$) | 300,000 DZD (~1,170$) | Core features, no chatbot, 5GB storage |
| Pro | Up to 300 | 50,000 DZD (~190$) | 485,000 DZD (~1,900$) | All features + premium content, no AI chatbot, 20GB storage |
| Pro + AI | 300+ students | 64,000 DZD (~250$) | 620,000 DZD (~2,500$) | All features + AI chatbot + unlimited storage + priority support + custom branding |

- **20% discount** for annual payment upfront
- **Multi-branch premium**: add 50% to plan price per additional campus
- **Premium content marketplace**: school earns 90%, platform takes 10%

---

## 33. Team Structure & Timeline

### 33.1 Minimum Viable Team

| Role | Responsibilities | Engagement |
|---|---|---|
| Backend Developer (You) | Django API, database, RAG chatbot, DevOps, admin panel API | Full-time |
| Flutter Developer | All 4 mobile apps, UI/UX implementation | Full-time |
| React Frontend Developer | Admin web panel, super admin panel | Full-time (first 6 months) |
| UI/UX Designer | Figma designs, user flows, design system, age-adaptive interfaces | Part-time / Freelance |
| QA Tester | Manual and automated testing across all 5 apps | Part-time (starts month 4) |

> Absolute minimum to start: you + one Flutter developer + part-time designer. Replace React admin with Django Admin (Jazzmin theme) for MVP if budget is tight.

### 33.2 Development Phases

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 0: Design & Architecture | 3-4 weeks | Figma designs, database schema, API contract, environment setup |
| Phase 1: Backend Foundation | 5-6 weeks | Auth, multi-tenant, core models, file storage, push notifications, WebSocket |
| Phase 2: Admin Panel MVP | 5-6 weeks | School setup, user management, grade publishing, announcement system |
| Phase 3: Teacher App | 4-5 weeks | Classes, homework, resources, grade entry, attendance, messaging |
| Phase 4: Parent & Student Apps | 5-6 weeks | Grade viewing, homework, attendance, chat, child switcher, age-adaptive UI |
| Phase 5: AI Chatbot | 3-4 weeks | RAG pipeline, Qdrant indexing, chatbot UI, multilingual testing |
| Phase 6: Advanced Features | 4-5 weeks | Analytics dashboard, timetable builder, discipline module, archiving |
| Phase 7: Polish & Testing | 4-5 weeks | Full QA, security audit, PDF generation, offline mode, Arabic RTL |
| Phase 8: Pilot Deployment | 2-3 weeks | Deploy with 1 real school, collect feedback, fix critical issues |
| Phase 9: App Store Launch | 2-3 weeks | App Store + Google Play submission, marketing website |

**Total with 3-4 people: 9-11 months**

---

## 34. Go-To-Market Strategy

The Algerian private school market is relationship-driven. Cold emails alone will not work.

| Phase | Strategy |
|---|---|
| Phase 1 - Pilots | Free 3-month pilot for 2-3 schools in your wilaya. Be physically present during onboarding. These become your case studies and references. |
| Phase 2 - Referrals | Go to every director that your pilot schools know. Offer referral discount: "Refer a school, get one month free." |
| Phase 3 - Events | Attend education fairs and teachers' union events. Create a 2-minute demo video. |
| Phase 4 - Online Presence | Landing page in Arabic and French with pricing, screenshots, and testimonials. |
| Phase 5 - Associations | Contact private school associations (federations des ecoles privees) in major wilayas for group deals. |

---

## 35. Critical Success Factors

- **User experience is everything**: test with real non-technical users before launch. If anyone struggles, you lose that school.
- **Offline support**: build offline-first from day one. Marks and homework must always be accessible.
- **Arabic & RTL support**: build RTL from day one, not as an afterthought.
- **Fast customer support**: WhatsApp response under 2 hours during school hours is your biggest competitive advantage.
- **Data migration**: the bulk import feature eliminates the biggest barrier to adoption.
- **Ship fast, learn fast**: MVP = Authentication + Grades + Homework + Announcements + Basic messaging. Get this in front of real schools immediately.

---

## 36. Features NOT to Build Yet

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

## 37. Hidden Technical Decisions

Decide these now before writing code. Changing them later is very painful.

| Decision | Recommendation | Reason |
|---|---|---|
| Soft delete vs hard delete | Soft delete always | Legal archiving requirement |
| Audit logging | Django signals writing to a separate AuditLog table | Full accountability |
| Row-level security | ORM-level isolation for now; PostgreSQL RLS as backup layer | Simpler to maintain |
| File size limits | Per file type (defined in Section 29) | Flexible and enforceable |
| Message retention policy | Per academic year -- archive at year end | Manageable storage costs |
| Maximum students per tenant | Cap by plan (100 / 300 / unlimited) -- enforced at account creation | Prevents abuse |
| Storage cost calculation | Flat by plan for simplicity in MVP | Easier billing |
| Grade decimal precision | 2 decimal places (e.g., 14.50/20) | Algerian school standard |
| Class rank visibility | Configurable per school | Some schools prefer not to show rank |
| UUID vs integer PKs | UUID -- prevents enumeration, better for multi-tenant | Security best practice |

---

## 38. Competitive Advantage Strategy

- **Perfect Arabic UX**: be the only product that feels native to Algerian schools
- **Physical presence**: be at the school during onboarding -- no competitor will do this
- **Free data migration**: offer to import existing student data for free
- **Fast WhatsApp support**: respond in under 2 hours during school hours
- **Emotional attachment**: when a parent sees their child's grade on their phone for the first time, they will demand their school keep using the app forever
- **Built for Algeria**: BEP, BEM, BAC tracking, coefficient-weighted averages, trimester structure -- not adapted from a foreign product
- **Relationships**: the Algerian school director community is small and interconnected -- one happy director is worth 10 future clients

---

## 39. Personal Action Plan

| Timeline | Action | Goal |
|---|---|---|
| Week 1-2 | Visit 3-5 private schools. Talk to directors, teachers, parents. Take notes on frustrations. | Validate the problem before building. |
| Week 3-4 | Hire or partner with a Flutter developer. Most critical hire. | Secure mobile development. |
| Week 5-6 | Commission UI/UX designer for Figma mockups (admin panel + parent app). | Define exactly what to build. |
| Week 7-8 | Set up Django project: multi-tenant, PostgreSQL, JWT auth, core models. No feature code yet. | Solid foundation first. |
| Week 9-14 | Build admin panel + teacher app. Priority: grade management -> homework -> announcements -> messaging. | Get to a demoable product fast. |
| Week 15-18 | Build parent app. A parent seeing their child's grade sells the product. | Create emotional impact. |
| Week 19-20 | Deploy to real server. Set up pilot school. Onboard them personally. | Real-world validation. |
| Month 6+ | Add student app, chatbot, analytics, timetable builder -- based on pilot feedback. | Feedback-driven expansion. |

> **The most important advice**: Give two schools a completely free subscription for 3-6 months. Be physically present at the school for the first week of onboarding. Sit with the director, the secretary, and two teachers and watch them use your app. Every moment of confusion they show you is worth more than any line of code you could write. Build what real schools need, not what you imagine they need.

---

## 40. Open Questions & Decisions Pending

| # | Question | Recommendation |
|---|---|---|
| 1 | Default admin panel language? | French first, Arabic in v2 |
| 2 | Can a student have more than 2 parent accounts? | Max 2 (father + mother) |
| 3 | Should teachers see other teachers' submitted grades? | No -- isolated by subject |
| 4 | Voice input for chatbot? | v2 feature |
| 5 | Class rank visible to students or parents only? | Configurable per school |
| 6 | Algerian SMS gateway? | Research local providers (cheaper, better delivery than Twilio) |
| 7 | Video hosting for premium content? | S3 for privacy and control |
| 8 | Should timetable builder detect teacher availability automatically? | Yes -- saves admin time |
| 9 | Should discipline incidents be visible to parents immediately or after admin review? | After admin review (professional control) |
| 10 | What format does the Ministry require for student data export? | Contact Ministry before building this feature |

---

## 41. Glossary

| Term | Definition |
|---|---|
| Tenant | A single school in the multi-tenant system |
| Section | A level division within a school (Primary / Middle / High) |
| Trimester | One of three academic periods in the Algerian school year |
| BEP | Brevet d'Enseignement Primaire -- Primary school final national exam (5AP) |
| BEM | Brevet d'Enseignement Moyen -- Middle school final national exam (4AM) |
| BAC | Baccalaureat -- High school final national exam (3AS), grants university access |
| Coefficient | Weight factor applied to a subject when calculating trimester averages |
| RAG | Retrieval-Augmented Generation -- AI technique powering the chatbot |
| FCM | Firebase Cloud Messaging -- service for mobile push notifications |
| JWT | JSON Web Token -- stateless authentication token format |
| DRF | Django REST Framework -- Django library for building REST APIs |
| RTL | Right-to-Left -- text direction for Arabic language |
| SaaS | Software as a Service -- subscription-based software business model |
| RTO | Recovery Time Objective -- max time to restore service after a failure |
| RPO | Recovery Point Objective -- max data loss acceptable in a failure event |
| Soft Delete | Mark a record as deleted without removing it from the database |
| Audit Trail | Log of all actions: who did what, when, and on which record |
| CDN | Content Delivery Network -- distributed servers for fast static file delivery |

---

*EduConnect Algeria -- Complete Product Conception & Technical Blueprint*  
*Version 2.0 -- February 2026 | Confidential*

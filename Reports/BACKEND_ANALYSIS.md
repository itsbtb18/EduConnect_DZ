# ILMI Backend — Comprehensive Code Analysis

> **Generated:** Full systematic analysis of `d:\WorkSpace\ECOLE\backend\`  
> **Framework:** Django 5.x + Django REST Framework  
> **Database:** PostgreSQL | **Cache/Broker:** Redis | **Async:** Celery + Channels  
> **Auth:** JWT (simplejwt) — `phone_number` as USERNAME_FIELD  
> **Architecture:** Multi-tenant (school-scoped) with UUID primary keys

---

## Table of Contents

1. [Infrastructure & Configuration](#1-infrastructure--configuration)
2. [Core Module](#2-core-module-backendcore)
3. [App: accounts](#3-app-accounts)
4. [App: schools](#4-app-schools)
5. [App: academics](#5-app-academics)
6. [App: grades](#6-app-grades)
7. [App: homework](#7-app-homework)
8. [App: announcements](#8-app-announcements)
9. [App: attendance](#9-app-attendance)
10. [App: chat](#10-app-chat)
11. [App: finance](#11-app-finance)
12. [App: canteen](#12-app-canteen)
13. [App: transport](#13-app-transport)
14. [App: library](#14-app-library)
15. [App: extracurricular](#15-app-extracurricular)
16. [App: discipline](#16-app-discipline)
17. [App: fingerprint](#17-app-fingerprint)
18. [App: notifications](#18-app-notifications)
19. [App: ai_chatbot](#19-app-ai_chatbot)
20. [Test Suite](#20-test-suite)
21. [Summary Statistics](#21-summary-statistics)

---

## 1. Infrastructure & Configuration

### 1.1 Settings (`ilmi/settings/`)

| File | Purpose |
|------|---------|
| `base.py` | Shared config — 17 local apps + 10 third-party, PostgreSQL, Redis cache, JWT (15min access / 30-day refresh), CORS, Channels/Redis, Celery/Redis, throttling (30/min anon, 120/min user), DjangoFilterBackend + SearchFilter + OrderingFilter, custom exception handler, French locale, Africa/Algiers timezone, WhiteNoise static files |
| `development.py` | DEBUG=True, console email, browsable API, debug toolbar, throttling disabled, local file storage |
| `production.py` | S3/Cloudflare R2 storage, SMTP email, Sentry SDK, full security headers (HSTS, SSL redirect), rotating file logging |

### 1.2 INSTALLED_APPS (third-party)

`rest_framework`, `rest_framework_simplejwt`, `rest_framework_simplejwt.token_blacklist`, `corsheaders`, `django_filters`, `channels`, `drf_spectacular`, `django_celery_beat`, `whitenoise`, `debug_toolbar` (dev only)

### 1.3 Main URL Router (`ilmi/urls.py`)

All apps mounted under `api/v1/`:

| Prefix | App |
|--------|-----|
| `api/v1/auth/` | accounts |
| `api/v1/schools/` | schools |
| `api/v1/academics/` | academics |
| `api/v1/grades/` | grades |
| `api/v1/homework/` | homework |
| `api/v1/announcements/` | announcements |
| `api/v1/attendance/` | attendance |
| `api/v1/chat/` | chat |
| `api/v1/finance/` | finance |
| `api/v1/canteen/` | canteen |
| `api/v1/transport/` | transport |
| `api/v1/library/` | library |
| `api/v1/extracurricular/` | extracurricular |
| `api/v1/discipline/` | discipline |
| `api/v1/fingerprint/` | fingerprint |
| `api/v1/notifications/` | notifications |
| `api/v1/ai/` | ai_chatbot |

Plus: health check (`/health/`), admin (`/admin/`), Swagger (`/api/docs/`), Redoc (`/api/redoc/`), debug toolbar (dev), media serving (dev).

### 1.4 Celery Beat Schedule (`ilmi/celery.py`)

| Task | Schedule |
|------|----------|
| `archive_academic_years` | September 1, 00:00 (crontab) |
| `weekly_parent_digest` | Every Sunday, 20:00 (crontab) |

### 1.5 Middleware

- **`TenantMiddleware`** (`core/middleware/tenant.py`): Attaches `request.school` from the authenticated user for every request, enabling multi-tenant isolation.

### 1.6 WebSocket Routing (`chat/routing.py`)

| Pattern | Consumer |
|---------|----------|
| `ws/chat/<conversation_id>/` | `ChatConsumer` (1:1 real-time chat) |
| `ws/room/<room_id>/` | `GroupChatConsumer` (group chat) |
| `ws/notifications/` | `NotificationConsumer` (live notifications) |

---

## 2. Core Module (`backend/core/`)

### 2.1 Abstract Base Models (`core/models.py`)

| Model | Fields | Purpose |
|-------|--------|---------|
| `TimeStampedModel` | `id` (UUID pk), `created_at`, `updated_at` | Base for all models |
| `AuditModel(TimeStampedModel)` | + `is_deleted`, `deleted_at`, `created_by` FK | Soft-delete + audit trail |
| `TenantModel(AuditModel)` | + `school` FK (School) | **Multi-tenant base** — all school-scoped models inherit this |

### 2.2 Permissions (`core/permissions.py`)

| Permission Class | Logic |
|-----------------|-------|
| `IsSuperAdmin` | `role == SUPER_ADMIN` |
| `IsSchoolAdmin` | `role in (SUPER_ADMIN, ADMIN, SECTION_ADMIN)` |
| `IsTeacher` | `role == TEACHER` |
| `IsParent` | `role == PARENT` |
| `IsStudent` | `role == STUDENT` |
| `IsAdminOrTeacher` | Admin or Teacher |
| `IsSameSchool` | Object-level — raises **404** on school mismatch (not 403) |

### 2.3 Mixins (`core/mixins.py`)

| Mixin | Purpose |
|-------|---------|
| `TenantAwareViewSetMixin` | Auto-scopes queryset to `user.school`, auto-assigns school on create |
| `TenantAwareModelViewSet` | Full CRUD ViewSet with tenant isolation |
| `TenantAwareReadOnlyViewSet` | Read-only ViewSet with tenant isolation |
| `TeacherOwnedMixin` | Auto-assigns `teacher` field to current user |
| `StudentFilterMixin` | Role-based filtering: student→own data, parent→children's data, teacher→assigned classes |

### 2.4 Tenant-Aware ViewSet (`core/viewsets.py`)

`TenantAwareViewSet(ModelViewSet)`: Enforces tenant isolation with `get_school()`, auto-stamps `school`, `created_by`, `updated_by` on create/update.

### 2.5 Tenant-Aware Serializer (`core/serializers.py`)

`TenantAwareSerializer(ModelSerializer)`: Auto-sets `school` + `created_by` on create, `updated_by` on update from request context.

### 2.6 Pagination (`core/pagination.py`)

| Class | Page Size | Max |
|-------|-----------|-----|
| `StandardResultsSetPagination` | 20 | 100 |
| `SmallResultsSetPagination` | 10 | 50 |
| `LargeResultsSetPagination` | 50 | 200 |

### 2.7 Utilities (`core/utils.py`)

- `generate_unique_code()` — random alphanumeric codes
- `get_current_academic_year()` — derives current school year
- `get_file_extension()`, `validate_file_type()`
- File extension constants for images, documents, etc.

### 2.8 Validators (`core/validators.py`)

`validate_file_size()`, `validate_document_file()`, `validate_image_file()`, `validate_homework_file()`, `validate_resource_file()`, `validate_excel_file()`

### 2.9 Exception Handler (`core/exceptions.py`)

`custom_exception_handler()` — wraps all DRF errors into standardized format:
```json
{"error": "...", "message": "...", "details": {...}, "status_code": 400}
```

### 2.10 Firebase Push (`core/firebase.py`)

- `send_push_notification(device_token, title, body, data)` — single-device FCM V1 API
- `send_push_to_multiple(tokens, title, body, data)` — multicast FCM (batches of 500)

### 2.11 QR Code Generator (`core/qr_generator.py`)

- `generate_qr_code(data)` → base64 PNG data URI
- `get_student_qr_data(student_profile)` → JSON with student info
- `get_teacher_qr_data(teacher_profile)` → JSON with teacher info

---

## 3. App: accounts

### 3.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User(AbstractBaseUser, PermissionsMixin)` | UUID pk, `first_name`, `last_name`, `phone_number` (unique, USERNAME_FIELD), `email`, `photo`, `role` (SUPER_ADMIN / ADMIN / SECTION_ADMIN / TEACHER / PARENT / STUDENT), `school` FK, `is_active`, `is_staff`, `is_first_login`, `created_by` FK, `created_at` | Custom `UserManager`. Auto-hashes plain-text passwords on save. |
| `ActivityLog` | `user` FK, `action` (CREATE/UPDATE/DELETE/LOGIN/EXPORT/OTHER), `resource`, `description`, `ip_address`, `metadata` JSON, `created_at` | Audit trail |
| `BulkImportJob` | `school` FK, `uploaded_by` FK, `file`, `status` (PENDING/PROCESSING/COMPLETED/FAILED), `total_rows`, `processed_rows`, `created_count`, `linked_count`, `error_count`, `error_rows` JSON, `celery_task_id` | Excel import tracking with `progress_pct` property |
| `PlatformConfig` | Singleton — `platform_name`, `default_language`, `maintenance_mode`, `allow_registration`, `max_schools`, SMTP/SMS/backup configured flags | Platform-wide settings |

### 3.2 Views

| View | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `LoginView` | POST | `auth/login/` | JWT login (phone_number + password) |
| `PINLoginView` | POST | `auth/login/pin/` | Student PIN login with rate-limiting (5 attempts / 30min lockout) |
| `TokenRefreshAPIView` | POST | `auth/refresh/` | Refresh JWT token |
| `LogoutView` | POST | `auth/logout/` | Blacklist refresh token |
| `UserListCreateView` | GET/POST | `auth/users/` | List/create users |
| `UserDetailView` | GET/PUT/PATCH/DELETE | `auth/users/<id>/` | User detail (soft-delete) |
| `ResetUserPasswordView` | POST | `auth/users/<id>/reset-password/` | Admin password reset |
| `MeView` | GET/PATCH | `auth/me/` | Current user profile |
| `ChangePasswordView` | POST | `auth/change-password/` | Self password change |
| `PlatformStatsView` | GET | `auth/platform-stats/` | Dashboard stats |
| `PlatformSettingsView` | GET/PUT | `auth/platform-settings/` | Platform config |
| `ActivityLogListView` | GET | `auth/activity-logs/` | Audit log list |
| `SystemHealthView` | GET | `auth/system-health/` | Health check |
| `BulkImportUploadView` | POST | `auth/students/bulk-import/` | Upload Excel for bulk import |
| `BulkImportProgressView` | GET | `auth/students/bulk-import/<id>/progress/` | Import progress |
| `BulkImportTemplateView` | GET | `auth/students/bulk-import/template/` | Download .xlsx template |

### 3.3 Serializers

`CustomTokenObtainPairSerializer` (adds role/school_id/is_first_login JWT claims + auto-rehash plain passwords), `UserSerializer`, `UserCreateSerializer`, `UserUpdateSerializer`, `ChangePasswordSerializer`, `ResetPasswordSerializer`, `PINLoginSerializer`, `SchoolMinimalSerializer`

### 3.4 Celery Tasks

| Task | Description |
|------|-------------|
| `bulk_import_students` | Processes Excel file row-by-row, creates students with auto-parent linking, tracks per-row progress |

### 3.5 Signals

| Signal | Trigger | Action |
|--------|---------|--------|
| `create_user_profile` | `post_save` on User | Auto-creates `StudentProfile` / `TeacherProfile` / `ParentProfile` based on role |

---

## 4. App: schools

### 4.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `School` | UUID pk, `name`, `logo`, `address`, `wilaya`, `phone`, `email`, `website`, `motto`, `subdomain` (unique), `school_category` (PRIVATE_SCHOOL / TRAINING_CENTER), `has_primary/middle/high` booleans, `available_streams` JSON, `training_type`, `subscription_plan` (STARTER/PRO/PRO_AI), subscription dates, `max_students`, `absence_alert_threshold`, `is_active`, `setup_completed` | Top-level tenant entity |
| `Section` | `school` FK, `section_type` (PRIMARY/MIDDLE/HIGH), `name` | unique_together (school, section_type) |
| `AcademicYear` | `school` FK, `section` FK (nullable), `name`, `start_date`, `end_date`, `is_current` | Unique constraints on school+year |

### 4.2 Views

| View | Description |
|------|-------------|
| `SchoolViewSet` | CRUD + custom actions: `my-school`, `profile`, `update-profile`, `complete-setup`, `upload_logo` |
| `AcademicYearViewSet` | CRUD with idempotent create |
| `SectionViewSet` | CRUD with idempotent create |

### 4.3 Serializers

- `SchoolSerializer`, `SchoolCreateSerializer` (inline admin account creation + auto-section creation), `SchoolUpdateSerializer`
- `SectionSerializer` (auto-names from section_type)
- `AcademicYearSerializer`

### 4.4 URLs (prefix `api/v1/schools/`)

Router-based: `schools/`, `academic-years/`, `sections/` with all CRUD + custom actions.

---

## 5. App: academics

### 5.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Level(TenantModel)` | `section` FK, `name`, `code`, `order`, `max_grade`, `passing_grade`, `has_streams` | Grade levels (e.g., 1ère année) |
| `Stream(TenantModel)` | `level` FK, `name`, `code`, `short_name`, `is_tronc_commun`, `is_custom`, `color`, `order` | Academic streams (Sciences, Lettres, etc.) |
| `Subject(TenantModel)` | `name`, `arabic_name`, `code`, `color`, `icon`, `is_custom` | Aliased as `SubjectTemplate` |
| `LevelSubject(TenantModel)` | `level` FK, `stream` FK (nullable), `subject` FK, `coefficient`, `is_mandatory`, `weekly_hours` | Subject-level mapping with coefficients |
| `Class(TenantModel)` | `section` FK, `academic_year` FK, `level` FK, `stream` FK, `name`, `homeroom_teacher` FK, `capacity` | Aliased as `Classroom` |
| `StudentProfile(AuditModel)` | `user` 1:1, `current_class` FK, `student_id`, `date_of_birth`, `enrollment_date`, `pin_hash` | Student-specific data |
| `ParentProfile(AuditModel)` | `user` 1:1, `children` M2M (StudentProfile), `relationship` | Parent-child linking |
| `TeacherProfile(AuditModel)` | `user` 1:1, `section` FK, `specialization` | Teacher-specific data |
| `TeacherAssignment(TenantModel)` | `teacher` FK, `subject` FK, `assigned_class` FK, `academic_year` FK | Teacher-to-class-subject assignment |
| `Room(TenantModel)` | `name`, `code`, `room_type` (CLASSROOM/LAB/COMPUTER_LAB/LIBRARY/GYM/etc.), `capacity`, `floor`, `building` | Physical rooms |
| `ScheduleSlot(TenantModel)` | Time slot definitions for scheduling | Timetable grid |
| `Lesson(TenantModel)` | Lesson instances in schedule | Scheduled lessons |
| `Resource(TenantModel)` | Teaching resources / materials | Uploads |
| `Timetable(TenantModel)` | Class timetable container | Weekly schedule |
| `TeacherAvailability(TenantModel)` | Teacher availability for scheduling | Constraint for timetable |

### 5.2 Views

| View | Description |
|------|-------------|
| `LevelViewSet` | CRUD for grade levels |
| `StreamViewSet` | CRUD for academic streams |
| `SubjectViewSet` | CRUD + `bulk-sync` action |
| `LevelSubjectViewSet` | CRUD for level-subject mappings |
| `ClassViewSet` | CRUD for classrooms |
| `TeacherAssignmentViewSet` | CRUD for teacher assignments |
| `ScheduleSlotViewSet` | CRUD with conflict validation |
| `LessonViewSet` | CRUD for lessons |
| `ResourceViewSet` | CRUD for teaching resources |
| `StudentViewSet` | CRUD for students (flat User+Profile) |
| `TeacherViewSet` | CRUD for teachers (flat User+Profile) |
| `TimetableViewSet` | CRUD for class timetables |
| `RoomViewSet` | CRUD for rooms |
| `TeacherAvailabilityViewSet` | CRUD for availability slots |
| `StudentFullProfileView` | Full student profile with all related data |
| `TeacherFullProfileView` | Full teacher profile |
| `ParentFullProfileView` | Full parent profile with children |
| `StudentQRCodeView` | Generate student QR code |
| `TeacherQRCodeView` | Generate teacher QR code |
| `StudentCardView` | Student ID card data |

### 5.3 Serializers

`LevelSerializer`, `StreamSerializer`, `SubjectSerializer`, `LevelSubjectSerializer`, `BulkSubjectSyncSerializer`, `ClassSerializer`, `TeacherAssignmentSerializer`, `ScheduleSlotSerializer`, `LessonSerializer`, `ResourceSerializer`, `StudentSerializer` (flat User+Profile merge), `TeacherSerializer` (flat User+Profile merge), `BulkTeacherSetupSerializer`

### 5.4 URLs (prefix `api/v1/academics/`)

Router-based: `levels/`, `streams/`, `subjects/`, `level-subjects/`, `classes/`, `assignments/`, `schedule/`, `lessons/`, `resources/`, `students/`, `teachers/`, `timetables/`, `rooms/`, `teacher-availability/`  
Manual paths: `students/<id>/full-profile/`, `teachers/<id>/full-profile/`, `parents/<id>/full-profile/`, `students/<id>/qr-code/`, `teachers/<id>/qr-code/`, `students/<id>/card/`

---

## 6. App: grades

### 6.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `ExamType` | `subject` FK, `classroom` FK, `academic_year` FK, `trimester` (1-3), `name`, `percentage`, `max_score` | Exam configuration |
| `Grade` | `student` FK (StudentProfile), `exam_type` FK, `score`, `is_absent`, `status` (DRAFT/SUBMITTED/PUBLISHED/RETURNED), publication/submission/return tracking with `admin_comment` | Individual grade entry with workflow states |
| `SubjectAverage` | `student`, `subject`, `classroom`, `academic_year`, `trimester`, `calculated_average`, `manual_override`, `is_published`, `is_locked` | Per-subject average per trimester |
| `TrimesterAverage` | `student`, `classroom`, `academic_year`, `trimester`, appreciation thresholds | Overall trimester average |
| `AnnualAverage` | Annual average aggregation | Year-end summary |
| `GradeAppeal` | Grade dispute/appeal tracking | Student/parent appeals |
| `GradeAuditLog` | Grade change audit trail | Immutable history |
| `ReportCard` | Report card generation | Per-student per-trimester |
| `TrimesterConfig` | Trimester dates/lock configuration | Admin-configurable |

### 6.2 Views

| View | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `ExamTypeViewSet` | CRUD | `grades/exam-types/` | Manage exam types |
| `GradeBulkEnterView` | POST | `grades/bulk-enter/` | Bulk grade entry by teacher |
| `GradeListView` | GET | `grades/list/` | Filtered grade list |
| `GradeSubmitView` | POST | `grades/submit/` | Teacher submits grades |
| `GradePublishView` | POST | `grades/publish/` | Admin publishes grades |
| `GradeReturnView` | POST | `grades/return/` | Admin returns grades to teacher |
| `GradeWorkflowStatusView` | GET | `grades/workflow-status/` | Workflow state overview |
| `GradeCorrectView` | PATCH | `grades/<id>/correct/` | Post-publish correction |
| `SubjectAverageListView` | GET | `grades/subject-averages/` | Subject averages |
| `SubjectAverageRecalculateView` | POST | `grades/subject-averages/recalculate/` | Recalculate averages |
| `SubjectAverageOverrideView` | POST | `grades/subject-averages/override/` | Manual override |
| `SubjectAveragePublishView` | POST | `grades/subject-averages/publish/` | Publish averages |
| `TrimesterAverageListView` | GET | `grades/trimester-averages/` | Trimester averages |
| `TrimesterRecalculateView` | POST | `grades/trimester-averages/recalculate/` | Recalculate |
| `TrimesterOverrideView` | POST | `grades/trimester-averages/override/` | Manual override |
| `TrimesterPublishView` | POST | `grades/trimester-averages/publish/` | Publish |
| `TrimesterLockView` | POST | `grades/trimester-averages/lock/` | Lock trimester |
| `TrimesterUnlockView` | POST | `grades/trimester-averages/unlock/` | Unlock trimester |
| `TrimesterConfigView` | GET/PUT | `grades/trimester-config/` | Trimester settings |
| `CSVImportPreviewView` | POST | `grades/csv-import/preview/` | Preview CSV import |
| `CSVImportConfirmView` | POST | `grades/csv-import/confirm/` | Confirm CSV import |
| `StudentAveragesView` | GET | `grades/students/<id>/averages/` | Student-specific averages |
| `GradeAppealView` | GET/POST | `grades/appeals/` | Grade appeals |
| `GradeAuditLogView` | GET | `grades/audit-log/` | Audit trail |
| `ReportCardView` | GET | `grades/report-cards/` | Report cards |
| `AnnualAverageView` | GET | `grades/annual-averages/` | Annual averages |

### 6.3 Permissions (`grades/permissions.py`)

| Permission | Logic |
|-----------|-------|
| `IsTeacherOfClassroom` | Verifies teacher is assigned to the target classroom |
| `IsAdminOrTeacherOfClassroom` | Admin OR assigned teacher |
| `IsAdminOnly` | Only ADMIN/SUPER_ADMIN |
| `IsNotLocked` | Checks trimester lock status — blocks writes when locked |

### 6.4 Celery Tasks

| Task | Description |
|------|-------------|
| `async_recalculate_cascade` | Triggered by Grade post_save signal — recalculates SubjectAverage → TrimesterAverage → AnnualAverage |
| `async_calculate_all_rankings` | Recalculates class/school rankings |
| `notify_appeal_assigned` | Sends notification when appeal is assigned |
| `generate_report_card_pdf` | Generates PDF report card |
| `generate_class_report_cards` | Bulk report card generation for a class |
| `recalculate_classroom_task` | Recalculates all averages for a classroom |

### 6.5 Serializers

ExamType (read + create), Grade, GradeBulkEnter, GradeCorrect, GradePublish, GradeSubmit, GradeReturn, SubjectAverage (read + recalc + override + publish), TrimesterAverage, TrimesterConfig, TrimesterLock/Unlock/Override/Publish/Recalc, CSVImport, GradeAppeal, GradeAuditLog, AnnualAverage, ReportCard

---

## 7. App: homework

### 7.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `HomeworkPost` | `school`, `class_obj` FK, `subject` FK, `teacher` FK, `academic_year` FK, `title`, `description`, `assigned_date`, `due_date`, `estimated_duration_minutes`, `is_published`, `is_corrected`, soft delete | Homework assignment |
| `HomeworkAttachment` | `homework` FK, `file`, `file_type`, `file_name` | File attachments |
| `HomeworkView` | `student` FK, `homework` FK, view tracking | Read tracking |

### 7.2 Views

| View | Endpoint | Description |
|------|----------|-------------|
| `HomeworkListCreateView` | `homework/` | Role-filtered: teacher→own, student→class, parent→children's classes, admin→all with filters |
| `HomeworkDetailView` | `homework/<id>/` | Single homework detail |
| `HomeworkMarkCorrectedView` | `homework/<id>/corrected/` | Mark as corrected |
| `HomeworkStatsView` | `homework/stats/` | Homework statistics |
| `HomeworkCalendarView` | `homework/calendar/` | Calendar view |
| `HomeworkOverloadView` | `homework/overload/` | Detect overloaded days |

### 7.3 Serializers

`HomeworkPostSerializer`, `HomeworkAttachmentSerializer`, `HomeworkViewSerializer`, `HomeworkCreateSerializer`, `HomeworkStatsSerializer`, `HomeworkCalendarDaySerializer`, `HomeworkOverloadSerializer`

### 7.4 URLs (prefix `api/v1/homework/`)

`stats/`, `calendar/`, `overload/`, ` ` (list+create), `<id>/`, `<id>/corrected/`

---

## 8. App: announcements

### 8.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Announcement` | `school`, `author` FK, `title`, `body`, `target_audience` (ALL/PARENTS/STUDENTS/TEACHERS/SPECIFIC_SECTION/SPECIFIC_CLASS), `target_section` FK, `target_class` FK, `is_pinned`, `publish_at`, soft delete | Targeted announcements |
| `AnnouncementAttachment` | `announcement` FK, file fields | Attachments |
| `AnnouncementRead` | `user` FK, `announcement` FK | Read tracking |

### 8.2 Views

| View | Endpoint | Description |
|------|----------|-------------|
| `AnnouncementListCreateView` | `announcements/` | Role-filtered list + create |
| `AnnouncementDetailView` | `announcements/<id>/` | Detail view |
| `AnnouncementMarkReadView` | `announcements/<id>/read/` | Mark as read |

### 8.3 Celery Tasks

| Task | Description |
|------|-------------|
| `send_announcement_notifications` | Push notifications to target audience |
| `send_event_reminders` | Scheduled event reminders |

### 8.4 Serializers

`AnnouncementSerializer`, `AnnouncementAttachmentSerializer`, `AnnouncementReadSerializer`, `AnnouncementCreateSerializer`

---

## 9. App: attendance

### 9.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `AttendanceRecord` | UUID pk, `student` FK (StudentProfile), `class_obj` FK, `academic_year` FK, `date`, `period` (MORNING/AFTERNOON), `subject_name`, `status` (PRESENT/ABSENT/LATE), `note`, `marked_by` FK, `school` FK, `is_justified`, `justification_note`, `justified_by` FK, `justified_at` | unique_together (student, date, period). Has `justify()` method. |
| `AbsenceExcuse` | `attendance_record` FK, `submitted_by` FK (PARENT), `justification_text`, `attachment`, `status` (PENDING/APPROVED/REJECTED), `reviewed_by` FK | Parent-submitted excuses |

### 9.2 Views

| View | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `MarkAttendanceView` | POST | `attendance/mark/` | Teacher bulk-marks attendance. Triggers parent notifications for absent students. |
| `AttendanceListView` | GET | `attendance/` | Admin filterable list with pagination (50/200). Filters: class_id, section_id, date/date_from/date_to, status, is_justified, student, teacher, search, period, ordering. |
| `AbsenceStatsView` | GET | `attendance/stats/` | Dashboard stats: today/week/month counts, at-risk students, teachers not marked |
| `AbsenceReportView` | GET | `attendance/report/` | CSV export |
| `JustifyAbsenceView` | POST | `attendance/<id>/justify/` | Admin directly justifies an absence |
| `CancelAbsenceView` | DELETE | `attendance/<id>/cancel/` | Admin deletes attendance record |
| `StudentAttendanceView` | GET | `attendance/my/` | Parent sees children's, student sees own |
| `ExcuseSubmitView` | POST | `attendance/excuses/` | Parent submits excuse |
| `ExcuseReviewView` | POST | `attendance/excuses/<id>/review/` | Admin approves/rejects excuse |

### 9.3 Serializers

`AttendanceRecordSerializer` (with student_name, class_name, teacher_name, student_phone, parent_phone computed fields), `AbsenceExcuseSerializer`, `AttendanceItemSerializer`, `MarkAttendanceSerializer`, `ExcuseSubmitSerializer`, `ExcuseReviewSerializer`, `JustifyAbsenceSerializer`, `AbsenceStatsSerializer`

### 9.4 Celery Tasks

| Task | Description |
|------|-------------|
| `notify_parent_of_absence` | Creates in-app Notification + FCM push to all parents when child marked absent/late |
| `detect_chronic_absenteeism` | Daily beat task: flags students exceeding school's absence_alert_threshold, notifies admins + parents |

---

## 10. App: chat

### 10.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Conversation` | UUID pk, `school` FK, `room_type` (DIRECT/TEACHER_PARENT/TEACHER_STUDENT/ADMIN_PARENT), `created_by` FK, `participant_admin` FK, `participant_other` FK, `participant_other_role`, `last_message_at`, `is_read_by_admin`, `unread_count_admin` | 1:1 private conversations. unique_together (participant_admin, participant_other). |
| `Message` | UUID pk, `conversation` FK, `sender` FK, `content`, `attachment` (FileField), `attachment_type` (image/document), `attachment_name`, `attachment_size`, `is_read`, `created_at` | Auto-updates conversation's `last_message_at` and `unread_count_admin` on save. Deletes physical file on model delete. |
| `ChatRoom` | UUID pk, `school` FK, `room_type` (CLASS_BROADCAST/ADMIN_BROADCAST/TEACHER_PARENT_GROUP/TEACHER_STUDENT_GROUP), `name`, `description`, `created_by` FK, `related_class` FK, `is_active` | Group/broadcast salons |
| `ChatRoomMembership` | `room` FK, `user` FK, `role` (ADMIN/MEMBER), `is_muted`, `joined_at` | Group members. unique_together (room, user). |
| `ChatRoomMessage` | `room` FK, `sender` FK, `content`, attachment fields | Messages in group rooms |

### 10.2 Views

| View | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `ConversationListCreateView` | GET/POST | `chat/conversations/` | List user's conversations (ordered by last_message_at). Create or return existing. |
| `ContactListView` | GET | `chat/conversations/contacts/` | Available contacts |
| `ConversationDeleteView` | DELETE | `chat/conversations/<id>/` | Delete conversation + all attachment files |
| `MessageListView` | GET | `chat/conversations/<id>/messages/` | List messages. Marks as read for admin. |
| `MessageUploadView` | POST | `chat/conversations/<id>/messages/upload/` | Upload attachment (10MB limit, png/jpg/jpeg/pdf). Broadcasts via WebSocket + FCM fallback. |
| `ChatRoomListCreateView` | GET/POST | `chat/rooms/` | List/create group rooms |
| `ChatRoomDetailView` | GET/PUT/DELETE | `chat/rooms/<id>/` | Room detail |
| `ChatRoomMessageListView` | GET | `chat/rooms/<id>/messages/` | Room message history |

### 10.3 WebSocket Consumers (`consumers.py`)

| Consumer | Route | Description |
|----------|-------|-------------|
| `ChatConsumer` | `ws/chat/<conversation_id>/` | Real-time 1:1 chat. JWT auth from query params. Verifies participation. Saves messages to DB + broadcasts + FCM push for offline users. |
| `GroupChatConsumer` | `ws/room/<room_id>/` | Real-time group chat. Verifies membership. |
| `NotificationConsumer` | `ws/notifications/` | Live notification delivery to clients |

### 10.4 Serializers

`MessageSerializer` (with sender_name, sender_is_admin, attachment_url), `ConversationListSerializer` (with participant_other_name, initials, last_message_preview), `ConversationCreateSerializer`, `ChatRoomMemberSerializer`, `ChatRoomMessageSerializer`, `ChatRoomListSerializer` (with member_count, last_message_preview), `ChatRoomCreateSerializer`

---

## 11. App: finance

### 11.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `FeeStructure(TenantModel)` | `name`, `academic_year` FK, `section` FK (nullable), `amount_monthly`, `amount_trimester`, `amount_annual` (DZD), `due_date`, `description` | Fee configuration per school/year/section |
| `StudentPayment(TenantModel)` | `student` FK, `fee_structure` FK, `payment_type` (mensuel/trimestriel/annuel), `amount_paid`, `payment_date`, `period_start`, `period_end`, `payment_method` (especes/baridimob/cib/virement), `receipt_number` (auto PAY-YYYY-XXXXX), `recorded_by` FK, `status` (actif/expire) | Auto-generates receipt number. Auto-computes status from period_end. |
| `StudentFeeEnrollment(TenantModel)` | `student` FK, `fee_structure` FK, `total_due`, `total_paid` (cached), `due_date`, `status` (PAID/PARTIAL/UNPAID/LATE), `notes` | unique_together (student, fee_structure). `refresh_totals()` recomputes from linked payments. |
| `SalaryConfig(TenantModel)` | `teacher` 1:1, `base_salary`, `hourly_rate`, `qualification` (LICENCE/MASTER/DOCTORAT/INGENIEUR/PROFESSEUR/VACATAIRE), `weekly_hours`, `bank_account`, `hire_date` | Teacher salary configuration |
| `Deduction(TenantModel)` | `name`, `deduction_type` (FIXED/PERCENTAGE), `value`, `is_active`, `description` | Reusable deduction types (CNAS, IRG, Mutuelle). Has `compute(gross_salary)` method. |
| `LeaveRecord(TenantModel)` | `teacher` FK, `leave_type` (ANNUAL/SICK/MATERNITY/UNPAID/OTHER), `start_date`, `end_date`, `status` (PENDING/APPROVED/REJECTED), `reason`, `approved_by` FK | Has `days` property. |
| `OvertimeRecord(TenantModel)` | `teacher` FK, `date`, `hours`, `description`, `approved`, `approved_by` FK | Extra hours tracking |
| `PaySlip(TenantModel)` | `teacher` FK, `month`, `year`, `base_salary`, `overtime_hours`, `overtime_amount`, `leave_days_unpaid`, `leave_deduction`, `gross_salary`, `deductions_detail` JSON, `total_deductions`, `net_salary`, `reference` (auto FDP-YYYY-MM-XXXXX), `status` (DRAFT/VALIDATED/PAID), `paid_on`, `notes` | Immutable payslip with full breakdown. unique_together (teacher, month, year). |

### 11.2 Views / Endpoints

**Student Fees:**

| View | Endpoint | Description |
|------|----------|-------------|
| `FeeStructureListCreateView` | `finance/fee-structures/` | CRUD fee structures |
| `FeeStructureDetailView` | `finance/fee-structures/<id>/` | Detail |
| `PaymentListCreateView` | `finance/payments/` | CRUD payments |
| `PaymentDetailView` | `finance/payments/<id>/` | Detail |
| `PaymentStatsView` | `finance/payments/stats/` | Payment statistics |
| `PaymentExpiringSoonView` | `finance/payments/expiring-soon/` | Expiring subscriptions |
| `PaymentBulkReminderView` | `finance/payments/bulk-reminder/` | Send bulk reminders |
| `PaymentReportView` | `finance/payments/report/` | Financial report |
| `PaymentSendReminderView` | `finance/payments/<id>/send-reminder/` | Single payment reminder |
| `PaymentReceiptView` | `finance/payments/<id>/receipt/` | Receipt download |
| `FeeEnrollmentListCreateView` | `finance/enrollments/` | Student fee enrollments |
| `FeeEnrollmentDetailView` | `finance/enrollments/<id>/` | Detail |
| `FeeEnrollmentStatsView` | `finance/enrollments/stats/` | Enrollment stats |

**Payroll:**

| View | Endpoint | Description |
|------|----------|-------------|
| `SalaryConfigListCreateView` | `finance/salary-configs/` | Teacher salary configs |
| `SalaryConfigDetailView` | `finance/salary-configs/<id>/` | Detail |
| `DeductionListCreateView` | `finance/deductions/` | Deduction types |
| `DeductionDetailView` | `finance/deductions/<id>/` | Detail |
| `LeaveRecordListCreateView` | `finance/leaves/` | Leave records |
| `LeaveRecordDetailView` | `finance/leaves/<id>/` | Detail |
| `LeaveApproveView` | `finance/leaves/<id>/approve/` | Approve leave |
| `OvertimeRecordListCreateView` | `finance/overtime/` | Overtime records |
| `OvertimeApproveView` | `finance/overtime/<id>/approve/` | Approve overtime |
| `PaySlipGenerateView` | `finance/payslips/generate/` | Generate single payslip |
| `PaySlipBulkGenerateView` | `finance/payslips/bulk-generate/` | Bulk generate payslips |
| `PayrollStatsView` | `finance/payslips/stats/` | Payroll statistics |
| `TeacherOwnPaySlipsView` | `finance/payslips/my/` | Teacher views own payslips |
| `PaySlipListView` | `finance/payslips/` | List all payslips |
| `PaySlipDetailView` | `finance/payslips/<id>/` | Detail |
| `PaySlipPDFView` | `finance/payslips/<id>/pdf/` | PDF download |

### 11.3 Additional Files

- `payroll_service.py` — Payslip computation engine (base + overtime - leave deductions - percentage/fixed deductions = net)
- `services.py` — Fee-related business logic

---

## 12. App: canteen

### 12.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `CanteenStudent(TenantModel)` | `student` 1:1, `start_date`, `end_date`, `is_active`, `nutritional_status` (NORMAL/UNDERWEIGHT/OVERWEIGHT/OBESE), `dietary_restriction` (NONE/DIABETIC/CELIAC/LACTOSE/ALLERGY/VEGETARIAN/OTHER), `allergy_details`, `medical_note` | Student canteen enrollment with medical info |
| `Menu(TenantModel)` | `title`, `period_type` (WEEKLY/MONTHLY/TRIMESTER), `start_date`, `end_date`, `is_published`, `notes` | Weekly/monthly canteen menus |
| `MenuItem(TenantModel)` | `menu` FK, `date`, `day_of_week` (SUN-THU, Algerian school week), `starter`, `main_course`, `side_dish`, `dessert`, `allergens`, `suitable_for_diabetic`, `suitable_for_celiac`, `calories_approx` | Individual meal entries. unique_together (menu, date). Auto-computes day_of_week. |
| `MealAttendance(TenantModel)` | `student` FK, `menu_item` FK, `date`, `present`, `notes` | Daily attendance. unique_together (student, date). |

### 12.2 Views / Endpoints

| View | Endpoint | Description |
|------|----------|-------------|
| `CanteenStudentListCreateView` | `canteen/students/` | Registered students |
| `CanteenStudentDetailView` | `canteen/students/<id>/` | Detail |
| `MenuListCreateView` | `canteen/menus/` | Menus |
| `MenuDetailView` | `canteen/menus/<id>/` | Detail |
| `MenuPublishView` | `canteen/menus/<id>/publish/` | Publish menu |
| `MenuItemListCreateView` | `canteen/menus/<menu_id>/items/` | Menu items |
| `MenuItemDetailView` | `canteen/menu-items/<id>/` | Detail |
| `MealAttendanceListCreateView` | `canteen/attendance/` | Attendance |
| `MealAttendanceBulkView` | `canteen/attendance/bulk/` | Bulk mark attendance |
| `ParentMenuListView` | `canteen/parent/menus/` | Published menus for parents |
| `ConsumptionReportView` | `canteen/reports/consumption/` | Consumption reports |

---

## 13. App: transport

### 13.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `BusDriver(TenantModel)` | `first_name`, `last_name`, `phone`, `national_id`, `date_of_birth`, `blood_type`, `photo_url`, `address`, `license_number`, `license_type` (B/C/D/E), `license_expiry`, `emergency_contact_name/phone`, `hire_date`, `is_active` | Has `license_valid` property. |
| `TransportLine(TenantModel)` | `name`, `neighborhood`, `description`, `driver` FK, `vehicle_plate`, `vehicle_model`, `vehicle_year`, `vehicle_color`, `capacity`, `departure_time`, `return_time`, `distance_km`, `is_active` | Bus route. Has `enrolled_count` property. |
| `BusStop(TenantModel)` | `line` FK, `name`, `order`, `estimated_time`, `latitude`, `longitude` | Ordered waypoints. unique_together (line, order). |
| `StudentTransport(TenantModel)` | `student` 1:1, `line` FK, `pickup_stop` FK, `dropoff_stop` FK, `start_date`, `end_date`, `is_active` | Student-to-line assignment |
| `GPSPosition(TenantModel)` | `line` FK, `latitude`, `longitude`, `speed`, `heading`, `recorded_at` | Real-time bus position |
| `TripLog(TenantModel)` | `line` FK, `date`, `trip_type` (DEPARTURE/RETURN), `scheduled_time`, `actual_time`, `status` (ON_TIME/DELAYED/CANCELLED), `delay_minutes`, `passengers_count`, `notes` | Daily trip records. unique_together (line, date, trip_type). |

### 13.2 Views / Endpoints

| View | Endpoint | Description |
|------|----------|-------------|
| `BusDriverListCreateView` | `transport/drivers/` | Driver CRUD |
| `BusDriverDetailView` | `transport/drivers/<id>/` | Detail |
| `BusDriverIDCardView` | `transport/drivers/<id>/id-card/` | Driver ID card |
| `TransportLineListCreateView` | `transport/lines/` | Route CRUD |
| `TransportLineDetailView` | `transport/lines/<id>/` | Detail |
| `BusStopListCreateView` | `transport/stops/` | Stop CRUD |
| `BusStopDetailView` | `transport/stops/<id>/` | Detail |
| `StudentTransportListCreateView` | `transport/students/` | Student assignments |
| `StudentTransportDetailView` | `transport/students/<id>/` | Detail |
| `GPSPositionUpdateView` | `transport/gps/` | Submit GPS position |
| `GPSPositionParentView` | `transport/gps/track/` | Parent tracks bus |
| `TripLogListCreateView` | `transport/trips/` | Trip logs |
| `TripLogDetailView` | `transport/trips/<id>/` | Detail |
| `PerformanceReportView` | `transport/report/` | Punctuality/performance report |
| `ParentTransportInfoView` | `transport/parent-info/` | Parent views child's transport info |

---

## 14. App: library

### 14.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Book(TenantModel)` | `title`, `author`, `isbn`, `publisher`, `category` (FICTION/SCIENCE/MATHEMATICS/HISTORY/... 15 choices), `language` (ARABIC/FRENCH/ENGLISH/TAMAZIGHT/OTHER), `subject`, `description`, `publication_year`, `edition`, `page_count`, `cover_image_url` | Has `total_copies` and `available_copies` properties. |
| `BookCopy(TenantModel)` | `book` FK, `barcode`, `condition` (NEW/GOOD/FAIR/POOR/DAMAGED), `status` (AVAILABLE/BORROWED/RESERVED/LOST/DAMAGED/RETIRED), `location`, `acquisition_date`, `notes` | Individual physical copy |
| `Loan(TenantModel)` | `book_copy` FK, `borrower` FK, `borrowed_date`, `due_date`, `returned_date`, `status` (ACTIVE/RETURNED/OVERDUE/LOST), `renewals_count`, `notes` | Has `is_overdue` property. |
| `Reservation(TenantModel)` | `book` FK, `user` FK, `reserved_date`, `status` (PENDING/FULFILLED/CANCELLED/EXPIRED), `notes` | Queue for unavailable books |
| `LibraryRequest(TenantModel)` | `requester` FK, `request_type` (PURCHASE/SUGGESTION/OTHER), `title`, `author`, `description`, `status` (PENDING/APPROVED/REJECTED), `admin_response`, `resolved_by` FK, `resolved_at` | Book purchase requests |

### 14.2 Views / Endpoints

| View | Endpoint | Description |
|------|----------|-------------|
| `BookListCreateView` | `library/books/` | Book catalogue |
| `BookDetailView` | `library/books/<id>/` | Detail |
| `BookCopyListCreateView` | `library/copies/` | Physical copies |
| `BookCopyDetailView` | `library/copies/<id>/` | Detail |
| `LoanListCreateView` | `library/loans/` | Loans |
| `LoanDetailView` | `library/loans/<id>/` | Detail |
| `LoanReturnView` | `library/loans/<id>/return/` | Return book |
| `LoanRenewView` | `library/loans/<id>/renew/` | Renew loan |
| `MyLoansView` | `library/my-loans/` | Current user's loans |
| `ReservationListCreateView` | `library/reservations/` | Reservations |
| `ReservationCancelView` | `library/reservations/<id>/cancel/` | Cancel reservation |
| `LibraryRequestListCreateView` | `library/requests/` | Book requests |
| `LibraryRequestDetailView` | `library/requests/<id>/` | Detail |
| `LibraryRequestResolveView` | `library/requests/<id>/resolve/` | Resolve request |
| `UsageReportView` | `library/usage-report/` | Usage statistics |

---

## 15. App: extracurricular

### 15.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Activity(TenantModel)` | `name`, `description`, `category` (SPORT/ART/SCIENCE/LANGUAGE/CULTURAL/OTHER), `supervisor` FK, `max_participants`, `day_of_week`, `start_time`, `end_time`, `location`, `is_active` | Clubs, sports, workshops |
| `Enrollment(TenantModel)` | `activity` FK, `student` FK, `enrolled_date`, `status` (ACTIVE/WITHDRAWN) | unique_together (activity, student) |
| `Session(TenantModel)` | `activity` FK, `date`, `notes`, `cancelled` | Individual session/occurrence |

### 15.2 Views (Router-based ViewSets)

| ViewSet | Basename | Description |
|---------|----------|-------------|
| `ActivityViewSet` | `extracurricular-activities` | Full CRUD |
| `EnrollmentViewSet` | `extracurricular-enrollments` | Full CRUD |
| `SessionViewSet` | `extracurricular-sessions` | Full CRUD |

### 15.3 URLs (prefix `api/v1/extracurricular/`)

Router-based: `activities/`, `enrollments/`, `sessions/`

---

## 16. App: discipline

### 16.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Incident(TenantModel)` | `student` FK, `reported_by` FK, `date`, `severity` (LOW/MEDIUM/HIGH/CRITICAL), `title`, `description`, `location`, `witnesses` | Disciplinary event |
| `Sanction(TenantModel)` | `incident` FK, `student` FK, `sanction_type` (WARNING/DETENTION/SUSPENSION/EXPULSION/COMMUNITY_SERVICE/OTHER), `start_date`, `end_date`, `decision`, `decided_by` FK, `parent_notified` | Applied sanctions |
| `BehaviorReport(TenantModel)` | `student` FK, `period`, `rating` (EXCELLENT/GOOD/AVERAGE/POOR), `comments`, `reported_by` FK | Periodic assessments |

### 16.2 Views (Router-based ViewSets)

| ViewSet | Basename | Description |
|---------|----------|-------------|
| `IncidentViewSet` | `discipline-incidents` | Full CRUD |
| `SanctionViewSet` | `discipline-sanctions` | Full CRUD |
| `BehaviorReportViewSet` | `discipline-behavior-reports` | Full CRUD |

### 16.3 URLs (prefix `api/v1/discipline/`)

Router-based: `incidents/`, `sanctions/`, `behavior-reports/`

---

## 17. App: fingerprint

### 17.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `FingerprintDevice(TenantModel)` | `name`, `serial_number` (unique), `location`, `ip_address` (GenericIPAddressField), `is_active`, `last_sync` | Biometric device registration |
| `FingerprintRecord(TenantModel)` | `user` FK, `finger_index` (0-9), `template_data` (BinaryField, encrypted), `enrolled_at` | unique_together (user, finger_index) |
| `BiometricAttendanceLog(TenantModel)` | `user` FK, `device` FK, `timestamp`, `event_type` (CHECK_IN/CHECK_OUT), `verified` | Scan events |

### 17.2 Views (Router-based ViewSets)

| ViewSet | Basename | Description |
|---------|----------|-------------|
| `FingerprintDeviceViewSet` | `fingerprint-devices` | Full CRUD |
| `FingerprintRecordViewSet` | `fingerprint-records` | Full CRUD |
| `BiometricAttendanceLogViewSet` | `fingerprint-logs` | Full CRUD |

### 17.3 URLs (prefix `api/v1/fingerprint/`)

Router-based: `devices/`, `records/`, `logs/`

---

## 18. App: notifications

### 18.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Notification` | UUID pk, `user` FK, `school` FK, `title`, `body`, `notification_type` (GRADE/HOMEWORK/ATTENDANCE/ANNOUNCEMENT/MESSAGE/REPORT_CARD/PAYMENT/EVENT/DISCIPLINE), `related_object_id` (UUID), `related_object_type`, `is_read`, `read_at`, `created_at` | In-app notification. Not TenantModel — uses own school FK. |
| `DeviceToken` | UUID pk, `user` FK, `token` (unique), `platform` (IOS/ANDROID), `created_at`, `last_used_at` | FCM push notification tokens |

### 18.2 Views

| View | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `NotificationListView` | GET | `notifications/` | List user's notifications. Filters: is_read, type. Limit 100. |
| `NotificationMarkReadView` | POST | `notifications/<id>/read/` | Mark single as read |
| `NotificationMarkAllReadView` | POST | `notifications/read-all/` | Mark all as read |
| `UnreadCountView` | GET | `notifications/unread-count/` | Unread count |
| `DeviceTokenView` | POST | `notifications/devices/` | Register FCM token |

### 18.3 Celery Tasks

| Task | Description |
|------|-------------|
| `send_notification` | Send FCM push to single user. Auto-cleans expired tokens. |
| `notify_parents_of_absence` | Create Notification + push for parents of absent student |

### 18.4 Serializers

`NotificationSerializer`, `DeviceTokenSerializer`

---

## 19. App: ai_chatbot

### 19.1 Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `KnowledgeBase(TenantModel)` | `title`, `content`, `category` (faq/policy/schedule/contact/general/academic), `is_active`, `vector_id` (Pinecone) | School-specific knowledge entries for RAG |
| `ChatSession(TenantModel)` | `user` FK | Conversation session |
| `ChatMessage(TenantModel)` | `session` FK, `role` (user/assistant), `content` | Individual messages |

### 19.2 Views

| View | Endpoint | Description |
|------|----------|-------------|
| `KnowledgeBaseViewSet` | `ai/knowledge/` | Admin CRUD for knowledge base entries |
| `ChatSessionViewSet` | `ai/sessions/` | Read-only: user's chat sessions |
| `ChatQueryView` | `ai/chat/` | POST — Send message to AI chatbot. Currently returns placeholder. TODO: RAG pipeline. |

### 19.3 RAG Service (`services.py`)

`RAGService` class with:
- `embed_text(text)` → OpenAI embeddings (text-embedding-3-small)
- `embed_documents(documents)` → Batch upsert to Pinecone
- `search(query, top_k, filters)` → Vector similarity search
- Lazy-loaded Pinecone index + OpenAI embeddings
- **Status: Scaffolded but not yet integrated into ChatQueryView**

### 19.4 Serializers

`KnowledgeBaseSerializer`, `ChatMessageSerializer`, `ChatSessionSerializer` (with nested messages), `ChatQuerySerializer`

---

## 20. Test Suite

### 20.1 Fixtures (`conftest.py`)

| Fixture | Description |
|---------|-------------|
| `school` | Test school |
| `academic_year` | Current academic year |
| `admin_user` | ADMIN role user |
| `teacher_user` | TEACHER role user |
| `student_user` | STUDENT role user |
| `parent_user` | PARENT role user |
| `section` | PRIMARY section |
| `level` | Grade level |
| `classroom` | Test classroom |
| `subject` | Test subject |
| `teacher_assignment` | Teacher-subject-class link |
| `exam_type` | Exam type |
| `api_client` | Unauthenticated DRF client |
| `admin_client` | Admin-authenticated client |
| `teacher_client` | Teacher-authenticated client |
| `student_client` | Student-authenticated client |
| `parent_client` | Parent-authenticated client |

### 20.2 Test Files

| File | Coverage |
|------|----------|
| `test_canteen.py` | Canteen models and views |
| `test_chronic_absence_chat.py` | Chronic absenteeism detection + chat |
| `test_finance.py` | Finance/payment flows |
| `test_grades_features.py` | Grade workflow |
| `test_library.py` | Library operations |
| `test_payroll.py` | Payroll/payslip generation |
| `test_tenant_isolation.py` | Multi-tenant data isolation |
| `test_three_features.py` | Cross-feature integration |
| `test_timetable_rooms.py` | Timetable + room conflicts |
| `test_transport.py` | Transport operations |

---

## 21. Summary Statistics

### Models by App

| App | Models | Key Entities |
|-----|--------|-------------|
| accounts | 4 | User, ActivityLog, BulkImportJob, PlatformConfig |
| schools | 3 | School, Section, AcademicYear |
| academics | 14+ | Level, Stream, Subject, LevelSubject, Class, StudentProfile, TeacherProfile, ParentProfile, TeacherAssignment, Room, ScheduleSlot, Lesson, Resource, Timetable, TeacherAvailability |
| grades | 8+ | ExamType, Grade, SubjectAverage, TrimesterAverage, AnnualAverage, GradeAppeal, GradeAuditLog, ReportCard, TrimesterConfig |
| homework | 3 | HomeworkPost, HomeworkAttachment, HomeworkView |
| announcements | 3 | Announcement, AnnouncementAttachment, AnnouncementRead |
| attendance | 2 | AttendanceRecord, AbsenceExcuse |
| chat | 5 | Conversation, Message, ChatRoom, ChatRoomMembership, ChatRoomMessage |
| finance | 7 | FeeStructure, StudentPayment, StudentFeeEnrollment, SalaryConfig, Deduction, LeaveRecord, OvertimeRecord, PaySlip |
| canteen | 4 | CanteenStudent, Menu, MenuItem, MealAttendance |
| transport | 6 | BusDriver, TransportLine, BusStop, StudentTransport, GPSPosition, TripLog |
| library | 5 | Book, BookCopy, Loan, Reservation, LibraryRequest |
| extracurricular | 3 | Activity, Enrollment, Session |
| discipline | 3 | Incident, Sanction, BehaviorReport |
| fingerprint | 3 | FingerprintDevice, FingerprintRecord, BiometricAttendanceLog |
| notifications | 2 | Notification, DeviceToken |
| ai_chatbot | 3 | KnowledgeBase, ChatSession, ChatMessage |
| **TOTAL** | **~78** | |

### API Endpoints Count (approximate)

| App | Endpoints |
|-----|-----------|
| accounts | 16 |
| schools | ~15 (router) |
| academics | ~30 (router + manual) |
| grades | ~25 |
| homework | 6 |
| announcements | 3 |
| attendance | 9 |
| chat | 8 |
| finance | ~25 |
| canteen | 11 |
| transport | 14 |
| library | 14 |
| extracurricular | ~10 (router) |
| discipline | ~10 (router) |
| fingerprint | ~10 (router) |
| notifications | 5 |
| ai_chatbot | ~7 (router + manual) |
| **TOTAL** | **~218** |

### Celery Tasks

| App | Tasks |
|-----|-------|
| accounts | `bulk_import_students` |
| grades | `async_recalculate_cascade`, `async_calculate_all_rankings`, `notify_appeal_assigned`, `generate_report_card_pdf`, `generate_class_report_cards`, `recalculate_classroom_task` |
| announcements | `send_announcement_notifications`, `send_event_reminders` |
| attendance | `notify_parent_of_absence`, `detect_chronic_absenteeism` |
| notifications | `send_notification`, `notify_parents_of_absence` |
| celery beat | `archive_academic_years`, `weekly_parent_digest` |
| **TOTAL** | **~14** |

### User Roles

| Role | Key Permissions |
|------|----------------|
| `SUPER_ADMIN` | Full platform access |
| `ADMIN` | School-level admin (manage all within school) |
| `SECTION_ADMIN` | Section-level admin |
| `TEACHER` | Mark attendance, enter grades, assign homework, chat |
| `PARENT` | View children's data, submit excuses, chat, pay fees |
| `STUDENT` | View own data, PIN login |

### Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Backend Framework | Django 5.x + DRF |
| Database | PostgreSQL |
| Cache / Broker | Redis |
| Async Tasks | Celery + celery-beat (DatabaseScheduler) |
| WebSockets | Django Channels + Daphne |
| Auth | JWT (simplejwt) with token blacklist |
| Push Notifications | Firebase Admin SDK (V1 API) |
| File Storage | Local (dev) / S3/Cloudflare R2 (prod) |
| API Docs | drf-spectacular (Swagger/Redoc) |
| Error Monitoring | Sentry (prod) |
| Static Files | WhiteNoise |
| AI/RAG | LangChain + OpenAI + Pinecone (scaffolded) |
| QR Codes | qrcode library |
| Excel Import | openpyxl |

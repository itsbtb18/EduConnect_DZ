# ILMI Admin Frontend — Comprehensive Analysis Report

> **Generated**: Analysis of `d:\WorkSpace\ECOLE\admin\`  
> **Platform**: ILMI — Algerian School Management SaaS  
> **UI Language**: French (fr-DZ)

---

## Table of Contents

1. [Tech Stack & Architecture](#1-tech-stack--architecture)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Routing & Navigation](#3-routing--navigation)
4. [API Layer](#4-api-layer)
5. [Shared UI Component Library](#5-shared-ui-component-library)
6. [Module-by-Module Analysis](#6-module-by-module-analysis)
   - [6.1 Dashboard (School Admin)](#61-dashboard-school-admin)
   - [6.2 Login](#62-login)
   - [6.3 Students](#63-students)
   - [6.4 Teachers](#64-teachers)
   - [6.5 Classes](#65-classes)
   - [6.6 Grades & Report Cards](#66-grades--report-cards)
   - [6.7 Attendance](#67-attendance)
   - [6.8 Homework](#68-homework)
   - [6.9 Timetable](#69-timetable)
   - [6.10 Announcements](#610-announcements)
   - [6.11 Messaging (Real-time Chat)](#611-messaging-real-time-chat)
   - [6.12 Notifications](#612-notifications)
   - [6.13 Financial / Payments](#613-financial--payments)
   - [6.14 Analytics (School)](#614-analytics-school)
   - [6.15 Settings (School)](#615-settings-school)
   - [6.16 User Management](#616-user-management)
   - [6.17 Setup Wizard (9-Step School Config)](#617-setup-wizard-9-step-school-config)
7. [Super Admin Platform](#7-super-admin-platform)
   - [7.1 Super Admin Dashboard](#71-super-admin-dashboard)
   - [7.2 School Management](#72-school-management)
   - [7.3 Plan / Subscription Management](#73-plan--subscription-management)
   - [7.4 Platform Analytics](#74-platform-analytics)
   - [7.5 Activity Logs](#75-activity-logs)
   - [7.6 System Health Monitoring](#76-system-health-monitoring)
   - [7.7 Platform Settings](#77-platform-settings)
8. [Constants & Data](#8-constants--data)
9. [Hooks Library](#9-hooks-library)
10. [Quality Assessment Summary](#10-quality-assessment-summary)

---

## 1. Tech Stack & Architecture

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.9.3 |
| Build | Vite | 5.4.10 |
| UI Library | Ant Design (antd) | 6.3.1 |
| Server State | TanStack React Query | 5.90.21 |
| Router | React Router | 7.13.1 |
| HTTP | Axios | 1.13.5 |
| Charts | Recharts | 3.7.0 |
| Icons | lucide-react + @ant-design/icons | — |
| Export | xlsx (SheetJS), html2canvas, jsPDF | — |
| CSS | Custom CSS (no Tailwind, no CSS-in-JS) | — |
| Theme | Ant Design ConfigProvider with teal `#00C9A7` primary | — |

**Architecture pattern**: Single Page Application (SPA) with:
- **API layer** (`api/client.ts`, `api/services.ts`) — centralized Axios instance + service objects
- **React Query hooks** (`hooks/useApi.ts`) — wraps all API services with mutations/queries
- **Context** — `AuthContext` for JWT management
- **Component library** (`components/ui/`) — 15+ reusable UI components
- **Pages** — feature-based page components (1 file per feature)
- **Constants** — Algerian MEN curriculum data (levels, subjects, coefficients, streams)

---

## 2. Authentication & Authorization

**File**: `context/AuthContext.tsx`

| Feature | Status | Details |
|---|---|---|
| JWT Bearer auth | ✅ Fully implemented | Access + Refresh tokens stored in `localStorage` |
| Auto-refresh on 401 | ✅ Fully implemented | Queue-based interceptor, refreshes once then replays queued requests |
| Login | ✅ Fully implemented | Phone number + password |
| Logout | ✅ Fully implemented | Clears tokens, redirects to `/login` |
| Role-based routing | ✅ Fully implemented | `ProtectedRoute`, `SuperAdminGuard`, `SchoolAdminGuard`, `SetupRedirectGuard` |
| User roles | ✅ Defined | `SUPER_ADMIN`, `ADMIN`, `SECTION_ADMIN`, `TEACHER`, `PARENT`, `STUDENT` |

**API endpoints used**:
- `POST /api/v1/accounts/login/` — login
- `POST /api/v1/accounts/token/refresh/` — token refresh
- `POST /api/v1/accounts/logout/` — logout
- `GET /api/v1/accounts/me/` — fetch current user

---

## 3. Routing & Navigation

**File**: `App.tsx`, `components/layout/Sidebar.tsx`, `components/layout/Header.tsx`

### Route Structure

**Public routes**:
- `/login` → `LoginPage`

**School Admin routes** (requires auth, blocks `SUPER_ADMIN`, redirects to `/setup` if school not configured):
| Route | Page Component | Guard |
|---|---|---|
| `/dashboard` | `Dashboard` | `ProtectedRoute` + `SchoolAdminGuard` + `SetupRedirectGuard` |
| `/users` | `UserManagement` | Same |
| `/students` | `StudentList` | Same |
| `/students/:id` | `StudentDetail` | Same |
| `/students/:id/profile` | `StudentProfilePage` | Same |
| `/teachers` | `TeacherList` | Same |
| `/teachers/:id/profile` | `TeacherProfilePage` | Same |
| `/classes` | `ClassManagement` | Same |
| `/grades` | `GradeManagement` | Same |
| `/notes-bulletins` | `GradesFullPage` | Same |
| `/attendance` | `AttendancePage` | Same |
| `/announcements` | `AnnouncementsPage` | Same |
| `/messaging` | `MessagingPage` | Same |
| `/financial` | `FinancialPage` | Same |
| `/analytics` | `AnalyticsPage` | Same |
| `/timetable` | `TimetablePage` | Same |
| `/notifications` | `NotificationsPage` | Same |
| `/homework` | `HomeworkPage` | Same |
| `/settings` | `SettingsPage` | Same |
| `/setup` | `SetupWizard` | `ProtectedRoute` + `SchoolAdminGuard` |

**Super Admin routes** (requires `SUPER_ADMIN` role):
| Route | Page Component |
|---|---|
| `/platform/dashboard` | `SuperAdminDashboard` |
| `/platform/schools` | `SchoolManagement` |
| `/platform/users` | `UserManagement` |
| `/platform/plans` | `PlanManagement` |
| `/platform/analytics` | `SuperAdminAnalytics` |
| `/platform/settings` | `PlatformSettings` |
| `/platform/activity-logs` | `ActivityLogsPage` |
| `/platform/system-health` | `SystemHealthPage` |
| `/platform/notifications` | `NotificationsPage` |

### Layout

- **AppLayout**: Sidebar + Header + `<Outlet />` with page transition animation
- **Sidebar**: Collapsible, role-aware navigation sections (Plateforme/Gestion/Académique/Communication/Administration). Shows school logo+name+plan for school admins, ILMI logo for super admin.
- **Header**: Breadcrumbs, page title, notification bell (with unread badge + dropdown), user avatar dropdown (profile/settings/fullscreen/logout), real-time clock.
- **CommandPalette**: `Ctrl+K` / `Cmd+K` keyboard shortcut, fuzzy search across all navigation items, role-aware.

---

## 4. API Layer

**Files**: `api/client.ts`, `api/services.ts`

### Axios Client (`client.ts`)
- Base URL: `/api/v1` (relative, proxied by Vite/nginx)
- Request interceptor: Attaches `Authorization: Bearer <token>`, handles `FormData` content-type
- Response interceptor: 401 auto-refresh with request queue, logout on refresh failure

### Service Objects (`services.ts`)

| Service | Methods | API Prefix |
|---|---|---|
| `authAPI` | `login`, `refresh`, `logout`, `me`, `platformStats` | `/accounts/` |
| `usersAPI` | `list`, `create`, `get`, `update`, `delete`, `resetPassword`, `changePassword` | `/accounts/users/` |
| `schoolsAPI` | CRUD + `mySchool`, `profile`, `updateProfile`, `completeSetup`, `uploadLogo`, sections CRUD, academicYears CRUD | `/schools/` |
| `academicsAPI` | levels CRUD, streams CRUD, levelSubjects CRUD, classes CRUD, subjects CRUD, `bulkSyncSubjects`, scheduleSlots CRUD, timetables CRUD (multipart), `timetablesClassesStatus`, teachers/assignments | `/academics/` |
| `studentsAPI` | CRUD + `fullProfile`, `qrCode` | `/students/` |
| `teachersAPI` | CRUD + `fullProfile`, `qrCode`, `bulkSetup` | `/teachers/` |
| `gradesAPI` | `list`, CRUD, `subjects`, `reportCards`, `generateReportCard`, `auditLog`, examTypes CRUD, `bulkEnter`, `publishGrades`, `correctGrade`, subjectAverages (recalc/override/publish), trimesterAverages (recalc/override/publish/lock/unlock), appeals (list/create/respond/pendingCount) | `/grades/` |
| `attendanceAPI` | `list`, `mark`, `bulkMark`, `excuses`, `stats`, `justify`, `cancel`, `report` (blob) | `/attendance/` |
| `financeAPI` | fees CRUD, payments CRUD, `stats`, `expiringSoon`, `sendReminder`, `bulkReminder`, `report` (blob) | `/finance/` |
| `announcementsAPI` | CRUD | `/announcements/` |
| `chatAPI` | conversations CRUD, messages, `uploadAttachment`, `contacts` | `/chat/` |
| `notificationsAPI` | `list`, `markRead` | `/notifications/` |
| `homeworkAPI` | CRUD + `stats`, `calendar`, `overload` | `/homework/` |
| `platformSettingsAPI` | `get`, `update` | `/platform/settings/` |
| `activityLogsAPI` | `list` | `/platform/activity-logs/` |
| `systemHealthAPI` | `check` | `/platform/health/` |

---

## 5. Shared UI Component Library

**Directory**: `components/ui/`  
**Barrel export**: `components/ui/index.ts`  
**Status**: ✅ All fully implemented with custom CSS

| Component | Purpose |
|---|---|
| `StatCard` | Dashboard stat counter with icon, value, subtitle, trend |
| `PageHeader` | Page title + subtitle + icon + action buttons container |
| `StatusBadge` | Color-coded status label (active/inactive/expired/etc.) |
| `EmptyState` | Illustrated empty state with message and optional CTA |
| `LoadingSkeleton` | Animated skeleton (variants: table, cards, profile) |
| `DataCard` | White card with header (title + actions) + body |
| `IconButton` | Circular icon button with tooltip |
| `Avatar` | User avatar with gradient background + initials fallback |
| `SearchInput` | Debounced search input with clear button |
| `Breadcrumbs` | Navigation breadcrumb trail |
| `GlassCard` | Frosted glass effect card (used in profiles) |
| `SectionHeader` | Section divider with title + optional action |
| `ProgressBar` | Horizontal progress bar with label |
| `GradeAuditTimeline` | Timeline component showing grade change history |
| `Toast` + `ToastProvider` | Custom toast notification system (success/error/warning/info) |
| `ConfirmDialog` + `ConfirmProvider` | Promise-based confirmation modal with destructive-action text-confirm |
| `CommandPalette` | Ctrl+K command palette with fuzzy search across all routes |
| `ImportButtons` | Import Excel/CSV buttons with template download (.xlsx generation via SheetJS) |

**Additional components**:
- `components/layout/AppLayout.tsx` — Sidebar + Header + Content wrapper
- `components/layout/Header.tsx` — Breadcrumbs, notifications dropdown, user menu, fullscreen toggle, clock
- `components/layout/Sidebar.tsx` — Collapsible navigation with school branding / ILMI logo
- `components/IDCard/IDCard.tsx` — Credit-card-sized ID card renderer (85.6×54mm) with PDF/PNG export via html2canvas + jsPDF
- `components/setup/EditableClassChip.tsx` — Editable chip for class names in wizard
- `components/setup/CustomStreamForm.tsx` — Form for adding custom streams/groups

---

## 6. Module-by-Module Analysis

### 6.1 Dashboard (School Admin)

**File**: `pages/Dashboard.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/dashboard`

| Feature | Implementation |
|---|---|
| Live stats | Students, teachers, classes, attendance rate, unread messages, today's announcements |
| Quick actions | 6-card grid: add student, mark attendance, enter grades, new announcement, view payments, messaging |
| Class table | List of classes with student count, average, homeroom teacher |
| Auto-refresh | 60-second polling interval |
| API hooks | `useDashboardStats`, `useClasses`, `useNotifications`, `useAnnouncements`, `useAttendance`, `useConversations` |

### 6.2 Login

**File**: `pages/LoginPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/login`

| Feature | Implementation |
|---|---|
| Phone + password form | Ant Design Form with validation |
| Branding | Split layout: left branding panel (ILMI logo + tagline), right login form |
| Error handling | 401 ("identifiants incorrects"), 429 ("trop de tentatives") |
| Post-login redirect | `SUPER_ADMIN` → `/platform/dashboard`, others → `/dashboard` |

### 6.3 Students

**Files**: `pages/StudentList.tsx`, `pages/StudentDetail.tsx`, `pages/StudentProfilePage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Routes**: `/students`, `/students/:id`, `/students/:id/profile`

| Feature | Implementation |
|---|---|
| **List** — CRUD table | Search, pagination, class filter, add/edit drawer |
| **List** — CSV import | Smart header mapping (maps French column names to API fields) |
| **List** — Export | CSV (with BOM for Excel) + PDF |
| **List** — Quick stats | Active/inactive counts in stat cards |
| **Detail** — Multi-tab | Profil, Absences, Notes, Paiements, Comportement, Enseignants |
| **Detail** — Inline edit | Edit modal for personal information |
| **Profile** — Rich page | Full profile with `useStudentFullProfile`, sections: identity, grades chart (Recharts), payments, teachers, absences summary, appeals list |
| **Profile** — ID card | Printable ID card with QR code (via `IDCard` component) |
| **Profile** — QR code | `useStudentQRCode` for QR generation |

**API endpoints**: `studentsAPI.list/get/create/update/delete/fullProfile/qrCode`

### 6.4 Teachers

**Files**: `pages/TeacherList.tsx`, `pages/TeacherProfilePage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Routes**: `/teachers`, `/teachers/:id/profile`

| Feature | Implementation |
|---|---|
| CRUD table | Search, pagination, add/edit drawer |
| Last login status | Color-coded tags (green = active recently, red = inactive) |
| Subject assignment | Multi-select dropdown in edit form |
| CSV + PDF export | ✅ |
| Profile page | Navy header, sections card, subjects, classrooms, schedule, QR code, ID card, teaching stats |
| Bulk setup | `useBulkSetupTeachers` hook exists |

**API endpoints**: `teachersAPI.list/get/create/update/delete/fullProfile/qrCode/bulkSetup`

### 6.5 Classes

**File**: `pages/ClassManagement.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/classes`

| Feature | Implementation |
|---|---|
| CRUD table | Search (debounced), pagination |
| Create/Edit modal | Name, level dropdown, capacity, homeroom teacher selector |
| Data display | Student count, teacher name, level name |

**API endpoints**: `academicsAPI.classes.list/create/update/delete`

### 6.6 Grades & Report Cards

**Files**: `pages/GradeManagement.tsx` (legacy), `pages/GradesFullPage.tsx` (main), `pages/grades/tabs/` (4 tabs), `pages/grades/components/` (6 sub-components)  
**Status**: ✅ FULLY IMPLEMENTED — Most complex module  
**Routes**: `/grades` (legacy), `/notes-bulletins` (main)

#### GradesFullPage — 4-Tab System

**Cascade filter**: Section → Level → Class → Trimester (1/2/3)

| Tab | File | Features |
|---|---|---|
| **Exam Types** | `ExamTypesTab.tsx` | CRUD exam types per subject. Percentage validation (must sum to 100%). Grouped by subject with progress bars. Inline add/edit. Quick-add for subjects without exam types. |
| **Grade Entry** | `GradeEntryTab.tsx` | Bulk grade entry table per exam type. Select subject + exam type, enter scores for all students. Local dirty-state tracking. Bulk save. Publish grades. Absent marking. |
| **Averages** | `AveragesTab.tsx` | Pivot table: students × subjects with averages. Subject average: recalculate, override (with reason), publish. Trimester average: recalculate, override, publish, lock/unlock (with confirmation text). Student ranking with `RankBadge`. `LockBadge` for locked trimesters. |
| **Appeals** | `AppealsTab.tsx` | List grade appeals/recourses. Filter by status (pending/under review/accepted/rejected) + type (exam/subject avg/trimester avg). Accept/reject with corrected value. Pending count badge. `AppealCard` component for each appeal. |

#### Sub-components (`pages/grades/components/`)

| Component | Purpose |
|---|---|
| `GradeInput` | Score input with max validation + absent toggle |
| `AverageCell` | Inline-editable average value with override flow |
| `PublishButton` | Publish action button with loading state |
| `LockBadge` | Lock/unlock indicator for trimester status |
| `RankBadge` | Student rank display (1st/2nd/3rd gold/silver/bronze) |
| `AppealCard` | Appeal detail card with respond form |

#### GradeManagement (Legacy)

| Feature | Implementation |
|---|---|
| Grade CRUD table | Search, pagination, CSV import for bulk grades |
| CSV + PDF export | ✅ |
| Audit timeline | `GradeAuditTimeline` drawer with grade change history |
| Report card generation | `useGenerateReportCard` |

**API endpoints**: `gradesAPI.*` — 20+ endpoints covering exam types, grades, averages, appeals, audit, report cards

### 6.7 Attendance

**File**: `pages/AttendancePage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/attendance`

| Feature | Implementation |
|---|---|
| List view | Table with search, filters (status, class, justified, date range) |
| Grid view | Weekly matrix by class — shows attendance per student per day |
| Individual marking | Mark student absent/present |
| Bulk marking | Mark entire class at once |
| Justify/Cancel | Justify absence with reason, cancel attendance record |
| Stats dashboard | Today/week/month attendance counts, at-risk students count |
| Export | CSV + PDF |
| Cell detail modal | Click grid cell to see/edit attendance details |

**API endpoints**: `attendanceAPI.list/mark/bulkMark/excuses/stats/justify/cancel/report`

### 6.8 Homework

**File**: `pages/HomeworkPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/homework`

| Feature | Implementation |
|---|---|
| List view | Table with filters (class, teacher, subject, date range, search) |
| Calendar view | Monthly calendar grid showing homework per day |
| Overload detection | Alerts when too many assignments on same day/week |
| Stats cards | Total, this week, this month, overdue, corrected |
| Detail drawer | Side drawer with full homework details |
| Delete | Delete with reason |
| Export | CSV + PDF |

**API endpoints**: `homeworkAPI.list/get/create/update/delete/stats/calendar/overload`

### 6.9 Timetable

**File**: `pages/TimetablePage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED (image-based)  
**Route**: `/timetable`

| Feature | Implementation |
|---|---|
| Upload | Drag-and-drop PNG/JPG/PDF per class (multipart FormData) |
| File validation | Size + type validation |
| Class overview | Table showing configured vs unconfigured classes |
| Lightbox | Full-size image viewer |
| CRUD | Upload, edit (replace), delete timetable images |
| Filter | By class |

**Note**: This is an image-based timetable system — admins upload timetable images rather than configuring slots in a structured interface.

**API endpoints**: `academicsAPI.timetables.list/create/update/delete`, `timetablesClassesStatus`

### 6.10 Announcements

**File**: `pages/AnnouncementsPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/announcements`

| Feature | Implementation |
|---|---|
| CRUD | Create, read, update, delete announcements |
| Pinning | Pin/unpin announcements (pinned shown first) |
| Urgency | Mark announcements as urgent |
| Scheduling | Set future date for scheduled announcements |
| Audience targeting | All, parents, students, teachers, specific class, specific section, specific users |
| Channel selection | App push notification, SMS, or both |
| Search + filter | Search by content, filter by audience |
| Stats | Total, urgent, scheduled, sent-today counts |

**API endpoints**: `announcementsAPI.list/get/create/update/delete`

### 6.11 Messaging (Real-time Chat)

**File**: `pages/MessagingPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/messaging`

| Feature | Implementation |
|---|---|
| WebSocket chat | Real-time via `ws://host/ws/chat/{conversationId}/?token=...` |
| Conversation list | Sidebar with search, unread count badges |
| Contact selector | Modal grouped by role (enseignants, parents, élèves, admins) |
| Messages | Display with date separators, sender avatar, timestamps |
| Attachments | Image + PDF upload (max 10MB), image lightbox |
| Auto-reconnect | Exponential backoff, max 10 reconnects |
| Delete conversation | With confirmation |
| Auto-scroll | Scrolls to latest message |
| Auto-resize textarea | Grows with content |

**Hooks**: `useChat` (WebSocket), `useConversations`, `useMessages`, `useContacts`, `useUploadAttachment`

### 6.12 Notifications

**File**: `pages/NotificationsPage.tsx`  
**Status**: ✅ MOSTLY IMPLEMENTED (send API is TODO)  
**Route**: `/notifications`

| Feature | Implementation |
|---|---|
| List | Notification list with type-based icons and colors |
| Filters | All / Unread / Read |
| Mark as read | Individual + mark all as read |
| Relative time | "Il y a 5min", "Il y a 2h", etc. |
| Type styling | Info/warning/success/error/PAYMENT/ATTENDANCE/HOMEWORK/GRADE/ANNOUNCEMENT |
| **Super Admin: Send notifications** | Form with target (all admins, specific school, super admins), priority (normal/urgent), title/content |
| ⚠️ Send API call | **TODO** — marked in code as not yet connected to backend |

**API endpoints**: `notificationsAPI.list/markRead`

### 6.13 Financial / Payments

**File**: `pages/FinancialPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/financial`

| Feature | Implementation |
|---|---|
| Payments CRUD | Create/edit/delete payments with method (espèces/BaridiMob/CIB/virement) |
| Fee structures CRUD | Create/edit fee structures (monthly/trimesterly/annual amounts) |
| Stats dashboard | Monthly/yearly totals, active/expired/never-paid counts |
| Expiring soon alerts | List of payments expiring within configured days |
| Reminders | Send individual reminder, bulk reminders |
| Search + filter | Student name search, status filter, payment type, date range |
| Export | CSV + PDF |

**API endpoints**: `financeAPI.fees.list/create/update/delete`, `financeAPI.payments.list/create/update/delete`, `stats`, `expiringSoon`, `sendReminder`, `bulkReminder`, `report`

### 6.14 Analytics (School)

**File**: `pages/AnalyticsPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/analytics`

| Feature | Implementation |
|---|---|
| Overview stats | Students, teachers, classes, attendance rate |
| Class distribution | Bar chart (Recharts) — students per class |
| Payment status | Pie chart — paid/partial/expired/never |
| Chronic absenteeism | Configurable threshold, list of at-risk students |
| Class attendance comparison | Bar chart comparing attendance across classes |
| Teacher engagement | Submission rates per teacher |

**Data source**: Real API data via `useDashboardStats`, `useClasses`, `useAttendance`, `usePayments`, `useTeachers`

### 6.15 Settings (School)

**File**: `pages/SettingsPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/settings`

| Tab | Features | Persistence |
|---|---|---|
| **Profil** | Edit name, email | API |
| **Sécurité** | Change password (current + new + confirm) | API |
| **Notifications** | Toggle: email, SMS, enrollment alerts, payment alerts, absence alerts | `localStorage` |
| **Général** | Language selector, timezone, academic year display | `localStorage` |

### 6.16 User Management

**File**: `pages/UserManagement.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/users` (school), `/platform/users` (super admin)

| Feature | Implementation |
|---|---|
| CRUD table | Role-based filtering, search, pagination |
| Role restrictions | School admin sees: ADMIN, SECTION_ADMIN, TEACHER, PARENT, STUDENT; Super admin sees all + school filter |
| Create/Edit form | First name, last name, phone, email, role, school (super admin only) |
| Delete | With confirmation |
| Reset password | Modal for admin-initiated password reset |
| Role avatars | Color-coded gradient avatars per role |

**API endpoints**: `usersAPI.list/get/create/update/delete/resetPassword`

### 6.17 Setup Wizard (9-Step School Config)

**Files**: `pages/setup/SetupWizard.tsx`, `pages/setup/steps/Step1-Step9.tsx`  
**Hook**: `hooks/useSetupWizard.ts`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/setup`

| Step | Name | Description |
|---|---|---|
| 1 | **Profil de l'école** | Logo upload, name, address, wilaya (48 Algerian provinces), phone, email |
| 2 | **Année scolaire** | Configure academic year + trimester dates |
| 3 | **Sections (Cycles)** | Enable/disable Primary, Middle (CEM), High school sections |
| 4 | **Niveaux & Classes** | 4A: Toggle levels per cycle; 4B: Configure class count + names per level. Custom streams per level. Editable class name chips. |
| 5 | **Matières & Coefficients** | Pre-filled from MEN curriculum. Inline-editable name, code, coefficient, mandatory flag. Add custom subjects. Reset to MEN defaults. |
| 6 | **Enseignants** | Add teachers with subject/class assignments |
| 7 | **Élèves** | Add students with class assignments |
| 8 | **Récapitulatif** | Summary dashboard: counts of sections, levels, classes, subjects, teachers, students. Detailed review of all configured items. |
| 9 | **Finalisation** | Submit configuration, show completion status |

**Key features**:
- `localStorage` persistence (survives page refresh)
- Auto-generates defaults from school sections (Primary/Middle/High)
- Uses `algerian-curriculum.ts` constants for levels, subjects, coefficients, streams
- Dirty-flag tracking per step
- Back/next navigation with validation
- `completeSetup` API call on final submission

---

## 7. Super Admin Platform

### 7.1 Super Admin Dashboard

**File**: `pages/superadmin/SuperAdminDashboard.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/dashboard`

| Feature | Implementation |
|---|---|
| Platform stats | Total schools, active subscriptions, total users, subscription rate |
| Plan distribution | Bar chart by plan (Starter/Pro/Pro+AI) |
| Quick actions | Add school, manage users, subscriptions, settings |
| Recent schools table | Latest registered schools |
| Recent users table | Latest created users |

**API**: `usePlatformStats`, `useSchools`, `useUsers`

### 7.2 School Management

**File**: `pages/SchoolManagement.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/schools`

| Feature | Implementation |
|---|---|
| Multi-step creation | 4-step wizard: Identity → Category → Subscription → Administrator |
| Grid + List views | Toggle between card grid and table list |
| Full CRUD | Create, view, edit, delete schools |
| Logo upload | File upload with preview |
| 48 Wilayas | Full Algerian wilaya selection dropdown |
| School categories | Private School, Training Center (with training types) |
| Section toggles | Primary, Middle, High school |
| Subscription plans | STARTER, PRO, PRO_AI with feature descriptions |
| Admin credentials | Show generated admin credentials after school creation |
| Client-side filters | By plan, status, category |

**API endpoints**: `schoolsAPI.list/get/create/update/delete/uploadLogo`

### 7.3 Plan / Subscription Management

**File**: `pages/superadmin/PlanManagement.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/plans`

| Feature | Implementation |
|---|---|
| Plan cards | Three plans (STARTER/PRO/PRO_AI) with feature lists + pricing |
| School table | Schools with current plan, status, actions |
| Toggle subscription | Activate/deactivate school subscription |
| Change plan | Modal to assign different plan to school |
| Filters | By plan, status |

**API**: `usePlatformStats`, `useSchools`, `useUpdateSchool`

### 7.4 Platform Analytics

**File**: `pages/superadmin/SuperAdminAnalytics.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/analytics`

| Feature | Implementation |
|---|---|
| Date range presets | 7d, 30d, 3m, 1y, all |
| Plan distribution | Pie chart by subscription plan |
| Active vs inactive | Percentage display |
| Growth by month | Dual-line chart (schools + users) |
| Schools by wilaya | Horizontal bar chart (top 10) |
| Subscription lifecycle | Stacked area chart |
| Top schools table | Top 10 by student count with ranking |

**Data source**: `usePlatformStats`, `useSchools` (client-side computed)

### 7.5 Activity Logs

**File**: `pages/superadmin/ActivityLogsPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/activity-logs`

| Feature | Implementation |
|---|---|
| Log table | Paginated (25/page), search, action filter |
| Action types | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT, SCHOOL_CREATED, SUBSCRIPTION_CHANGED, IMPERSONATION_STARTED (14 types) |
| Color-coded actions | Icon + color per action type |
| Expandable rows | Click to see payload/details |
| Relative time | "Il y a 5min", "Il y a 2j" |
| CSV export | ✅ |
| Refresh | Manual refresh button |

**API**: `useActivityLogs`

### 7.6 System Health Monitoring

**File**: `pages/superadmin/SystemHealthPage.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/system-health`

| Service Monitored | Details |
|---|---|
| Django API | Status, response time, version |
| PostgreSQL | Connections, response time |
| Redis Cache | Memory usage, connected clients |
| File Storage | Used percent, total |
| Celery Workers | Active workers, pending tasks |
| FCM Push (external) | Always marked as operational |

| Feature | Implementation |
|---|---|
| Auto-refresh | 30-second interval (toggleable) |
| Service cards | Status indicator (green/red), details, response time |
| Healthy count | X/6 services operational |
| Last refresh time | Displayed in header |

**API**: `useSystemHealth` → `GET /api/v1/platform/health/`

### 7.7 Platform Settings

**File**: `pages/superadmin/PlatformSettings.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Route**: `/platform/settings`

| Tab | Settings |
|---|---|
| **Général** | Maintenance mode toggle, open registration toggle, default language |
| **Sécurité** | 2FA toggle, account lockout toggle, max login attempts, JWT session duration |
| **Notifications** | Email notifications, push notifications, subscription expiry alerts, expiry warning days |

**Persistence**: `localStorage` + API (`platformSettingsAPI.get/update`)  
**Extra**: Test email button (simulated)

---

## 8. Constants & Data

### `constants/algerian-curriculum.ts`
**Status**: ✅ COMPREHENSIVE — defines the entire Algerian MEN (Ministry of Education) curriculum

| Data | Content |
|---|---|
| **Cycle colors** | PRIMARY (green), MIDDLE/CEM (amber), HIGH/Lycée (red) |
| **Streams (Filières)** | 2 Tronc Commun (TC Sciences, TC Lettres) + 6 specializations (Sciences Exp., Maths, Tech Maths, Lettres/Philo, Langues Étrangères, Gestion/Éco) |
| **Levels (16 total)** | PREP, 1AP-5AP (Primary /10), 1AM-4AM (Middle /20), 1AS-3AS (High /20) — each with maxGrade, passingGrade, stream associations |
| **Subjects (20)** | Full catalog with French name, Arabic name, color code |
| **Subject assignments** | Per-level mandatory subjects with coefficients: Primaire (6-10 subjects), Moyen/CEM (15 subjects), Lycée 1AS by tronc commun, 2AS/3AS by filière (official BAC coefficients) |

### `data/mockData.ts`
Contains: List of 48 Algerian wilayas

---

## 9. Hooks Library

**Directory**: `hooks/`

| Hook | File | Purpose |
|---|---|---|
| `useApi` (50+ hooks) | `useApi.ts` | React Query wrappers for every API service. Includes queries + mutations with cache invalidation. |
| `useDebounce` | `useDebounce.ts` | Debounces a value (default 300ms) |
| `useExport` | `useExport.ts` | `exportToCSV` (SheetJS with BOM) + `exportToPDF` (HTML table → print window) |
| `usePageTitle` | `usePageTitle.ts` | Sets `document.title` based on current route |
| `useSetupWizard` | `useSetupWizard.ts` | State machine for 9-step wizard with localStorage persistence, MEN defaults, dirty tracking |
| `useWebSocket` | `useWebSocket.ts` | `useChat` — WebSocket connection per conversation with exponential backoff reconnect |

---

## 10. Quality Assessment Summary

### Implementation Maturity

| Rating | Count | Modules |
|---|---|---|
| ✅ **Fully Implemented** | 28/29 | Dashboard, Login, Students (3 pages), Teachers (2), Classes, Grades (full system with 4 tabs + 6 sub-components), Attendance, Homework, Timetable, Announcements, Messaging, Financial, Analytics, Settings, User Management, Setup Wizard (9 steps), + all 7 Super Admin pages |
| ⚠️ **Mostly Implemented** | 1/29 | Notifications (send-to-school API call is TODO) |
| 🚫 **Placeholder / Not implemented** | 0 | None |

### Strengths

1. **Consistent patterns**: Every page follows the same structure (PageHeader + stat cards + DataCard table + drawer/modal forms).
2. **Full French localization**: All UI text, error messages, labels are in French.
3. **Comprehensive API coverage**: Every feature makes real API calls — no hardcoded mock data in pages.
4. **Role-aware everywhere**: Route guards, sidebar navigation, form fields, and data filters adapt to user role.
5. **Export everywhere**: CSV + PDF export on every data table (Students, Teachers, Grades, Attendance, Homework, Financial, Activity Logs).
6. **Custom component library**: 15+ reusable UI components with consistent styling.
7. **Complex grades system**: Full exam types → grade entry → averages → trimester locking → appeals pipeline.
8. **Real-time chat**: WebSocket-based messaging with reconnection logic.
9. **9-step setup wizard**: Comprehensive school onboarding with MEN curriculum pre-population.
10. **Algerian curriculum data**: Complete levels, subjects, coefficients, and streams matching MEN specifications.

### Areas for Improvement

1. **No test suite**: Zero unit/integration tests. No test framework configured in `package.json`.
2. **No i18n framework**: French strings are hardcoded. No `react-intl` or `i18next` for future Arabic/English support.
3. **localStorage for settings**: Notification preferences and general settings persist only locally, not per-user on the server.
4. **Image-based timetable**: Timetable is upload-only (no structured schedule builder).
5. **No offline support**: No service worker or PWA capabilities.
6. **No error boundary**: No React error boundaries for crash recovery.
7. **Some `any` types**: A few `as any` casts exist (e.g., in Header.tsx notification filtering).
8. **Send notification TODO**: The super admin send-notification function has no API call wired up yet.
9. **No pagination info display**: Some tables lack total record count display.
10. **Discipline module missing**: Sidebar doesn't include a discipline/behavior page despite `StudentDetail` having a "Comportement" tab.

### File Count Summary

| Category | Count |
|---|---|
| Page components | 29 files |
| Grade sub-components | 10 files (4 tabs + 6 components) |
| Setup wizard steps | 9 files |
| UI components | 15 files |
| Layout components | 4 files (+ CSS each) |
| Hooks | 6 files |
| API layer | 2 files |
| Context | 1 file |
| Types | 4 files |
| Constants | 1 file |
| **Total source files** | **~81 files** |

# EduConnect DZ — Authentication & Admin Management

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [User Roles](#user-roles)
3. [Authentication Flow](#authentication-flow)
4. [Creating Admin Users](#creating-admin-users)
5. [School Management](#school-management)
6. [Multi-Admin per School](#multi-admin-per-school)
7. [API Endpoints](#api-endpoints)
8. [CLI Commands](#cli-commands)
9. [First Login Flow](#first-login-flow)
10. [Security](#security)

---

## Architecture Overview

EduConnect uses a **multi-tenant** architecture where each school is a tenant.
- **Backend**: Django 5.x + Django REST Framework + SimpleJWT
- **Admin Panel**: React + Vite + Ant Design
- **Authentication**: JWT (JSON Web Tokens) with access/refresh token pair
- **User Model**: Custom `AbstractBaseUser` with `phone_number` as the unique identifier (no username)

---

## User Roles

| Role | Code | Scope | Description |
|------|------|-------|-------------|
| Super Admin | `SUPER_ADMIN` | Global | Platform owner. No school assigned. Can manage all schools and users. |
| Admin | `ADMIN` | School | School administrator. Full control within their school. |
| Section Admin | `SECTION_ADMIN` | School | Manages a section (Primary/Middle/High) within a school. |
| Teacher | `TEACHER` | School | Teacher within a school. |
| Parent | `PARENT` | School | Parent of students in a school. |
| Student | `STUDENT` | School | Student enrolled in a school. Uses PIN login. |

**Key rule**: All roles except `SUPER_ADMIN` **must** belong to a school.

---

## Authentication Flow

### 1. Standard Login (Phone + Password)

```
POST /api/v1/auth/login/
Content-Type: application/json

{
  "phone_number": "0550000000",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "role": "SUPER_ADMIN",
  "is_first_login": false,
  "school_id": null
}
```

The JWT `access` token contains custom claims: `role`, `school_id`, `is_first_login`.

### 2. PIN Login (Students Only)

```
POST /api/v1/auth/login/pin/
{
  "phone_number": "0551234567",
  "pin": 1234
}
```

Rate-limited: 5 failed attempts → 30-minute lockout per phone number.

### 3. Token Refresh

```
POST /api/v1/auth/refresh/
{ "refresh": "eyJ..." }
```

The admin panel automatically refreshes expired tokens via an Axios interceptor.

### 4. Token Storage

- Tokens are stored in `localStorage` as `access_token` and `refresh_token`
- The Axios interceptor attaches `Authorization: Bearer <token>` to all API requests
- On 401 responses, the interceptor attempts a silent refresh before redirecting to login

---

## Creating Admin Users

### Via Admin Panel (Recommended)

1. **Login** as `SUPER_ADMIN` or `ADMIN`
2. Navigate to **Utilisateurs** (Users) in the sidebar
3. Click **"Nouvel Utilisateur"**
4. Fill in **all required fields**:
   - First name (Prénom) — **required**
   - Last name (Nom) — **required**
   - Phone number — **required**, must be unique
   - Email — optional
   - Role — **required** (ADMIN, SECTION_ADMIN, TEACHER, PARENT, STUDENT)
   - School — **required** for all roles except SUPER_ADMIN (auto-assigned for school admins)
   - Password — **required**, minimum 8 characters
5. Click **"Créer l'utilisateur"**

### Via API

```
POST /api/v1/auth/users/
Authorization: Bearer <superadmin_token>
Content-Type: application/json

{
  "first_name": "Ahmed",
  "last_name": "Bouzid",
  "phone_number": "0551234567",
  "email": "ahmed@ecole.dz",
  "role": "ADMIN",
  "school": "<school-uuid>",
  "password": "securepass123"
}
```

### Via CLI (Management Command)

```bash
python manage.py setup_school \
  --name "Ecole Ibn Khaldoun" \
  --code "eik" \
  --admin-email "admin@eik.dz" \
  --admin-password "securepass123" \
  --admin-first-name "Ahmed" \
  --admin-last-name "Bouzid"
```

This creates both a school and its first admin user in one step.

### Create Django Superuser (SUPER_ADMIN)

```bash
python manage.py createsuperuser
# Enter phone_number, first_name, last_name, role, password
```

---

## School Management

### Creating a New School

**Only SUPER_ADMIN** can create schools.

#### Via Admin Panel

1. Login as `SUPER_ADMIN`
2. Navigate to **Écoles** in the sidebar
3. Click **"Nouvelle École"**
4. Fill in:
   - School name — **required**
   - Subdomain — **required**, lowercase letters/numbers/hyphens only (e.g., `ibn-khaldoun`)
   - Address, phone, email — optional
   - Subscription plan — **required** (STARTER / PRO / PRO_AI)
5. Click **"Créer l'école"**

#### Via API

```
POST /api/v1/schools/
Authorization: Bearer <superadmin_token>

{
  "name": "Ecole Ibn Khaldoun",
  "subdomain": "ibn-khaldoun",
  "address": "123 Rue Didouche, Alger",
  "phone": "0551234567",
  "email": "contact@eik.dz",
  "subscription_plan": "PRO"
}
```

### Viewing Schools

- **SUPER_ADMIN**: Sees all schools, can search by name/subdomain
- **ADMIN / SECTION_ADMIN**: Can only see their own school via `/api/v1/schools/my-school/`

---

## Multi-Admin per School

EduConnect supports **multiple admin users per school**. This is the recommended setup for large schools.

### How It Works

- Multiple users with role `ADMIN` can be assigned to the same school via the `school` foreign key
- Each admin has **full access** to all data within their school
- There is **no limit** on the number of admins per school

### Assigning a New Admin to an Existing School

#### Option 1: Via School Management Page

1. Login as `SUPER_ADMIN`
2. Go to **Écoles**
3. Find the school card
4. Click the **"Add Admin"** button (person+ icon)
5. Fill in the admin's details and password
6. The system automatically assigns them as `ADMIN` for that school

#### Option 2: Via User Management Page

1. Login as `SUPER_ADMIN`
2. Go to **Utilisateurs**
3. Click **"Nouvel Utilisateur"**
4. Set role to `ADMIN`
5. **Select the existing school** from the dropdown
6. Fill in all required fields and create

#### Option 3: Via API

```
POST /api/v1/auth/users/
Authorization: Bearer <superadmin_token>

{
  "first_name": "Fatima",
  "last_name": "Benali",
  "phone_number": "0559876543",
  "email": "fatima@eik.dz",
  "role": "ADMIN",
  "school": "<existing-school-uuid>",
  "password": "securepass123"
}
```

### Viewing School Admins

- On the **Schools** page, click "Add Admin" to see the list of existing admins for that school
- On the **Users** page, filter by school and role=ADMIN to see all admins

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/login/` | Login with phone + password | Public |
| POST | `/api/v1/auth/login/pin/` | PIN login (students) | Public |
| POST | `/api/v1/auth/refresh/` | Refresh JWT token | Public |
| GET | `/api/v1/auth/me/` | Get current user profile | Authenticated |
| PATCH | `/api/v1/auth/me/` | Update own profile | Authenticated |
| POST | `/api/v1/auth/change-password/` | Change own password | Authenticated |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/auth/users/` | List users (filtered by school for admins) | SUPER_ADMIN, ADMIN, SECTION_ADMIN |
| POST | `/api/v1/auth/users/` | Create a new user | SUPER_ADMIN, ADMIN, SECTION_ADMIN |
| GET | `/api/v1/auth/users/<id>/` | Get user details | SUPER_ADMIN, ADMIN, SECTION_ADMIN |
| PATCH | `/api/v1/auth/users/<id>/` | Update user | SUPER_ADMIN, ADMIN, SECTION_ADMIN |
| DELETE | `/api/v1/auth/users/<id>/` | Deactivate user (soft delete) | SUPER_ADMIN, ADMIN, SECTION_ADMIN |
| POST | `/api/v1/auth/users/<id>/reset-password/` | Reset a user's password | SUPER_ADMIN, ADMIN, SECTION_ADMIN |

**Query parameters for GET `/api/v1/auth/users/`:**
- `role` — Filter by role (e.g., `?role=ADMIN`)
- `school` — Filter by school UUID (SUPER_ADMIN only)
- `search` — Search by name, phone, or email
- `is_active` — Filter by active status (`true`/`false`)

### School Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/schools/` | List schools | SUPER_ADMIN (all), ADMIN (own only) |
| POST | `/api/v1/schools/` | Create a school | SUPER_ADMIN only |
| GET | `/api/v1/schools/<id>/` | Get school details | SUPER_ADMIN, ADMIN (own only) |
| PATCH | `/api/v1/schools/<id>/` | Update school | SUPER_ADMIN only |
| DELETE | `/api/v1/schools/<id>/` | Delete school | SUPER_ADMIN only |
| GET | `/api/v1/schools/my-school/` | Get current user's school | ADMIN, SECTION_ADMIN |

---

## CLI Commands

### Create a school with its first admin

```bash
python manage.py setup_school \
  --name "School Name" \
  --code "subdomain" \
  --admin-email "admin@school.dz" \
  --admin-password "securepass" \
  --admin-first-name "First" \
  --admin-last-name "Last"
```

### Create a superuser

```bash
python manage.py createsuperuser
```

---

## First Login Flow

1. Admin creates a user with an initial password
2. The `is_first_login` flag is set to `True` by default
3. When the user logs in, the response includes `"is_first_login": true`
4. The admin panel can prompt the user to change their password
5. After changing password via `/api/v1/auth/change-password/`, `is_first_login` is set to `False`
6. Password resets (by admin) also set `is_first_login` back to `True`

---

## Security

### Password Requirements
- Minimum **8 characters**
- Stored as hashed (Django's `PBKDF2` by default)

### JWT Configuration
- Access token: short-lived (default 5 minutes, configurable in `settings.py`)
- Refresh token: longer-lived (default 1 day, configurable)
- Custom claims: `role`, `school_id`, `is_first_login`

### Rate Limiting
- PIN login: 5 failed attempts → 30-minute lockout per phone number
- Uses Django cache backend (Redis in production)

### Permission Model
- **Tenant isolation**: Users can only see data from their own school
- **Role-based access**: Each API endpoint enforces role checks
- **Soft delete**: Users are deactivated (not deleted) to preserve audit trail
- `IsSameSchool` permission class ensures cross-school data never leaks (returns 404, not 403)

### Audit Trail
- Every user has `created_by` foreign key tracking who created them
- Every school has `created_by` tracking which superadmin created it
- `created_at` timestamps on all records

---

## Default Superuser

After initial setup:
- **Phone**: `0550000000`
- **Password**: `admin123456`
- **Role**: `SUPER_ADMIN`

> ⚠️ **Change this password immediately in production!**

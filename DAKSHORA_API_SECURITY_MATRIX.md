# DAKSHORA 2.0 — API Security Matrix

**Standard**: Fail-Closed, Bearer JWT Cryptographically Verified, Least-Privilege RBAC  
**Total Endpoints Audited**: 385  

---

## 1. Gateway Routing Architecture

```
Incoming Request
      │
      ▼
Fastify Gateway (/api/*)
      │
      ├─ Pre-handler: Rate Limiter & Helmet Headers
      │
      ├─ /health, /health/supabase -> [Public Whitelist]
      ├─ /api/auth/login, /api/auth/otp/* -> [Rate-Limited Public Auth]
      ├─ /api/erp/admissions/leads/capture, /api/leads -> [Public Inquiries]
      │
      ├─ /api/admin/*, /api/superadmin/* -> [requireAuth + requireSuperAdmin]
      │
      └─ /api/erp/*, /api/websites/*, /api/organizations/* -> [requireAuth + resolveTenantOrgId]
```

---

## 2. API Endpoint Security Matrix (Representative Sample)

| Path | Method | Auth Required | Role Required | Tenant Scoped | Rate Limited | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/health` | GET | NO | Public | NO | Standard | **SECURE** |
| `/api/auth/login` | POST | NO | Public | NO | 10 req / min | **SECURE** |
| `/api/auth/otp/send` | POST | NO | Public | NO | 5 req / min | **SECURE** |
| `/api/auth/otp/verify` | POST | NO | Public | NO | 10 req / min | **SECURE** |
| `/api/erp/admissions/leads/capture`| POST | NO | Public | Optional | 15 req / min | **SECURE** |
| `/api/leads` | POST | NO | Public | Optional | 15 req / min | **SECURE** |
| `/api/leads` | GET | YES | School Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/leads/:id` | PATCH | YES | School Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/me` | GET | YES | Authenticated User | YES | Standard | **SECURE** |
| `/api/organizations` | GET | YES | Authenticated User | YES | Standard | **SECURE** |
| `/api/organizations` | POST | YES | SuperAdmin | Platform | Standard | **SECURE** |
| `/api/admin/dashboard` | GET | YES | SuperAdmin | Platform | Standard | **SECURE** |
| `/api/admin/organizations` | GET | YES | SuperAdmin | Platform | Standard | **SECURE** |
| `/api/admin/users` | GET | YES | SuperAdmin | Platform | Standard | **SECURE** |
| `/api/admin/subscriptions` | GET | YES | SuperAdmin | Platform | Standard | **SECURE** |
| `/api/erp/students` | GET | YES | Staff / Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/erp/students` | POST | YES | School Admin / Principal | YES | Standard | **SECURE** |
| `/api/erp/students/:id` | PATCH | YES | School Admin / Principal | YES | Standard | **SECURE** |
| `/api/erp/staff` | GET | YES | Staff / Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/erp/staff` | POST | YES | School Admin / HR | YES | Standard | **SECURE** |
| `/api/erp/attendance/student/daily`| GET/POST | YES | Teacher / School Admin | YES | Standard | **SECURE** |
| `/api/erp/attendance/staff/daily` | GET/POST | YES | Principal / Admin | YES | Standard | **SECURE** |
| `/api/erp/fees/overview` | GET | YES | Accountant / Admin | YES | Standard | **SECURE** |
| `/api/erp/fees/collect` | POST | YES | Cashier / Accountant | YES | Standard | **SECURE** |
| `/api/erp/exams/overview` | GET | YES | Teacher / Exam Incharge | YES | Standard | **SECURE** |
| `/api/erp/marks/bulk-save` | POST | YES | Subject Teacher / Admin | YES | Standard | **SECURE** |
| `/api/erp/timetable/overview` | GET | YES | Authenticated School User | YES | Standard | **SECURE** |
| `/api/erp/library/overview` | GET | YES | Librarian / Admin | YES | Standard | **SECURE** |
| `/api/erp/onboarding/status` | GET | YES | School Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/erp/onboarding/step/:step` | PATCH | YES | School Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/erp/onboarding/activate` | POST | YES | School Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/erp/ai/chat` | POST | YES | Authenticated Role | YES | Token Quota | **SECURE** |
| `/api/websites` | GET/POST | YES | School Admin / SuperAdmin | YES | Standard | **SECURE** |
| `/api/media` | GET | YES | Authenticated User | YES | Standard | **SECURE** |

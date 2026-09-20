# DAKSHORA 2.0 — Row Level Security (RLS) Matrix

**Database**: Supabase PostgreSQL 15+  
**Security Standard**: Strict Multi-Tenant Isolation with SuperAdmin Definer Override  

---

## 1. Security Architecture Summary

* **Tenant Isolation**: Handled via `public.is_org_member(target_org UUID)` function.
* **Super Admin Override**: Governed by `public.is_platform_superadmin()` which strictly evaluates `(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'superadmin'`.
* **Anonymous Requests**: Anonymous (`anon`) role has **0** SELECT, INSERT, UPDATE, or DELETE access to any operational ERP or platform table.

---

## 2. Complete RLS Matrix

| Table Name | RLS Enabled | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy | Tenant Isolation | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `organizations` | YES | Member / SuperAdmin | SuperAdmin | Member Admin / SuperAdmin | SuperAdmin | Enforced | **SECURE** |
| `organization_members` | YES | Own Member / SuperAdmin | Org Admin / SuperAdmin | Org Admin / SuperAdmin | Org Admin / SuperAdmin | Enforced | **SECURE** |
| `roles` | YES | Authenticated | SuperAdmin | SuperAdmin | SuperAdmin | Platform Scope | **SECURE** |
| `permissions` | YES | Authenticated | SuperAdmin | SuperAdmin | SuperAdmin | Platform Scope | **SECURE** |
| `role_permissions` | YES | Authenticated | SuperAdmin | SuperAdmin | SuperAdmin | Platform Scope | **SECURE** |
| `schools` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `academic_sessions` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `classes` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `sections` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `subjects` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `section_subjects` | YES | Via `sections.org_id` | Via `sections.org_id` | Via `sections.org_id` | Via `sections.org_id` | Enforced | **SECURE** |
| `students` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `parents` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `student_parents` | YES | Via `students.org_id` | Via `students.org_id` | Via `students.org_id` | Via `students.org_id` | Enforced | **SECURE** |
| `student_enrollments` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `staff` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `student_attendance` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `staff_attendance` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `timetables` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `homework` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `exams` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `exam_subjects` | YES | Via `exams.org_id` | Via `exams.org_id` | Via `exams.org_id` | Via `exams.org_id` | Enforced | **SECURE** |
| `marks` | YES | Via `exams.org_id` | Via `exams.org_id` | Via `exams.org_id` | Via `exams.org_id` | Enforced | **SECURE** |
| `fee_structures` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `student_fees` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `fee_payments` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `notices` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `notifications` | YES | Own User / SuperAdmin | Org Member / SuperAdmin | Own User / SuperAdmin | Own User / SuperAdmin | Enforced | **SECURE** |
| `transport_routes` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `vehicles` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `student_transport` | YES | Via `students.org_id` | Via `students.org_id` | Via `students.org_id` | Via `students.org_id` | Enforced | **SECURE** |
| `library_books` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `library_transactions` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `leave_requests` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `payroll` | YES | Org Admin / SuperAdmin | Org Admin / SuperAdmin | Org Admin / SuperAdmin | Org Admin / SuperAdmin | Enforced | **SECURE** |
| `documents` | YES | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Org Member / SuperAdmin | Enforced | **SECURE** |
| `audit_logs` | YES | Org Admin / SuperAdmin | Authenticated System | Read-Only (No UPDATE) | Read-Only (No DELETE) | Enforced | **SECURE** |

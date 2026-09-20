# DAKSHORA 2.0 — Database & Schema Audit

**Database**: Supabase PostgreSQL 15+  
**Target Project**: `wrzbgezrrlvxnuthgqwg.supabase.co`  
**Audit Scope**: Migrations 011 to 024, Schema Integrity, Indexes, Foreign Keys, RLS  

---

## 1. Schema Overview & Migration History

| Migration | File | Description | Status |
| :---: | :--- | :--- | :---: |
| **011** | `011_library_management.sql` | Library books, categories, members, transactions, and fines. | Applied |
| **013** | `013_reports_analytics.sql` | Reporting views, audit rollups, and analytics presets. | Applied |
| **014** | `014_dakshora_ai.sql` | AI conversations, token tracking, and vector collections. | Applied |
| **015** | `015_erp_production_hardening_settings.sql` | School master settings, campuses, and configuration JSONB. | Applied |
| **016** | `016_erp_timetable_scheduling.sql` | Bell schedules, rooms, timetable slots, teacher substitutions. | Applied |
| **017** | `017_erp_parent_student_portal.sql` | Parent-student mapping, emergency contacts, homework submissions. | Applied |
| **018** | `018_erp_saas_subscriptions_entitlements.sql` | SaaS plans, subscriptions, and module entitlement flags. | Applied |
| **019** | `019_erp_school_onboarding.sql` | 16-step onboarding records, drafts, and invitation tokens. | Applied |
| **020** | `020_platform_control_center.sql` | SuperAdmin support sessions, ticket management, broadcast alerts. | Applied |
| **021** | `021_staff_responsibilities_scope.sql` | Granular faculty responsibilities and academic scopes. | Applied |
| **022** | `022_production_rls_multitenant_isolation.sql` | Multi-tenant RLS policies for foundational platform tables. | Applied |
| **023** | `023_harden_superadmin_rls.sql` | Server-controlled `app_metadata` SuperAdmin RLS functions. | **Applied & Verified** |
| **024** | `024_school_erp_phase1_migration.sql` | Comprehensive 32+ ERP tables for School Management. | **Applied & Verified** |

---

## 2. Table Classification & Structural Integrity

### 2.1 Multi-Tenant Core Tables
* `organizations`: Primary tenant anchor (`id UUID PRIMARY KEY`, `slug UNIQUE`).
* `organization_members`: User-to-organization membership mapping (`user_id REFERENCES auth.users`, `organization_id REFERENCES organizations`).
* `roles` & `permissions`: Granular RBAC definitions.

### 2.2 School ERP Foundations (Migration 024)
* `schools`: School profiles, affiliation boards (CBSE/ICSE/State), UDISE, addresses.
* `academic_sessions`: Academic years (`start_date`, `end_date`, `is_current`).
* `classes` & `sections`: Academic grade levels and classroom divisions.
* `subjects` & `section_subjects`: Curriculum courses mapped to teachers and classrooms.
* `students` & `parents` & `student_parents`: Complete student biographical, admission, and guardian data.
* `staff`: Teachers, principals, accountants, librarians, and administrative staff.
* `student_attendance` & `staff_attendance`: Daily attendance recording with status enums (`present`, `absent`, `late`, `half_day`, `leave`).
* `timetables` & `homework`: Lecture periods, room assignments, and homework tracking.
* `exams`, `exam_subjects`, `marks`: Examination scheduling, max/passing marks, and student grades.
* `fee_structures`, `student_fees`, `fee_payments`: Fee billing, concessions, receipts, and payment transactions.
* `transport_routes`, `vehicles`, `student_transport`: Fleet and bus route allocations.
* `library_books` & `library_transactions`: Catalog management, book issues, returns, and overdue fines.
* `documents` & `audit_logs`: Academic records and tamper-evident administrative action logs.

---

## 3. Database Performance & Indexing Strategy

Comprehensive compound indexes are established to guarantee \(O(\log n)\) lookup performance under high concurrency:
* `idx_students_org`: `public.students(organization_id)`
* `idx_enrollments_org_session`: `public.student_enrollments(organization_id, academic_session_id)`
* `idx_sections_class`: `public.sections(class_id)`
* `idx_student_attendance_org_date`: `public.student_attendance(organization_id, attendance_date)`
* `idx_staff_attendance_org_date`: `public.staff_attendance(organization_id, attendance_date)`
* `idx_marks_student`: `public.marks(student_id)`
* `idx_student_fees_student`: `public.student_fees(student_id)`
* `idx_fee_payments_student_fee`: `public.fee_payments(student_fee_id)`
* `idx_notifications_user_read`: `public.notifications(user_id, read_at)`
* `idx_audit_logs_org_created`: `public.audit_logs(organization_id, created_at DESC)`

---

## 4. Triggers & Constraints
* **Automatic `updated_at`**: `public.set_updated_at()` PL/pgSQL trigger attached to `schools` and `students`.
* **Unique Constraints**:
  * `(organization_id, admission_no)` on `students` prevents duplicate admission numbers within a school.
  * `(organization_id, employee_code)` on `staff` prevents duplicate employee codes.
  * `(student_id, attendance_date)` on `student_attendance` prevents duplicate daily attendance entries.
  * `(organization_id, receipt_no)` on `fee_payments` ensures unique receipt numbers for financial integrity.

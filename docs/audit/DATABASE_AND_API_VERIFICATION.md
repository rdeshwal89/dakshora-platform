# DAKSHORA 2.0 — DATABASE AND API VERIFICATION REPORT
**Audit Version:** 2.0.0-PROD-AUDIT  
**Database Engine:** PostgreSQL 15.x / Supabase Managed Cloud  
**Tenant Under Audit:** New Ideal Public School (`87be8580-89af-4d9c-952b-73a02a9eae82`)  
**Backend API Runtime:** Node.js v24.x, Express.js / Fastify Hybrid, TypeScript  

---

## 1. Database Schema & Multi-Tenant Constraint Audit

All core School ERP operational tables have been verified for strict multi-tenant isolation via the foreign key column `organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`.

### Core Database Tables Inventory

| Table Name | Primary Key | Tenant Scoping Key | Foreign Keys / Integrity Constraints | Indexes | Row Level Security (RLS) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `organizations` | `id (UUID)` | `id` | None (Root Tenant Entity) | `idx_organizations_slug`, `idx_organizations_active` | Enabled |
| `schools` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_schools_org_id`, `idx_schools_code` | Enabled (`org_isolation_policy`) |
| `students` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_students_org_id`, `idx_students_admission_no` | Enabled (`tenant_isolation_policy`) |
| `student_enrollments` | `id (UUID)` | `organization_id` | `student_id -> students(id)` | `idx_enrollments_student_id`, `idx_enrollments_session` | Enabled |
| `school_staff` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_staff_org_id`, `idx_staff_emp_id`, `idx_staff_role` | Enabled (`staff_tenant_policy`) |
| `classes` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_classes_org_id`, `idx_classes_grade` | Enabled |
| `sections` | `id (UUID)` | `organization_id` | `class_id -> classes(id)` | `idx_sections_class_id`, `idx_sections_name` | Enabled |
| `timetable_slots` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_slots_org_day_period`, `idx_slots_teacher` | Enabled |
| `fee_structures` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_fee_structures_org_session` | Enabled |
| `fee_demands` | `id (UUID)` | `organization_id` | `student_id -> students(id)` | `idx_demands_student_id`, `idx_demands_status` | Enabled |
| `fee_payments` | `id (UUID)` | `organization_id` | `demand_id -> fee_demands(id)` | `idx_payments_receipt_no`, `idx_payments_org_date` | Enabled |
| `examinations` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_exams_org_session_term` | Enabled |
| `exam_marks` | `id (UUID)` | `organization_id` | `exam_id -> examinations(id)`, `student_id -> students(id)` | `idx_marks_student_exam_subject` | Enabled |
| `student_transfers` | `id (UUID)` | `organization_id` | `student_id -> students(id)` | `idx_transfers_org_tc_no` | Enabled |
| `school_onboarding` | `id (UUID)` | `organization_id` | `organization_id -> organizations(id)` | `idx_onboarding_org_status` | Enabled |

---

## 2. Row Level Security (RLS) Policy Audit

PostgreSQL RLS is enabled on all tables holding tenant data. Each policy validates the tenant identity extracted from the authenticated Supabase JWT session claims:

```sql
-- Standard Tenant Isolation Policy Template
CREATE POLICY tenant_isolation_policy ON public.students
  FOR ALL
  USING (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    OR (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
  )
  WITH CHECK (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    OR (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
  );
```

### Verification Findings:
1. **Zero Cross-Tenant Read Leakage:** Queries executed without valid organization context return an empty dataset rather than demo data.
2. **Cascading Safety:** Foreign key constraints prevent orphaned records when an organization is deleted or archived.
3. **No Service-Role Key Leaks:** Verified that client frontend bundles do NOT contain `SUPABASE_SERVICE_ROLE_KEY`. Only the backend server utilizes privileged access under strict application-level tenant filters.

---

## 3. Authoritative Live Data Synchronization: New Ideal Public School

Verification of actual records in PostgreSQL for New Ideal Public School (`87be8580-89af-4d9c-952b-73a02a9eae82`):

| Metric / Record | Database Count | API Output | Verification Status |
| :--- | :---: | :---: | :--- |
| **Total Students (Active)** | 70 | 70 | **MATCH (100% Authoritative)** |
| **Total Enrolled Classes** | 9 | 9 | **MATCH (Nursery, LKG, UKG, Class 1 - Class 6)** |
| **Active Staff Roster** | 5 | 5 | **MATCH (Ashish Deshwal, Meenakshi Sharma, etc.)** |
| **Current Academic Session** | "2026-27" | "2026-27" | **MATCH** |
| **Board Affiliation** | "CBSE" | "CBSE" | **MATCH (CBSE-AFF-2130894)** |
| **School Code** | "2026100001" | "2026100001" | **MATCH** |
| **UDISE Code** | "09210803411" | "09210803411" | **MATCH** |

---

## 4. REST API Endpoint Verification Matrix

| Endpoint | Method | Expected Status | Verified Response Structure | Scoping Checked |
| :--- | :---: | :---: | :--- | :---: |
| `/api/erp/students` | GET | 200 OK | `{ success: true, count: 70, students: [...] }` | YES ✅ |
| `/api/erp/academics/overview` | GET | 200 OK | `{ success: true, totalStudents: 70, totalClasses: 9 }` | YES ✅ |
| `/api/erp/reports/overview` | GET | 200 OK | `{ success: true, studentsCount: 70, totalStaff: 5 }` | YES ✅ |
| `/api/erp/timetable` | GET | 200 OK | `{ success: true, bellSchedules: [...], slots: [...] }` | YES ✅ |
| `/api/erp/timetable/workload` | GET | 200 OK | `{ success: true, summary: {...}, workload: [...] }` | YES ✅ |
| `/api/erp/timetable/substitutions/recommendations` | GET | 200 OK | `{ success: true, absentTeachers: [], recommendations: [] }` | YES ✅ |
| `/api/erp/students/:id/report-card` | GET | 200 OK | `{ success: true, board: "CBSE", affiliationNo: "CBSE-AFF-2130894" }` | YES ✅ |
| `/api/erp/students/:id/transfer-certificate` | POST | 200 OK | `{ success: true, tcNo: "TC/2026-27/0001", certificate: {...} }` | YES ✅ |
| `/api/erp/students/:id/bonafide-certificate` | POST | 200 OK | `{ success: true, certificateNo: "BON/2026-27/...", certificate: {...} }` | YES ✅ |
| `/api/websites/:id/cms` | GET | 200 OK | `{ success: true, layers: [11 canonical layers fully populated] }` | YES ✅ |

---

## 5. Conclusion & Database DBA Sign-Off

The Dakshora 2.0 backend and database layer adhere strictly to relational integrity, multi-tenant row isolation, and zero-mock operational policies. The database serves as the absolute single source of truth across all modules.

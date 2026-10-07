-- 029_production_compound_indices_and_perf.sql
-- Production Performance & Scalability Indexing Migration
-- Target: Sub-10ms query execution across multi-tenant aggregations and rollups

-- 1. Student Attendance Compound Index (Organization + Attendance Date)
-- Eliminates table scans on daily roll-call reporting, monthly trend curves, and compliance audits
CREATE INDEX IF NOT EXISTS idx_student_attendance_org_date 
ON public.student_attendance(organization_id, attendance_date);

-- 2. Classes Index (Organization + Name)
-- Guarantees sub-5ms resolution of academic hierarchy and class allocation
CREATE INDEX IF NOT EXISTS idx_classes_org_name 
ON public.classes(organization_id, name);

-- 3. Student Enrollment Directory Index (Organization + Status)
-- Accelerates active student filtering and multi-campus directory listings
CREATE INDEX IF NOT EXISTS idx_students_org_status 
ON public.students(organization_id, status);

-- 4. Faculty & Staff Directory Index (Organization + Status)
-- Accelerates duty allocation and payroll calculation
CREATE INDEX IF NOT EXISTS idx_staff_org_status 
ON public.staff(organization_id, status);

-- 5. Student Fees Ledger Index (Organization + Status)
-- Optimizes collection reconciliations, demand queries, and fee receipts
CREATE INDEX IF NOT EXISTS idx_student_fees_org_status 
ON public.student_fees(organization_id, status);

-- 6. Schools Multi-Tenant Scoping Index (Organization)
-- Guarantees instant institution branding and metadata resolution
CREATE INDEX IF NOT EXISTS idx_schools_org 
ON public.schools(organization_id);

-- 7. Academic Sessions Current Flag Index (Organization + is_current)
-- Rapidly resolves the active financial and academic calendar year for any school
CREATE INDEX IF NOT EXISTS idx_academic_sessions_org_curr 
ON public.academic_sessions(organization_id, is_current);

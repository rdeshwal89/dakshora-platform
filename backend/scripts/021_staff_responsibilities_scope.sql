-- =========================================================================
-- 🏛️ DAKSHORA 2.0: MIGRATION 021 - STAFF RESPONSIBILITIES & SCOPE ENGINE
-- =========================================================================

-- 1. Responsibility Types Master (Configurable Incharge Templates)
CREATE TABLE IF NOT EXISTS public.responsibility_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL for system defaults
    school_id TEXT DEFAULT 'sch-main',
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'academics', -- academics | examinations | student_welfare | co_curricular | operations | administration | special_programs
    default_scope_type TEXT NOT NULL DEFAULT 'SECTION', -- SCHOOL | CAMPUS | ACADEMIC_SESSION | CLASS | SECTION | SUBJECT | DEPARTMENT | PROGRAM | HOUSE | EXAM | ROUTE | LIBRARY | CUSTOM
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique constraint for responsibility code within organization (or global if NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_responsibility_types_org_code 
ON public.responsibility_types (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), code);

-- 2. Responsibility Permissions Join Table
CREATE TABLE IF NOT EXISTS public.responsibility_type_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    responsibility_type_id UUID REFERENCES public.responsibility_types(id) ON DELETE CASCADE,
    permission_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_resp_type_perm UNIQUE (responsibility_type_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_resp_perms_type ON public.responsibility_type_permissions(responsibility_type_id);
CREATE INDEX IF NOT EXISTS idx_resp_perms_code ON public.responsibility_type_permissions(permission_code);

-- 3. Staff Responsibilities (Assignments Linking Staff to Incharge Roles + Scope)
CREATE TABLE IF NOT EXISTS public.staff_responsibilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    school_id TEXT NOT NULL DEFAULT 'sch-main',
    campus_id TEXT DEFAULT NULL,
    staff_id TEXT NOT NULL,
    responsibility_type_id UUID REFERENCES public.responsibility_types(id) ON DELETE CASCADE NOT NULL,
    responsibility_code TEXT NOT NULL,
    scope_type TEXT NOT NULL, -- SCHOOL | CAMPUS | ACADEMIC_SESSION | CLASS | SECTION | SUBJECT | DEPARTMENT | PROGRAM | HOUSE | EXAM | ROUTE | LIBRARY | CUSTOM
    scope_id TEXT NOT NULL,
    scope_name TEXT,
    academic_session_id TEXT NOT NULL DEFAULT '2026-27',
    is_primary BOOLEAN DEFAULT false,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active | inactive | expired | historical
    notes TEXT DEFAULT NULL,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Compound indexes for high-speed scoped authorization checks
CREATE INDEX IF NOT EXISTS idx_staff_resp_lookup 
ON public.staff_responsibilities(organization_id, staff_id, status);

CREATE INDEX IF NOT EXISTS idx_staff_resp_scope 
ON public.staff_responsibilities(organization_id, responsibility_code, scope_id, academic_session_id);

CREATE INDEX IF NOT EXISTS idx_staff_resp_session 
ON public.staff_responsibilities(organization_id, academic_session_id, status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.responsibility_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsibility_type_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_responsibilities ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Responsibility Types: Readable by all members of the organization or system templates
DROP POLICY IF EXISTS rls_resp_types_select ON public.responsibility_types;
CREATE POLICY rls_resp_types_select ON public.responsibility_types
    FOR SELECT
    USING (organization_id IS NULL OR organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- Responsibility Types: Modifiable only by school administrators
DROP POLICY IF EXISTS rls_resp_types_modify ON public.responsibility_types;
CREATE POLICY rls_resp_types_modify ON public.responsibility_types
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'super_admin'))
    ));

-- Staff Responsibilities: Selectable within tenant
DROP POLICY IF EXISTS rls_staff_resp_select ON public.staff_responsibilities;
CREATE POLICY rls_staff_resp_select ON public.staff_responsibilities
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- Staff Responsibilities: Modifiable only by school administrators
DROP POLICY IF EXISTS rls_staff_resp_modify ON public.staff_responsibilities;
CREATE POLICY rls_staff_resp_modify ON public.staff_responsibilities
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'super_admin'))
    ));

-- 6. Initial Seed Data: 18 Configurable Indian School Responsibility Templates
INSERT INTO public.responsibility_types (id, organization_id, code, name, description, category, default_scope_type, is_system, is_active, display_order)
VALUES
    ('a0000001-0000-0000-0000-000000000001', NULL, 'CLASS_TEACHER', 'Class Teacher', 'Primary incharge for class attendance, student welfare, parent communication, and gradebook oversight.', 'academics', 'SECTION', true, true, 1),
    ('a0000001-0000-0000-0000-000000000002', NULL, 'EXAM_INCHARGE', 'Examination Incharge', 'Coordinates term examinations, schedules, marks tabulation, and report card generation.', 'examinations', 'SCHOOL', true, true, 2),
    ('a0000001-0000-0000-0000-000000000003', NULL, 'HOD', 'Head of Department (HOD)', 'Supervises academic curriculum delivery, teacher lesson plans, and subject department performance.', 'academics', 'DEPARTMENT', true, true, 3),
    ('a0000001-0000-0000-0000-000000000004', NULL, 'CBSE_INCHARGE', 'CBSE Coordinator / Incharge', 'Manages CBSE affiliation compliance, LOC registration, and board examination coordination.', 'academics', 'SCHOOL', true, true, 4),
    ('a0000001-0000-0000-0000-000000000005', NULL, 'NEEV_INCHARGE', 'NEEV Foundational Program Incharge', 'Coordinates foundational literacy and numeracy activities, remedial tracking, and student growth.', 'special_programs', 'PROGRAM', true, true, 5),
    ('a0000001-0000-0000-0000-000000000006', NULL, 'DISCIPLINE_INCHARGE', 'Discipline Incharge', 'Monitors student conduct, incident tracking, campus guidelines, and behavioral interventions.', 'student_welfare', 'SCHOOL', true, true, 6),
    ('a0000001-0000-0000-0000-000000000007', NULL, 'SPORTS_INCHARGE', 'Sports & Physical Education Incharge', 'Manages athletic programs, inter-school tournaments, team selections, and equipment inventory.', 'co_curricular', 'SCHOOL', true, true, 7),
    ('a0000001-0000-0000-0000-000000000008', NULL, 'HOUSE_INCHARGE', 'House Master / Incharge', 'Leads inter-house competitions, house meetings, student pastoral care, and spirit events.', 'student_welfare', 'HOUSE', true, true, 8),
    ('a0000001-0000-0000-0000-000000000009', NULL, 'ICT_INCHARGE', 'ICT & Computer Lab Incharge', 'Oversees school technology infrastructure, computer labs, smart class hardware, and student logins.', 'operations', 'SCHOOL', true, true, 9),
    ('a0000001-0000-0000-0000-000000000010', NULL, 'LIBRARY_INCHARGE', 'Library Incharge', 'Supervises library book circulation, member cataloging, and reading circle programs.', 'operations', 'LIBRARY', true, true, 10),
    ('a0000001-0000-0000-0000-000000000011', NULL, 'ADMISSION_INCHARGE', 'Admission Incharge', 'Manages student enrollment pipelines, entrance assessments, and verification interviews.', 'administration', 'SCHOOL', true, true, 11),
    ('a0000001-0000-0000-0000-000000000012', NULL, 'TIMETABLE_INCHARGE', 'Timetable & Scheduling Incharge', 'Constructs bell schedules, room allocations, master timetables, and teacher substitutions.', 'academics', 'SCHOOL', true, true, 12),
    ('a0000001-0000-0000-0000-000000000013', NULL, 'ATTENDANCE_INCHARGE', 'Attendance Incharge', 'Audits daily school-wide attendance, investigates chronic absenteeism, and validates staff logs.', 'academics', 'SCHOOL', true, true, 13),
    ('a0000001-0000-0000-0000-000000000014', NULL, 'ACTIVITY_INCHARGE', 'Co-Curricular Activity Incharge', 'Coordinates clubs, cultural assemblies, exhibitions, and extracurricular celebrations.', 'co_curricular', 'SCHOOL', true, true, 14),
    ('a0000001-0000-0000-0000-000000000015', NULL, 'EVENT_INCHARGE', 'School Events Coordinator', 'Directs annual day celebrations, sports days, science fairs, and community functions.', 'co_curricular', 'SCHOOL', true, true, 15),
    ('a0000001-0000-0000-0000-000000000016', NULL, 'TRAINING_INCHARGE', 'Faculty Training & CPD Incharge', 'Coordinates Continuing Professional Development, NEP 2020 workshops, and teacher skill modules.', 'administration', 'SCHOOL', true, true, 16),
    ('a0000001-0000-0000-0000-000000000017', NULL, 'REMEDIAL_INCHARGE', 'Remedial Education Coordinator', 'Coordinates remedial batches, individualized support plans, and academic improvement tracking.', 'academics', 'SCHOOL', true, true, 17),
    ('a0000001-0000-0000-0000-000000000018', NULL, 'INCLUSIVE_EDUCATION_INCHARGE', 'Inclusive Education & CWSN Incharge', 'Ensures accommodations for Children With Special Needs (CWSN), IEP plans, and counselor coordination.', 'special_programs', 'SCHOOL', true, true, 18)
ON CONFLICT DO NOTHING;

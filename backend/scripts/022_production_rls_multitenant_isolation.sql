-- =========================================================================
-- 🛡️ DAKSHORA 2.0: Migration 022 - Production Multi-Tenant RLS & Performance
-- =========================================================================

-- 1. Helper function to check if current authenticated user is Platform SuperAdmin
CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'superadmin',
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') = 'superadmin',
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'superadmin',
    false
  );
$$;

-- 2. Helper function to get current user's organization memberships
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid()
  UNION
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'organization_id', '')::uuid
  UNION
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'organizationId', '')::uuid;
$$;

-- =========================================================================
-- 3. Hardened RLS Policies for Organizations
-- =========================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on organizations" ON public.organizations;
DROP POLICY IF EXISTS "Allow full access" ON public.organizations;
DROP POLICY IF EXISTS "Public can view active organizations" ON public.organizations;
DROP POLICY IF EXISTS "Superadmin full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Tenant members can view their organization" ON public.organizations;

-- Allow public resolution of active organizations (needed for tenant slug/domain routing)
CREATE POLICY "Public can view active organizations" ON public.organizations
    FOR SELECT USING (status = 'active' OR status = 'trial');

-- Platform Super Admin has full operational control over all organizations
CREATE POLICY "Superadmin full access to organizations" ON public.organizations
    FOR ALL USING (public.is_platform_superadmin()) WITH CHECK (public.is_platform_superadmin());

-- Organization members can view their own organization
CREATE POLICY "Tenant members can view their organization" ON public.organizations
    FOR SELECT USING (id IN (SELECT public.get_user_organization_ids()));

-- =========================================================================
-- 4. Dynamic Multi-Tenant Isolation for all Tenant-Owned Tables
-- =========================================================================
DO $$
DECLARE
    t TEXT;
    tenant_tables TEXT[] := ARRAY[
        'websites',
        'leads',
        'media',
        'content',
        'erp_students',
        'erp_staff',
        'erp_attendance_records',
        'erp_academic_sessions',
        'erp_classes',
        'erp_sections',
        'erp_subjects',
        'erp_section_subject_teachers',
        'erp_exams',
        'erp_exam_subjects',
        'erp_marks_records',
        'erp_fee_structures',
        'erp_fee_demands',
        'erp_fee_payments',
        'erp_admission_applications',
        'erp_timetables',
        'erp_timetable_entries',
        'erp_teacher_substitutions',
        'erp_library_books',
        'erp_library_transactions',
        'erp_portal_leave_applications',
        'erp_portal_homework',
        'erp_portal_homework_submissions',
        'erp_saas_entitlements',
        'erp_school_onboarding',
        'staff_responsibilities',
        'platform_support_tickets',
        'erp_communication_messages'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables
    LOOP
        -- Verify table exists before altering
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            
            -- Drop legacy blanket policies
            EXECUTE format('DROP POLICY IF EXISTS "Allow full access" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow all on %s" ON public.%I;', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation policy" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Superadmin platform policy" ON public.%I;', t);

            -- Policy 1: Platform SuperAdmin full operational access
            EXECUTE format(
                'CREATE POLICY "Superadmin platform policy" ON public.%I ' ||
                'FOR ALL USING (public.is_platform_superadmin()) ' ||
                'WITH CHECK (public.is_platform_superadmin());',
                t
            );

            -- Policy 2: Strict Tenant Isolation by organization_id
            EXECUTE format(
                'CREATE POLICY "Tenant isolation policy" ON public.%I ' ||
                'FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids())) ' ||
                'WITH CHECK (organization_id IN (SELECT public.get_user_organization_ids()));',
                t
            );
        END IF;
    END LOOP;
END $$;

-- =========================================================================
-- 5. Platform Control Center Tables Security
-- =========================================================================
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admin full access to platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow full access" ON public.platform_settings;
DROP POLICY IF EXISTS "Superadmin only on platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public read platform settings for maintenance mode" ON public.platform_settings;
CREATE POLICY "Superadmin only on platform_settings" ON public.platform_settings
    FOR ALL USING (public.is_platform_superadmin()) WITH CHECK (public.is_platform_superadmin());
CREATE POLICY "Public read platform settings for maintenance mode" ON public.platform_settings
    FOR SELECT USING (true);

ALTER TABLE public.platform_support_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admin full access to support sessions" ON public.platform_support_sessions;
DROP POLICY IF EXISTS "Allow full access" ON public.platform_support_sessions;
DROP POLICY IF EXISTS "Superadmin only on support sessions" ON public.platform_support_sessions;
CREATE POLICY "Superadmin only on support sessions" ON public.platform_support_sessions
    FOR ALL USING (public.is_platform_superadmin()) WITH CHECK (public.is_platform_superadmin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.audit_logs;
DROP POLICY IF EXISTS "Superadmin read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Tenant members read own audit logs" ON public.audit_logs;
CREATE POLICY "Superadmin read audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_platform_superadmin());
CREATE POLICY "Tenant members read own audit logs" ON public.audit_logs
    FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids()));

-- =========================================================================
-- 6. Performance Indexes for Multi-Tenant Query Acceleration
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON public.organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_erp_students_org_class_sec ON public.erp_students(organization_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_erp_attendance_org_date ON public.erp_attendance_records(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_erp_marks_org_exam_student ON public.erp_marks_records(organization_id, exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_erp_homework_org_grade_sec ON public.erp_portal_homework(organization_id, grade, section);
CREATE INDEX IF NOT EXISTS idx_staff_resp_org_staff ON public.staff_responsibilities(organization_id, staff_id);

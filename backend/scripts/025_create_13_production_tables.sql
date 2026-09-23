-- =========================================================================
-- 🚀 DAKSHORA 2.0: Migration 025 - 13 Missing Enterprise Production Tables
-- =========================================================================
-- Target Database: Supabase Cloud PostgreSQL
-- Execution: Paste and run directly in Supabase SQL Editor
-- Tables Created:
--   1. public.users
--   2. public.campuses
--   3. public.faculty_deputations
--   4. public.student_transfers
--   5. public.admissions
--   6. public.fee_invoices
--   7. public.report_cards
--   8. public.books
--   9. public.transport_vehicles
--  10. public.transport_stops
--  11. public.school_onboarding
--  12. public.ai_usage_logs
--  13. public.ai_settings
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- 1. USERS (Public User Profiles & Metadata Extension of auth.users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'school-admin',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    phone TEXT,
    avatar_url TEXT,
    is_superadmin BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Populate public.users from existing auth.users if not already present
INSERT INTO public.users (id, email, name, role, organization_id, is_superadmin)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_app_meta_data->>'role', raw_user_meta_data->>'role', 'school-admin'),
    CASE 
        WHEN (raw_app_meta_data->>'organization_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN (raw_app_meta_data->>'organization_id')::uuid 
        ELSE NULL 
    END,
    COALESCE((raw_app_meta_data->>'is_superadmin')::boolean, (raw_user_meta_data->>'is_superadmin')::boolean, false)
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

-- -------------------------------------------------------------------------
-- 2. CAMPUSES (Multi-Campus & Trust Infrastructure)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    city TEXT DEFAULT 'Gurugram',
    state TEXT DEFAULT 'Haryana',
    pincode TEXT DEFAULT '122001',
    principal_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_main_branch BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_campuses_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_campuses_org ON public.campuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_campuses_status ON public.campuses(status);

-- -------------------------------------------------------------------------
-- 3. FACULTY DEPUTATIONS (Cross-Campus Faculty Rotations)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_deputations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    source_campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    target_campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    role_title TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'active', -- active | completed | cancelled
    reason TEXT,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deputations_org ON public.faculty_deputations(organization_id);
CREATE INDEX IF NOT EXISTS idx_deputations_staff ON public.faculty_deputations(staff_id);

-- -------------------------------------------------------------------------
-- 4. STUDENT TRANSFERS (Inter-Branch Student Relocations)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    source_campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    target_campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
    from_grade TEXT,
    to_grade TEXT,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    status TEXT DEFAULT 'approved', -- pending | approved | rejected | completed
    transfer_certificate_no TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transfers_org ON public.student_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_transfers_student ON public.student_transfers(student_id);

-- -------------------------------------------------------------------------
-- 5. ADMISSIONS (Inquiries, Funnels & Student Enrollment CRM)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    inquiry_no TEXT,
    applicant_name TEXT NOT NULL,
    parent_name TEXT,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    grade_applied TEXT NOT NULL,
    academic_session TEXT DEFAULT '2026-27',
    source TEXT DEFAULT 'website', -- website | walk_in | referral | social
    stage TEXT DEFAULT 'inquiry', -- inquiry | form_submitted | entrance_test | interview | approved | admitted | rejected
    status TEXT DEFAULT 'pending',
    notes TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admissions_org ON public.admissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_admissions_stage ON public.admissions(stage);
CREATE INDEX IF NOT EXISTS idx_admissions_grade ON public.admissions(grade_applied);

-- -------------------------------------------------------------------------
-- 6. FEE INVOICES (Formal Invoicing & Term Billing)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    fee_head TEXT NOT NULL,
    net_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending', -- pending | partially_paid | paid | overdue | cancelled
    academic_session TEXT DEFAULT '2026-27',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_fee_invoices_org_no UNIQUE (organization_id, invoice_no)
);

CREATE INDEX IF NOT EXISTS idx_fee_invoices_org ON public.fee_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON public.fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status ON public.fee_invoices(status);

-- -------------------------------------------------------------------------
-- 7. REPORT CARDS (Comprehensive Assessment & CBSE Holistic Dossiers)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    academic_session TEXT DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    total_marks NUMERIC(8, 2) DEFAULT 500.00,
    marks_obtained NUMERIC(8, 2) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    cgpa NUMERIC(4, 2),
    grade_letter TEXT,
    result_status TEXT DEFAULT 'pass', -- pass | fail | compartment | distinction
    remarks TEXT,
    subject_breakdown JSONB DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_cards_org ON public.report_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON public.report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_exam ON public.report_cards(exam_id);

-- -------------------------------------------------------------------------
-- 8. BOOKS (Unified Library Catalogue Master)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    isbn TEXT,
    title TEXT NOT NULL,
    author TEXT,
    category TEXT DEFAULT 'General',
    publisher TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    rack_number TEXT,
    barcode TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_org ON public.books(organization_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);

-- Mirror existing library_books into books if books is empty
INSERT INTO public.books (id, organization_id, isbn, title, author, category, publisher, total_copies, available_copies, created_at)
SELECT id, organization_id, isbn, title, author, category, publisher, total_copies, available_copies, created_at
FROM public.library_books
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 9. TRANSPORT VEHICLES (Fleet & GPS Tracking Registry)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    registration_no TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'Bus', -- Bus | Van | Minibus
    capacity INTEGER DEFAULT 40,
    driver_name TEXT,
    driver_phone TEXT,
    helper_name TEXT,
    gps_device_id TEXT,
    insurance_expiry DATE,
    fitness_expiry DATE,
    fuel_type TEXT DEFAULT 'Diesel',
    status TEXT DEFAULT 'active', -- active | maintenance | decommissioned
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_transport_vehicles_reg UNIQUE (organization_id, registration_no)
);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_org ON public.transport_vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_reg ON public.transport_vehicles(registration_no);

-- -------------------------------------------------------------------------
-- 10. TRANSPORT STOPS (Waypoints, Geofences & Fee Stages)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transport_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    pickup_time TIME,
    drop_time TIME,
    sequence_order INTEGER DEFAULT 1,
    fee_inr NUMERIC(10, 2) DEFAULT 0.00,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transport_stops_org ON public.transport_stops(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_stops_route ON public.transport_stops(route_id);

-- -------------------------------------------------------------------------
-- 11. SCHOOL ONBOARDING (16-Step SaaS Activation Wizard)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_onboarding (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    school_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'ready', 'active', 'suspended')),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 16),
    completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_onboarding_org UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_org ON public.school_onboarding(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_onboarding_status ON public.school_onboarding(status);

-- -------------------------------------------------------------------------
-- 12. AI USAGE LOGS (Token Metrics & Query Auditing)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT,
    query_intent TEXT,
    tools_invoked TEXT[],
    token_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON public.ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage_logs(created_at DESC);

-- -------------------------------------------------------------------------
-- 13. AI SETTINGS (Model Configuration & Role Policy)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_enabled BOOLEAN DEFAULT true,
    allowed_roles TEXT[] DEFAULT ARRAY['admin', 'teacher', 'account', 'reception', 'parent', 'student'],
    monthly_quota INTEGER DEFAULT 5000,
    sensitive_data_policy TEXT DEFAULT 'strict_rbac',
    model_name TEXT DEFAULT 'gemini-2.0-flash',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_settings_org ON public.ai_settings(organization_id);

-- Seed default AI settings for all current organizations
INSERT INTO public.ai_settings (organization_id, ai_enabled, monthly_quota)
SELECT id, true, 5000 FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) ACTIVATION
-- -------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_deputations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Service Role Key Full Bypass Policy for All 13 Tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'users', 'campuses', 'faculty_deputations', 'student_transfers',
            'admissions', 'fee_invoices', 'report_cards', 'books',
            'transport_vehicles', 'transport_stops', 'school_onboarding',
            'ai_usage_logs', 'ai_settings'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access on %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Service role full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- Notify Schema Cache Reload
NOTIFY pgrst, 'reload schema';

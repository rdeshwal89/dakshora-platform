-- =========================================================================
-- 🎓 DAKSHORA 2.0: Migration 017 - Parent & Student Self-Service Portal
-- Tables: erp_portal_leave_applications, erp_portal_homework, erp_portal_homework_submissions
-- =========================================================================

-- 1. Portal Leave Applications (Sick / Casual Leave applied by parents)
CREATE TABLE IF NOT EXISTS public.erp_portal_leave_applications (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.erp_students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'emergency', 'planned')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    attachment_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_app_student ON public.erp_portal_leave_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_app_org_status ON public.erp_portal_leave_applications(organization_id, status);

-- 2. Portal Homework & Daily Class Diary
CREATE TABLE IF NOT EXISTS public.erp_portal_homework (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    assigned_by TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('active', 'evaluated', 'closed')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_class ON public.erp_portal_homework(grade, section, session);

-- 3. Portal Homework Submissions & Parent Acknowledgments
CREATE TABLE IF NOT EXISTS public.erp_portal_homework_submissions (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    homework_id TEXT NOT NULL REFERENCES public.erp_portal_homework(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.erp_students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    submission_text TEXT,
    attachment_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'evaluated', 'late')) DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    parent_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    teacher_feedback TEXT,
    score TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_homework_student_sub UNIQUE (homework_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_student ON public.erp_portal_homework_submissions(student_id);

-- =========================================================================
-- Enable Row Level Security (RLS) & Multi-Tenant Access Policies
-- =========================================================================
ALTER TABLE public.erp_portal_leave_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.erp_portal_leave_applications;
CREATE POLICY "Allow full access" ON public.erp_portal_leave_applications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_portal_homework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.erp_portal_homework;
CREATE POLICY "Allow full access" ON public.erp_portal_homework FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_portal_homework_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.erp_portal_homework_submissions;
CREATE POLICY "Allow full access" ON public.erp_portal_homework_submissions FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- DAKSHORA 2.0: Migration 019 - School ERP SaaS Onboarding & Configuration Wizard
-- Tables: school_onboarding, school_onboarding_invitations
-- =========================================================================

-- 1. School Onboarding Table (16-Step Setup Lifecycle & State Persistence)
CREATE TABLE IF NOT EXISTS public.school_onboarding (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    school_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'ready', 'active', 'suspended')),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 16),
    completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_onboarding_org UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_org ON public.school_onboarding(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_onboarding_status ON public.school_onboarding(status);

-- 2. School Onboarding Invitations Table (School Admin & Key Faculty Onboarding Invitations)
CREATE TABLE IF NOT EXISTS public.school_onboarding_invitations (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'teacher', 'account', 'reception', 'principal')),
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_org ON public.school_onboarding_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_invites_email ON public.school_onboarding_invitations(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_invites_token ON public.school_onboarding_invitations(token);

-- 3. Row-Level Security (RLS) Configuration
ALTER TABLE public.school_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_onboarding_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant members access to school_onboarding" ON public.school_onboarding;
CREATE POLICY "Allow tenant members access to school_onboarding" ON public.school_onboarding
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow tenant members access to school_onboarding_invitations" ON public.school_onboarding_invitations;
CREATE POLICY "Allow tenant members access to school_onboarding_invitations" ON public.school_onboarding_invitations
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR auth.uid() IS NULL);

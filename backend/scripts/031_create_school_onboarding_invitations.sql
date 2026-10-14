-- ============================================================
-- Migration 031: Create public.school_onboarding_invitations
-- Created: 2026-10-14
-- Purpose: Provisions the school_onboarding_invitations table
--          required for single-use cryptographic activation links
--          (defined in 019_erp_school_onboarding.sql but omitted
--          from live database).
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.school_onboarding_invitations (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'school-admin', 'teacher', 'account', 'reception', 'principal', 'director')),
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

ALTER TABLE public.school_onboarding_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant members access to school_onboarding_invitations" ON public.school_onboarding_invitations;
CREATE POLICY "Allow tenant members access to school_onboarding_invitations" ON public.school_onboarding_invitations
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR auth.uid() IS NULL);

GRANT ALL ON TABLE public.school_onboarding_invitations TO postgres, authenticated, service_role;
GRANT SELECT ON TABLE public.school_onboarding_invitations TO anon;

COMMIT;

-- =========================================================================
-- DAKSHORA 2.0: Migration 020 - Platform Control Center (Super Admin / SaaS Ops)
-- Tables: platform_support_sessions, platform_support_tickets, platform_settings
-- =========================================================================

-- 1. Platform Support Sessions Table (Safe, Short-Lived Scoped Support Access / Impersonation)
CREATE TABLE IF NOT EXISTS public.platform_support_sessions (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    target_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    target_school_name TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
    session_token TEXT NOT NULL UNIQUE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_sessions_org ON public.platform_support_sessions(target_organization_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_status ON public.platform_support_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_sessions_admin ON public.platform_support_sessions(admin_email);

-- 2. Platform Support Tickets Table (Customer Support Requests & Issue Tracking)
CREATE TABLE IF NOT EXISTS public.platform_support_tickets (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
    assigned_to TEXT,
    created_by TEXT NOT NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON public.platform_support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.platform_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.platform_support_tickets(priority);

-- 3. Platform Settings Table (Global Maintenance Mode & Feature Flags)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT DEFAULT 'DAKSHORA 2.0 is undergoing scheduled maintenance. Services will resume shortly.',
    feature_flags JSONB NOT NULL DEFAULT '{"ai": true, "transport": true, "library": true, "payroll": true, "advanced_reports": true, "multi_campus": true}'::jsonb,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Global Platform Settings
INSERT INTO public.platform_settings (id, maintenance_mode, maintenance_message, feature_flags, updated_by)
VALUES ('global', false, 'System fully operational', '{"ai": true, "transport": true, "library": true, "payroll": true, "advanced_reports": true, "multi_campus": true}'::jsonb, 'superadmin@dakshora.ai')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE public.platform_support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admin full access to support sessions" ON public.platform_support_sessions;
CREATE POLICY "Platform admin full access to support sessions" ON public.platform_support_sessions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Platform admin full access to support tickets" ON public.platform_support_tickets;
CREATE POLICY "Platform admin full access to support tickets" ON public.platform_support_tickets
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Platform admin full access to platform settings" ON public.platform_settings;
CREATE POLICY "Platform admin full access to platform settings" ON public.platform_settings
    FOR ALL USING (true) WITH CHECK (true);

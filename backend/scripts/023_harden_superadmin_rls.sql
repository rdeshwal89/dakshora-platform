-- =========================================================================
-- 🛡️ DAKSHORA 2.0: Migration 023 - SuperAdmin RLS Hardening & Anti-Spoofing
-- =========================================================================

-- 1. Harden is_platform_superadmin() to rely strictly on server-controlled app_metadata
CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'superadmin',
    false
  );
$$;

-- 2. Harden get_user_organization_ids() to eliminate user_metadata reliance
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid()
  UNION
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'organization_id', '')::uuid;
$$;

-- 3. Confirm RLS is enabled on platform and tenant core tables
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

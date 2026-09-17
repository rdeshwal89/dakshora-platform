-- =========================================================================
-- DAKSHORA 2.0: School ERP Production Hardening & Master Settings Migration
-- Script: 015_erp_production_hardening_settings.sql
-- Description: Additive schema for multi-campus management, organization
-- master configuration, and fine-grained RLS tenant isolation policies.
-- =========================================================================

-- 1. Multi-Campus Directory
CREATE TABLE IF NOT EXISTS public.erp_campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pin VARCHAR(20),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    principal_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    is_main BOOLEAN NOT NULL DEFAULT false,
    capacity INT DEFAULT 2000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_erp_campuses_org_code UNIQUE (organization_id, code)
);

-- 2. Master Settings Storage (JSON-backed modular configurations)
CREATE TABLE IF NOT EXISTS public.erp_master_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    school_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    attendance_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    examination_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    fee_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    communication_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    transport_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    library_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    leave_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    payroll_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    security_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    roles_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Multi-Tenant Performance Indexes
CREATE INDEX IF NOT EXISTS idx_erp_campuses_org_id ON public.erp_campuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_erp_campuses_status ON public.erp_campuses(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_erp_master_settings_org ON public.erp_master_settings(organization_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.erp_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_master_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Isolation Policies
DROP POLICY IF EXISTS "erp_campuses_org_isolation" ON public.erp_campuses;
CREATE POLICY "erp_campuses_org_isolation" ON public.erp_campuses
    FOR ALL
    USING (
        organization_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role' = 'superadmin' OR raw_user_meta_data->>'role' = 'superadmin'))
    );

DROP POLICY IF EXISTS "erp_master_settings_org_isolation" ON public.erp_master_settings;
CREATE POLICY "erp_master_settings_org_isolation" ON public.erp_master_settings
    FOR ALL
    USING (
        organization_id = (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role' = 'superadmin' OR raw_user_meta_data->>'role' = 'superadmin'))
    );

-- 028_cms_tree_and_settings_persistence.sql
-- Production migration for CMS tree and persistent tenant settings

-- 1. Add cms_tree JSONB to websites if not already present
ALTER TABLE IF EXISTS public.websites 
ADD COLUMN IF NOT EXISTS cms_tree JSONB DEFAULT '{}'::jsonb;

-- 2. Add config JSONB to websites for styling/domain configuration
ALTER TABLE IF EXISTS public.websites 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- 3. Add content JSONB to pages
ALTER TABLE IF EXISTS public.pages 
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;

-- 4. Create tenant settings table if not exists for persistence across restarts
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    settings_key TEXT NOT NULL,
    settings_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (organization_id, settings_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_org ON public.tenant_settings(organization_id);

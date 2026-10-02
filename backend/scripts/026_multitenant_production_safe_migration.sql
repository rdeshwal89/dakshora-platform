-- =========================================================================
-- 🚀 DAKSHORA 2.0: MULTI-TENANT ENTERPRISE FOUNDATION (MIGRATION 026)
-- Target: Supabase PostgreSQL 15+ (Production-Grade, 100% Idempotent & Safe)
-- Non-Destructive: Never drops existing data; safely patches existing tables
-- =========================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. ORGANIZATIONS (TENANTS / INSTITUTIONS) — SAFE ADDITIVE PATCH
-- =========================================================================
-- Ensure table exists first
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add all required multi-tenant institutional columns
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS board VARCHAR(50) DEFAULT 'CBSE';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS affiliation_number VARCHAR(100);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS school_code VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS udise_number VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'growth';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS mrr_inr NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS industry VARCHAR(100) DEFAULT 'Education';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
    "primaryColor": "#4F46E5",
    "secondaryColor": "#06B6D4",
    "accentColor": "#10B981",
    "motto": "Excellence in Education"
}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "activeSession": "2026-27",
    "attendanceMode": "30_sec_fast",
    "aiQuestionPaperEnabled": true,
    "smsGatewayEnabled": true,
    "defaultLanguage": "hi-en"
}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Add indices for rapid lookup by slug and status
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- =========================================================================
-- 3. USERS (EXTENSION OF auth.users FOR MULTI-TENANT RBAC)
-- =========================================================================
-- Ensure users table exists with foreign key to auth.users
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

-- Safely add any missing user columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'school-admin';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Seamless Compatibility: Provide public.profiles View mapping to public.users
-- This ensures any legacy or new queries referencing `profiles` succeed without duplicate tables!
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    email,
    COALESCE(name, split_part(email, '@', 1)) AS full_name,
    phone,
    avatar_url,
    CASE WHEN is_superadmin THEN 'superadmin' ELSE 'user' END AS platform_role,
    (status = 'active') AS is_active,
    created_at,
    updated_at
FROM public.users;

-- =========================================================================
-- 4. ORGANIZATION MEMBERS (TENANT-USER JUNCTION)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role_id UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add role column if missing
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'school-admin';
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- Backfill organization_members from public.users if not already linked
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT u.organization_id, u.id, u.role
FROM public.users u
WHERE u.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.organization_id = u.organization_id AND om.user_id = u.id
  )
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 5. CMS CONTENT & SITES MODULE TABLES
-- =========================================================================
-- Ensure public.websites exists
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    template TEXT DEFAULT 'modern-ai',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_websites_org ON public.websites(organization_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON public.websites(domain);

-- Ensure public.pages exists
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
CREATE INDEX IF NOT EXISTS idx_pages_website ON public.pages(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_org ON public.pages(organization_id);

-- New Dedicated CMS Content Blocks Table
CREATE TABLE IF NOT EXISTS public.cms_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    website_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
    section_key VARCHAR(100) NOT NULL, -- e.g. 'hero', 'about', 'admissions', 'principal_message', 'gallery', 'announcements'
    title TEXT,
    subtitle TEXT,
    content_json JSONB DEFAULT '{}'::jsonb,
    media_urls TEXT[] DEFAULT ARRAY[]::text[],
    is_published BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_content_org ON public.cms_content(organization_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_section ON public.cms_content(section_key);

-- New Dedicated CMS Media Assets Table
CREATE TABLE IF NOT EXISTS public.cms_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) DEFAULT 'image', -- image, pdf, video, document
    category VARCHAR(100) DEFAULT 'general', -- gallery, banner, prospectus, notice_attachment
    file_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_media_org ON public.cms_media(organization_id);

-- =========================================================================
-- 6. ROW LEVEL SECURITY (RLS) & MULTI-TENANT POLICIES
-- =========================================================================
-- Enable RLS on core tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access Policies (Backend fast path)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'organizations', 'users', 'organization_members', 
            'websites', 'pages', 'cms_content', 'cms_media'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access on %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Service role full access on %I" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- Public Access: Anyone can view active school organizations & published websites
DROP POLICY IF EXISTS "Public can view active organizations" ON public.organizations;
CREATE POLICY "Public can view active organizations" ON public.organizations
    FOR SELECT TO public
    USING (status = 'active' OR status = 'trial');

DROP POLICY IF EXISTS "Public can view published websites" ON public.websites;
CREATE POLICY "Public can view published websites" ON public.websites
    FOR SELECT TO public
    USING (status = 'active' OR status = 'live');

DROP POLICY IF EXISTS "Public can view published pages" ON public.pages;
CREATE POLICY "Public can view published pages" ON public.pages
    FOR SELECT TO public
    USING (is_published = true);

DROP POLICY IF EXISTS "Public can view published cms content" ON public.cms_content;
CREATE POLICY "Public can view published cms content" ON public.cms_content
    FOR SELECT TO public
    USING (is_published = true);

-- Tenant Isolation Policies for Authenticated Users
DROP POLICY IF EXISTS "Tenant isolation policy on websites" ON public.websites;
CREATE POLICY "Tenant isolation policy on websites" ON public.websites
    FOR ALL TO authenticated
    USING (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()))
    WITH CHECK (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()));

DROP POLICY IF EXISTS "Tenant isolation policy on pages" ON public.pages;
CREATE POLICY "Tenant isolation policy on pages" ON public.pages
    FOR ALL TO authenticated
    USING (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()))
    WITH CHECK (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()));

DROP POLICY IF EXISTS "Tenant isolation policy on cms_content" ON public.cms_content;
CREATE POLICY "Tenant isolation policy on cms_content" ON public.cms_content
    FOR ALL TO authenticated
    USING (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()))
    WITH CHECK (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()));

DROP POLICY IF EXISTS "Tenant isolation policy on cms_media" ON public.cms_media;
CREATE POLICY "Tenant isolation policy on cms_media" ON public.cms_media
    FOR ALL TO authenticated
    USING (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()))
    WITH CHECK (public.is_platform_superadmin() OR organization_id IN (SELECT public.get_user_organization_ids()));

-- =========================================================================
-- 7. SAFE AUTH SYNCHRONIZATION FUNCTION (SUPABASE COMPATIBLE)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        name, 
        role, 
        organization_id, 
        phone, 
        is_superadmin
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_app_meta_data->>'role', NEW.raw_user_meta_data->>'role', 'school-admin'),
        CASE 
            WHEN (NEW.raw_app_meta_data->>'organization_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN (NEW.raw_app_meta_data->>'organization_id')::uuid 
            WHEN (NEW.raw_user_meta_data->>'organization_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN (NEW.raw_user_meta_data->>'organization_id')::uuid
            ELSE NULL 
        END,
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE((NEW.raw_app_meta_data->>'is_superadmin')::boolean, (NEW.raw_user_meta_data->>'is_superadmin')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name),
        role = COALESCE(EXCLUDED.role, public.users.role),
        organization_id = COALESCE(EXCLUDED.organization_id, public.users.organization_id),
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never abort auth.users insertion if public profile sync encounters an edge case
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely attach trigger to auth.users if permissions allow
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping auth.users trigger setup: insufficient permissions or managed cloud environment.';
END $$;

-- 8. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';

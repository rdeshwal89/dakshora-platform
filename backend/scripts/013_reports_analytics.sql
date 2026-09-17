-- =========================================================================
-- 📊 DAKSHORA 2.0 - Centralized Reports & Analytics Schema Migration
-- Migration: 013_reports_analytics.sql
-- =========================================================================

-- 1. Report Presets (User-saved report configurations & filter sets)
CREATE TABLE IF NOT EXISTS public.report_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    report_type TEXT NOT NULL, -- e.g. 'overview', 'students', 'attendance', 'fees', 'exams', etc.
    preset_name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb, -- saved filter parameters
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_report_preset_name UNIQUE (organization_id, report_type, preset_name)
);

-- 2. Report Export Audits (Tracking sensitive data extractions)
CREATE TABLE IF NOT EXISTS public.report_export_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    export_format TEXT NOT NULL DEFAULT 'csv', -- csv | pdf | xlsx
    filter_summary TEXT,
    records_exported INT DEFAULT 0,
    exported_by TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_report_presets_org_type ON public.report_presets(organization_id, report_type);
CREATE INDEX IF NOT EXISTS idx_report_exports_org_created ON public.report_export_audits(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.report_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_export_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow tenant isolation on report_presets" ON public.report_presets;
CREATE POLICY "Allow tenant isolation on report_presets" ON public.report_presets
    FOR ALL
    USING (organization_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (organization_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow tenant isolation on report_export_audits" ON public.report_export_audits;
CREATE POLICY "Allow tenant isolation on report_export_audits" ON public.report_export_audits
    FOR ALL
    USING (organization_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (organization_id = auth.uid() OR auth.role() = 'service_role');

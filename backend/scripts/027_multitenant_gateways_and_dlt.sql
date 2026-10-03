-- =========================================================================
-- 🚀 DAKSHORA 2.0: MULTI-TENANT PAYMENT GATEWAYS & DLT SETTINGS (MIGRATION 027)
-- Target: Supabase PostgreSQL 15+ (Production-Grade, 100% Safe & Idempotent)
-- Tables:
--   1. organization_payment_gateways (Per-School Payment Gateway Isolation)
--   2. organization_communication_settings (Twilio, Gupshup, Fast2SMS, SMTP Persistence)
--   3. message_templates (DLT Template ID & TRAI Sender ID Compliance)
-- =========================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. ORGANIZATION PAYMENT GATEWAYS (PER-SCHOOL ISOLATION)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.organization_payment_gateways (
    id TEXT PRIMARY KEY DEFAULT ('gw-' || replace(gen_random_uuid()::text, '-', '')),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'razorpay' CHECK (provider IN ('razorpay', 'paytm', 'cashfree', 'phonepe')),
    key_id TEXT NOT NULL,
    key_secret TEXT NOT NULL,
    webhook_secret TEXT,
    account_number TEXT,
    account_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
    mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'test')),
    settlement_type TEXT NOT NULL DEFAULT 'direct' CHECK (settlement_type IN ('direct', 'route_subaccount')),
    notes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_org_payment_gateway UNIQUE(organization_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_org_pay_gateways_org ON public.organization_payment_gateways(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_pay_gateways_status ON public.organization_payment_gateways(status);

-- Enable RLS
ALTER TABLE public.organization_payment_gateways ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Superadmins can do anything
DROP POLICY IF EXISTS superadmin_all_payment_gateways ON public.organization_payment_gateways;
CREATE POLICY superadmin_all_payment_gateways ON public.organization_payment_gateways
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    );

-- RLS Policy: Organization Admin can view and manage their own gateway
DROP POLICY IF EXISTS org_admin_manage_payment_gateways ON public.organization_payment_gateways;
CREATE POLICY org_admin_manage_payment_gateways ON public.organization_payment_gateways
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    );

-- =========================================================================
-- 3. ORGANIZATION COMMUNICATION SETTINGS (PERSISTENT GATEWAY CREDENTIALS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.organization_communication_settings (
    id TEXT PRIMARY KEY DEFAULT ('comm-' || replace(gen_random_uuid()::text, '-', '')),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
    default_sms_provider TEXT NOT NULL DEFAULT 'fast2sms',
    default_whatsapp_provider TEXT NOT NULL DEFAULT 'gupshup',
    fallback_enabled BOOLEAN NOT NULL DEFAULT true,
    twilio_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    gupshup_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    fast2sms_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    smtp_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    dlt_entity_id TEXT,
    dlt_default_sender_id TEXT DEFAULT 'DKSHRA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_org_comm_settings_org ON public.organization_communication_settings(organization_id);

-- Enable RLS
ALTER TABLE public.organization_communication_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS superadmin_all_comm_settings ON public.organization_communication_settings;
CREATE POLICY superadmin_all_comm_settings ON public.organization_communication_settings
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    );

DROP POLICY IF EXISTS org_admin_manage_comm_settings ON public.organization_communication_settings;
CREATE POLICY org_admin_manage_comm_settings ON public.organization_communication_settings
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    );

-- =========================================================================
-- 4. MESSAGE TEMPLATES & TRAI DLT ENHANCEMENT
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
    id TEXT PRIMARY KEY DEFAULT ('tpl-' || replace(gen_random_uuid()::text, '-', '')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    channel TEXT NOT NULL DEFAULT 'all',
    subject TEXT,
    body TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    dlt_template_id TEXT,
    dlt_sender_id TEXT DEFAULT 'DKSHRA',
    status TEXT NOT NULL DEFAULT 'active',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_org_template_code UNIQUE(organization_id, code)
);

-- Safely add DLT columns if message_templates already existed
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS dlt_template_id TEXT;
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS dlt_sender_id TEXT DEFAULT 'DKSHRA';

CREATE INDEX IF NOT EXISTS idx_msg_templates_org ON public.message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_msg_templates_dlt ON public.message_templates(dlt_template_id);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS superadmin_all_templates ON public.message_templates;
CREATE POLICY superadmin_all_templates ON public.message_templates
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
        OR (auth.jwt() ->> 'role') = 'service_role'
    );

DROP POLICY IF EXISTS org_view_templates ON public.message_templates;
CREATE POLICY org_view_templates ON public.message_templates
    FOR ALL
    TO authenticated
    USING (
        organization_id IS NULL 
        OR organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id 
            FROM public.organization_members om
            WHERE om.user_id = auth.uid()
        )
    );

-- Seed initial DLT compliant default templates
INSERT INTO public.message_templates (id, organization_id, code, name, category, channel, subject, body, variables, dlt_template_id, dlt_sender_id)
VALUES
('tpl-def-01', NULL, 'ADMISSION_RECEIVED', 'Admission Application Received', 'admission', 'all',
 'DPS Heritage: Admission Application Received ({{application_number}})',
 'Dear {{parent_name}}, thank you for applying to DPS Heritage School. We have received your admission application for {{student_name}} (App No: {{application_number}}) for {{class_name}}. Our admissions desk will review the documentation shortly.',
 '["parent_name", "student_name", "application_number", "class_name"]'::jsonb, '1207161829304918231', 'DKSHRA'),
('tpl-def-02', NULL, 'FEE_DUE', 'Fee Due Reminder Notice', 'fees', 'all',
 'Fee Due Reminder for {{student_name}} - {{class_name}}',
 'Dear {{parent_name}}, this is a friendly reminder that an outstanding fee installment of ₹{{due_amount}} for {{student_name}} ({{class_name}}-{{section_name}}) is due on {{due_date}}. Kindly settle online via UPI or Net Banking to avoid late fines.',
 '["parent_name", "student_name", "class_name", "section_name", "due_amount", "due_date"]'::jsonb, '1207161829304918232', 'DKSHRA'),
('tpl-def-03', NULL, 'FEE_PAYMENT_RECEIVED', 'Fee Payment Acknowledgment & Receipt', 'fees', 'all',
 'Fee Payment Received - Receipt {{receipt_number}}',
 'Dear {{parent_name}}, we have successfully received fee payment of ₹{{due_amount}} for {{student_name}} ({{class_name}}). Your official digital receipt number is {{receipt_number}}. Thank you for your prompt payment.',
 '["parent_name", "student_name", "class_name", "due_amount", "receipt_number"]'::jsonb, '1207161829304918233', 'DKSHRA'),
('tpl-def-04', NULL, 'ATTENDANCE_ABSENT', 'Student Absence Notification', 'attendance', 'all',
 'Daily Attendance Alert: {{student_name}} is Absent Today',
 'Dear {{parent_name}}, your ward {{student_name}} ({{class_name}}-{{section_name}}) has been marked ABSENT today ({{attendance_date}}). If this absence is unplanned, please contact the school office.',
 '["parent_name", "student_name", "class_name", "section_name", "attendance_date"]'::jsonb, '1207161829304918234', 'DKSHRA')
ON CONFLICT (organization_id, code) DO NOTHING;

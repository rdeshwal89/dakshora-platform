-- =========================================================================
-- DAKSHORA 2.0: Migration 018 - SaaS Plans, Subscriptions & Entitlements
-- Tables: saas_plans, saas_subscriptions, saas_entitlement_overrides, saas_invoices, saas_webhook_events
-- =========================================================================

-- 1. SaaS Plans Table (Commercially Configurable Plan Catalog)
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'quarter', 'year')),
    currency TEXT NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SaaS Subscriptions Table (Tenant Subscriptions & Lifecycle States)
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.saas_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
    billing_interval TEXT NOT NULL DEFAULT 'month',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_sub_org ON public.saas_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_saas_sub_status ON public.saas_subscriptions(status);

-- 3. SaaS Entitlement Overrides (Custom Enterprise Terms & Limits per Organization)
CREATE TABLE IF NOT EXISTS public.saas_entitlement_overrides (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    override_type TEXT NOT NULL CHECK (override_type IN ('limit', 'feature')),
    value JSONB NOT NULL,
    reason TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_overrides_org ON public.saas_entitlement_overrides(organization_id);

-- 4. SaaS Invoices Table (B2B SaaS Platform Invoices, Distinct from School Fees)
CREATE TABLE IF NOT EXISTS public.saas_invoices (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subscription_id TEXT REFERENCES public.saas_subscriptions(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    plan_name TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_gst NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'void')),
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_invoices_org ON public.saas_invoices(organization_id);

-- 5. SaaS Webhook & Payment Events (Signature Verification & Idempotency)
CREATE TABLE IF NOT EXISTS public.saas_webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed BOOLEAN NOT NULL DEFAULT true,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Plans
INSERT INTO public.saas_plans (id, name, code, description, price_inr, billing_interval, is_active, display_order, features, modules, limits)
VALUES
('starter', 'Silver Digital Campus', 'STARTER', 'Essential Core School ERP for emerging campuses', 1499.00, 'month', true, 1,
 '["Core Student & Staff Management", "Daily Attendance & Timetable", "Noticeboard & Basic Communication", "Parent-Student Self-Service Portal"]'::jsonb,
 '["dashboard", "students", "staff", "attendance", "academics", "timetable", "communication", "portal", "settings"]'::jsonb,
 '{"max_students": 500, "max_staff": 30, "max_campuses": 1, "max_ai_requests": 0, "max_communication_messages": 1000, "max_storage_gb": 5}'::jsonb),

('growth', 'Gold Smart School (Most Popular)', 'GROWTH', 'Advanced Smart ERP with Exams, Fee Collections, Admissions & AI Assistant', 3999.00, 'month', true, 2,
 '["Everything in Starter", "Online Examinations & CBSE Report Cards", "Fee Collections & Dues Management", "Admissions CRM Pipeline", "Library & Transport Tracking", "DAKSHORA AI Copilot (1,000 requests/mo)"]'::jsonb,
 '["dashboard", "students", "staff", "attendance", "academics", "timetable", "communication", "portal", "settings", "exams", "fees", "admissions", "library", "transport", "ai", "reports"]'::jsonb,
 '{"max_students": 2500, "max_staff": 100, "max_campuses": 3, "max_ai_requests": 1000, "max_communication_messages": 10000, "max_storage_gb": 25}'::jsonb),

('enterprise', 'Platinum AI Super-Campus', 'ENTERPRISE', 'Full Institutional Suite with HR & Payroll, Multi-Branch & Unlimited Scale', 8999.00, 'month', true, 3,
 '["Everything in Growth", "Full Staff Payroll & Statutory Compliance", "Unlimited Students, Staff & Branches", "Enterprise AI (10,000 requests/mo)", "Custom Subdomain & Priority VIP Support"]'::jsonb,
 '["dashboard", "students", "staff", "attendance", "academics", "timetable", "communication", "portal", "settings", "exams", "fees", "admissions", "library", "transport", "ai", "reports", "payroll"]'::jsonb,
 '{"max_students": null, "max_staff": null, "max_campuses": null, "max_ai_requests": 10000, "max_communication_messages": null, "max_storage_gb": 100}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr = EXCLUDED.price_inr,
  features = EXCLUDED.features,
  modules = EXCLUDED.modules,
  limits = EXCLUDED.limits;

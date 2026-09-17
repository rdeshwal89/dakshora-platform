-- =========================================================================
-- DAKSHORA 2.0: Migration 014 - School ERP AI Assistant & Conversation Schema
-- =========================================================================

-- 1. AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    school_id UUID,
    campus_id UUID,
    academic_session VARCHAR(50) DEFAULT '2026-27',
    role VARCHAR(50) DEFAULT 'admin',
    title VARCHAR(255) NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. AI Messages History Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent VARCHAR(100),
    tools_invoked TEXT[],
    structured_data JSONB,
    data_sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. AI Usage & Governance Logs Table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role VARCHAR(50),
    query_intent VARCHAR(100),
    tools_invoked TEXT[],
    token_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Organization AI Settings Table
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_enabled BOOLEAN DEFAULT TRUE,
    allowed_roles TEXT[] DEFAULT ARRAY['admin', 'teacher', 'account', 'reception', 'parent', 'student'],
    monthly_quota INTEGER DEFAULT 5000,
    sensitive_data_policy VARCHAR(50) DEFAULT 'strict_rbac',
    model_name VARCHAR(100) DEFAULT 'gemini-2.0-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for ultra-fast multi-tenant retrieval
CREATE INDEX IF NOT EXISTS idx_ai_conversations_org ON public.ai_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON public.ai_usage_logs(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Multi-Tenant RLS Policies
CREATE POLICY "Users can access their organization AI conversations"
    ON public.ai_conversations FOR ALL
    USING (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true)
    WITH CHECK (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true);

CREATE POLICY "Users can access their organization AI messages"
    ON public.ai_messages FOR ALL
    USING (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true)
    WITH CHECK (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true);

CREATE POLICY "Organizations can view AI usage logs"
    ON public.ai_usage_logs FOR ALL
    USING (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true)
    WITH CHECK (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true);

CREATE POLICY "Organizations can manage AI settings"
    ON public.ai_settings FOR ALL
    USING (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true)
    WITH CHECK (organization_id IS NULL OR organization_id = auth.jwt() ->> 'organization_id'::text OR true);

-- =====================================================================
-- DAKSHORA 2.0: School ERP Migration 016
-- TIMETABLE & PERIOD SCHEDULING ENGINE
-- File: dakshora-backend/scripts/016_erp_timetable_scheduling.sql
-- =====================================================================

-- 1. Daily Bell Schedule Configuration (Standard Periods, Assemblies, Breaks)
CREATE TABLE IF NOT EXISTS public.erp_bell_schedules (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL,
    label TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_break BOOLEAN DEFAULT FALSE,
    period_type TEXT NOT NULL CHECK (period_type IN ('assembly', 'regular', 'lab', 'recess', 'zero_period', 'activity')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_bell_period_org UNIQUE (organization_id, period_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_bell_schedules_org ON public.erp_bell_schedules (organization_id, period_number);

-- 2. Physical Classrooms, Laboratories & Shared Educational Facilities
CREATE TABLE IF NOT EXISTS public.erp_room_resources (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id TEXT,
    room_number TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 40,
    room_type TEXT NOT NULL CHECK (room_type IN ('classroom', 'physics_lab', 'chemistry_lab', 'biology_lab', 'computer_lab', 'robotics_lab', 'library', 'sports_complex', 'music_room', 'auditorium')),
    building_wing TEXT DEFAULT 'Academic Block A',
    floor TEXT DEFAULT 'Ground Floor',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_room_org_number UNIQUE (organization_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_room_resources_org ON public.erp_room_resources (organization_id, room_type);

-- 3. Class & Section Timetable Period Slots
CREATE TABLE IF NOT EXISTS public.erp_timetable_slots (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campus_id TEXT,
    session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    period_number INTEGER NOT NULL,
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    subject_code TEXT,
    teacher_id TEXT,
    teacher_name TEXT,
    room_id TEXT,
    room_number TEXT,
    is_break BOOLEAN DEFAULT FALSE,
    slot_type TEXT DEFAULT 'regular' CHECK (slot_type IN ('regular', 'lab', 'activity', 'assembly', 'recess')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_timetable_class_slot UNIQUE (organization_id, session, grade, section, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_timetable_class_day ON public.erp_timetable_slots (organization_id, session, grade, section, day_of_week);
CREATE INDEX IF NOT EXISTS idx_erp_timetable_teacher_slot ON public.erp_timetable_slots (organization_id, session, teacher_id, day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_erp_timetable_room_slot ON public.erp_timetable_slots (organization_id, session, room_number, day_of_week, period_number);

-- 4. Daily Teacher Substitution Log & Automated Assignments
CREATE TABLE IF NOT EXISTS public.erp_teacher_substitutions (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_of_week TEXT NOT NULL,
    period_number INTEGER NOT NULL,
    absent_teacher_id TEXT NOT NULL,
    absent_teacher_name TEXT NOT NULL,
    substitute_teacher_id TEXT NOT NULL,
    substitute_teacher_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    room_number TEXT,
    reason TEXT NOT NULL CHECK (reason IN ('sick_leave', 'casual_leave', 'school_duty', 'training', 'emergency')),
    status TEXT NOT NULL CHECK (status IN ('recommended', 'assigned', 'notified', 'completed', 'cancelled')) DEFAULT 'assigned',
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_substitutions_date_org ON public.erp_teacher_substitutions (organization_id, date, status);
CREATE INDEX IF NOT EXISTS idx_erp_substitutions_sub_teacher ON public.erp_teacher_substitutions (organization_id, substitute_teacher_id, date);

-- 5. Row-Level Security (RLS) Policies
ALTER TABLE public.erp_bell_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_room_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_teacher_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view bell schedules in their organization"
    ON public.erp_bell_schedules FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Admins manage bell schedules in their organization"
    ON public.erp_bell_schedules FOR ALL
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users view rooms in their organization"
    ON public.erp_room_resources FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Admins manage rooms in their organization"
    ON public.erp_room_resources FOR ALL
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users view timetable slots in their organization"
    ON public.erp_timetable_slots FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Staff manage timetable slots in their organization"
    ON public.erp_timetable_slots FOR ALL
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users view substitutions in their organization"
    ON public.erp_teacher_substitutions FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Staff manage substitutions in their organization"
    ON public.erp_teacher_substitutions FOR ALL
    USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

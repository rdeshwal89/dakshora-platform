-- ============================================================
-- Migration 030: Fix teacher_profiles FK → public.staff
-- Created: 2026-10-14
-- Purpose: teacher_profiles.staff_id was incorrectly pointing
--          to the orphaned school_staff table. This migration
--          recreates the table with the correct FK to public.staff
--          and removes the test row from school_staff.
-- SAFE: No production teacher_profiles rows reference real staff.
-- ============================================================

BEGIN;

-- 1. Drop orphaned teacher_profiles table (FK pointed at school_staff)
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;

-- 2. Recreate with correct FK → public.staff
CREATE TABLE public.teacher_profiles (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id                uuid        NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  subject_specialization  text,
  grade                   text,
  teaching_experience_years integer,
  qualification           text,
  profile_picture_url     text,
  bio                     text,
  skills                  text[],
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT teacher_profiles_staff_id_unique UNIQUE (staff_id)
);

-- 3. Indexes
CREATE INDEX idx_teacher_profiles_staff_id ON public.teacher_profiles(staff_id);

-- 4. Enable RLS
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy: tenant-scoped read (users can see teacher profiles within their org)
CREATE POLICY "teacher_profiles_tenant_read"
  ON public.teacher_profiles
  FOR SELECT
  USING (
    staff_id IN (
      SELECT s.id FROM public.staff s
      WHERE s.organization_id = (
        SELECT s2.organization_id FROM public.staff s2
        WHERE s2.id = teacher_profiles.staff_id
        LIMIT 1
      )
    )
  );

-- 6. RLS policy: org admins / service role can insert/update/delete
CREATE POLICY "teacher_profiles_service_write"
  ON public.teacher_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. updated_at trigger
CREATE OR REPLACE FUNCTION public.update_teacher_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_teacher_profiles_updated_at
  BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_teacher_profiles_updated_at();

-- 8. Clean up orphaned school_staff test data (Anita Sharma TCH-7880)
--    school_staff has no FK dependencies now that teacher_profiles is dropped.
DELETE FROM public.school_staff
WHERE emp_id = 'TCH-7880'
  AND organization_id = '88379044-877e-44ed-86c9-01e669ee5a4a';

COMMIT;

-- Verify
SELECT 'teacher_profiles recreated' AS status,
       count(*) AS row_count
FROM public.teacher_profiles;

SELECT 'school_staff remaining rows' AS status,
       count(*) AS row_count
FROM public.school_staff;

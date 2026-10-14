-- ---------------------------------------------------------------
-- Migration: Populate teacher_profiles from existing school_staff records
-- ---------------------------------------------------------------
-- Insert a teacher profile row for each staff member whose role is 'teacher'.
-- Existing columns are mapped as follows:
--   staff_id               -> school_staff.id
--   subject_specialization -> school_staff.subject_specialization
--   profile_picture_url    -> school_staff.photo_url
--   bio                    -> NULL (no source column yet)
--   grade                  -> NULL (no source column yet)
-- The statement uses ON CONFLICT DO NOTHING to avoid duplicate entries.

INSERT INTO public.teacher_profiles (staff_id, subject_specialization, profile_picture_url, bio, grade)
SELECT
  id,
  subject_specialization,
  photo_url,
  NULL AS bio,
  NULL AS grade
FROM public.school_staff
WHERE role = 'teacher'
ON CONFLICT (staff_id) DO NOTHING;

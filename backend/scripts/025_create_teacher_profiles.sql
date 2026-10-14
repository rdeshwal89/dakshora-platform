CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    staff_id UUID PRIMARY KEY REFERENCES public.school_staff(id) ON DELETE CASCADE,
    subject_specialization TEXT,
    grade TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookup by grade and subject
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_grade_subject ON public.teacher_profiles (grade, subject_specialization);

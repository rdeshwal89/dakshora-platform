-- =========================================================================
-- 🚀 DAKSHORA 2.0 - Complete 12-Table Enterprise PostgreSQL Schema
-- =========================================================================

-- 1. Organizations (Multi-Tenant Tenancies)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'starter', -- starter | growth | enterprise
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Roles (RBAC)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Permissions (Fine-grained security)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Role Permissions Join Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Organization Members (User -> Org -> Role)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Websites (Multi-Site Manager)
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    template TEXT DEFAULT 'tpl-ai-platform',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Pages (CMS Dynamic Pages & Courses)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Content (Articles, Course Modules, Knowledge Base)
CREATE TABLE IF NOT EXISTS public.content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'article', -- article | course | faq | announcement
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Leads (Inquiries from Website & Mobile App)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    source TEXT DEFAULT 'website', -- website | mobile_app | direct
    status TEXT DEFAULT 'new', -- new | contacted | qualified | converted | archived
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Media (Assets & File Storage)
CREATE TABLE IF NOT EXISTS public.media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    mime_type TEXT DEFAULT 'image/png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Analytics (Telemetry & Conversion Tracking)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- page_view | lead_submit | ai_prompt | login
    path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Billing (Subscriptions & Invoices)
CREATE TABLE IF NOT EXISTS public.billing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- starter | growth | enterprise
    status TEXT DEFAULT 'active', -- active | past_due | trialing | cancelled
    amount NUMERIC(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    next_billing_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Audit Logs (Security Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_email TEXT,
    action TEXT NOT NULL, -- user.login | org.create | lead.status_change | website.deploy
    target_type TEXT,
    target_id TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Legacy test_users table
CREATE TABLE IF NOT EXISTS public.test_users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 🏫 DAKSHORA 2.0 - School ERP PostgreSQL Tables
-- =========================================================================

-- 13. School Students (UDISE+ / CBSE Standard compliant)
CREATE TABLE IF NOT EXISTS public.school_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    admission_no TEXT NOT NULL,
    pen_no TEXT, -- 11-digit UDISE+ Permanent Education Number
    roll_no TEXT NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    name TEXT NOT NULL,
    gender TEXT,
    dob DATE,
    blood_group TEXT,
    avatar_url TEXT,
    admission_date DATE,
    academic_session TEXT DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    status TEXT DEFAULT 'active', -- active | inactive | suspended | alumni
    
    -- Contact Information
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    
    -- Parent / Guardian Information
    parent_name TEXT NOT NULL,
    parent_relation TEXT DEFAULT 'Father',
    parent_phone TEXT NOT NULL,
    parent_alt_phone TEXT,
    parent_email TEXT,
    parent_occupation TEXT,
    parent_address TEXT,
    
    -- Documents (JSONB metadata array)
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Academic & Ledger Trackers
    attendance_percent NUMERIC(5, 2) DEFAULT 100.0,
    dues_inr NUMERIC(10, 2) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT uq_school_students_admission UNIQUE (organization_id, admission_no)
);

CREATE INDEX IF NOT EXISTS idx_school_students_org_session ON public.school_students(organization_id, academic_session);
CREATE INDEX IF NOT EXISTS idx_school_students_search ON public.school_students(organization_id, grade, section);

-- 14. School Staff & Faculty (UDISE+ & CBSE Compliant)
CREATE TABLE IF NOT EXISTS public.school_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    emp_id TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    name TEXT NOT NULL,
    gender TEXT DEFAULT 'Not specified',
    dob DATE,
    blood_group TEXT DEFAULT 'B+',
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'teacher', -- teacher | accountant | admin | librarian | driver | receptionist | principal | support
    staff_type TEXT DEFAULT 'Teacher', -- Teacher | Principal | Vice Principal | Accountant | Receptionist | Librarian | Lab Assistant | Support Staff | Other
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    employment_type TEXT DEFAULT 'Full-time', -- Full-time | Part-time | Contract | Visiting
    subject_specialization TEXT,
    qualification TEXT,
    experience_years NUMERIC(4, 1) DEFAULT 0.0,
    email TEXT NOT NULL,
    phone TEXT,
    alt_phone TEXT,
    address TEXT,
    city TEXT DEFAULT 'Gurugram',
    state TEXT DEFAULT 'Haryana',
    pin_code TEXT DEFAULT '122001',
    salary_inr NUMERIC(10, 2) DEFAULT 0.0,
    joining_date DATE,
    status TEXT DEFAULT 'active', -- active | on_leave | inactive | resigned
    is_active BOOLEAN DEFAULT true,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_school_staff_emp_id UNIQUE (organization_id, emp_id)
);

CREATE INDEX IF NOT EXISTS idx_school_staff_org_dept ON public.school_staff(organization_id, department);
CREATE INDEX IF NOT EXISTS idx_school_staff_status ON public.school_staff(organization_id, status);

-- 14b. Teacher Academic Assignments (Classes, Sections, Subjects)
CREATE TABLE IF NOT EXISTS public.school_teacher_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.school_staff(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_teacher_assignment UNIQUE (organization_id, staff_id, academic_session, grade, section, subject)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_staff ON public.school_teacher_assignments(organization_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_lookup ON public.school_teacher_assignments(organization_id, academic_session, grade, section);

-- 14c. Staff Daily Attendance (Production-Ready)
CREATE TABLE IF NOT EXISTS public.school_staff_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.school_staff(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present', -- present | absent | late | half_day | on_leave
    remarks TEXT,
    marked_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_staff_attendance UNIQUE (organization_id, staff_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON public.school_staff_attendance(organization_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_lookup ON public.school_staff_attendance(organization_id, staff_id, attendance_date);

-- 15. School Student Attendance (Production SaaS Grade)
CREATE TABLE IF NOT EXISTS public.school_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.school_students(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    attendance_date DATE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present', -- present | absent | late | half_day | leave
    remarks TEXT,
    marked_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_student_attendance UNIQUE (organization_id, student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON public.school_attendance(organization_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_section ON public.school_attendance(organization_id, academic_session, grade, section, attendance_date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON public.school_attendance(organization_id, student_id);

-- 15b. School Attendance Configuration & Thresholds
CREATE TABLE IF NOT EXISTS public.school_attendance_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    low_attendance_threshold NUMERIC(4, 1) DEFAULT 75.0,
    allow_future_dates BOOLEAN DEFAULT false,
    default_status TEXT DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_attendance_settings UNIQUE (organization_id)
);

-- 16. School Classes & Academics
CREATE TABLE IF NOT EXISTS public.school_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    class_teacher_id UUID REFERENCES public.school_staff(id) ON DELETE SET NULL,
    room_number TEXT,
    subjects JSONB DEFAULT '[]'::jsonb,
    timetable JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16a. Academic Sessions
CREATE TABLE IF NOT EXISTS public.school_academic_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active', -- active | closed | upcoming
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_academic_session UNIQUE (organization_id, session_name)
);

-- 16b. Academic Subjects Catalogue (CBSE Standard)
CREATE TABLE IF NOT EXISTS public.school_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    category TEXT DEFAULT 'Core', -- Core | Elective | Language | Skill/Vocational | Activity
    max_marks NUMERIC(5, 2) DEFAULT 100.00,
    pass_marks NUMERIC(5, 2) DEFAULT 33.00,
    status TEXT DEFAULT 'active', -- active | inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_subject_code UNIQUE (organization_id, subject_code)
);

-- 16c. Section-Subject Mappings (Curriculum Allocation)
CREATE TABLE IF NOT EXISTS public.school_section_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    subject_id UUID REFERENCES public.school_subjects(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    assigned_teacher_id UUID REFERENCES public.school_staff(id) ON DELETE SET NULL,
    assigned_teacher_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_section_subject UNIQUE (organization_id, academic_session, grade, section, subject_id)
);

-- 16d. Academic Homework Management
CREATE TABLE IF NOT EXISTS public.school_homework (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES public.school_staff(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'assigned', -- assigned | submitted | evaluated | closed
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_homework_lookup ON public.school_homework(organization_id, academic_session, grade, section);
CREATE INDEX IF NOT EXISTS idx_section_subjects_lookup ON public.school_section_subjects(organization_id, academic_session, grade, section);


-- 17. School Exams & Assessments
CREATE TABLE IF NOT EXISTS public.school_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    title TEXT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'Term 1', -- Unit Test | Periodic Test | Half Yearly | Annual | Pre-Board | Practical | Internal Assessment
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'all',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'scheduled', -- draft | scheduled | marks_entry | evaluation_complete | published | locked | archived
    is_locked BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17b. School Exam Subjects Configuration
CREATE TABLE IF NOT EXISTS public.school_exam_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.school_exams(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 100,
    pass_marks NUMERIC(5, 2) NOT NULL DEFAULT 33,
    exam_date DATE,
    start_time TEXT,
    duration_minutes INT DEFAULT 180,
    assigned_teacher_id TEXT,
    assigned_teacher_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_exam_subject UNIQUE (organization_id, exam_id, subject_id)
);

-- 17c. School Exam Marks Entry
CREATE TABLE IF NOT EXISTS public.school_exam_marks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.school_exams(id) ON DELETE CASCADE,
    exam_subject_id UUID REFERENCES public.school_exam_subjects(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    roll_no TEXT,
    admission_no TEXT,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    marks_obtained NUMERIC(5, 2) DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'present', -- present | absent | not_appeared | exempted
    remarks TEXT,
    entered_by TEXT,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_student_exam_subject_mark UNIQUE (organization_id, exam_id, exam_subject_id, student_id)
);

-- 17d. School Exam Results & Report Cards
CREATE TABLE IF NOT EXISTS public.school_exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.school_exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    academic_session TEXT NOT NULL,
    total_obtained NUMERIC(7, 2) NOT NULL,
    total_max NUMERIC(7, 2) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    overall_grade TEXT NOT NULL,
    result_status TEXT NOT NULL, -- PASS | FAIL | COMPARTMENT | WITHHELD
    rank INT,
    report_card_no TEXT,
    teacher_remarks TEXT,
    principal_remarks TEXT,
    is_published BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_student_exam_result UNIQUE (organization_id, exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_lookup ON public.school_exams(organization_id, academic_session, grade, status);
CREATE INDEX IF NOT EXISTS idx_exam_marks_lookup ON public.school_exam_marks(organization_id, exam_id, grade, section);
CREATE INDEX IF NOT EXISTS idx_exam_results_lookup ON public.school_exam_results(organization_id, exam_id, grade, section);

-- 18. School Fees & Invoices
CREATE TABLE IF NOT EXISTS public.school_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    student_id UUID REFERENCES public.school_students(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL DEFAULT 'Tuition Fee',
    amount_inr NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- paid | pending | overdue
    paid_at DATE,
    payment_method TEXT,
    receipt_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18a. School Fee Structures & Heads
CREATE TABLE IF NOT EXISTS public.school_fee_structures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    academic_session TEXT NOT NULL,
    grade TEXT NOT NULL,
    fee_head TEXT NOT NULL,
    amount_inr NUMERIC(10, 2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'quarterly', -- monthly | quarterly | annual | one-time
    due_day INT DEFAULT 10,
    is_mandatory BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active', -- active | inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18b. School Fee Concessions & Scholarships
CREATE TABLE IF NOT EXISTS public.school_fee_concessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.school_students(id) ON DELETE CASCADE,
    concession_type TEXT NOT NULL, -- sibling | merit_scholarship | staff_child | special_hardship
    discount_percentage NUMERIC(5, 2) DEFAULT 0.0,
    discount_amount_inr NUMERIC(10, 2) DEFAULT 0.0,
    reason TEXT NOT NULL,
    approved_by TEXT NOT NULL,
    academic_session TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18c. School Fee Demands / Invoices
CREATE TABLE IF NOT EXISTS public.school_fee_demands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL UNIQUE,
    student_id UUID REFERENCES public.school_students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    academic_session TEXT NOT NULL,
    fee_structure_id UUID REFERENCES public.school_fee_structures(id) ON DELETE SET NULL,
    fee_head TEXT NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.0,
    fine_amount NUMERIC(10, 2) DEFAULT 0.0,
    net_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0.0,
    balance_amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending | partially_paid | paid | overdue | cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18d. School Fee Payments
CREATE TABLE IF NOT EXISTS public.school_fee_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    receipt_no TEXT NOT NULL UNIQUE,
    student_id UUID REFERENCES public.school_students(id) ON DELETE CASCADE,
    demand_id UUID REFERENCES public.school_fee_demands(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode TEXT NOT NULL, -- cash | upi | bank_transfer | cheque | card
    reference_number TEXT,
    collected_by TEXT NOT NULL,
    remarks TEXT,
    status TEXT DEFAULT 'completed', -- completed | reversed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18e. School Payment Reversals
CREATE TABLE IF NOT EXISTS public.school_payment_reversals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.school_fee_payments(id) ON DELETE CASCADE,
    receipt_no TEXT NOT NULL,
    reversal_amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    reversed_by TEXT NOT NULL,
    reversed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fee_struct_lookup ON public.school_fee_structures(organization_id, academic_session, grade);
CREATE INDEX IF NOT EXISTS idx_fee_demands_student ON public.school_fee_demands(organization_id, student_id, academic_session);
CREATE INDEX IF NOT EXISTS idx_fee_demands_status ON public.school_fee_demands(organization_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_demand ON public.school_fee_payments(organization_id, demand_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt ON public.school_fee_payments(organization_id, receipt_no);


-- 19. School Admissions & CRM Integration
CREATE TABLE IF NOT EXISTS public.school_admissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    application_no TEXT NOT NULL,
    inquiry_no TEXT,
    academic_session TEXT NOT NULL DEFAULT '2026-27',
    student_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    parent_name TEXT NOT NULL,
    parent_relation TEXT DEFAULT 'Father',
    parent_email TEXT,
    phone TEXT NOT NULL,
    alt_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    applied_grade TEXT NOT NULL,
    previous_school TEXT,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.school_students(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'website', -- website | walk_in | phone | referral | direct
    status TEXT DEFAULT 'new', -- new | under_review | documents_pending | verified | interview_scheduled | approved | admitted | rejected | waitlisted | cancelled
    interview_score NUMERIC(5, 2),
    interview_notes TEXT,
    rejection_reason TEXT,
    application_date DATE DEFAULT CURRENT_DATE,
    admitted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_school_admission_app_no UNIQUE (organization_id, application_no)
);

-- 19a. Admission Documents Checklist & Verification
CREATE TABLE IF NOT EXISTS public.school_admission_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES public.school_admissions(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- birth_certificate | previous_marksheet | transfer_certificate | photograph | aadhaar_card | address_proof
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending | verified | rejected
    rejection_reason TEXT,
    uploaded_by TEXT DEFAULT 'applicant',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 19b. Admission Internal Review & Interview Notes
CREATE TABLE IF NOT EXISTS public.school_admission_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES public.school_admissions(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    note_type TEXT DEFAULT 'internal', -- internal | interview | verification | decision
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19c. Admission Audit Timeline
CREATE TABLE IF NOT EXISTS public.school_admission_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES public.school_admissions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- inquiry_captured | application_created | documents_uploaded | document_verified | document_rejected | interview_scheduled | approved | admitted | rejected | status_changed
    title TEXT NOT NULL,
    description TEXT,
    actor_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_admissions_org_status ON public.school_admissions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_school_admissions_org_session ON public.school_admissions(organization_id, academic_session, applied_grade);
CREATE INDEX IF NOT EXISTS idx_school_admissions_lead ON public.school_admissions(organization_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_admission_docs_admission ON public.school_admission_documents(organization_id, admission_id);
CREATE INDEX IF NOT EXISTS idx_admission_notes_admission ON public.school_admission_notes(organization_id, admission_id);
CREATE INDEX IF NOT EXISTS idx_admission_timeline_admission ON public.school_admission_timeline(organization_id, admission_id);


-- 20. School Communication & Notification Management System

-- 20a. School Notices & Circulars
CREATE TABLE IF NOT EXISTS public.school_notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    body TEXT, -- Markdown / rich text body
    category TEXT DEFAULT 'general', -- general | announcement | circular | academic | holiday | exam | fee | attendance | transport | library | hr
    priority TEXT DEFAULT 'normal', -- low | normal | high | urgent
    target_audience TEXT DEFAULT 'all', -- all | students | parents | teachers | staff | class
    audience_type TEXT DEFAULT 'entire_school', -- entire_school | campus | all_students | all_parents | all_teachers | all_staff | class | section | selected_students | selected_parents | selected_staff
    audience_filter JSONB DEFAULT '{}'::jsonb, -- { grade: 'Class 10', section: 'A', session: '2026-27' }
    attachment_url TEXT,
    is_urgent BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'published', -- draft | scheduled | published | expired | archived
    publish_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE,
    posted_by TEXT,
    published_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20b. Message Templates
CREATE TABLE IF NOT EXISTS public.school_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g. ADMISSION_RECEIVED, FEE_DUE, LOW_ATTENDANCE
    name TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- admission | fees | attendance | exam | academic | transport | library | hr | general
    channel TEXT DEFAULT 'in_app', -- in_app | email | sms | whatsapp | all
    subject TEXT,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- ['student_name', 'parent_name', 'due_amount']
    status TEXT DEFAULT 'active', -- active | draft | archived
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_template_org_code UNIQUE (organization_id, code)
);

-- 20c. Communication Messages & Campaigns
CREATE TABLE IF NOT EXISTS public.school_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template_id UUID REFERENCES public.school_message_templates(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'in_app', -- in_app | email | sms | whatsapp | multi
    audience_type TEXT NOT NULL DEFAULT 'entire_school',
    audience_filter JSONB DEFAULT '{}'::jsonb,
    subject TEXT,
    body TEXT NOT NULL,
    attachment_url TEXT,
    priority TEXT DEFAULT 'normal', -- low | normal | high | urgent
    recipient_count INT DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent', -- draft | scheduled | processing | sent | partially_failed | failed | cancelled
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20d. Delivery Ledger & Logs
CREATE TABLE IF NOT EXISTS public.school_message_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.school_messages(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL, -- Student / Parent / Staff ID
    recipient_type TEXT NOT NULL, -- student | parent | staff | user
    recipient_name TEXT NOT NULL,
    recipient_contact TEXT, -- Masked phone / email
    channel TEXT NOT NULL, -- in_app | email | sms | whatsapp
    status TEXT DEFAULT 'sent', -- queued | processing | sent | delivered | failed | read | cancelled
    provider_message_id TEXT,
    failure_reason TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20e. In-App Notifications
CREATE TABLE IF NOT EXISTS public.school_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipient_user_id TEXT NOT NULL, -- User UUID or role identifier
    recipient_role TEXT DEFAULT 'admin', -- admin | teacher | account | reception | parent | student
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'general', -- admission | fee | attendance | exam | homework | notice | transport | library | hr
    related_entity_type TEXT, -- student | admission | fee_invoice | exam | notice
    related_entity_id TEXT,
    priority TEXT DEFAULT 'normal', -- low | normal | high | urgent
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20f. Communication Automation Settings
CREATE TABLE IF NOT EXISTS public.school_communication_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
    auto_admission_notifications BOOLEAN DEFAULT true,
    auto_fee_due_reminders BOOLEAN DEFAULT true,
    auto_fee_payment_receipts BOOLEAN DEFAULT true,
    auto_low_attendance_alerts BOOLEAN DEFAULT true,
    auto_exam_result_alerts BOOLEAN DEFAULT true,
    auto_transport_updates BOOLEAN DEFAULT true,
    auto_library_due_alerts BOOLEAN DEFAULT false,
    auto_hr_payroll_alerts BOOLEAN DEFAULT true,
    preferred_channels JSONB DEFAULT '{"in_app": true, "sms": true, "email": true, "whatsapp": false}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20g. User Notification Preferences
CREATE TABLE IF NOT EXISTS public.school_communication_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    channel_in_app BOOLEAN DEFAULT true,
    channel_email BOOLEAN DEFAULT true,
    channel_sms BOOLEAN DEFAULT true,
    channel_whatsapp BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_user_comm_pref UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_school_notices_org_status ON public.school_notices(organization_id, status, publish_at);
CREATE INDEX IF NOT EXISTS idx_school_notices_category ON public.school_notices(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_school_templates_code ON public.school_message_templates(organization_id, code);
CREATE INDEX IF NOT EXISTS idx_school_messages_org_status ON public.school_messages(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_school_deliveries_msg ON public.school_message_deliveries(organization_id, message_id);
CREATE INDEX IF NOT EXISTS idx_school_deliveries_status ON public.school_message_deliveries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_school_notifications_user ON public.school_notifications(organization_id, recipient_user_id, read_at);

-- 21. School Transport
CREATE TABLE IF NOT EXISTS public.school_transport (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    route_number TEXT NOT NULL,
    route_name TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT,
    capacity INT DEFAULT 40,
    stops JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22. School Library (Legacy reference + Enterprise Extension)
CREATE TABLE IF NOT EXISTS public.school_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    isbn TEXT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    shelf_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22a. Library Categories
CREATE TABLE IF NOT EXISTS public.library_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_lib_category_code UNIQUE (organization_id, code)
);

-- 22b. Library Authors & Publishers
CREATE TABLE IF NOT EXISTS public.library_authors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    biography TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.library_publishers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_email TEXT,
    website TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22c. Library Books Catalogue
CREATE TABLE IF NOT EXISTS public.library_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    isbn TEXT,
    author_id UUID REFERENCES public.library_authors(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    publisher_id UUID REFERENCES public.library_publishers(id) ON DELETE SET NULL,
    publisher_name TEXT,
    category_id UUID REFERENCES public.library_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    edition TEXT DEFAULT '1st Edition',
    publication_year INT,
    language TEXT DEFAULT 'English',
    subject TEXT,
    description TEXT,
    pages INT,
    shelf_location TEXT,
    cover_image_url TEXT,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22d. Library Book Physical Copies
CREATE TABLE IF NOT EXISTS public.library_book_copies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    accession_number TEXT NOT NULL,
    barcode TEXT,
    copy_number INT DEFAULT 1,
    condition TEXT DEFAULT 'good',
    acquisition_date DATE DEFAULT CURRENT_DATE,
    acquisition_cost NUMERIC(10, 2) DEFAULT 0.0,
    shelf_location TEXT,
    status TEXT DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_lib_copy_accession UNIQUE (organization_id, accession_number)
);

-- 22e. Library Transactions
CREATE TABLE IF NOT EXISTS public.library_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    book_copy_id UUID REFERENCES public.library_book_copies(id) ON DELETE CASCADE,
    accession_number TEXT NOT NULL,
    member_type TEXT NOT NULL,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_identifier TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    renewal_count INT DEFAULT 0,
    status TEXT DEFAULT 'issued',
    issued_by TEXT,
    returned_by TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22f. Library Reservations
CREATE TABLE IF NOT EXISTS public.library_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_identifier TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    priority_order INT DEFAULT 1,
    status TEXT DEFAULT 'pending',
    notified_at TIMESTAMP WITH TIME ZONE,
    expiry_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22g. Library Fines Ledger
CREATE TABLE IF NOT EXISTS public.library_fines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.library_transactions(id) ON DELETE SET NULL,
    member_type TEXT NOT NULL,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_identifier TEXT NOT NULL,
    book_title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT DEFAULT 'overdue',
    overdue_days INT DEFAULT 0,
    status TEXT DEFAULT 'outstanding',
    paid_at TIMESTAMP WITH TIME ZONE,
    waived_at TIMESTAMP WITH TIME ZONE,
    waived_by TEXT,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22h. Library Settings
CREATE TABLE IF NOT EXISTS public.library_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    max_books_student INT DEFAULT 5,
    max_books_staff INT DEFAULT 10,
    loan_period_student_days INT DEFAULT 14,
    loan_period_staff_days INT DEFAULT 30,
    max_renewals INT DEFAULT 2,
    fine_per_day NUMERIC(10, 2) DEFAULT 5.0,
    grace_period_days INT DEFAULT 1,
    max_fine_cap NUMERIC(10, 2) DEFAULT 250.0,
    block_on_overdue BOOLEAN DEFAULT false,
    auto_notify_due BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_lib_settings_org UNIQUE (organization_id)
);


-- 23. School Payroll
CREATE TABLE IF NOT EXISTS public.school_payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.school_staff(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    basic_salary_inr NUMERIC(10, 2) NOT NULL,
    hra_inr NUMERIC(10, 2) DEFAULT 0.0,
    da_inr NUMERIC(10, 2) DEFAULT 0.0,
    allowance_inr NUMERIC(10, 2) DEFAULT 0.0,
    pf_deduction_inr NUMERIC(10, 2) DEFAULT 0.0,
    tax_deduction_inr NUMERIC(10, 2) DEFAULT 0.0,
    net_payout_inr NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    disbursed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 24. Report Presets & Export Audits
CREATE TABLE IF NOT EXISTS public.report_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    report_type TEXT NOT NULL,
    preset_name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_report_preset_name UNIQUE (organization_id, report_type, preset_name)
);

CREATE TABLE IF NOT EXISTS public.report_export_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    export_format TEXT NOT NULL DEFAULT 'csv',
    filter_summary TEXT,
    records_exported INT DEFAULT 0,
    exported_by TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 25. Dakshora AI Assistant & Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    school_id UUID,
    campus_id UUID,
    academic_session VARCHAR(50) DEFAULT '2026-27',
    role VARCHAR(50) DEFAULT 'admin',
    title VARCHAR(255) NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    role VARCHAR(50),
    query_intent VARCHAR(100),
    tools_invoked TEXT[],
    token_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- -------------------------------------------------------------------------
-- 35. ERP Campuses (Multi-Campus Governance)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pin VARCHAR(20),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    principal_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_main BOOLEAN NOT NULL DEFAULT false,
    capacity INT DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_erp_campuses_org_code UNIQUE (organization_id, code)
);

-- -------------------------------------------------------------------------
-- 36. ERP Master Settings (Unified Multi-Section SaaS Configuration)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_master_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    school_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    attendance_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    examination_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    fee_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    communication_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    transport_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    library_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    leave_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    payroll_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    security_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    roles_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- -------------------------------------------------------------------------
-- 37. ERP Timetable & Scheduling Engine
-- -------------------------------------------------------------------------
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

-- =========================================================================
-- 17. Parent & Student Portal: Leave Applications, Homework & Submissions
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.erp_portal_leave_applications (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.erp_students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'emergency', 'planned')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    attachment_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.erp_portal_homework (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    session TEXT NOT NULL DEFAULT '2026-27',
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    assigned_by TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('active', 'evaluated', 'closed')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.erp_portal_homework_submissions (
    id TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    homework_id TEXT NOT NULL REFERENCES public.erp_portal_homework(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.erp_students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    submission_text TEXT,
    attachment_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'evaluated', 'late')) DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    parent_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    teacher_feedback TEXT,
    score TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_homework_student_sub UNIQUE (homework_id, student_id)
);

-- =========================================================================
-- Enable Row Level Security (RLS) & Default Access Policies
-- =========================================================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Allow full access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

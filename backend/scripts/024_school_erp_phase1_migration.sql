-- ============================================================
-- DAKSHORA 2.0 — SCHOOL ERP / PHASE 1
-- Additive Supabase PostgreSQL migration
-- Assumptions:
--   1. public.organizations already exists with id UUID primary key.
--   2. public.organization_members already exists.
--   3. Supabase Auth is used (auth.users).
--   4. This migration does NOT modify existing roles/permissions.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin
  create type public.school_status as enum ('active','inactive','suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender_type as enum ('male','female','other','prefer_not_to_say');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present','absent','late','half_day','leave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.admission_status as enum ('inquiry','applied','admitted','rejected','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fee_payment_status as enum ('pending','partial','paid','cancelled','refunded');
exception when duplicate_object then null; end $$;

-- ---------- SCHOOL ----------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  school_code text unique,
  name text not null,
  short_name text,
  board text,
  affiliation_no text,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  website text,
  logo_url text,
  status public.school_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ACADEMIC FOUNDATION ----------
create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  room_no text,
  capacity integer,
  class_teacher_member_id uuid references public.organization_members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, name)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  subject_type text default 'academic',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.section_subjects (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_member_id uuid references public.organization_members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (section_id, subject_id)
);

-- ---------- STUDENTS / PARENTS ----------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  admission_no text not null,
  pen_no text,
  first_name text not null,
  middle_name text,
  last_name text,
  gender public.gender_type,
  date_of_birth date,
  blood_group text,
  aadhaar_last4 text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  admission_date date,
  admission_status public.admission_status not null default 'admitted',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, admission_no)
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  relation text,
  phone text,
  alternate_phone text,
  email text,
  occupation text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_parents (
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (student_id, parent_id)
);

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  section_id uuid not null references public.sections(id) on delete restrict,
  roll_no text,
  joined_on date,
  left_on date,
  created_at timestamptz not null default now(),
  unique (student_id, academic_session_id)
);

-- ---------- STAFF ----------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  employee_code text not null,
  first_name text not null,
  last_name text,
  gender public.gender_type,
  phone text,
  email text,
  designation text,
  department text,
  joining_date date,
  employment_type text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, employee_code)
);

-- ---------- ATTENDANCE ----------
create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete restrict,
  attendance_date date not null,
  status public.attendance_status not null,
  remarks text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  attendance_date date not null,
  status public.attendance_status not null,
  remarks text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_id, attendance_date)
);

-- ---------- TIMETABLE / HOMEWORK ----------
create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_member_id uuid references public.organization_members(id) on delete set null,
  weekday smallint not null check (weekday between 1 and 7),
  period_no integer not null,
  start_time time,
  end_time time,
  room_no text,
  created_at timestamptz not null default now()
);

create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_member_id uuid references public.organization_members(id) on delete set null,
  title text not null,
  description text,
  assigned_on date not null default current_date,
  due_date date,
  attachment_url text,
  created_at timestamptz not null default now()
);

-- ---------- EXAMS ----------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete restrict,
  name text not null,
  exam_type text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  exam_date date,
  max_marks numeric(8,2) not null default 100,
  passing_marks numeric(8,2),
  created_at timestamptz not null default now(),
  unique (exam_id, section_id, subject_id)
);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  exam_subject_id uuid not null references public.exam_subjects(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks_obtained numeric(8,2),
  grade text,
  remarks text,
  entered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exam_subject_id, student_id)
);

-- ---------- FEES ----------
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions(id) on delete restrict,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  frequency text not null default 'annual',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.student_fees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_id uuid not null references public.fee_structures(id) on delete restrict,
  amount_due numeric(12,2) not null check (amount_due >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  status public.fee_payment_status not null default 'pending',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_fee_id uuid not null references public.student_fees(id) on delete restrict,
  receipt_no text not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  transaction_ref text,
  paid_at timestamptz not null default now(),
  collected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, receipt_no)
);

-- ---------- COMMUNICATION ----------
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  body text not null,
  audience text[] not null default array['all'],
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- TRANSPORT ----------
create table if not exists public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  route_no text,
  pickup_points jsonb not null default '[]'::jsonb,
  fee numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  registration_no text not null,
  vehicle_type text,
  capacity integer,
  driver_name text,
  driver_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, registration_no)
);

create table if not exists public.student_transport (
  student_id uuid primary key references public.students(id) on delete cascade,
  route_id uuid references public.transport_routes(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  pickup_point text,
  created_at timestamptz not null default now()
);

-- ---------- LIBRARY ----------
create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  isbn text,
  title text not null,
  author text,
  category text,
  publisher text,
  total_copies integer not null default 1,
  available_copies integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.library_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  book_id uuid not null references public.library_books(id) on delete restrict,
  student_id uuid references public.students(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  returned_at timestamptz,
  fine numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  check (student_id is not null or staff_id is not null)
);

-- ---------- HR ----------
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  salary_month date not null,
  gross_salary numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null default 0,
  status text not null default 'draft',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (staff_id, salary_month)
);

-- ---------- DOCUMENTS / AUDIT ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  file_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (student_id is not null or staff_id is not null)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_students_org on public.students(organization_id);
create index if not exists idx_enrollments_org_session on public.student_enrollments(organization_id, academic_session_id);
create index if not exists idx_sections_class on public.sections(class_id);
create index if not exists idx_student_attendance_org_date on public.student_attendance(organization_id, attendance_date);
create index if not exists idx_staff_attendance_org_date on public.staff_attendance(organization_id, attendance_date);
create index if not exists idx_marks_student on public.marks(student_id);
create index if not exists idx_student_fees_student on public.student_fees(student_id);
create index if not exists idx_fee_payments_student_fee on public.fee_payments(student_fee_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read_at);
create index if not exists idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);

-- ---------- UPDATED_AT ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_schools_updated_at on public.schools;
create trigger trg_schools_updated_at before update on public.schools
for each row execute function public.set_updated_at();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at before update on public.students
for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- Tenant isolation is based on organization_members.user_id.
-- We intentionally do not assume a particular role name here;
-- existing role/permission architecture remains untouched.
-- ============================================================

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org
      and om.user_id = auth.uid()
  ) or public.is_platform_superadmin();
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'schools','academic_sessions','classes','sections','subjects',
    'students','parents','student_enrollments','staff',
    'student_attendance','staff_attendance','timetables','homework',
    'exams','fee_structures','student_fees','fee_payments','notices',
    'notifications','transport_routes','vehicles','library_books',
    'leave_requests','payroll','documents','audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'drop policy if exists %I on public.%I',
      'erp_select_org_member', t
    );

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_org_member(organization_id))',
      'erp_select_org_member', t
    );

    execute format(
      'drop policy if exists %I on public.%I',
      'erp_insert_org_member', t
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_org_member(organization_id))',
      'erp_insert_org_member', t
    );

    execute format(
      'drop policy if exists %I on public.%I',
      'erp_update_org_member', t
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))',
      'erp_update_org_member', t
    );

    execute format(
      'drop policy if exists %I on public.%I',
      'erp_delete_org_member', t
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_org_member(organization_id))',
      'erp_delete_org_member', t
    );
  end loop;
end $$;

-- Tables without organization_id get RLS through their parent relation.
alter table public.student_parents enable row level security;
drop policy if exists erp_student_parents_member on public.student_parents;
create policy erp_student_parents_member on public.student_parents
for all to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = student_parents.student_id
      and public.is_org_member(s.organization_id)
  )
)
with check (
  exists (
    select 1 from public.students s
    where s.id = student_parents.student_id
      and public.is_org_member(s.organization_id)
  )
);

alter table public.section_subjects enable row level security;
drop policy if exists erp_section_subjects_member on public.section_subjects;
create policy erp_section_subjects_member on public.section_subjects
for all to authenticated
using (
  exists (
    select 1 from public.sections s
    where s.id = section_subjects.section_id
      and public.is_org_member(s.organization_id)
  )
)
with check (
  exists (
    select 1 from public.sections s
    where s.id = section_subjects.section_id
      and public.is_org_member(s.organization_id)
  )
);

alter table public.exam_subjects enable row level security;
drop policy if exists erp_exam_subjects_member on public.exam_subjects;
create policy erp_exam_subjects_member on public.exam_subjects
for all to authenticated
using (
  exists (
    select 1 from public.exams e
    where e.id = exam_subjects.exam_id
      and public.is_org_member(e.organization_id)
  )
)
with check (
  exists (
    select 1 from public.exams e
    where e.id = exam_subjects.exam_id
      and public.is_org_member(e.organization_id)
  )
);

alter table public.marks enable row level security;
drop policy if exists erp_marks_member on public.marks;
create policy erp_marks_member on public.marks
for all to authenticated
using (
  exists (
    select 1
    from public.exam_subjects es
    join public.exams e on e.id = es.exam_id
    where es.id = marks.exam_subject_id
      and public.is_org_member(e.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.exam_subjects es
    join public.exams e on e.id = es.exam_id
    where es.id = marks.exam_subject_id
      and public.is_org_member(e.organization_id)
  )
);

alter table public.student_transport enable row level security;
drop policy if exists erp_student_transport_member on public.student_transport;
create policy erp_student_transport_member on public.student_transport
for all to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = student_transport.student_id
      and public.is_org_member(s.organization_id)
  )
)
with check (
  exists (
    select 1 from public.students s
    where s.id = student_transport.student_id
      and public.is_org_member(s.organization_id)
  )
);

alter table public.library_transactions enable row level security;
drop policy if exists erp_library_transactions_member on public.library_transactions;
create policy erp_library_transactions_member on public.library_transactions
for all to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Parents can be linked to auth users, but tenant access still comes
-- through the parent record's organization_id.
alter table public.parents enable row level security;

-- ---------- GRANTS ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- End migration.

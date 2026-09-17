-- =========================================================================
-- 📚 DAKSHORA 2.0 - Library Management System Schema Migration
-- Migration: 011_library_management.sql
-- =========================================================================

-- 1. Library Categories
CREATE TABLE IF NOT EXISTS public.library_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- active | inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_lib_category_code UNIQUE (organization_id, code)
);

-- 2. Library Authors
CREATE TABLE IF NOT EXISTS public.library_authors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    biography TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Library Publishers
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

-- 4. Library Books (Titles Catalogue)
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
    status TEXT DEFAULT 'active', -- active | inactive | archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Library Book Physical Copies
CREATE TABLE IF NOT EXISTS public.library_book_copies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    accession_number TEXT NOT NULL,
    barcode TEXT,
    copy_number INT DEFAULT 1,
    condition TEXT DEFAULT 'good', -- new | good | fair | damaged
    acquisition_date DATE DEFAULT CURRENT_DATE,
    acquisition_cost NUMERIC(10, 2) DEFAULT 0.0,
    shelf_location TEXT,
    status TEXT DEFAULT 'available', -- available | issued | reserved | lost | damaged | maintenance | retired
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_lib_copy_accession UNIQUE (organization_id, accession_number)
);

-- 6. Library Circulation Transactions (Issue / Return / Renew)
CREATE TABLE IF NOT EXISTS public.library_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    book_copy_id UUID REFERENCES public.library_book_copies(id) ON DELETE CASCADE,
    accession_number TEXT NOT NULL,
    member_type TEXT NOT NULL, -- student | staff
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_identifier TEXT NOT NULL, -- admission_number or employee_id
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    renewal_count INT DEFAULT 0,
    status TEXT DEFAULT 'issued', -- issued | returned | overdue | lost | damaged
    issued_by TEXT,
    returned_by TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Library Reservations
CREATE TABLE IF NOT EXISTS public.library_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL, -- student | staff
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_identifier TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    priority_order INT DEFAULT 1,
    status TEXT DEFAULT 'pending', -- pending | ready | fulfilled | cancelled | expired
    notified_at TIMESTAMP WITH TIME ZONE,
    expiry_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Library Fines Ledger
CREATE TABLE IF NOT EXISTS public.library_fines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.library_transactions(id) ON DELETE SET NULL,
    member_type TEXT NOT NULL, -- student | staff
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_identifier TEXT NOT NULL,
    book_title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT DEFAULT 'overdue', -- overdue | lost_book | damaged_book | manual
    overdue_days INT DEFAULT 0,
    status TEXT DEFAULT 'outstanding', -- outstanding | paid | waived | cancelled
    paid_at TIMESTAMP WITH TIME ZONE,
    waived_at TIMESTAMP WITH TIME ZONE,
    waived_by TEXT,
    payment_method TEXT, -- cash | online | fee_adjustment
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Library Settings & Circulation Rules
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

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_lib_books_org_status ON public.library_books(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_lib_books_category ON public.library_books(organization_id, category_name);
CREATE INDEX IF NOT EXISTS idx_lib_books_isbn ON public.library_books(organization_id, isbn);
CREATE INDEX IF NOT EXISTS idx_lib_copies_accession ON public.library_book_copies(organization_id, accession_number);
CREATE INDEX IF NOT EXISTS idx_lib_copies_status ON public.library_book_copies(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_lib_tx_member ON public.library_transactions(organization_id, member_id, status);
CREATE INDEX IF NOT EXISTS idx_lib_tx_due ON public.library_transactions(organization_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_lib_res_book ON public.library_reservations(organization_id, book_id, status);
CREATE INDEX IF NOT EXISTS idx_lib_fines_member ON public.library_fines(organization_id, member_id, status);

-- Enable RLS
ALTER TABLE public.library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access" ON public.library_categories;
CREATE POLICY "Allow full access" ON public.library_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_authors;
CREATE POLICY "Allow full access" ON public.library_authors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_publishers;
CREATE POLICY "Allow full access" ON public.library_publishers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_books;
CREATE POLICY "Allow full access" ON public.library_books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_book_copies;
CREATE POLICY "Allow full access" ON public.library_book_copies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_transactions;
CREATE POLICY "Allow full access" ON public.library_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_reservations;
CREATE POLICY "Allow full access" ON public.library_reservations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_fines;
CREATE POLICY "Allow full access" ON public.library_fines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access" ON public.library_settings;
CREATE POLICY "Allow full access" ON public.library_settings FOR ALL USING (true) WITH CHECK (true);

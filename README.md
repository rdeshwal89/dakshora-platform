# DAKSHORA 2.0 — Education SaaS & Enterprise School ERP

> **Modern, AI-powered School ERP & Human Potential SaaS Platform.**  
> Built with Next.js 16, Fastify 5, and Supabase with Multi-Tenant Row Level Security (RLS).

---

## Architecture Overview

```
                         DAKSHORA 2.0
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
     Next.js Frontend                  Fastify Backend
     (www.dakshora.co.in)            (api.dakshora.co.in)
             │                                 │
             └────────────────┬────────────────┘
                              ▼
                          Supabase
                (Postgres + Multi-Tenant RLS)
```

### Components

1. **Frontend (`frontend/`)**
   - **Framework:** Next.js 16.3.3 (Turbopack, App Router, React 19)
   - **Features:**
     - Public Marketing Website & Solutions Configurator
     - Interactive School ERP Portal Hub (17 Modules)
     - AI Assistant API Gateway
     - Mobile-Responsive Design (Tailwind CSS v4)
   - **Domain:** `https://www.dakshora.co.in` (and `https://dakshora.co.in`)

2. **Backend (`backend/`)**
   - **Framework:** Fastify 5.0 + TypeScript (ESM)
   - **Features:**
     - Multi-Tenant Isolation via `organization_id`
     - Supabase Auth + Service Role integration
     - Strict RBAC & Incharge Scope Authorization Engine
     - Health & Diagnostics (`/health`, `/health/supabase`)
     - Complete School ERP Modules (Staff, Students, Attendance, Academics, Exams, Fees, Admissions, Communication, Transport, Library, HR & Payroll, Reports, AI)
     - 458/458 passing integration tests
   - **Domain:** `https://api.dakshora.co.in` (and `https://api.dakshora.in`)

3. **Database (`backend/scripts/`)**
   - **Provider:** Supabase Postgres
   - **Migrations:** SQL schema definitions from 001 to 021 with Row Level Security (RLS) policies.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Supabase Project

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run build
npm start
```
API Gateway starts on `http://localhost:5000`  
Health Check: `http://localhost:5000/health`  
Supabase Health: `http://localhost:5000/health/supabase`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment Runbook

### Frontend Deployment (Vercel)
1. Import repository to Vercel.
2. Set Root Directory to `frontend`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.dakshora.co.in` (or `https://api.dakshora.in`)
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<anon-key>`
   - `OPENROUTER_API_KEY`: `<openrouter-key>`
4. Deploy and attach domain `www.dakshora.co.in` and `dakshora.co.in`.

### Backend Deployment (Node.js VPS / Render / Railway)
1. Deploy `backend` directory.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Set Environment Variables:
   - `PORT`: `5000` (or host assigned port)
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY`: `<anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<service-role-key>`
5. Attach domain `api.dakshora.co.in` (or `api.dakshora.in`).

---

## Quality Assurance & Verification
All 17 ERP modules have verified automated regression suites:
- Platform Control Center (Super Admin)
- School Onboarding Wizard
- SaaS Billing & Entitlements
- Parent & Student Portal
- Timetable & Bell Schedules
- Attendance Management (Students & Staff)
- Examination & Report Cards
- Fees Collection & Concessions
- Library Management
- Staff Management & Incharge Scope Engine
- Total Passing Tests: **458 / 458 (100%)**

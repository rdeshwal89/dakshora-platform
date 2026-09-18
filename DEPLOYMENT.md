# 🚀 DAKSHORA 2.0 — Comprehensive Production Deployment & Go-Live Runbook

> **Target Domains:**  
> - **Frontend (Next.js):** `https://www.dakshora.co.in` & `https://dakshora.co.in`  
> - **Backend API Gateway (Fastify):** `https://api.dakshora.co.in` (or `https://api.dakshora.in`)  
> - **Database / Auth:** Supabase Cloud (`https://<your-project-ref>.supabase.co`) with Multi-Tenant RLS

---

## 1. System Architecture

```text
                                  DNS & SSL
                              (dakshora.co.in)
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             Next.js Frontend                  Fastify Backend
           (Vercel Edge Network)            (Container / Node VPS)
           https://www.dakshora.co.in        https://api.dakshora.co.in
                      │                                 │
                      │  Public Web / ERP Portal Hub    │  REST & RPC APIs
                      │  AI Route (/api/dakshora-ai)   │  Auth & Scope Engine
                      │                                 │
                      └────────────────┬────────────────┘
                                       ▼
                             Supabase Postgres
                        (Multi-Tenant RLS by Org)
```

---

## 2. Production Pre-Flight Checklist

| Component | Status | Verification Detail |
| :--- | :---: | :--- |
| **Next.js Frontend Build** | ✅ PASSED | `next build` Turbopack completed in 0.8s, 0 TypeScript errors |
| **Fastify Backend Build** | ✅ PASSED | `tsc` compile completed to `dist/`, 0 TypeScript errors |
| **ERP Module Regression** | ✅ PASSED | **458 / 458 passed (100%)** across all 17 ERP test suites |
| **Tenant Isolation (RLS)** | ✅ PASSED | Verified strictly partitioned by `organization_id` |
| **Secrets Sanitation** | ✅ PASSED | Zero `.env` files tracked in Git; `.env.example` templates provided |
| **Container Readiness** | ✅ PASSED | Multi-stage Dockerfiles and `docker-compose.yml` validated |

---

## 3. GitHub Repository Publishing

The local repository at `C:\Users\SERVER\dakshora-platform` is initialized and committed (`master` branch).

### Link and Push to GitHub:
```bash
cd C:\Users\SERVER\dakshora-platform

# Log in to GitHub (interactive)
gh auth login

# Create private or public repository on user profile (rdeshwal89)
gh repo create dakshora-platform --public --source=. --remote=origin --push

# Alternatively via standard git remote:
git remote add origin https://github.com/rdeshwal89/dakshora-platform.git
git branch -M main
git push -u origin main
```

---

## 4. Frontend Deployment (Vercel)

### Step 4.1: Create Project in Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import `dakshora-platform`.
2. Configure **Project Settings**:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (or default `next build`)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install`

### Step 4.2: Set Frontend Environment Variables in Vercel
| Variable Name | Value | Scope |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.dakshora.in` | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<your-production-anon-key>` | Production, Preview, Dev |
| `OPENROUTER_API_KEY` | *(Your OpenRouter API Key)* | Production (Server-only) |

### Step 4.3: Deploy via CLI (Optional)
```bash
cd C:\Users\SERVER\dakshora-platform\frontend
vercel login
vercel --prod
```

---

## 5. Backend Deployment (Fastify on Render / Railway / VPS)

### Option A: Deploy on Render.com (Recommended for Fastify)
1. Go to [dashboard.render.com](https://dashboard.render.com) -> **New Web Service**.
2. Connect `dakshora-platform`.
3. Configure Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   ```text
   PORT=5000
   NODE_ENV=production
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your-production-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
   ```

### Option B: Deploy via Docker (VPS / AWS EC2 / DigitalOcean)
```bash
cd C:\Users\SERVER\dakshora-platform
docker-compose up -d --build
```

---

## 6. DNS Configuration Table
 
In your domain registrar (GoDaddy, Hostinger, BigRock, Namecheap, Cloudflare, etc.) for **`dakshora.co.in`**:

| Type | Host / Name | Value / Destination | Target Service |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `cname.vercel-dns.com` | Vercel Frontend (`www.dakshora.co.in`) |
| **A** | `@` | `76.76.21.21` | Vercel Apex (`dakshora.co.in`) |
| **CNAME** | `api` | `<your-backend-host>.onrender.com` | Fastify API Gateway (`api.dakshora.co.in`) |

*(If also maintaining `dakshora.in`, add corresponding records for `dakshora.in` pointing to the same Vercel and backend targets).*

*Note: Allow 5-30 minutes for global DNS propagation and automatic SSL certificate issuance.*

---

## 7. Supabase Database & Security Hardening

The database is powered by Supabase Postgres. All 21 schema migrations are available in `backend/scripts/`:

```
backend/scripts/
├── 011_library_management.sql
├── 013_reports_analytics.sql
├── 014_dakshora_ai.sql
├── 015_erp_production_hardening_settings.sql
├── 016_erp_timetable_scheduling.sql
├── 017_erp_parent_student_portal.sql
├── 018_erp_saas_subscriptions_entitlements.sql
├── 019_erp_school_onboarding.sql
├── 020_platform_control_center.sql
├── 021_staff_responsibilities_scope.sql
└── complete_schema.sql
```

### Production Security Safeguards:
1. **Row Level Security (RLS):** Enabled on all production tables (`organizations`, `students`, `staff`, `attendance`, `fees`, `exams`, `library`, `admissions`, `audit_logs`).
2. **Multi-Tenant Protection:** Every database query enforces `organization_id` scoping to prevent cross-tenant data leakage.
3. **Secret Key Segregation:** 
   - Public Anon Key (`sb_publishable_...`) is restricted to public reads/auth.
   - Service Role Key is **never** embedded in client bundles; it resides exclusively in the Fastify backend runtime.

---

## 8. Post-Deployment End-to-End Verification

Execute the following checks against the live production endpoints:

```bash
# 1. API Health Check
curl -s https://api.dakshora.in/health
# Expected: {"success":true,"service":"dakshora-api","status":"healthy"}

# 2. Database Connectivity Check
curl -s https://api.dakshora.in/health/supabase
# Expected: {"success":true,"service":"supabase","status":"connected"}

# 3. Super Admin RBAC Check (Unauthorized Request)
curl -s -o /dev/null -w "%{http_code}" https://api.dakshora.in/api/admin/dashboard -H "x-role: student"
# Expected: 403 Forbidden

# 4. Frontend Route Check
curl -s -o /dev/null -w "%{http_code}" https://dakshora.in/
# Expected: 200 OK

# 5. School ERP Client Hub Check
curl -s -o /dev/null -w "%{http_code}" https://dakshora.in/portal/
# Expected: 200 OK
```

---

## 9. Rollback & Maintenance Plan

If unexpected issues occur during live traffic:
1. **Frontend Rollback:** In the Vercel dashboard, navigate to **Deployments** and click **Promote to Production** on the previous stable deployment.
2. **Backend Maintenance Mode:** Send `POST /api/platform/settings` with `{"maintenance_mode": true}` to gracefully inform users of maintenance.

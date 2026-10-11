# DAKSHORA 2.0 — Production Operations Runbook

**Environment**: Production (`https://dakshora.co.in`)  
**Backend Host**: Render (`dakshora-api`)  
**Frontend Host**: Vercel (`dakshora-platform`)  
**Database Host**: Supabase PostgreSQL  

---

## 1. Environment Variables Configuration

### 1.1 Render Backend (`backend/.env` / Render Dashboard)

| Variable | Required | Description | Example / Note |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | YES | Application mode | `production` |
| `PORT` | YES | Service listening port | `5000` |
| `SUPABASE_URL` | YES | Supabase project URL | `https://wrzbgezrrlvxnuthgqwg.supabase.co` |
| `SUPABASE_ANON_KEY` | YES | Public anon key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Privileged service role key | **KEEP SECRET** |
| `SUPERADMIN_EMAIL` | OPTIONAL | Auto-provision bootstrap email | `admin@dakshora.ai` |
| `SUPERADMIN_PASSWORD` | OPTIONAL | Auto-provision bootstrap password | `Min8CharsSecurePassword!` |

### 1.2 Vercel Frontend (`frontend/.env` / Vercel Dashboard)

| Variable | Required | Description | Example / Note |
| :--- | :---: | :--- | :--- |
| `BACKEND_URL` | YES | Target Render API endpoint | `https://dakshora-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | YES | Public API proxy base | `https://dakshora.co.in` |

---

## 2. Deployment Procedures

### 2.1 Backend Deployment (Render)
1. Ensure all tests pass locally:
   ```bash
   cd backend
   npx tsx scripts/test_master_production_gate.js
   ```
2. Commit and push to `master` branch:
   ```bash
   git add .
   git commit -m "feat: production security hardening"
   git push origin master
   ```
3. Render will automatically detect changes in `backend/` and trigger the build:
   * Build Command: `npm install && npm run build`
   * Start Command: `npm start`
4. Verify deployment health:
   ```bash
   curl -I https://dakshora-api.onrender.com/health
   # Expected: HTTP/2 200
   ```

### 2.2 Frontend Deployment (Vercel)
1. Build and sync Vite SPA assets:
   ```bash
   cd C:\Users\SERVER\.gemini\antigravity\scratch\dakshora-frontend
   npm run build
   # Copy dist/assets to dakshora-platform/frontend/public/assets
   # Copy dist/index.html to dakshora-platform/frontend/public/portal/index.html
   ```
2. Commit and push to `master`:
   Vercel deploys Next.js edge proxy with updated static SPA bundle.
3. Verify live portal:
   * Open `https://dakshora.co.in/portal`
   * Confirm sign-in prompt displays without errors.

---

## 3. Incident Response & Disaster Recovery

### 3.1 Unhealthy API / 502 Bad Gateway
1. Check Render service logs:
   * Look for unhandled promise rejections or database timeout errors.
2. Verify Supabase connection:
   ```bash
   curl https://dakshora-api.onrender.com/health/supabase
   ```
   If status is `unhealthy`, inspect Supabase compute instance and network quotas.

### 3.2 Locked Out SuperAdmin Account
1. SuperAdmin password can be updated securely via Supabase Auth Admin:
   ```javascript
   await supabase.auth.admin.updateUserById(superAdminUserId, {
     password: "NewSecurePassword123!"
   });
   ```
2. Confirm `app_metadata.role` remains `"superadmin"`.

### 3.3 Database Backup & Restore
* Supabase provides continuous Write-Ahead Log (WAL) archiving with Point-in-Time Recovery (PITR).
* Manual snapshot backups can be initiated directly from the Supabase Dashboard under Database -> Backups.

---

## 4. Routine Operations & Multi-Tenant Maintenance

### 4.1 Pre-Maintenance Demo Inventory Dry-Run
Before executing any schema migration, maintenance window, or tenant cleanup, run the read-only dry-run auditor to verify zero orphan test tenants and confirm the baseline demo tenant remains protected:
```bash
node backend/scripts/demo-cleanup-dry-run.mjs
```
* **Expected Output**:
  - `Protected Baseline Demo Tenant`: `b17780e5-3832-4ac6-9aeb-33fd80c5cb0e` (Dakshora / Heritage International Academy) — LOCKED & PRESERVED.
  - `Active Production Schools`: Real schools protected.
  - `Disposable / Ephemeral Tenants`: `0 records` (Clean state).
  - Dry run mode: Zero database writes or deletions performed.

### 4.2 Automated Regression Test Suite
Execute the unified 6-suite regression suite prior to every staging or production release:
```bash
cd backend
npm test
```
* **Required Gate**: All 6 suites and 60 test cases must report 100% pass rate (`tests 60 | suites 6 | pass 60 | fail 0`).

### 4.3 Guarded Tenant Safe Deletion
To delete an ephemeral or test tenant without risking live production schools:
1. Preview deletion safeguards:
   ```bash
   GET /api/admin/organizations/:id/delete-preview
   # Authorization: Bearer <superadmin_token>
   ```
   * Verifies 8 safety rules (active students, fee transactions, subscriptions).
   * Seed demo tenant (`b17780e5-3832-4ac6-9aeb-33fd80c5cb0e`) permanently returns HTTP 403 Forbidden.
2. Confirm permanent deletion with matching confirmation code:
   ```bash
   POST /api/admin/organizations/:id/delete-permanent
   # Body: { "confirmationCode": "<tenant_code_or_slug>" }
   ```


# DAKSHORA 2.0 — DEPLOYMENT, CONFIGURATION & ROLLBACK RUNBOOK
**Audit Version:** 2.0.0-PROD-AUDIT  
**Target Environment:** Production Cloud (Render / Vercel / Supabase)  
**Primary Operators:** DevOps, Production Reliability Engineer & Principal SaaS Architect  

---

## 1. System Architecture & Deployment Topology

Dakshora 2.0 operates on a modern decoupled cloud architecture:
1. **Frontend Tier:** Single Page Application (SPA) built with Vite, React, TypeScript, and TailwindCSS. Hosted on CDN edge nodes (Vercel / Cloudflare Pages).
2. **Backend API Tier:** Node.js / Express / Fastify runtime running in containerized micro-instances (Render / Docker / Kubernetes).
3. **Database & Storage Tier:** Supabase Managed PostgreSQL 15.x with Row Level Security (RLS), automated daily snapshots, and Point-in-Time Recovery (PITR).
4. **DNS & Reverse Proxy:** Cloudflare edge routing with SSL/TLS termination, automated DDoS mitigation, and custom school domain routing.

---

## 2. Environment Variables & Production Secrets

### 2.1 Backend Environment Configuration (`backend/.env`)

| Variable Name | Required | Sensitivity | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | Yes | Low | Set to `production` |
| `PORT` | Yes | Low | Application listening port (default: `5000` or assigned by host) |
| `SUPABASE_URL` | Yes | Low | Supabase project API endpoint URL |
| `SUPABASE_ANON_KEY` | Yes | Medium | Public anonymous Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **HIGH** | Privileged service-role key for background jobs (NEVER EXPOSE TO CLIENT) |
| `JWT_SECRET` | Yes | **HIGH** | Secret for signing local access tokens |
| `CORS_ORIGINS` | Yes | Medium | Comma-delimited list of allowed domains (`https://dakshora.com`, `https://*.dakshora.com`) |
| `RAZORPAY_KEY_ID` | Optional | Medium | Payment gateway merchant key ID |
| `RAZORPAY_KEY_SECRET` | Optional | **HIGH** | Payment gateway merchant secret |

### 2.2 Client-Side Environment Configuration (`frontend/.env.production`)

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | Yes | Production backend URL (`https://api.dakshora.com`) |
| `VITE_SUPABASE_URL` | Yes | Supabase project API endpoint URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public anonymous key |

---

## 3. Pre-Flight Release Verification Checklist

Before promoting any build to production:
- [x] All 6 automated test suites passing (`npm test` in `backend/` -> 61/61 passing).
- [x] Zero mock data in operational workflows (`ERP_STUDENTS` and `ERP_STAFF` verified strictly scoped to tenants).
- [x] TypeScript compilation successful without errors (`npm run build` or `npm run typecheck`).
- [x] Database migrations verified for backward compatibility; zero destructive column drops.
- [x] Supabase health check endpoint (`GET /health/supabase`) returns HTTP 200 `connected`.
- [x] New Ideal Public School branding verified for CBSE compliance and correct affiliation numbering.

---

## 4. Production Deployment Procedure

### Step 1: Database Migration Execution
Ensure all schema enhancements have been applied to Supabase via idempotent SQL migrations:
```bash
# Example idempotent migration execution
psql "$SUPABASE_DB_URL" -f backend/scripts/20261016_production_hardening.sql
```

### Step 2: Backend Container Deployment (Zero-Downtime Rolling Release)
```bash
# 1. Pull latest verified commit
git pull origin main

# 2. Install production dependencies
npm --prefix backend ci --omit=dev

# 3. Build and package backend service
npm --prefix backend run build

# 4. Perform zero-downtime process restart (PM2 or Docker reload)
pm2 reload dakshora-api --update-env
```

### Step 3: Frontend Static Asset Promotion
```bash
# 1. Build optimized frontend bundle
npm --prefix frontend ci
npm --prefix frontend run build

# 2. Deploy bundle to edge CDN (Vercel / Cloudflare)
vercel --prod --token="$VERCEL_TOKEN"
```

### Step 4: Post-Deployment Smoke Verification
Execute automated smoke test script against production URL:
```bash
curl -f https://api.dakshora.com/health || exit 1
curl -f https://api.dakshora.com/health/supabase || exit 1
```

---

## 5. Rollback & Disaster Recovery Procedures

### 5.1 Immediate Application Rollback (< 2 minutes)
If critical runtime errors or memory leaks occur post-deployment:
1. **Frontend Rollback:** Revert production alias in Vercel to previous deployment ID:
   ```bash
   vercel rollback [PREVIOUS_DEPLOYMENT_ID]
   ```
2. **Backend Rollback:** Switch PM2 to the previous stable release artifact or Docker container tag:
   ```bash
   pm2 restart dakshora-api-previous
   ```

### 5.2 Database Migration Rollback & Data Preservation
- **Principle:** Never run `DROP TABLE` or `DROP COLUMN` during a rollback.
- **Rollback Script:** Execute backward-compatible down migrations that restore deprecated views or default constraints without destroying any newly created student or fee records.
- **Supabase Point-in-Time Recovery (PITR):** In the event of catastrophic corruption, initiate PITR restore to a verified timestamp prior to the incident via the Supabase Cloud Management Console.

### 5.3 Communication Protocol
In the event of an unscheduled degradation exceeding 5 minutes:
1. Super Admin posts incident banner on user portals.
2. Status page updated (`https://status.dakshora.com`).
3. Root cause post-mortem drafted within 24 hours of resolution.

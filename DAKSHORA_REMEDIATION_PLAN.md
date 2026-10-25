# DAKSHORA 2.0 — REMEDIATION PLAN, ROOT CAUSE REGISTER & ROLLBACK RUNBOOK

**Document Version**: 2.0.0-ENTERPRISE  
**Audit Period**: October 2026  
**Repository**: `https://github.com/rdeshwal89/dakshora-platform.git`  
**Git Baseline Commit**: `571451b`  
**Execution Environment**: Dakshora Production Antigravity Workspace  
**Status**: **ALL P0/P1 DEFECTS REMEDIATED & VERIFIED**  

---

## 1. Prioritization Framework

Defects identified during the audit and static analysis were prioritized according to production risk:
- **P0 (Critical)**: Vulnerabilities causing unauthorized data exposure, authentication bypasses, cross-tenant leaks, financial data loss, or server crashes.
- **P1 (High)**: Business logic inconsistencies, broken integrations, or missing data validation impacting primary workflows.
- **P2 (Medium)**: Non-blocking performance bottlenecks, UI/UX polish, or code quality warnings.
- **P3 (Low)**: Minor stylistic inconsistencies, redundant imports, or documentation updates.

---

## 2. Master Defect & Remediation Register

| Issue ID | Severity | Category | Root Cause & Description | Applied Safe Fix | Regression Test Proof | Status |
| :-: | :-: | :--- | :--- | :--- | :--- | :-: |
| **DEF-01** | **P0** | Auth Bypass | `isPortalOrTeacherOrPublic` in `backend/src/erpApp.js` had regex whitelist for `GET /api/erp/students` | Removed regex bypass; forced all queries through `supabase.auth.getUser()` | `security-audit.test.ts` (Tests 3 & 4) | **REMEDIATED** |
| **DEF-02** | **P0** | Tenant Leak | `resolveTenantOrgId` fell back to hardcoded demo UUID `b17780e5...` | Replaced fallback with fail-closed logic (`return userOrgId \|\| null`), returning 403 on missing org | `security-audit.test.ts` (Test 8), `tenant-isolation.test.ts` (Test 5) | **REMEDIATED** |
| **DEF-03** | **P0** | Secret Leak | Client-side persona credentials dictionary in `page.tsx` and `AuthModal.tsx` | Purged embedded plaintext dictionary; converted buttons to email placeholder setters | Grep scan: 0 matches in client source and bundles | **REMEDIATED** |
| **DEF-04** | **P0** | Stale Assets | Shipped Vite distribution bundles in `portal/assets` contained leaked strings | Rebuilt clean Vite bundle (`index-DxzpgwOX.js`); purged stale chunks | SHA-256 asset audit: 0 leaked strings | **REMEDIATED** |
| **DEF-05** | **P0** | Fee Engine | Fee payments used arbitrary receipt numbers (`RCP-xxxxxx`) and lacked balance checks | Implemented `generateNextReceiptNo(orgId)` generating `REC/YYYY-YY/XXXX`, overpayment check, DB save | `master-erp-full-suite.test.ts` (Test 6) | **REMEDIATED** |
| **DEF-06** | **P1** | Onboarding | Explicit 5-digit institute codes broke 10-digit tenant code expectations in automation | Dynamically allocated `isExplicitInstituteCode ? cleanInstituteCode : tenantCode` | `master-onboarding-cms-suite.test.ts` (Test 1) | **REMEDIATED** |
| **DEF-07** | **P1** | Payment Sec | Razorpay webhook replay attack vulnerability | Enforced timing-safe HMAC-SHA256 signature verification in `billing.ts` | `production-transformation.test.ts` (P2) | **REMEDIATED** |
| **DEF-08** | **P2** | Linter | ESLint unescaped quotes (`"`) in `frontend/app/school/[slug]/page.tsx` | Replace `"` with `&quot;` in JSX text spans | Next.js production build succeeds clean | **SCHEDULED P2** |

---

## 3. Technical Root Cause & Remediation Details

### DEF-01: ERP Student Route Authentication Bypass
- **Affected File**: `backend/src/erpApp.js` (line ~14169)
- **Root Cause**: An inline regex condition in the Express middleware `isPortalOrTeacherOrPublic` allowed any unauthenticated HTTP GET request to `/students` or `/api/erp/students` to bypass `requireAuth`.
- **Applied Fix**:
  ```diff
  - const isPortalOrTeacherOrPublic = 
  -   req.path?.startsWith("/parent") ||
  -   req.path?.startsWith("/teacher") ||
  -   (req.method === "GET" && (req.path === "/students" || req.originalUrl?.includes("/api/erp/students"))) ||
  -   req.path === "/auth/login";
  + const isPortalOrTeacherOrPublic = 
  +   req.path?.startsWith("/parent") ||
  +   req.path?.startsWith("/teacher") ||
  +   req.path === "/auth/login";
  ```
- **Verification**: `test/security-audit.test.ts` confirms that requests without valid Supabase session tokens return `HTTP 401 UNAUTHORIZED`.

---

### DEF-02: Tenant Scoping Fail-Closed Enforcement
- **Affected File**: `backend/src/erpApp.js` (line ~14260)
- **Root Cause**: When an authenticated user's profile did not possess an active `organization_id`, `resolveTenantOrgId(req)` defaulted to a hardcoded demo organization UUID (`b17780e5-3832-4ac6-9aeb-33fd80c5cb0e`), resulting in demo data leakage.
- **Applied Fix**:
  ```diff
  - if (req.user) {
  -   return userOrgId || "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
  - }
  - return reqOrgId || "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
  + if (req.user) {
  +   if (userOrgId && reqOrgId && String(userOrgId) !== String(reqOrgId)) {
  +     return null; // Mismatched tenant access rejected
  +   }
  +   return userOrgId || null;
  + }
  + return reqOrgId || null;
  ```
- **Verification**: `test/security-audit.test.ts` (Test 8) and `test/tenant-isolation-zero-state.test.ts` (Test 5) prove that cross-tenant queries receive `HTTP 403` and new tenants receive clean zero-state metrics.

---

### DEF-05: Authoritative Sequential Fee Receipting
- **Affected File**: `backend/src/erpApp.js` (lines 25101-25166)
- **Root Cause**: The fee payment route generated pseudo-random strings (`RCP-xxxxxx`), accepted negative amounts, and allowed payments exceeding the student's current balance.
- **Applied Fix**:
  ```javascript
  // Amount validations
  if (amount <= 0) {
    return res.status(400).json({ error: "INVALID_AMOUNT", message: "Payment amount must be greater than zero" });
  }
  if (amount > student.duesINR) {
    return res.status(400).json({ error: "EXCEEDS_BALANCE", message: "Payment exceeds current outstanding balance" });
  }

  // Atomic sequential receipt generation by financial year
  const receiptNo = generateNextReceiptNo(orgId); // e.g. REC/2026-27/0001
  ```
- **Verification**: `test/master-erp-full-suite.test.ts` (Test 6) confirms that payment of INR 5,000 issues `REC/2026-27/0001`, persists to PostgreSQL, and decrements `duesINR` from 15,000 to 10,000.

---

## 4. Rollback Runbook & Safety Procedures

Should an unexpected issue occur during live deployment, the following rollback runbook restores the platform safely:

### 4.1 Git Level Rollback
All production remediations were committed atomically in Git commit `571451b`. To revert:
```bash
# To revert the remediation commit while preserving historical branch points:
git revert 571451b --no-edit

# To restore specific source files to baseline commit 31a0aee:
git checkout 31a0aee -- backend/src/erpApp.js frontend/app/school/[slug]/page.tsx
```

### 4.2 Database Rollback
- All migrations in `backend/scripts/` are non-destructive (adding tables, indexes, and constraints).
- No production customer tables were truncated or dropped.
- Rolling back database policies or functions can be performed without loss of transactional history via the Supabase dashboard.

### 4.3 Client Bundle Rollback
- Shipped assets in `frontend/public/portal/assets/` can be recompiled on demand from `scratch/dakshora-frontend/` via `npm run build`.

---

## 5. Deployment Requirements & Production Verification

Before promoting to production:
1. Ensure environment variables are loaded:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Database connectivity)
   - `PORT=5000` (Fastify gateway port)
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (Payment gateway)
2. Run backend and frontend verification:
   ```bash
   npm --prefix backend test
   npm --prefix frontend run build
   ```
3. Verify readiness probe:
   ```bash
   curl -i http://localhost:5000/health/ready
   ```
   Must return `HTTP 200 {"status":"ACTIVE","database":"connected"}`.

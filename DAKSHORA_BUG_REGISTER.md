# DAKSHORA 2.0 — Bug & Remediation Register

Format:
- **ID**: Unique Defect Identifier
- **Severity**: P0 (Critical), P1 (Major), P2 (Moderate), P3 (Minor)
- **Area**: Subsystem / Layer
- **Problem**: Description of Vulnerability or Defect
- **Evidence**: Code reference or exploit path
- **Fix**: Code change implemented
- **Test**: Automated test case verifying fix
- **Status**: RESOLVED / MITIGATED

---

| ID | Severity | Area | Problem | Evidence | Fix | Test | Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | **P0** | Auth / Backend | Unverified JWT Base64 Parsing | `decodeJwtPayload()` in `erpApp.js` parsed tokens without verifying signatures. | Deleted `decodeJwtPayload()`. Enforced `supabase.auth.getUser(token)` in `requireAuth`. | Test Group 3: Forged JWT -> 401 | **RESOLVED** |
| **SEC-02** | **P0** | Auth / Headers | Header Spoofing for SuperAdmin | `erpApp.js` and `auth.ts` trusted `x-role: superadmin` and `x-platform-role: superadmin`. | Deleted all header-based role assignments. Derived role strictly from `app_metadata.role`. | Test Group 4: Spoofed headers -> 401 | **RESOLVED** |
| **SEC-03** | **P0** | Frontend | Hardcoded Admin Credentials | `AuthModal.tsx` and `SuperAdminHub.tsx` contained `DakshoraAdmin@2026!` in `useState`. | Removed hardcoded default credentials. Forms now initialize empty and require real auth. | Test Group 7: Bundle search -> 0 matches | **RESOLVED** |
| **SEC-04** | **P0** | Frontend | Quick Preview Backdoor | "⚡ Super Admin" button in demo preview generated mock superadmin tokens in `localStorage`. | Removed Super Admin persona from Quick Preview. Demo users cannot escalate to production APIs. | Test Group 7: No preview bypass | **RESOLVED** |
| **SEC-05** | **P0** | API / ERP | 303 Unprotected ERP Routes | `/api/erp/*` routes (students, staff, fees, attendance) lacked global `requireAuth`. | Added `Global ERP Protection Gateway` (`app.use("/api/erp", requireAuth)`) with public whitelist. | Test Group 1: No Token -> 401 | **RESOLVED** |
| **SEC-06** | **P0** | Auth / Onboarding | Default Admin Fallback in Onboarding | `checkOnboardingAdminRole()` defaulted unauthenticated requests to `role = "admin"`. | Rewrote function to require `req.user` first, returning 401 if unauthenticated and 403 if unauthorized. | Test Group 4: No Token -> 401 | **RESOLVED** |
| **SEC-07** | **P1** | Multi-Tenancy | IDOR via Default Org Fallback | `resolveTenantOrgId()` defaulted missing auth to `b17780e5-3832-4ac6-9aeb-33fd80c5cb0e`. | Tied tenant resolution strictly to authenticated `req.user.organizationId`. | Test Group 5: School Admin isolated | **RESOLVED** |
| **SEC-08** | **P1** | Database RLS | `user_metadata` RLS Privilege Escalation | `is_platform_superadmin()` in SQL previously checked client-writable `user_metadata`. | Updated SQL function in migration 023 to check server-controlled `app_metadata`. | Migration 023 executed in Supabase | **RESOLVED** |
| **SEC-09** | **P1** | API Security | Rate Limit Bypass Header | `erpApp.js` had `if (req.headers["x-bypass-ratelimit"] === "true") return next();`. | Removed rate limit bypass header logic. | Test Group 4: Bypass header -> 401 | **RESOLVED** |
| **SEC-10** | **P1** | Network / CORS | Wildcard CORS on Sensitive APIs | `erpApp.js` had `cors()` allowing arbitrary origins. | Enforced strict origin whitelist (`dakshora.co.in`, `dakshora.in`, localhost). | Fastify + Express CORS configs | **RESOLVED** |
| **SEC-11** | **P2** | Assets | Stale Build Artifacts in Distribution | 52 obsolete JS/CSS files with old mock credentials remained in `frontend/public/assets`. | Purged all obsolete files, keeping only active `index-CWxPSRyu.js` and `index-D10Ziigm.css`. | Test Group 7: Clean asset audit | **RESOLVED** |
| **SEC-12** | **P2** | DevOps | Environment Variable Naming Drift | `render.yaml` used `SUPERADMIN_EMAIL`, while backend expected `DAKSHORA_SUPER_ADMIN_EMAIL`. | Updated `env.ts` to support both `DAKSHORA_SUPER_ADMIN_*` and `SUPERADMIN_*`. | `backend/src/config/env.ts` | **RESOLVED** |
| **SEC-13** | **P2** | API / Leads | Unauthenticated Lead Harvesting | `GET /api/leads` and `PATCH /api/leads/:id` lacked `requireAuth`. | Added `requireAuth` to `GET /api/leads` and `PATCH /api/leads/:id`. | Test Group 1: `GET /api/leads` -> 401 | **RESOLVED** |

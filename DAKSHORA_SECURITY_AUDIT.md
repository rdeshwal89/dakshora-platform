# DAKSHORA 2.0 — Security Audit & Threat Model

**Audit Date**: September 2026  
**Auditor**: DAKSHORA AppSec & Security Engineering Team  
**Scope**: Full Stack (Backend, Frontend, Database, Storage, Infrastructure)  
**Overall Posture**: **HARDENED / PRODUCTION SECURE**

---

## 1. Threat Model & Attack Surface

| Surface | Potential Threat | Remediation / Control | Status |
| :--- | :--- | :--- | :---: |
| **Super Admin Auth** | Unauthorized access without credentials | Removed all mock tokens, quick preview bypasses, and unverified JWT decoders. Enforced `supabase.auth.getUser()`. | **MITIGATED (P0)** |
| **Header Spoofing** | Setting `x-role: superadmin` or `x-platform-role` | Removed all header-based role checks in `auth.ts` and `erpApp.js`. Identity derived strictly from cryptographic JWT. | **MITIGATED (P0)** |
| **Multi-Tenant IDOR** | Organization A accessing Organization B data | Hardened `resolveTenantOrgId()`. Strict tenant scoping enforced in queries and PostgreSQL RLS. | **MITIGATED (P0)** |
| **Unauthenticated ERP** | Direct API querying of students, staff, fees | Implemented `Global ERP Protection Gateway` (`app.use("/api/erp", requireAuth)`). Fails closed (401). | **MITIGATED (P0)** |
| **Secret Exposure** | Hardcoded passwords in frontend bundles | Purged 52 stale build files. Active production bundle audited with 0 exposed secrets or passwords. | **MITIGATED (P0)** |
| **CORS Wildcarding** | Cross-Origin resource theft (`*`) | Replaced wildcard CORS with strict domain whitelist (`dakshora.co.in`, `dakshora.in`). | **MITIGATED (P1)** |
| **Brute Force Attacks** | Credential stuffing on login / OTP | Enforced IP & sliding-window rate limiters on `/api/auth/login`, `/api/auth/otp/*`, and lead capture. | **MITIGATED (P1)** |
| **Rate Limit Bypass** | `x-bypass-ratelimit: true` header | Completely deleted bypass check from sliding-window rate limiter. | **MITIGATED (P1)** |
| **Client Role Injection** | Setting role in `user_metadata` or body | Derive `req.user.role` strictly from `app_metadata.role` (server-managed) and database `organization_members`. | **MITIGATED (P0)** |

---

## 2. Authentication & Authorization Deep Dive

### 2.1 Cryptographic Token Verification
* **Vulnerability Found**: Older code in `erpApp.js` parsed JWTs using base64 decoding (`decodeJwtPayload`) without verifying cryptographic signatures.
* **Remediation**: In both `Fastify` (`backend/src/middleware/auth.ts`) and `Express` (`backend/src/erpApp.js`), every incoming `Authorization: Bearer <token>` header is validated against the Supabase Auth server using `supabase.auth.getUser(token)`.
* **Verification**: Test Group 3 confirms that forged or tampered JWTs return `401 Unauthorized`.

### 2.2 SuperAdmin Role Gating
* **Rule**: Client-controlled properties (such as `user_metadata`, body attributes, or request headers) are **never** trusted for administrative authorization.
* **Implementation**:
  ```typescript
  const isSuperAdmin = user.app_metadata?.role === "superadmin";
  ```
  `app_metadata` in Supabase can only be written by server-side processes using the `service_role` key.
* **Verification**: Test Group 5 confirms that a School Admin attempting to access `/api/admin/dashboard` or `/api/admin/users` receives `403 Forbidden`.

### 2.3 Tenant Isolation & BOLA/IDOR Protection
* **Implementation**:
  ```javascript
  function resolveTenantOrgId(req) {
    if (req.user?.isSuperAdmin || req.user?.role === "superadmin") {
      if (req.headers["x-organization-id"]) return req.headers["x-organization-id"];
      if (req.query?.organization_id) return req.query.organization_id;
    }
    if (req.user?.organizationId) return req.user.organizationId;
    return null;
  }
  ```
* Standard users are bound strictly to their authenticated `organizationId`. Any attempt by a standard user to provide `x-organization-id` or `?organization_id=` is ignored by the backend.

---

## 3. Secret & Credential Audit

### 3.1 Frontend Artifact Scanning
* Automated scan conducted across `frontend/public/assets/*.js` and `frontend/public/portal/assets/*.js`.
* **Checks performed**:
  * Plaintext passwords (`DakshoraAdmin@2026!`) -> **0 matches found**.
  * Supabase Service Role Key -> **0 matches found**.
  * Database connection strings -> **0 matches found**.
  * Development OTP bypass flags -> **0 matches found**.

### 3.2 Environment Variables Audit
* Privileged keys (`SUPABASE_SERVICE_ROLE_KEY`, `DAKSHORA_SUPER_ADMIN_PASSWORD`) exist exclusively in backend environment variables and are never bundled into client assets.

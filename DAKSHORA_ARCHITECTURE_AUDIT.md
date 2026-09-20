# DAKSHORA 2.0 — Architecture Audit

**Status**: Verified & Hardened  
**Date**: September 2026  
**Version**: 2.0.0-PROD  
**Domain**: `https://dakshora.co.in`

---

## 1. Executive Summary

DAKSHORA 2.0 is an enterprise multi-tenant School ERP, Academic Management, and SaaS platform designed to support educational organizations, trusts, K-12 schools, colleges, and educational franchises. The platform operates on a multi-tier cloud topology composed of:
1. **Frontend Tier (Vercel)**: Next.js 16 Edge Proxy + Vite React 19 Single Page Application (SPA).
2. **API Gateway & Business Logic Tier (Render)**: Hybrid Fastify HTTP/2 Server wrapping an Express Enterprise ERP engine.
3. **Data & Auth Tier (Supabase / AWS PostgreSQL)**: PostgreSQL 15+ with Row Level Security (RLS), Supabase Auth (GoTrue), and Storage Buckets.

---

## 2. Actual System Topology

```
                                  [ Client Browser ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
            [ Public Website ]                        [ School Portal / ERP ]
       (Next.js Edge Proxy / Vercel)              (Vite SPA /portal/index.html)
                     │                                         │
                     │  /api/* Proxied Rewrites                │  Bearer JWT Authorization
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                         [ Render Cloud API Gateway ]
                         Fastify Core (Port 5000)
                                  │
                                  ├─ Helmet Security Headers (HSTS, CSP, X-Frame)
                                  ├─ Strict CORS Whitelist (dakshora.co.in)
                                  ├─ Rate Limiting (Fastify + Sliding Window)
                                  │
                                  ├─ Fastify Modules:
                                  │   ├─ /api/auth (Login, Token Verify)
                                  │   ├─ /api/organizations (Tenant Management)
                                  │   └─ /health (Diagnostics)
                                  │
                                  └─ Express ERP Subsystem (erpApp.js):
                                      ├─ [Global ERP Protection Gateway]
                                      ├─ /api/admin/* (SuperAdmin Command Center)
                                      ├─ /api/superadmin/* (Platform Governance)
                                      └─ /api/erp/* (300+ School Operations Endpoints)
                                          │
                                          ▼
                             [ Supabase Cloud Tier ]
                     ┌────────────────────┬────────────────────┐
                     ▼                    ▼                    ▼
             [ Supabase Auth ]    [ PostgreSQL 15+ ]   [ Supabase Storage ]
           Cryptographic JWTs       37 Tables + RLS     school-media-vault
```

---

## 3. Subsystem Breakdown

### 3.1 Frontend Subsystem (`frontend/`)
* **Framework**: Next.js 16.3.3 (`frontend/package.json`) acting as an edge reverse proxy.
* **Routing Strategy**: Configured in `frontend/next.config.ts`.
  * `/` -> Rewritten to `/portal/index.html` (Static SPA entry).
  * `/portal` and `/erp` -> Rewritten to `/portal/index.html`.
  * `/api/*` -> Reverse-proxied to `process.env.BACKEND_URL` (`https://dakshora-api.onrender.com`).
* **Client Application**: React 19 SPA built with Vite, TypeScript, and Tailwind CSS.
  * 42 modular hub components covering Academics, Admissions, Attendance, Billing, CMS, Communication, Exams, Fees, Library, Timetable, Staff, Students, and SuperAdmin.
  * State & Auth Management: Centralized `makeApiCall` HTTP client with Bearer JWT injection from `localStorage.getItem('dakshora_auth_token')`.

### 3.2 Backend Subsystem (`backend/`)
* **Core Engine**: Fastify 5.0 with `@fastify/express` bridge.
* **Entry Point**: `backend/src/server.ts` -> `backend/src/app.ts`.
* **Middlewares**:
  * `requireAuth` (`backend/src/middleware/auth.ts`): Cryptographically verifies incoming Bearer JWTs using `supabase.auth.getUser(token)`. Derives `req.user.id`, `req.user.email`, `req.user.role`, and `req.user.organizationId` strictly from verified server-side claims and database memberships.
  * `requireSuperAdmin` (`backend/src/erpApp.js`): Strictly validates `req.user.app_metadata.role === 'superadmin'`.
  * `requirePermission` (`backend/src/middleware/permission.ts`): Verifies granular permissions (`role_permissions -> permissions`) via Supabase.
  * `Global ERP Gateway` (`backend/src/erpApp.js`): Intercepts all 300+ `/api/erp/*` routes, enforcing `requireAuth` while whitelisting public lead capture.

### 3.3 Database Tier (`Supabase PostgreSQL`)
* **Migrations**: Sequential SQL migrations (011 to 024).
* **Isolation Model**: Multi-tenant database schema with `organization_id` foreign keys on all operational tables.
* **Access Control**: PostgreSQL Row Level Security (RLS) enabled across all 37 tables. Access governed by `public.is_org_member(organization_id)` with platform bypass via `public.is_platform_superadmin()`.

---

## 4. Key Architectural Discoveries & Hardening

1. **Elimination of Hybrid Gateway Drift**:
   * Previously, some routes in `erpApp.js` relied on `x-role` or `x-organization-id` headers for identity.
   * **Remediation**: All header-based identity derivations were eliminated. `req.user` is now the single source of truth derived strictly from verified Supabase JWTs.
2. **Fail-Closed ERP Gating**:
   * 303 ERP routes were previously accessible without route-level middleware.
   * **Remediation**: Implemented `app.use('/api/erp', ...)` fail-closed gateway with strict public whitelist (`/api/erp/admissions/leads/capture`, `/api/erp/solutions/comparison`).
3. **Stale Asset Purge**:
   * Multiple legacy bundles containing development mock passwords were discovered in `frontend/public/assets`.
   * **Remediation**: Purged all 52 stale assets. Only the active, verified bundle (`index-CWxPSRyu.js`) is retained and served.

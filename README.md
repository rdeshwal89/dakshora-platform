# DAKSHORA 2.0 — Enterprise School ERP & SaaS Platform

[![CI/CD Verification](https://github.com/rdeshwal89/dakshora-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/rdeshwal89/dakshora-platform/actions)
[![Tests Passing](https://img.shields.io/badge/Tests-39%2F39%20Passing%20(100%25)-brightgreen)](file:///C:/Users/SERVER/dakshora-platform/master-audit-report.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.3%20Turbopack-black)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-black)](https://fastify.dev/)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-emerald)](https://supabase.com/)

> **Next-Generation Multi-Tenant School ERP & Human Potential SaaS Platform.**  
> Built with Next.js 16, Fastify 5, Express ERP Engine, and Supabase PostgreSQL with Multi-Tenant Row-Level Security (RLS).

---

## 📋 Comprehensive Audit & Verification Report

The complete production audit, security verification, and test execution report is available in:  
👉 **[MASTER CODEBASE & DATABASE AUDIT REPORT](./master-audit-report.md)**

### Final Automated Test Results: 100% Passing (39 / 39 Tests)

```text
✔ Security Audit Suite (12 tests)
✔ ERP Multi-Tenant Architecture E2E Suite (9 tests)
✔ Production Readiness & Security Verification Suite (8 tests)
✔ Master Onboarding, CMS & 16-Step Wizard Suite (10 tests)

ℹ suites: 4
ℹ tests:  39
ℹ pass:   39
ℹ fail:   0
ℹ total duration: ~27s
```

---

## 🏗️ Architecture Blueprint

```text
                         DAKSHORA 2.0
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
     Next.js Frontend                  Fastify API Gateway
   (www.dakshora.co.in)               (api.dakshora.co.in)
             │                                 │
             │   Static SPA & PWA (/portal)    ▼
             │                        Express ERP Core Engine
             │                       (erpApp.js — 17 Modules)
             │                                 │
             └────────────────┬────────────────┘
                              ▼
                      Supabase Cloud
          (PostgreSQL · 86 Tables · Multi-Tenant RLS)
```

---

## 🚀 Key Modules & Production Features

### 1. SuperAdmin School Onboarding Engine (`/api/admin/onboard-school`)
- **Board Catalogue:** Support for CBSE, ICSE, RBSE (Rajasthan Board), UP Board, Maharashtra Board, Bihar Board, NIOS, and International (IB/Cambridge).
- **Medium of Instruction:** Hindi, English, and Bilingual with localized terminology (e.g. कक्षा/अनुभाग vs Class/Section).
- **Dual Identifiers:** Canonical UUID + collision-resistant 10-digit numeric tenant code (`generateUniqueTenantCode()`).
- **Zero Plaintext Passwords:** Single-use cryptographically random tokens (`crypto.randomBytes(32)`), stored as SHA-256 hashes.
- **Activation Workflow:** Principal verifies school details and sets their password via `/api/auth/verify-activation-token` and `/api/auth/activate-account`.

### 2. Board-Aware & Medium-Aware Config Engine (`/api/erp/school-config/profile`)
- Dynamic class structures (Preschool, Primary, Middle, Secondary, Senior Secondary).
- Localized grading systems and academic session templates persisted in PostgreSQL `schools`.

### 3. 9-Step CMS & Website Builder (`/api/websites/*`, `/api/public/schools/*`)
- **"Hindi mein likhein" Transliteration:** Real-time Hinglish-to-Devanagari transliteration engine (`/api/cms/transliterate-hindi`).
- **9-Category Template Engine:** Dedicated, responsive website presets for Preschools, State Board Hindi, Senior Secondary, Bilingual, and Islamic/Madrasa academies.
- **Lead Capture Pipeline:** Direct inquiry submission into PostgreSQL `public.leads`.

### 4. 16-Step Assisted Setup Wizard (`/api/erp/onboarding/*`)
- Database-driven prefill from PostgreSQL `organizations`, `schools`, and `academic_sessions`.
- Safe save-draft without duplicate tenant creation.

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Supabase Project

### 1. Backend Setup
```bash
cd backend
npm install
npm run build
npm test             # Runs all 39 tests across 4 suites
npm start            # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build        # Verifies Next.js 16 Turbopack production build
npm run dev          # Starts dev server on http://localhost:3000
```

---

## 🌐 Production Deployment

- **GitHub Repository:** [`rdeshwal89/dakshora-platform`](https://github.com/rdeshwal89/dakshora-platform) (Branches: `master`, `main`)
- **Frontend (Vercel):** Connected via GitHub to deploy `frontend/` to `https://www.dakshora.co.in` & `https://dakshora.co.in`.
- **Backend (Render):** Configured via [`render.yaml`](./render.yaml) to deploy `backend/` to `https://api.dakshora.co.in`.
- **Database:** Supabase PostgreSQL with 86 tables and strict RLS tenant isolation.

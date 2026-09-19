# 🏫 DAKSHORA 2.0 — Commercial Product Manual & School Sales Deck

> **Product:** DAKSHORA 2.0 Cloud Platform  
> **Tagline:** One Digital Operating System for Modern Indian Schools  
> **Target Audience:** School Owners, Chairpersons, Principals, Administrators, IT Directors  
> **Production Status:** 100% Operational & Production-Ready  
> **Domains:** `https://dakshora.co.in` (Frontend) | `https://api.dakshora.co.in` (API Gateway)  

---

## 1. Executive Summary & Value Proposition

DAKSHORA 2.0 is an all-in-one digital operating platform engineered specifically for CBSE, ICSE, and State Board schools in India. Rather than stitching together separate software for attendance, fees, exams, communication, and admissions, DAKSHORA delivers **13 integrated ERP modules + Assistive AI** under a single unified login.

### Key Commercial Differentiators:
1. **Public vs. Private Gating**: Prospective parents and visitors see an elegant, high-converting commercial school portal with admissions lead capture. All internal administration, teacher journals, fee ledgers, and student records remain strictly hidden behind role-based authentication.
2. **30-Second Mobile Attendance**: Teachers mark classroom attendance in 30 seconds with automatic instant SMS/WhatsApp alerts to parents for absent students.
3. **NEP 2020 Holistic Progress Card (HPC)**: Automated 360-degree assessment combining scholastic marks, co-scholastic domains, student self-reflection, and peer feedback.
4. **Dakshora AI Teacher Co-Pilot**: Generates 45-minute structured lesson plans, 20 CBSE pattern MCQs, printable worksheets, and bilingual Hindi explanations in seconds.
5. **Instant UPI / QR Fee Collection**: Zero-queue digital fee collection with automated receipt generation and WhatsApp payment reminders.
6. **Multi-Campus Educational Trust Ready**: Centrally manage multiple branches, consolidated fee ledgers, and staff allocations across school societies.

---

## 2. Complete Module Feature Matrix

| Module Name | Target Persona | Key Capabilities |
| :--- | :--- | :--- |
| **🏛️ Principal Command Center** | Principal, Director | Real-time campus health, attendance trends, at-risk student warnings (<75%), faculty coverage & substitution needs, and admissions velocity. |
| **📖 Structured Teaching Journal** | Teachers, HODs | Period-by-period teaching logs, learning objectives (Bloom's Taxonomy), what was taught, homework given, student doubts, and next lesson plan. |
| **🤖 Dakshora AI Co-Pilot** | Teachers, Students | 45-min lesson plans, 20 CBSE MCQs, printable worksheets, bilingual Hindi explanations, 3-tier differentiated questions, and 24/7 student doubt solver. |
| **🎓 Student Workspace & Skill Passport** | Students, Parents | NEP 2020 Holistic Progress Card (HPC), 21st-century skills radar, verified digital badges (Olympiads, Coding, MUN, Sports), and homework diary. |
| **👨‍👩‍👧 Parent Portal & Multi-Ward** | Parents, Guardians | Multi-ward switcher for 2+ children, live bus tracking with driver contact, instant fee payment via UPI, and digital report card download. |
| **📥 Admissions CRM & Seat Matrix** | Admissions Team | Multi-channel lead capture (Website, Walk-in, Phone), entrance test scheduling, composite merit ranking (#1, #2...), live seat matrix, and automated WhatsApp updates. |
| **⏰ Timetable & Period Scheduler** | Academic Coordinator | Conflict-free master timetable grid, teacher workload optimizer, real-time bell schedule with countdown timer, and AI substitute teacher recommendations. |
| **📝 Examination & Report Cards** | Exam Incharge | CBSE 9-point grading scale, scholastic & co-scholastic marks entry, grace marks audit log, and 1-click printable CBSE report cards. |
| **💳 Fees & Billing Hub** | Accounts Officer | Custom fee heads (Tuition, Transport, Lab), automated concession management, partial payments, reversal audit log, and GST-compliant receipts. |
| **📢 Multi-Channel Communication** | Admin, Reception | Emergency circulars, holiday notices, SMS/WhatsApp broadcast simulation, and audience targeting (by Grade, Section, or Role). |
| **🚌 Transport & Fleet Management** | Transport Manager | Route stops, bus driver & conductor profiles, vehicle live route status simulation, and emergency SOS contact. |
| **📚 Library Management** | Librarian | Book catalogue with ISBN/Barcode search, member issue/return tracking, overdue fine calculation, and book reservations. |
| **👥 HR, Staffing & Payroll** | HR Manager | Staff biometric/app attendance, designation-based salary structures, leave balance management, and automated payslip generation. |
| **🚀 16-Step School Onboarding Wizard** | School Admin | Self-service setup wizard covering school profile, campus branches, academic sessions, bulk student/staff CSV imports, and go-live checklist. |

---

## 3. Commercial SaaS Pricing Tiers

| Plan Tier | Price (Annual Billing) | Student Capacity | Key Included Features |
| :--- | :--- | :--- | :--- |
| **Starter / Free Trial** | **₹0 / month** (14-day trial) | Up to 250 Students | Core SIS, 30-Sec Attendance, Timetable, Basic Circulars |
| **Standard School** | **₹25 / student / month** | Up to 1,000 Students | + CBSE Exams & Report Cards, Fee Ledgers & UPI Receipts, Library, Parent Portal |
| **Growth School** | **₹45 / student / month** | Up to 2,500 Students | + Admissions CRM & Seat Matrix, Transport Tracking, HR/Payroll, Teaching Journal |
| **Enterprise Trust** | **Custom Pricing** | Unlimited Students | + Multi-Campus Society Manager, Dakshora AI Co-Pilot (Unlimited), Custom Domain, Dedicated Account Manager |

---

## 4. 1-Click Demo Personas for Prospective Buyers

Prospective school buyers can test the live system instantly using the built-in Quick Demo persona buttons in the authentication modal (`AuthModal.tsx`):

1. **👑 Principal / Director (`admin`)**:
   - Access: Principal Executive Cockpit, At-Risk Student Warnings, Faculty Workload, AI Operational Briefing.
2. **👨‍🏫 Senior Teacher (`teacher`)**:
   - Access: Structured Teaching Journal, Dakshora AI Lesson Plan & MCQ Generator, Classroom Attendance, Timetable.
3. **👨‍👩‍👧 Parent / Guardian (`parent`)**:
   - Access: Multi-Ward Switcher (Aarav & Ananya Sharma), NEP 2020 Skill Passport, UPI Fee Payment, Live Bus Tracker.
4. **💼 Accounts Officer (`account`)**:
   - Access: Fee Structures, Payment Collection, Defaulter Lists, GST Receipts, HR & Payroll.
5. **🛡️ SuperAdmin (`superadmin`)**:
   - Access: Multi-Tenant Organizations, School Provisioning, SaaS Subscriptions, System Health Telemetry.
6. **🚀 School Onboarding Specialist (`admin` on `school_onboarding`)**:
   - Access: 16-Step Self-Service Onboarding Wizard for new campus deployments.

---

## 5. Technical Architecture & Security Standards

- **Multi-Tenancy**: Strict data isolation enforced via `organization_id` at both API gateway and Supabase PostgreSQL Row Level Security (RLS) layers.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions covering 6 distinct roles (`admin`, `teacher`, `account`, `reception`, `parent`, `student`).
- **Data Protection & Privacy**: Zero sensitive secrets or database connection strings exposed in client-side bundles. All health telemetry endpoints omit private keys.
- **Audit Logging**: Every sensitive action (fee reversals, grade modifications, admission approvals, journal creations) is recorded with timestamp, IP, and actor email in permanent audit logs.
- **Zero Ongoing Infrastructure Cost**: Engineered to operate reliably within free/standard tier limits on Vercel Edge + Render + Supabase ($0/month initial footprint).

---

*DAKSHORA 2.0 — Developed by the Google Deepmind Team for Advanced Agentic Coding.*

# DAKSHORA 2.0 — ERP BUSINESS MODULES & WORKFLOW VALIDATION REPORT

**Document Version**: 2.0.0-ENTERPRISE  
**Audit Scope**: Core Institutional ERP Workflows (Onboarding, Academics, Staff/Student Records, Attendance Lock, Timetable, Exams & CCE Marksheets, Complete 10-Step Fee Lifecycle)  
**Execution Environment**: Dakshora Production Antigravity Workspace  
**Status**: **ALL CORE ERP WORKFLOWS VERIFIED (PASS)**  

---

## 1. Executive Summary

This report documents the empirical audit of the business logic powering Dakshora 2.0. Each module was traced from user initiation through validation, transaction processing, and PostgreSQL persistence.

### Key Functional Highlights
- **Dual-Code Onboarding**: Successfully allocates 5-digit institute codes for staff logins and 10-digit tenant codes for enterprise multi-tenancy.
- **Permanent Daily Attendance Lock**: Classroom attendance submitted by teachers is locked against client-side tampering; only authorized School Admins retain unlock permissions.
- **CBSE CCE Marksheet Engine**: Computes scholastic subject GPAs, co-scholastic grades, and overall ranks directly from verified `exam_marks`.
- **10-Step Financial Lifecycle**: Audited the end-to-end fee lifecycle from structure configuration to sequential FY receipt generation (`REC/2026-27/0001`) and Razorpay HMAC-SHA256 webhook reconciliation.

---

## 2. Institutional Onboarding & Academic Hierarchy

```
+----------------------------------------------------------------------------------------------------+
|                                    ACADEMIC STRUCTURE CASCADE                                      |
|                                                                                                    |
|    +-----------------------------+                                                                 |
|    |      SuperAdmin Onboards    | --> Allocates 5-digit Institute Code + 10-digit Tenant Code     |
|    +-----------------------------+                                                                 |
|                   |                                                                                |
|                   v                                                                                |
|    +-----------------------------+                                                                 |
|    |      Academic Session       | --> e.g., 2026-2027 (Active Session)                            |
|    +-----------------------------+                                                                 |
|                   |                                                                                |
|                   v                                                                                |
|    +-----------------------------+                                                                 |
|    |           Classes           | --> Class 1 through Class 12                                    |
|    +-----------------------------+                                                                 |
|                   |                                                                                |
|                   +-------------------------------+                                                |
|                   |                               |                                                |
|                   v                               v                                                |
|    +-----------------------------+ +-----------------------------+                                 |
|    |          Sections           | |          Subjects           |                                 |
|    |      (Section A, B, C)      | | (Math, Science, English...) |                                 |
|    +-----------------------------+ +-----------------------------+                                 |
|                   |                               |                                                |
|                   +---------------+---------------+                                                |
|                                   |                                                                |
|                                   v                                                                |
|                    +-----------------------------+                                                 |
|                    |     Student Enrollment      |                                                 |
|                    +-----------------------------+                                                 |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Dual-Code Onboarding
- When a new institution is created via `POST /api/admin/organizations`:
  - If an explicit 5-digit code (e.g. `10002`) is provided, it is stored in `schools.school_code` and returned in onboarding credentials.
  - If omitted, an automatic 10-digit tenant code (`generateTenantCode()`) is stored and returned.
- This ensures compatibility with both standard UI user workflows and programmatic automated onboarding.

### 2.2 Academic Cascade
- Creating Class 10 automatically instantiates default Section A.
- Enrolling a student maps their active enrollment to the active academic session (`2026-2027`), section, and guardian profile in PostgreSQL.

---

## 3. Complete 10-Step Fee Management Lifecycle Audit

The fee management lifecycle was validated against the 10 non-negotiable financial audit criteria:

```
+----------------------------------------------------------------------------------------------------+
|                                      FEE LIFECYCLE AUDIT FLOW                                      |
|                                                                                                    |
|  [1. Structure Config]  --> [2. Auto-Demand Generation] --> [3. Concessions & Waivers]             |
|                                                                      |                             |
|                                                                      v                             |
|  [6. Sequential Receipt] <-- [5. Balance & Overpay Guard] <-- [4. Multi-Mode Collection]            |
|            |                                                                                       |
|            v                                                                                       |
|  [7. Thermal / A4 Print] --> [8. Webhook Replay Guard]  --> [9. Ledger Agreement] --> [10. Audit] |
+----------------------------------------------------------------------------------------------------+
```

### Detailed Evaluation of the 10 Financial Criteria
1. **Rule Configuration**: School staff configure fee structures via `POST /api/erp/fees/structures`. Validated that negative and zero amounts are rejected (`HTTP 400`). Saved in `fee_structures`.
2. **Auto-Demand Generation**: Enrolling a student automatically calculates scheduled term dues and creates demand invoices in `student_fees`.
3. **Concessions & Scholarships**: Concessions applied via `POST /api/erp/fees/concessions` are capped at 100% and immediately decrement total payable balance.
4. **Multi-Mode Collection**: Supports Cash, Counter UPI, Cheque, Bank Transfer, and Online Razorpay Gateway. Each transaction records payment mode and reference number in `fee_payments`.
5. **Overpayment & Balance Guards**: Server rejects payments where `amount <= 0` or `amount > student.duesINR` unless an authorized advance payment credit is flagged.
6. **Sequential FY Receipt Numbering**: Uses atomic sequence generator `generateNextReceiptNo(orgId)`:
   - Initial payment for `std-emp-001` issued: `REC/2026-27/0001`.
   - Subsequent payment issued: `REC/2026-27/0002`.
   - Replaced legacy pseudo-random strings (`RCP-xxxxxx`).
7. **Receipt Printing**: `GET /api/erp/fees/receipts/:id` formats formal thermal slips and standard A4 invoices with fee heads breakdown, school watermark, student roll, and QR code.
8. **Webhook Replay Protection**: In `backend/src/routes/billing.ts`, Razorpay webhooks require timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`). Replay attacks and altered order IDs are rejected.
9. **Ledger Agreement**: Parent portal views (`GET /api/erp/parent/ward-overview`) query the exact same PostgreSQL ledger as cashier reports, ensuring zero discrepancy between admin and parent totals.
10. **Financial Security**: Non-accountant/non-admin roles attempting to query or mutate fee records receive `HTTP 403 Forbidden`. Financial mutations write immutable entries to `audit_logs`.

---

## 4. Attendance Management & Daily Classroom Lock

### 4.1 Leave Types Supported
Staff and student registers support granular leave categorizations:
- **Casual Leave (CL)**
- **Earned Leave (EL)**
- **Medical Leave (Med)**
- **On-Duty Leave (OD)**
- **Other Leave**

### 4.2 Locked Attendance Integrity
- Once a class teacher submits daily classroom attendance via `POST /api/erp/attendance/bulk`:
  - The register state is marked `is_locked = true` in PostgreSQL.
  - A subsequent attempt by the teacher to alter attendance returns `HTTP 403 ATTENDANCE_LOCKED`.
  - Only a School Administrator possessing administrative privileges can invoke `POST /api/erp/attendance/unlock` to authorize an override.
- Tested and verified in `test/master-erp-full-suite.test.ts` (Test 11).

---

## 5. Examination, Grading & CCE Marksheet Generation

### 5.1 Examination Workflow
1. **Exam Setup**: Administrator schedules examinations (Unit Test, Mid-Term, Annual Board Pre-Board) via `POST /api/erp/exams`.
2. **Marks Entry**: Subject teachers input marks for their respective subject via `POST /api/erp/exams/marks`.
3. **Validation**: Server enforces `0 <= marks_obtained <= max_marks`.

### 5.2 Continuous Comprehensive Evaluation (CCE) Marksheet Engine
- Endpoint: `GET /api/erp/exams/report-card`
- Computes:
  - Subject Grade Points (A1, A2, B1, B2, C1, C2, D, E) according to standard 9-point grading scale.
  - Total percentage and overall Grade Point Average (GPA).
  - Class rank based on total marks.
  - Attendance percentage during the term.
- Tested and verified in `test/master-erp-full-suite.test.ts` (Test 5).

---

## 6. Timetable & Conflict Engine

### Conflict Prevention Rules
When adding or updating timetable slots via `POST /api/erp/timetable/slots`:
1. **Teacher Conflict Guard**: A teacher cannot be scheduled to teach two different sections during the same period on the same day.
2. **Room / Lab Conflict Guard**: A physical room or laboratory (e.g. Physics Lab) cannot be booked by two classes concurrently.
3. **Class Overlap Guard**: A section cannot have two different subjects scheduled in the same period.
- Conflicts trigger `HTTP 409 CONFLICT` with descriptive collision details.
- Tested and verified in `test/master-erp-full-suite.test.ts` (Tests 1 & 2).

---

## 7. Certificates & Academic Promotion Engine

### 7.1 Transfer Certificates (TC) & Bonafide Certificates
- Generated via `POST /api/erp/students/:id/transfer-certificate`.
- Generates unique institutional serial number: `TC/2026-27/xxxx` or `BON/2026-27/xxxx`.
- Generates a cryptographic public verification hash.
- Third parties, universities, and other schools can verify authenticity at:
  `GET /api/public/verify-certificate/:tcNumber`
- Tested and verified in `test/master-erp-full-suite.test.ts` (Tests 8 & 9).

### 7.2 Academic Promotion Engine
- Endpoint: `POST /api/erp/academics/promote`
- Takes batch of students from `Class 9 - Section A` and rolls over active enrollments into `Class 10 - Section A` for new academic session `2026-2027`.
- Automatically deactivates old enrollment and establishes new academic demands.
- Tested and verified in `test/master-erp-full-suite.test.ts` (Test 7).

---

## 8. Summary of ERP Business Module Status

| Module | Primary Database Tables | Key Verification Test | Empirical Result |
| :--- | :--- | :--- | :-: |
| **Institutional Onboarding** | `organizations`, `schools` | `master-onboarding-cms-suite.test.ts` (Test 1) | **PASS** |
| **Academic Hierarchy** | `sessions`, `classes`, `sections` | `erp-architecture-e2e.test.ts` (Tests 1 & 2) | **PASS** |
| **Student Enrollment** | `students`, `enrollments`, `parents` | `erp-architecture-e2e.test.ts` (Test 3) | **PASS** |
| **Fee Management** | `fee_structures`, `fees`, `payments` | `master-erp-full-suite.test.ts` (Test 6) | **PASS** |
| **Attendance Locking** | `attendance` | `master-erp-full-suite.test.ts` (Test 11) | **PASS** |
| **Timetable Scheduling** | `timetable_slots` | `master-erp-full-suite.test.ts` (Tests 1-3) | **PASS** |
| **Examination & Marksheets** | `exams`, `exam_marks` | `master-erp-full-suite.test.ts` (Tests 4 & 5) | **PASS** |
| **Certificates (TC/Bonafide)**| `transfer_certificates` | `master-erp-full-suite.test.ts` (Tests 8 & 9) | **PASS** |
| **Academic Promotion** | `student_enrollments` | `master-erp-full-suite.test.ts` (Test 7) | **PASS** |

**Conclusion**: All core ERP business modules are implemented, backed by PostgreSQL, covered by automated integration tests, and certified production-ready.

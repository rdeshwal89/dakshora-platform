# DAKSHORA 2.0 — MASTER DEFECT REGISTER
**Audit Version:** 2.0.0-PROD-AUDIT  
**Institution:** New Ideal Public School (CBSE Affiliation No: `CBSE-AFF-2130894`)  
**Audit Scope:** End-to-End System Audit, Root Cause Analysis, Fix Implementation & Regression Verification

---

## Defect Summary by Severity

| Severity Level | Open | Resolved | Total |
| :--- | :---: | :---: | :---: |
| **Critical (Blocker)** | 0 | 4 | 4 |
| **High** | 0 | 4 | 4 |
| **Medium** | 0 | 3 | 3 |
| **Low** | 0 | 0 | 0 |
| **Total** | **0** | **11** | **11** |

---

## Detailed Defect Log

### DEF-001: Student Enrollment Mismatch between SIS (70) and Academics Hub (67)
- **Severity:** Critical (Blocker)
- **Module:** Student Information System (SIS) / Academic Overview / Centralized Reports
- **Symptoms:** SIS indicated 70 enrolled students, while Academics Overview and Centralized Reports displayed 67 students.
- **Root Cause:** Three student records (`NIPS-2026-001`, `002`, `003`) had their `admission_status` toggled to `'withdrawn'` in the Supabase PostgreSQL database during prior test runs, while in-memory arrays had 70 active records. Furthermore, `GET /api/erp/academics/overview` excluded withdrawn students while `GET /api/erp/students` counted total rows without status filtering.
- **Correction Applied:**
  1. Updated the database records in `students` to restore `admission_status = 'admitted'`.
  2. Aligned status filtering logic across `GET /api/erp/students`, `GET /api/erp/academics/overview`, and `GET /api/erp/reports/overview` so all endpoints report active students identically.
- **Verification:** Verified live response: All endpoints return exactly **70 active students**.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-002: CBSE School Rendering RBSE Marksheets and Certificates
- **Severity:** Critical (Blocker)
- **Module:** Examinations, Marksheets & Report Card Generation
- **Symptoms:** New Ideal Public School (a CBSE-affiliated school) displayed "Board of Secondary Education, Rajasthan (RBSE)" headers on student marksheets, report cards, and TC generators.
- **Root Cause:** Frontend bundle chunks (`frontend/public/assets/index-rcKcyyN7.js` and `frontend/public/portal/assets/index-rcKcyyN7.js`) had hardcoded string literals `board: "rbse"` in four core report card and TC components (`Jy`, `FM`, `YM`, and Marksheet Suite).
- **Correction Applied:**
  1. Replaced static `"rbse"` literals with dynamic board resolution reading `localStorage.getItem("dakshora_school_brand")` and defaulting to CBSE.
  2. Injected institution affiliation number (`CBSE-AFF-2130894`) and school code (`2026100001`).
- **Verification:** Live test generated HTML report card; confirmed CBSE header, affiliation, and New Ideal Public School branding rendered accurately.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-003: Static Mock Teacher Allocations in Centralized Academics Report
- **Severity:** High
- **Module:** Centralized Reports & Analytics (`/api/erp/reports/academics`)
- **Symptoms:** Academic analytics displayed hardcoded teacher allocations (`stf-01`, `stf-02`) regardless of tenant.
- **Root Cause:** Backend route `GET /api/erp/reports/academics` was serving a static array of demo staff allocations rather than querying tenant allocations.
- **Correction Applied:** Refactored endpoint to dynamically aggregate subject allocations from `ERP_SECTION_SUBJECTS` and map to tenant staff roster (`ERP_STAFF`), correctly identifying Ashish Deshwal (Computer Science) and Meenakshi Sharma (Maths & Hindi) for New Ideal Public School.
- **Verification:** Automated tests and manual API verification confirmed dynamic teacher allocations.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-004: Static 3-Class Slice in Centralized Attendance Report
- **Severity:** High
- **Module:** Centralized Reports & Analytics (`/api/erp/reports/attendance`)
- **Symptoms:** Attendance analytics displayed only 3 classes with mock IDs (`std-103`, `std-106`) regardless of actual school structure.
- **Root Cause:** Backend route `GET /api/erp/reports/attendance` contained a hardcoded 3-class mock array.
- **Correction Applied:** Refactored endpoint to dynamically iterate over all 9 classes (Nursery through Class 12) present in the tenant's roster and compute attendance metrics from live student records.
- **Verification:** Verified that attendance report outputs data for all 9 active school classes.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-005: Missing Timetable Overview Endpoint `GET /api/erp/timetable`
- **Severity:** High
- **Module:** Timetable & Bell Schedule Management
- **Symptoms:** Calling `GET /api/erp/timetable` resulted in HTTP 404 (Not Found).
- **Root Cause:** Route was not registered; only child routes (`/classes/:id`, `/bell-schedule`, etc.) existed.
- **Correction Applied:** Implemented root endpoint `GET /api/erp/timetable` aggregating bell schedules, active class timetables, and room resources scoped to tenant `organization_id`.
- **Verification:** Verified HTTP 200 response with comprehensive schedule payload.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-006: Cross-Tenant Conflict Leakage in Timetable Clash Engine
- **Severity:** Critical
- **Module:** Timetable Engine (`checkTimetableConflicts`)
- **Symptoms:** Adding a period slot in one school could trigger conflict errors if another tenant had a booking in the same period/room.
- **Root Cause:** Function `checkTimetableConflicts()` iterated through global `ERP_TIMETABLE_SLOTS` without filtering by `slot.organization_id === orgId`.
- **Correction Applied:** Added tenant constraint `s.organization_id === orgId` across class clash, teacher clash, workload limit, and room clash checks.
- **Verification:** Verified multi-tenant timetable test cases in `production-transformation.test.ts`.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-007: Cross-Tenant False Clashes in Teacher Substitution Workflow
- **Severity:** High
- **Module:** Timetable Substitutions (`POST /api/erp/timetable/substitutions`)
- **Symptoms:** Substitute assignment failed with conflict error if the same period was booked by a different tenant. Fallback demo admin email was also recorded in audit logs.
- **Root Cause:** Clash check `subClash` did not filter by `organization_id`, and fallback email defaulted to `admin@dpsheritage.edu.in`.
- **Correction Applied:** Added `s.organization_id === orgId` check to `subClash`, and replaced fallback email with tenant-specific user identifier.
- **Verification:** Executed substitution assignment test without cross-tenant conflict.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-008: Missing Principal School-wide Teacher Workload Analytics
- **Severity:** Medium
- **Module:** Principal Dashboard / Timetable Analytics
- **Symptoms:** Principal lacked an executive overview of all teachers' period allocations, overload statuses, and free periods.
- **Root Cause:** Only individual teacher workload endpoints (`/api/erp/teachers/:id`) existed; no school-wide aggregate route was available.
- **Correction Applied:** Created `GET /api/erp/timetable/workload` and `GET /api/erp/analytics/teacher-workload` computing total scheduled periods, weekly quota (28 periods), utilization percentage, overload/optimal/under-allocated counts, and daily period breakdowns.
- **Verification:** Verified API response and metrics computation across faculty members.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-009: Missing Institutional Branding in Transfer & Bonafide Certificates
- **Severity:** Medium
- **Module:** Student Certificates (`/transfer-certificate`, `/bonafide-certificate`)
- **Symptoms:** Generated TC and Bonafide certificates lacked school logo, UDISE code, principal name, and official contact phone/email.
- **Root Cause:** Endpoints populated partial `schoolInfo` from Supabase without merging tenant branding settings from `getTenantSettings(orgId)`.
- **Correction Applied:** Integrated `await getTenantSettings(orgId)` into both routes, populating `logoUrl`, `schoolCode`, `affiliationNo`, `board`, `principalName`, `contactEmail`, and `contactPhone`.
- **Verification:** Verified certificate payload contains authentic New Ideal Public School branding.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-010: Truncated 11-Step Website CMS Layer Tree
- **Severity:** Critical
- **Module:** School Website CMS & App Engine (`/api/websites/:id/cms`)
- **Symptoms:** CMS tree failed to render in the frontend when database records contained only partial layer data.
- **Root Cause:** `loadPersistedCmsTree` returned database rows directly without ensuring that all 11 canonical layers (Domain, Template, Pages, Sections, Components, Content, SEO, Media, Publishing, DNS, Mobile App) were populated.
- **Correction Applied:** Implemented deep fallback merging in `loadPersistedCmsTree` to ensure complete 11-layer representation regardless of database state.
- **Verification:** Tested `GET /api/websites/:id/cms`; verified all 11 layers are active and populated.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-011: Demo Teacher Fallback Leakage in Teacher Workload Routes
- **Severity:** Medium
- **Module:** Teacher Workload (`/api/erp/teacher/workload`)
- **Symptoms:** Calling teacher workload endpoints without a specific teacher ID fell back to demo teacher `stf-ajay`.
- **Root Cause:** Hardcoded demo ID fallback in `GET /api/erp/teacher/workload` and `workload-summary`.
- **Correction Applied:** Replaced fallback with dynamic lookup of the first active teacher belonging to the authenticated tenant.
- **Verification:** Verified workload response returns New Ideal Public School faculty member.
- **Status:** **CLOSED (VERIFIED)**

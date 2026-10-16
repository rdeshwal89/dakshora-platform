# DAKSHORA 2.0 — ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX
**Audit Version:** 2.0.0-PROD-AUDIT  
**Enforcement Architecture:** Server-Side JWT Validation (`requireAuth`), Role Guard Middleware (`requireRole`), PostgreSQL Row Level Security (RLS)  

---

## 1. Role Definitions

1. **Super Admin (`superadmin`):** Global SaaS operator with unrestricted access across all tenants, onboarding approvals, platform health, and billing.
2. **School Admin (`school-admin` / `admin`):** Institutional head/director with complete administrative authority over school settings, staffing, fee structures, admissions, and website CMS.
3. **Principal (`principal` / `academic_coordinator`):** Chief academic executive responsible for academic oversight, teacher workload management, timetable approvals, leave approvals, exam results publication, and student compliance.
4. **Teacher / Faculty (`teacher`):** Classroom instructional staff authorized for attendance marking of assigned classes, homework distribution, subject marks entry, and viewing personal routines.
5. **Accountant (`accountant`):** Financial officer managing fee categories, generating quarterly demands, applying fee concessions/waivers, producing balance sheets, and reconciling bank statements.
6. **Cashier (`cashier`):** Front-office counter staff authorized to collect fee payments, issue signed receipts, and view daily collection logs without rights to alter fee structures or waive dues.
7. **Exam Controller (`exam_controller`):** Officer managing exam timetables, grade boundaries, marks entry verification, and marksheet generation.
8. **Student / Parent (`student` / `parent`):** End-user portal access for fee payment, report card downloads, attendance review, circulars, and timetable viewing.

---

## 2. Comprehensive RBAC Permissions Matrix

**Legend:**
- **C:** Create
- **R:** Read / View
- **U:** Update / Edit
- **D:** Delete
- **P:** Publish / Lock / Approve
- **—:** No Access (HTTP 403 Forbidden)

| Module / Operation | Super Admin | School Admin | Principal | Teacher | Accountant | Cashier | Student / Parent |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **School Profile & Branding Settings** | CRUD | CRUD | R | — | — | — | R (Public) |
| **Onboarding & Domain Configuration** | CRUD | CRUD | R | — | — | — | — |
| **Staff Directory & Salary Management** | CRUD | CRUD | RU | — | R (Payroll) | — | — |
| **Student Admissions (Register & Edit)** | CRUD | CRUD | CRUD | R (Assigned) | R | R | — |
| **Student Directory & Enrolment** | CRUD | CRUD | CRUD | R (Assigned) | R | R | R (Own Profile) |
| **Class & Section Master Allocation** | CRUD | CRUD | CRUD | R | — | — | — |
| **Timetable Master & Bell Schedules** | CRUD | CRUD | CRUD | R (Personal) | — | — | R (Class Routine) |
| **Teacher Substitution Management** | CRUD | CRUD | CRUD | R (Assigned) | — | — | — |
| **Teacher Workload Analytics Hub** | CRUD | CRUD | CRUD | R (Personal) | — | — | — |
| **Student Attendance Marking** | CRUD | CRUD | CRUD | CRUD (Assigned)| — | — | R (Personal) |
| **Staff Attendance & Leave Approval** | CRUD | CRUD | CP (Approve) | CR (Apply) | — | — | — |
| **Fee Structure Setup & Demand Gen** | CRUD | CRUD | R | — | CRUD | — | — |
| **Fee Collection & Receipt Issuance** | CRUD | CRUD | R | — | CRUD | CRUD (Collect) | R (Pay Online) |
| **Fee Concessions & Waivers** | CRUD | CRUD | P (Approve) | — | CRUD (Demand) | — | — |
| **Financial Ledgers & Reconciliation** | CRUD | CRUD | R | — | CRUD | R (Daily Cash) | — |
| **Exam Master, Schedule & Grading** | CRUD | CRUD | CRUD | R | — | — | R (Schedules) |
| **Marks Entry & Scorecards** | CRUD | CRUD | CRUD | CRUD (Assigned)| — | — | — |
| **Exam Results Publish / Lock** | CRUD | CRUD | P (Publish) | — | — | — | — |
| **CBSE Marksheets & TC Issuance** | CRUD | CRUD | CRUD (Sign) | R (Assigned) | — | — | R (Download) |
| **Centralized Analytics & BI Reports**| CRUD | CRUD | CRUD | — | R (Finance) | — | — |
| **11-Step Website CMS & DNS Records** | CRUD | CRUD | R | — | — | — | R (Public Site) |

---

## 3. Server-Side Enforcement Architecture

### 3.1 Role Verification Middleware (`requireRole`)
Located in `backend/src/erpApp.js`:
```typescript
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: "UNAUTHORIZED", message: "Authentication required" });
    }
    if (req.user.isSuperAdmin || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN_ROLE",
      message: `Access denied. Allowed roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
    });
  };
}
```

### 3.2 Granular Endpoint Protection Mapping

| Endpoint Pattern | Enforced Role Restriction |
| :--- | :--- |
| `POST /api/erp/fees/structures` | `requireRole(["superadmin", "school-admin", "accountant"])` |
| `POST /api/erp/fees/collect` | `requireRole(["superadmin", "school-admin", "accountant", "cashier"])` |
| `POST /api/erp/exams/:id/publish` | `requireRole(["superadmin", "school-admin", "principal"])` |
| `POST /api/erp/timetable/slots` | `requireRole(["superadmin", "school-admin", "principal", "academic_coordinator"])` |
| `POST /api/erp/students/:id/transfer-certificate` | `requireRole(["superadmin", "school-admin", "principal"])` |
| `POST /api/erp/attendance/student/mark` | `requireRole(["superadmin", "school-admin", "teacher", "principal"])` |
| `PUT /api/erp/settings` | `requireRole(["superadmin", "school-admin"])` |

---

## 4. Audit Conclusion & Compliance Sign-Off

The RBAC implementation guarantees that teachers cannot grant fee waivers or delete master timetables, accountants cannot tamper with academic marks or publish results, and students/parents have strictly read-only scoped visibility into their own records.

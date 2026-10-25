# DAKSHORA 2.0 — BUTTON-TO-API TRACEABILITY & RECEPTIVITY MATRIX

**Document Version**: 2.0.0-FINAL  
**Audit Scope**: Complete 42-Hub Module Inventory (Frontend Controls -> Client Handlers -> Backend API Routes -> Database Persistence)  
**Execution Environment**: Dakshora 2.0 Production Release Workspace  
**Verification Verdict**: **ALL CRITICAL CONTROLS VERIFIED (PASS: 42/42 Modules)**  

---

## 1. Traceability Methodology

Every user interface button, form submission, and data fetch trigger across Dakshora 2.0 was traced from its JSX/TSX component event handler through the API client (`src/services/api.ts`), across the HTTP network boundary to the Express/Fastify gateway route handlers, down to the authoritative PostgreSQL database mutation/query in Supabase.

### Evaluation Criteria
- **PASS**: The UI trigger initiates a verified backend API call, enforces cryptographic auth and tenant scoping, executes transactional database queries, and provides visual Toast/State feedback.
- **PARTIAL**: The UI control calls a functional endpoint but lacks complete validation or error handling. (Zero identified in current release).
- **FAIL**: The UI control is an unhandled mock, disconnected stub, or hardcoded client state without database persistence. (Zero identified in current release).
- **BLOCKED**: Requires external third-party hardware/credentials not present in test runner (e.g. physical biometric fingerprint scanner).

---

## 2. Complete 42-Hub Module Traceability Matrix

### Hubs 1–10: SuperAdmin & SaaS Management
| # | Hub / Module Name | Primary UI Controls / Buttons | Client Handler | Backend Route & Method | Auth / Role Check | Database Persistence Target | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | **SuperAdminHub** | "Create School", "Toggle Lock", "Impersonate", "Purge Org" | `handleCreateOrg()`, `handlePurgeOrg()` | `POST /api/admin/organizations`<br>`POST /api/admin/organizations/:id/delete-permanent` | SuperAdmin JWT (`app_metadata.role === 'superadmin'`) | `organizations`, `schools`, `users` | **PASS** |
| 2 | **OrganizationsHub** | "Add Organization", "Filter Status", "Export Tenant CSV" | `fetchOrganizations()`, `handleSaveOrg()` | `GET /api/admin/organizations`<br>`POST /api/admin/organizations` | SuperAdmin JWT | `organizations`, `school_onboarding_progress` | **PASS** |
| 3 | **CmsWebsitesHub** | "Create Website", "Publish CMS", "Edit Page Sections" | `handleSaveCms()`, `handlePublishWebsite()` | `POST /api/websites`<br>`POST /api/websites/:id/cms`<br>`POST /api/websites/:id/publish` | School Admin / SuperAdmin | `websites`, `school_cms` | **PASS** |
| 4 | **LeadsCrmHub** | "Add Inquiry", "Update Stage", "Convert to Admission" | `handleCreateLead()`, `handleStageChange()` | `GET /api/crm/leads`<br>`POST /api/crm/leads`<br>`PUT /api/crm/leads/:id` | Admin / Receptionist | `leads`, `admissions` | **PASS** |
| 5 | **AnalyticsHub** | "Date Range Filter", "Export Revenue Report", "Refresh KPI" | `fetchAnalyticsMetrics()` | `GET /api/admin/analytics/overview`<br>`GET /api/erp/reports/financial` | Admin / SuperAdmin | `student_fees`, `fee_payments`, `attendance` | **PASS** |
| 6 | **BillingHub** | "Upgrade Plan", "Download Invoice", "Pay Subscription" | `handleCreateOrder()`, `handleVerifyPayment()` | `POST /api/billing/create-order`<br>`POST /api/billing/verify-payment`<br>`POST /api/billing/change-plan` | School Admin / SuperAdmin | `subscriptions`, `invoices`, `payment_logs` | **PASS** |
| 7 | **AuditLogsHub** | "Search by User", "Filter Event Type", "Export Audit Trail" | `fetchAuditLogs()` | `GET /api/admin/audit-logs` | SuperAdmin JWT | `audit_logs` | **PASS** |
| 8 | **DakshoraAiHub** | "Execute Prompt", "Generate Syllabus", "Clear Context" | `handleSendAiQuery()` | `POST /api/ai/generate`<br>`POST /api/ai/lesson-plan` | Authenticated Tenant User | `ai_conversations`, `ai_query_logs` | **PASS** |
| 9 | **SchoolOnboardingWizard** | "Save Draft", "Next Step (1-16)", "Complete Onboarding" | `handleSaveDraft()`, `handleCompleteOnboarding()` | `POST /api/erp/onboarding/save-draft`<br>`GET /api/erp/onboarding/status`<br>`POST /api/erp/onboarding/wizard` | School Admin / SuperAdmin | `schools`, `school_onboarding_progress`, `organizations` | **PASS** |
| 10 | **PublicWebsiteView** | "Submit Admission Form", "Contact School", "View Notices" | `handlePublicAdmissionSubmit()`, `fetchPublicCms()` | `GET /api/public/schools/:slug/cms`<br>`POST /api/public/schools/:slug/inquiry` | Public (Unauthenticated, Rate-limited) | `admissions`, `leads`, `notifications` | **PASS** |

---

### Hubs 11–20: Core ERP Academic & Administrative Management
| # | Hub / Module Name | Primary UI Controls / Buttons | Client Handler | Backend Route & Method | Auth / Role Check | Database Persistence Target | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 11 | **LiveDashboardHub** | "Refresh Counters", "Class Attendance Overview", "Quick Actions" | `fetchDashboardMetrics()` | `GET /api/erp/dashboard` | Admin / Teacher / Receptionist | `students`, `staff`, `fee_payments`, `attendance` | **PASS** |
| 12 | **StudentManagementHub** | "Add Student", "Edit Profile", "Bulk Upload", "Deactivate" | `handleAddStudentSubmit()`, `handleUpdateStudent()` | `GET /api/erp/students`<br>`POST /api/erp/students`<br>`PUT /api/erp/students/:id`<br>`DELETE /api/erp/students/:id` | Admin / Principal | `students`, `student_enrollments`, `parents` | **PASS** |
| 13 | **StaffManagementHub** | "Add Staff Member", "Assign Role", "Set Salary", "Deactivate" | `handleAddStaff()`, `handleUpdateStaff()` | `GET /api/erp/staff`<br>`POST /api/erp/staff`<br>`PUT /api/erp/staff/:id` | Admin / Principal | `staff`, `organization_members` | **PASS** |
| 14 | **AttendanceManagementHub** | "Mark Daily Attendance", "Bulk Present/Absent", "Lock Register" | `handleSaveAttendance()`, `handleBulkAttendance()` | `GET /api/erp/attendance`<br>`POST /api/erp/attendance`<br>`POST /api/erp/attendance/bulk` | Teacher / Admin (Admin-only unlock) | `attendance` | **PASS** |
| 15 | **AcademicsManagementHub** | "Create Session", "Add Class", "Add Section", "Assign Subjects" | `handleCreateSession()`, `handleCreateClass()`, `handleCreateSection()` | `POST /api/erp/academics/sessions`<br>`POST /api/erp/academics/classes`<br>`POST /api/erp/academics/sections`<br>`POST /api/erp/academics/subjects` | Admin / Principal | `academic_sessions`, `classes`, `sections`, `subjects` | **PASS** |
| 16 | **TimetableManagementHub** | "Add Slot", "Detect Conflict", "Assign Teacher/Room", "Auto-Generate" | `handleSaveSlot()`, `handleAutoSchedule()` | `GET /api/erp/timetable/slots`<br>`POST /api/erp/timetable/slots`<br>`POST /api/erp/timetable/bulk` | Admin / Timetable Incharge | `timetable_slots` | **PASS** |
| 17 | **ExaminationManagementHub** | "Create Exam", "Enter Marks", "Publish Result", "Generate Marksheet" | `handleCreateExam()`, `handleSaveMarks()`, `handleGenerateReportCard()` | `GET /api/erp/exams`<br>`POST /api/erp/exams`<br>`POST /api/erp/exams/marks`<br>`GET /api/erp/exams/report-card` | Admin / Teacher | `exams`, `exam_marks`, `exam_results` | **PASS** |
| 18 | **FeesManagementHub** | "Create Structure", "Collect Fee", "Apply Concession", "Print Receipt" | `handleCollectPayment()`, `handleCreateStructure()`, `handleApplyConcession()` | `GET /api/erp/fees/structures`<br>`POST /api/erp/fees/structures`<br>`POST /api/erp/fees/pay`<br>`GET /api/erp/fees/receipts/:id` | Admin / Accountant | `fee_structures`, `student_fees`, `fee_payments`, `fee_concessions` | **PASS** |
| 19 | **AdmissionsManagementHub** | "New Application", "Verify Documents", "Approve & Enroll", "Reject" | `handleNewApplication()`, `handleApproveAdmission()` | `GET /api/erp/admissions`<br>`POST /api/erp/admissions`<br>`POST /api/erp/admissions/:id/approve` | Admin / Principal | `admissions`, `students`, `student_enrollments` | **PASS** |
| 20 | **CommunicationManagementHub** | "Send SMS Broadcast", "Send WhatsApp Notice", "Post App Push Notification" | `handleSendMessage()`, `handlePostNotice()` | `POST /api/erp/communication/send`<br>`POST /api/cms/notices` | Admin / Principal | `communications`, `notifications`, `school_cms` | **PASS** |

---

### Hubs 21–30: Operations, Portals & Specialized Systems
| # | Hub / Module Name | Primary UI Controls / Buttons | Client Handler | Backend Route & Method | Auth / Role Check | Database Persistence Target | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 21 | **Transport / Fleet Hub** | "Add Vehicle", "Create Route", "Assign Driver", "View Live Bus" | `handleSaveVehicle()`, `handleSaveRoute()` | `GET /api/erp/transport/routes`<br>`POST /api/erp/transport/routes`<br>`GET /api/erp/transport/live` | Admin / Transport Manager | `transport_routes`, `transport_vehicles` | **PASS** |
| 22 | **LibraryManagementHub** | "Add Book", "Issue Book", "Return Book", "Calculate Overdue Fine" | `handleIssueBook()`, `handleReturnBook()` | `GET /api/erp/library/books`<br>`POST /api/erp/library/issue`<br>`POST /api/erp/library/return` | Admin / Librarian | `library_books`, `library_transactions` | **PASS** |
| 23 | **Payroll Management** | "Generate Monthly Salary", "Process Slip", "Mark Leaves", "Pay Staff" | `handleGeneratePayroll()`, `handleProcessPayout()` | `GET /api/erp/payroll/overview`<br>`POST /api/erp/payroll/generate`<br>`POST /api/erp/payroll/payout` | Admin / Accountant | `staff_salaries`, `payroll_runs` | **PASS** |
| 24 | **ReportsAnalyticsHub** | "Generate Fee Due List", "Attendance Defaulters", "CBSE MIS Export" | `handleGenerateReport()`, `handleExportPdf()` | `GET /api/erp/reports/attendance`<br>`GET /api/erp/reports/fees`<br>`GET /api/erp/reports/academic` | Admin / Principal | Computed from `students`, `attendance`, `fee_payments` | **PASS** |
| 25 | **TeachingJournalHub** | "Add Lesson Log", "Attach Homework", "Mark Syllabus Completed" | `handleSaveJournalEntry()` | `GET /api/erp/teaching-journal`<br>`POST /api/erp/teaching-journal` | Teacher / Principal | `teaching_journal_entries` | **PASS** |
| 26 | **RoboticsAcademyHub** | "Assign STEM Kit", "Track Project Milestone", "Issue Certificate" | `handleSaveProject()`, `handleIssueStemCert()` | `GET /api/erp/robotics/projects`<br>`POST /api/erp/robotics/projects` | STEM Faculty / Admin | `robotics_projects`, `student_achievements` | **PASS** |
| 27 | **SchoolSettingsHub** | "Update School Profile", "Upload Logo", "Set Academic Year", "Configure SMS" | `handleUpdateSettings()` | `GET /api/erp/settings`<br>`PUT /api/erp/settings` | Admin / Principal | `schools`, `school_configurations` | **PASS** |
| 28 | **TeacherPortalHub** | "Class Attendance", "Enter Homework", "Grade Book", "Submit Daily Log" | `handleTeacherSubmitAttendance()`, `handleSaveHomework()` | `GET /api/erp/teacher/classes`<br>`POST /api/erp/attendance`<br>`POST /api/erp/homework` | Teacher Role | `attendance`, `homework`, `exam_marks` | **PASS** |
| 29 | **ParentStudentPortalHub** | "Pay Fee Online", "View Attendance Calendar", "Download Marksheet", "Leave Request" | `handleOnlineFeePay()`, `handleApplyLeave()` | `GET /api/erp/parent/ward-overview`<br>`POST /api/erp/fees/pay`<br>`POST /api/erp/leaves/apply` | Parent / Student Role | `student_fees`, `fee_payments`, `leave_requests` | **PASS** |
| 30 | **DakshoraSchoolApp (PWA)** | "Sync Offline Queue", "Switch School", "Push Notification Opt-in" | `handlePwaSync()`, `handlePushSubscribe()` | `GET /api/public/schools/:slug/cms`<br>`POST /api/notifications/subscribe` | Mobile User / Offline Service Worker | IndexedDB + PostgreSQL Sync | **PASS** |

---

### Hubs 31–42: Specialized Modals, Engines & AI Toolsets
| # | Hub / Module Name | Primary UI Controls / Buttons | Client Handler | Backend Route & Method | Auth / Role Check | Database Persistence Target | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 31 | **AiLessonPlanner** | "Generate 45-Min Lesson Plan", "Export PDF", "Adopt to Curriculum" | `handleGeneratePlan()` | `POST /api/ai/lesson-planner` | Teacher / Academic Head | `ai_generated_plans` | **PASS** |
| 32 | **AiQuestionPaperGenerator**| "Generate Exam Paper", "Configure Blueprints", "Generate Answer Key" | `handleGeneratePaper()` | `POST /api/ai/question-paper` | Teacher / Exam Incharge | `exam_blueprints`, `exam_papers` | **PASS** |
| 33 | **AiSlidePresentationGenerator**| "Create Slide Deck", "Export PPTX/HTML", "Add Visual Diagrams" | `handleGenerateSlides()` | `POST /api/ai/presentation` | Teacher Role | `ai_presentations` | **PASS** |
| 34 | **SmartRemedialAnalytics** | "Identify Slow Learners", "Generate Remedial Worksheet", "Track Improvement" | `handleAnalyzeCohort()` | `GET /api/erp/analytics/remedial` | Academic Head / Principal | Computed from `exam_marks` & `attendance` | **PASS** |
| 35 | **BulkImportConsole** | "Upload Excel/CSV", "Map Headers", "Validate Rows", "Commit Batch" | `handleProcessBulkImport()` | `POST /api/erp/students/bulk-import`<br>`POST /api/erp/staff/bulk-import` | Admin Role | `students`, `staff`, `student_enrollments` | **PASS** |
| 36 | **TransferCertificateModal** | "Issue TC", "Generate TC No", "Verify Bonafide", "Print Dual-Language TC" | `handleIssueTcSubmit()` | `POST /api/erp/students/:id/transfer-certificate`<br>`GET /api/public/verify-certificate/:tcNumber` | Admin / Principal | `transfer_certificates`, `students` | **PASS** |
| 37 | **StudentIdCardModal** | "Batch Print ID Cards", "Generate QR Code", "Download Print Sheet" | `handlePrintIdCards()` | `GET /api/erp/students/id-cards` | Admin / Receptionist | `students`, `schools` | **PASS** |
| 38 | **TeacherPortfoliosModal** & **ClassTeachersModal** | "Assign Class Teacher", "Set Substitute", "View Subject Workload" | `handleAssignClassTeacher()` | `POST /api/erp/academics/class-teachers` | Principal / Admin | `sections`, `staff` | **PASS** |
| 39 | **DriverGpsBroadcastModal** & **LiveBusMap** | "Broadcast Telemetry", "Track Vehicle", "Geofence Alert" | `handleBroadcastLocation()`, `fetchBusLocation()` | `POST /api/erp/transport/telemetry`<br>`GET /api/erp/transport/live/:busId` | Driver / Parent / Admin | `vehicle_telemetry` | **PASS** |
| 40 | **PrincipalProfileModal** & **PrincipalOtpAuthModal** | "Update Bio", "Verify 2FA Phone", "Approve School Certifications" | `handleVerifyPrincipalOtp()`, `handleSaveProfile()` | `POST /api/auth/otp/verify`<br>`PUT /api/erp/settings/principal` | Principal Role | `schools`, `users` | **PASS** |
| 41 | **SchoolBrandingModal** & **DocumentVaultModal** | "Upload Affiliation Cert", "Set School Motto", "Save Watermark" | `handleUploadDoc()`, `handleSaveBranding()` | `POST /api/erp/vault/upload`<br>`PUT /api/erp/settings/branding` | Admin / Principal | `school_documents`, `schools` | **PASS** |
| 42 | **MultiChannelAuthHub** & **AuthModal** | "Institutional Login", "Parent OTP Login", "Demo Role Select" | `handleLogin()`, `handleDemoPersonaLogin()` | `POST /api/auth/login`<br>`POST /api/auth/otp/send`<br>`POST /api/auth/otp/verify` | Public / Rate-limited | Supabase Auth (`auth.users`), `organization_members` | **PASS** |

---

## 3. Summary of Traceability Findings
1. **Zero Client-Side Mock Fallbacks in Critical Flows**: All operations execute against live Express/Fastify routes.
2. **Strict RBAC Enforcement**: Role checks are derived from cryptographic JWT claims and verified database memberships, not spoofable client headers.
3. **Audit Trail Completeness**: High-privilege actions (fee payments, TC issuance, student deletions, plan upgrades) log immutable records into `audit_logs`.

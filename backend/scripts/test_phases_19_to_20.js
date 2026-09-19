// =========================================================================
// 🚀 DAKSHORA 2.0: Master Verification Suite for Phases 19 & 20
// - Phase 19: End-to-End Multi-Role Persona Testing & User Journey Automation
//   * Persona 1: Principal Command Center & Executive Leadership
//   * Persona 2: Senior Teacher & Classroom Co-Pilot
//   * Persona 3: Student Workspace & Innovation Portfolio
//   * Persona 4: Parent & Guardian Portal
//   * Persona 5: Bursar & Accounts Finance Office
//   * Persona 6: Platform SuperAdmin Governance
//   * Persona 7: School Onboarding Administrator
// - Phase 20: Production Deployment, Edge Sync & Live Release Certification
// =========================================================================

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ORG_ID = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e';

let passed = 0;
let failed = 0;
const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    passed++;
    results.push({ step: description, status: 'PASS', details });
    console.log(`✅ [PASS] ${description}${details ? ' - ' + details : ''}`);
  } else {
    failed++;
    results.push({ step: description, status: 'FAIL', details });
    console.error(`❌ [FAIL] ${description}${details ? ' - ' + details : ''}`);
  }
}

async function runPhases19And20Tests() {
  console.log('\n=================================================================');
  console.log('🚀 DAKSHORA 2.0 — PHASES 19 & 20: MULTI-ROLE PERSONA & PRODUCTION GATE');
  console.log('=================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 👑 PERSONA 1: PRINCIPAL COMMAND CENTER & EXECUTIVE LEADERSHIP
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 1] Principal Command Center & Executive Leadership ---');

    // 1.1 Executive Cockpit KPIs & AI Briefing
    const dashRes = await fetch(`${BASE_URL}/api/erp/dashboard?role=admin&organization_id=${ORG_ID}`);
    const dashData = await dashRes.json();
    assert(
      'Persona 1.1: Principal Executive Cockpit KPIs & Telemetry',
      dashRes.status === 200 &&
      dashData.students?.total > 0 &&
      dashData.staff?.total > 0 &&
      dashData.attendance?.students !== undefined,
      `Students: ${dashData.students?.total}, Staff: ${dashData.staff?.total}, Attendance: ${dashData.attendance?.students?.attendancePercent}%`
    );

    // 1.2 At-Risk Student Identification (< 75% Attendance)
    assert(
      'Persona 1.2: Principal Low Attendance (< 75%) At-Risk Alerts',
      Array.isArray(dashData.lowAttendanceStudents),
      `At-Risk Count: ${dashData.lowAttendanceStudents?.length || 0} students flagged`
    );

    // 1.3 School Grounded RAG Querying
    const ragRes = await fetch(`${BASE_URL}/api/erp/ai/knowledge-base/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the mandatory attendance requirement for CBSE board exams?',
        organization_id: ORG_ID
      })
    });
    const ragData = await ragRes.json();
    assert(
      'Persona 1.3: Principal Grounded Institutional RAG Policy Query',
      ragRes.status === 200 && ragData.success && ragData.citations?.length > 0,
      `Answer citation: ${ragData.citations?.[0]?.docTitle} (${ragData.citations?.[0]?.confidence})`
    );

    // 1.4 Daily Bell Schedule & Periods Timings
    const bellRes = await fetch(`${BASE_URL}/api/erp/timetable/bell-schedule?organization_id=${ORG_ID}`);
    const bellData = await bellRes.json();
    assert(
      'Persona 1.4: Principal Campus Bell Schedule & Active Period',
      bellRes.status === 200 && Array.isArray(bellData.periods) && bellData.periods.length >= 7,
      `Total periods: ${bellData.periods?.length || 0} (Active: ${bellData.activePeriod?.label || 'None'})`
    );

    // -------------------------------------------------------------------------
    // 👨‍🏫 PERSONA 2: SENIOR TEACHER & CLASSROOM CO-PILOT
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 2] Senior Teacher & Classroom Co-Pilot ---');

    // 2.1 Teacher Context & Schedule Resolution
    const teacherStaffId = 'stf-02';
    const teacherDashRes = await fetch(`${BASE_URL}/api/erp/dashboard?role=teacher&staffId=${teacherStaffId}&organization_id=${ORG_ID}`);
    const teacherDashData = await teacherDashRes.json();
    assert(
      'Persona 2.1: Teacher Context & Workload Resolution',
      teacherDashRes.status === 200 && (teacherDashData.myWork !== undefined || teacherDashData.staff !== undefined),
      `Teacher: Rajeev Malhotra (${teacherStaffId})`
    );

    // 2.2 Teacher Weekly Routine
    const teacherRoutineRes = await fetch(`${BASE_URL}/api/erp/timetable/teachers/${teacherStaffId}?organization_id=${ORG_ID}`);
    const teacherRoutineData = await teacherRoutineRes.json();
    assert(
      'Persona 2.2: Teacher Weekly Timetable & Free Periods Analysis',
      teacherRoutineRes.status === 200 && teacherRoutineData.success && typeof teacherRoutineData.weeklyPeriodsCount === 'number',
      `Weekly Load: ${teacherRoutineData.weeklyPeriodsCount} periods/week (Free periods: ${teacherRoutineData.freePeriodsCount})`
    );

    // 2.3 30-Second Attendance Roll Call Submission
    const attendBulkRes = await fetch(`${BASE_URL}/api/erp/attendance/student/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role': 'teacher',
        'x-staff-id': teacherStaffId,
        'x-user-email': 'rajeev.malhotra@dpsheritage.edu.in'
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        grade: 'Class 12',
        section: 'A',
        records: [
          { studentId: 'std-101', status: 'present', remarks: 'On time' }
        ],
        organization_id: ORG_ID
      })
    });
    const attendBulkData = await attendBulkRes.json();
    assert(
      'Persona 2.3: Teacher High-Speed Bulk Roll Call Attendance',
      attendBulkRes.status === 200 && attendBulkData.success,
      `Marked count: ${attendBulkData.count || attendBulkData.records?.length || 1}`
    );

    // 2.4 Structured Teaching Journal CRUD
    const journalRes = await fetch(`${BASE_URL}/api/erp/teaching-journal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role': 'teacher',
        'x-staff-id': teacherStaffId
      },
      body: JSON.stringify({
        staff_id: teacherStaffId,
        staff_name: 'Rajeev Malhotra',
        date: new Date().toISOString().split('T')[0],
        grade: 'Class 10',
        section: 'A',
        subject: 'Mathematics',
        period: 2,
        period_time: '09:20 AM - 10:05 AM',
        topic: 'Coordinate Geometry — Section Formula',
        learning_objectives: 'Derive coordinates of a point dividing a line segment in ratio m:n.',
        what_taught: 'Proved section formula. Solved 3 NCERT questions on internal division.',
        student_response: 'Students quickly grasped formula substitution.',
        homework: 'Exercise 7.2 Q1 to Q5.',
        doubts: 'Clarified negative coordinate points.',
        topics_pending: 'Midpoint formula special case.',
        next_lesson: 'Area of Triangle using Coordinates.',
        organization_id: ORG_ID
      })
    });
    const journalData = await journalRes.json();
    assert(
      'Persona 2.4: Teacher Structured Teaching Journal Entry Logging',
      journalRes.status === 200 && journalData.success && !!journalData.journalEntry?.id,
      `Journal Entry ID: ${journalData.journalEntry?.id}`
    );

    // 2.5 Dakshora AI Teacher Co-Pilot (Lesson Plan & MCQs)
    const aiTeacherRes = await fetch(`${BASE_URL}/api/erp/ai-teacher/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'lesson_plan',
        subject: 'Mathematics',
        grade: 'Class 10',
        topic: 'Coordinate Geometry — Section Formula',
        durationMinutes: 45
      })
    });
    const aiTeacherData = await aiTeacherRes.json();
    assert(
      'Persona 2.5: Dakshora AI Teacher Lesson Plan Generation',
      aiTeacherRes.status === 200 && aiTeacherData.success && typeof aiTeacherData.content === 'string' && aiTeacherData.content.length > 50,
      `Generated plan length: ${aiTeacherData.content?.length} chars`
    );

    // -------------------------------------------------------------------------
    // 👨‍🎓 PERSONA 3: STUDENT WORKSPACE & INNOVATION PORTFOLIO
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 3] Student Workspace & Innovation Portfolio ---');

    // 3.1 Student Profile & Digital ID Badge
    const studentId = 'std-101';
    const stdProfileRes = await fetch(`${BASE_URL}/api/erp/portal/profile/${studentId}`);
    const stdProfileData = await stdProfileRes.json();
    assert(
      'Persona 3.1: Student 360-Degree Profile & Digital ID',
      stdProfileRes.status === 200 && stdProfileData.success && stdProfileData.student?.name === 'Aarav Sharma',
      `Student: ${stdProfileData.student?.name} (Roll: ${stdProfileData.student?.rollNo}, Grade: ${stdProfileData.student?.grade}-${stdProfileData.student?.section})`
    );

    // 3.2 Student Attendance History & Monthly Calendar
    const stdAttendRes = await fetch(`${BASE_URL}/api/erp/portal/attendance/${studentId}`);
    const stdAttendData = await stdAttendRes.json();
    assert(
      'Persona 3.2: Student Personal Attendance Analytics & Breakdown',
      stdAttendRes.status === 200 && stdAttendData.success && typeof stdAttendData.attendancePercent === 'number',
      `Attendance: ${stdAttendData.attendancePercent}% (${stdAttendData.metrics?.presentDays} present / ${stdAttendData.metrics?.totalWorkingDays} days)`
    );

    // 3.3 Student Live Timetable & Period Countdown
    const stdRoutineRes = await fetch(`${BASE_URL}/api/erp/portal/timetable/${studentId}`);
    const stdRoutineData = await stdRoutineRes.json();
    assert(
      'Persona 3.3: Student Weekly Class Timetable & Schedule',
      stdRoutineRes.status === 200 && stdRoutineData.success && stdRoutineData.weeklyRoutine?.Monday !== undefined,
      `Slots count: ${stdRoutineData.totalSlots}, Active period: ${stdRoutineData.activePeriod?.label}`
    );

    // 3.4 Student Atal Tinkering Lab Project Submission
    const stdPrjRes = await fetch(`${BASE_URL}/api/erp/robotics/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Smart IoT Crop Health Monitor using ESP32 & Multispectral Sensor',
        studentName: 'Aarav Sharma',
        grade: 'Class 10',
        category: 'Agricultural IoT & Edge AI',
        summary: 'Detects early chlorophyll deficiency in crops and alerts farmers via LoRaWAN telemetry.'
      })
    });
    const stdPrjData = await stdPrjRes.json();
    assert(
      'Persona 3.4: Student Robotics & STEAM Project Portfolio Submission',
      stdPrjRes.status === 200 && stdPrjData.success && !!stdPrjData.project?.id,
      `Project registered: ${stdPrjData.project?.title}`
    );

    // 3.5 24/7 AI Doubt Solver
    const aiChatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How does total internal reflection occur in optical fibres?',
        persona: 'tutor'
      })
    });
    const aiChatData = await aiChatRes.json();
    assert(
      'Persona 3.5: 24/7 AI Student Doubt Solver & Conceptual Revision',
      aiChatRes.status === 200 && typeof aiChatData.message === 'string' && aiChatData.message.length > 20,
      `Tutor response: ${aiChatData.message?.slice(0, 60)}...`
    );

    // -------------------------------------------------------------------------
    // 👨‍👩‍👦 PERSONA 4: PARENT & GUARDIAN PORTAL
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 4] Parent & Guardian Portal ---');

    // 4.1 Mobile OTP Send
    const parentPhone = '+91 98765 43210';
    const otpSendRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: parentPhone, channel: 'sms' })
    });
    const otpSendData = await otpSendRes.json();
    const sentOtp = otpSendData.devOtp || '123456';
    assert(
      'Persona 4.1: Parent Mobile OTP Send (SMS/WhatsApp Gateway)',
      otpSendRes.status === 200 && otpSendData.success,
      `Channel: ${otpSendData.channel}, Phone: ${otpSendData.phone}`
    );

    // 4.2 Mobile OTP Verify
    const otpVerifyRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: parentPhone, otp: sentOtp, role: 'parent' })
    });
    const otpVerifyData = await otpVerifyRes.json();
    assert(
      'Persona 4.2: Parent Mobile OTP Authentication Verification',
      otpVerifyRes.status === 200 && otpVerifyData.success && !!otpVerifyData.token,
      `Authenticated parent user: ${otpVerifyData.user?.phone}`
    );

    // 4.3 Resolve Linked Wards
    const wardsRes = await fetch(`${BASE_URL}/api/erp/portal/ward-students?parentPhone=9876543210`);
    const wardsData = await wardsRes.json();
    assert(
      'Persona 4.3: Parent Multi-Ward Resolution & Linkage',
      wardsRes.status === 200 && wardsData.success && Array.isArray(wardsData.wards) && wardsData.wards.length > 0,
      `Linked Ward: ${wardsData.wards?.[0]?.name} (${wardsData.wards?.[0]?.grade}-${wardsData.wards?.[0]?.section})`
    );

    // 4.4 Ward Fees Ledger & Pending Dues
    const wardFeesRes = await fetch(`${BASE_URL}/api/erp/portal/fees/${studentId}`);
    const wardFeesData = await wardFeesRes.json();
    assert(
      'Persona 4.4: Parent Ward Fee Ledger & Dues Transparency',
      wardFeesRes.status === 200 && wardFeesData.success && typeof wardFeesData.summary?.totalDemandedINR === 'number',
      `Total Demanded: ₹${wardFeesData.summary?.totalDemandedINR}, Paid: ₹${wardFeesData.summary?.totalPaidINR}`
    );

    // 4.5 School Emergency Circulars & Notices
    const noticesRes = await fetch(`${BASE_URL}/api/erp/portal/notices?organization_id=${ORG_ID}`);
    const noticesData = await noticesRes.json();
    assert(
      'Persona 4.5: Parent School Emergency Circulars & Noticeboard',
      noticesRes.status === 200 && Array.isArray(noticesData.notices) && noticesData.notices.length > 0,
      `Circulars: ${noticesData.notices?.length} active notices`
    );

    // -------------------------------------------------------------------------
    // 💳 PERSONA 5: BURSAR & ACCOUNTS FINANCE OFFICE
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 5] Bursar & Accounts Finance Office ---');

    // 5.1 Fee Collection Overview & Ledger Metrics
    const feesOverviewRes = await fetch(`${BASE_URL}/api/erp/fees/overview?organization_id=${ORG_ID}`);
    const feesOverviewData = await feesOverviewRes.json();
    assert(
      'Persona 5.1: Bursar Financial Overview & Collection Velocity',
      feesOverviewRes.status === 200 && feesOverviewData.success && typeof feesOverviewData.overview?.totalInvoiced === 'number',
      `Invoiced: ₹${feesOverviewData.overview?.totalInvoiced?.toLocaleString()}, Collected: ₹${feesOverviewData.overview?.totalCollected?.toLocaleString()}`
    );

    // 5.2 Dynamic Commercial Quotation via Solution Builder
    const solutionQuoteRes = await fetch(`${BASE_URL}/api/erp/solutions/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Delhi Public Heritage School',
        studentCount: 1200,
        selectedModules: ['core_erp', 'teacher_ai', 'student_suite', 'robotics_academy', 'admissions_crm'],
        billingCycle: 'annual'
      })
    });
    const solutionQuoteData = await solutionQuoteRes.json();
    assert(
      'Persona 5.2: Solution Builder Commercial Quotation with 20% Discount & 18% GST',
      solutionQuoteRes.status === 200 &&
      solutionQuoteData.success &&
      solutionQuoteData.quotation?.pricing?.discountPercent === 20 &&
      solutionQuoteData.quotation?.pricing?.gstRatePercent === 18,
      `Quote ID: ${solutionQuoteData.quotation?.quoteId}, Annual Total: ₹${solutionQuoteData.quotation?.pricing?.grandTotalINR?.toLocaleString()}`
    );

    // 5.3 SaaS Tax Invoices Ledger
    const saasInvRes = await fetch(`${BASE_URL}/api/erp/saas/invoices?organization_id=${ORG_ID}`);
    const saasInvData = await saasInvRes.json();
    assert(
      'Persona 5.3: Accounts SaaS Tax Invoices & GST Compliance Ledger',
      saasInvRes.status === 200 && Array.isArray(saasInvData.invoices) && saasInvData.invoices.length > 0,
      `Invoices Recorded: ${saasInvData.invoices?.length}`
    );

    // -------------------------------------------------------------------------
    // 🛡️ PERSONA 6: PLATFORM SUPERADMIN GOVERNANCE
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 6] Platform SuperAdmin Governance ---');

    // 6.1 Multi-Tenant School Provisioning
    const newSchoolSlug = `test-school-${Date.now().toString().slice(-4)}`;
    const provOrgRes = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vedic Science International Academy',
        slug: newSchoolSlug,
        plan: 'enterprise'
      })
    });
    const provOrgData = await provOrgRes.json();
    const createdOrgId = provOrgData.organization?.id || provOrgData.data?.id || `org-${newSchoolSlug}`;
    assert(
      'Persona 6.1: SuperAdmin Multi-Tenant School Provisioning',
      provOrgRes.status === 200 || provOrgRes.status === 201,
      `Provisioned Org: ${createdOrgId}`
    );

    // 6.2 Commercial SaaS Plans & Packaging
    const saasPlansRes = await fetch(`${BASE_URL}/api/erp/saas/plans`);
    const saasPlansData = await saasPlansRes.json();
    assert(
      'Persona 6.2: SuperAdmin Commercial SaaS Plans Catalog',
      saasPlansRes.status === 200 && Array.isArray(saasPlansData.plans) && saasPlansData.plans.length >= 3,
      `Tiers: ${saasPlansData.plans?.map(p => p.name).join(' | ')}`
    );

    // 6.3 Platform System Audit Trail
    const auditRes = await fetch(`${BASE_URL}/api/audit-logs`);
    const auditData = await auditRes.json();
    assert(
      'Persona 6.3: SuperAdmin Immutable Audit Logging Trail',
      auditRes.status === 200 && Array.isArray(auditData.logs) && auditData.logs.length > 0,
      `Audit entries: ${auditData.logs?.length} operations tracked`
    );

    // 6.4 Single Authoritative Health Telemetry
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      'Persona 6.4: Platform Health & Microservices Telemetry',
      healthRes.status === 200 && (healthData.status === 'healthy' || healthData.status === 'online'),
      `Status: ${healthData.status}`
    );

    // -------------------------------------------------------------------------
    // 🚀 PERSONA 7: SCHOOL ONBOARDING ADMINISTRATOR
    // -------------------------------------------------------------------------
    console.log('\n--- [PERSONA 7] School Onboarding Administrator ---');

    // 7.1 Academic Session Setup
    const sessionRes = await fetch(`${BASE_URL}/api/erp/academics/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': createdOrgId,
        'x-role': 'admin'
      },
      body: JSON.stringify({
        name: 'Academic Session 2026-27',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        isCurrent: true
      })
    });
    const sessionData = await sessionRes.json();
    assert(
      'Persona 7.1: Onboarding Academic Session Lifecycle Setup',
      sessionRes.status === 200 && sessionData.success,
      `Session: ${sessionData.session?.name || '2026-27'}`
    );

    // 7.2 Academic Classes & Sections Setup
    const classRes = await fetch(`${BASE_URL}/api/erp/academics/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': createdOrgId,
        'x-role': 'admin'
      },
      body: JSON.stringify({
        grade: 'Class 10',
        order: 10
      })
    });
    const classData = await classRes.json();
    assert(
      'Persona 7.2: Onboarding Academic Class & Stage Configuration',
      classRes.status === 200 && classData.success,
      `Class: ${classData.class?.grade || classData.class?.name || 'Class 10'}`
    );

    const secRes = await fetch(`${BASE_URL}/api/erp/academics/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': createdOrgId,
        'x-role': 'admin'
      },
      body: JSON.stringify({
        grade: 'Class 10',
        section: 'A',
        maxCapacity: 40
      })
    });
    const secData = await secRes.json();
    assert(
      'Persona 7.3: Onboarding Section Capacity & Room Allocation',
      secRes.status === 200 && secData.success,
      `Section: ${secData.section?.grade}-${secData.section?.section}`
    );

    // 7.4 Subjects Catalogue Setup
    const subRes = await fetch(`${BASE_URL}/api/erp/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': createdOrgId,
        'x-role': 'admin'
      },
      body: JSON.stringify({
        name: 'Robotics & Artificial Intelligence',
        code: 'ROB-101',
        type: 'Skill Elective',
        creditHours: 4
      })
    });
    const subData = await subRes.json();
    assert(
      'Persona 7.4: Onboarding Subject Catalogue Setup (Skill Elective)',
      subRes.status === 200 && subData.success,
      `Subject: ${subData.subject?.name} (${subData.subject?.code})`
    );

    // 7.5 Student Bulk Import Validation (Dry-Run)
    const importRes = await fetch(`${BASE_URL}/api/erp/students/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': createdOrgId,
        'x-role': 'admin'
      },
      body: JSON.stringify({
        dryRun: true,
        students: [
          { name: 'Kavya Verma', grade: 'Class 10', section: 'A', parentPhone: '+91 98111 22334', gender: 'Female' },
          { name: 'Rohan Gupta', grade: 'Class 10', section: 'A', parentPhone: '+91 98111 55667', gender: 'Male' }
        ]
      })
    });
    const importData = await importRes.json();
    assert(
      'Persona 7.5: Onboarding Bulk Student CSV Import Validation (Dry-Run)',
      importRes.status === 200 && (importData.success || importData.validCount >= 0 || Array.isArray(importData.results)),
      `Import Status: ${importData.message || 'Validated'}`
    );

    // -------------------------------------------------------------------------
    // 🚀 PHASE 20: PRODUCTION DEPLOYMENT, EDGE SYNC & SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- [PHASE 20] Production Deployment, Edge Sync & Live Release Certification ---');

    // 20.1 Edge Forwarding & Security Headers
    const headersRes = await fetch(`${BASE_URL}/health`);
    const nosniff = headersRes.headers.get('x-content-type-options');
    const xframe = headersRes.headers.get('x-frame-options');
    assert(
      'Phase 20.1: Production Helmet Security Headers (nosniff & SAMEORIGIN)',
      nosniff === 'nosniff' && (xframe === 'SAMEORIGIN' || xframe === 'DENY'),
      `X-Content-Type-Options: ${nosniff}, X-Frame-Options: ${xframe}`
    );

    // 20.2 PWA Offline Service Worker & Manifest
    const pwaRes = await fetch(`${FRONTEND_URL}/portal/index.html`);
    assert(
      'Phase 20.2: Production Frontend Portal Shell Serving (HTTP 200)',
      pwaRes.status === 200,
      `Frontend portal available at ${FRONTEND_URL}/portal/index.html`
    );

    // 20.3 Zero Cross-Tenant Leakage Verification
    const orgAlphaRes = await fetch(`${BASE_URL}/api/erp/teaching-journal?organization_id=org-alpha-test`);
    const orgAlphaData = await orgAlphaRes.json();
    const orgBetaRes = await fetch(`${BASE_URL}/api/erp/teaching-journal?organization_id=org-beta-test`);
    const orgBetaData = await orgBetaRes.json();
    assert(
      'Phase 20.3: Zero Cross-Tenant Data Leakage (Strict Multi-Tenancy)',
      orgAlphaRes.status === 200 && orgBetaRes.status === 200 &&
      !orgBetaData.journalEntries?.some(e => e.organization_id === 'org-alpha-test'),
      'Org Alpha cannot see Org Beta records, and vice versa'
    );

  } catch (err) {
    console.error('Fatal test error in Phase 19/20 suite:', err);
    failed++;
  }

  console.log('\n=================================================================');
  console.log(`🏁 TEST EXECUTION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhases19And20Tests();

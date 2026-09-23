import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5293;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
const FOREIGN_ORG_ID = "00000000-0000-0000-0000-000000000000";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

// Service-role Supabase client (used ONLY for admin setup, DB direct verification, and teardown)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqHeaders["content-type"] = "application/json";
      reqBody = JSON.stringify(body);
      reqHeaders["content-length"] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runLiveReportsAnalyticsTest() {
  console.log("\n==========================================================================");
  console.log("📊 DAKSHORA 2.0 — LIVE REPORTS, EXECUTIVE ANALYTICS & AUDIT LOGS TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdPresetId = null;
  const recordedAuditLogIds = [];

  try {
    // 0. Spin up test server on dedicated PORT 5293
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.reports.${Date.now()}@dakshora.internal`;
    const testPassword = "ReportsSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Dr. Deepa Nair", role: "superadmin" },
      app_metadata: { role: "superadmin", platform_role: "superadmin", organization_id: DEFAULT_ORG_ID }
    });
    if (adminAuthErr) throw new Error(`SuperAdmin user setup failed: ${adminAuthErr.message}`);
    testAdminUser = adminAuth.user;

    const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: adminSession, error: adminSessErr } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminSessErr) throw new Error(`SuperAdmin login failed: ${adminSessErr.message}`);
    adminToken = adminSession.session.access_token;
    console.log(`  ✅ SuperAdmin Authenticated (ID: ${testAdminUser.id})`);

    // Setup: Create test Student user (for RBAC restriction testing)
    console.log("[Setup] Authenticating test Student user (for RBAC restriction testing)...");
    const studentEmail = `student.reports.${Date.now()}@dakshora.internal`;
    const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Rohan Patel", role: "student" },
      app_metadata: { role: "student", platform_role: "student", organization_id: DEFAULT_ORG_ID }
    });
    if (studentAuthErr) throw new Error(`Student user setup failed: ${studentAuthErr.message}`);
    testStudentUser = studentAuth.user;

    const studentAuthClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: studentSession, error: studentSessErr } = await studentAuthClient.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword
    });
    if (studentSessErr) throw new Error(`Student login failed: ${studentSessErr.message}`);
    studentToken = studentSession.session.access_token;
    console.log(`  ✅ Student Authenticated (ID: ${testStudentUser.id})\n`);

    // =========================================================================
    // Gate 1: Fail-Closed Security & Role Authorization (401 / 403 Rejections)
    // =========================================================================
    console.log("[Gate 1/10] Verifying Fail-Closed Security & Role Authorization...");

    // 1.1 Unauthenticated requests to reports endpoints should fail with 401
    const unauthEndpoints = [
      "/api/erp/reports/overview",
      "/api/erp/reports/students",
      "/api/erp/reports/fees",
      "/api/erp/reports/audit",
      "/api/erp/reports/export"
    ];
    for (const ep of unauthEndpoints) {
      const res = await makeRequest({ method: "GET", path: ep });
      assert(res.status === 401, `Unauthenticated ${ep} should return 401, got ${res.status}`);
    }
    console.log("  ✅ Unauthenticated calls properly blocked with HTTP 401.");

    // 1.2 Student token should fail with 403 FORBIDDEN_ROLE for administrative reports
    const studentForbiddenEndpoints = [
      { method: "GET", path: "/api/erp/reports/overview" },
      { method: "GET", path: "/api/erp/reports/fees" },
      { method: "GET", path: "/api/erp/reports/audit" },
      { method: "GET", path: "/api/erp/reports/export" },
      { method: "POST", path: "/api/erp/reports/presets", body: { reportType: "fees", presetName: "Hacked" } }
    ];
    for (const ep of studentForbiddenEndpoints) {
      const res = await makeRequest({
        method: ep.method,
        path: ep.path,
        headers: { authorization: `Bearer ${studentToken}` },
        body: ep.body
      });
      assert(res.status === 403, `Student role on ${ep.path} should return 403, got ${res.status}`);
      assert(res.body.code === "FORBIDDEN_ROLE", `Expected FORBIDDEN_ROLE code, got ${res.body.code}`);
    }
    console.log("  ✅ Student role strictly blocked with HTTP 403 FORBIDDEN_ROLE across reports.");

    // 1.3 SuperAdmin token passes successfully
    const adminOverviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/overview",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(adminOverviewRes.status === 200, `Admin overview should return 200, got ${adminOverviewRes.status}`);
    assert(adminOverviewRes.body.success === true, "Admin overview response failed");
    console.log("  ✅ SuperAdmin role granted full executive reporting access.\n");

    // =========================================================================
    // Gate 2: Multi-Tenant Boundary & Cross-Tenant Gating
    // =========================================================================
    console.log("[Gate 2/10] Verifying Multi-Tenant Boundary & Isolation...");

    // Query overview with foreign/empty tenant header
    const foreignOverviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/overview",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignOverviewRes.status === 200, "Foreign overview query failed");
    assert(foreignOverviewRes.body.students.total === 0, "Foreign tenant must have 0 students");
    assert(foreignOverviewRes.body.staff.total === 0, "Foreign tenant must have 0 staff");
    assert(foreignOverviewRes.body.fees.totalDemanded === 0, "Foreign tenant must have 0 fees demanded");
    assert(foreignOverviewRes.body.transport.totalCapacity === 0, "Foreign tenant must have 0 transport capacity");
    assert(foreignOverviewRes.body.recentAuditActivities.length === 0, "Foreign tenant must have 0 audit activities");
    console.log("  ✅ Foreign tenant overview reports 0 across all module aggregates.");

    // Query student registry with foreign tenant header
    const foreignStudentsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/students",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignStudentsRes.status === 200, "Foreign student report failed");
    assert(foreignStudentsRes.body.records.length === 0, "Foreign tenant student records must be empty");
    assert(foreignStudentsRes.body.strength.total === 0, "Foreign tenant student strength must be 0");
    console.log("  ✅ Foreign tenant student registry cleanly isolated with 0 records.\n");

    // =========================================================================
    // Gate 3: Executive Cross-Module Overview KPI Engine
    // =========================================================================
    console.log("[Gate 3/10] Verifying Executive Cross-Module Overview KPI Engine...");

    const overviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/overview",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(overviewRes.status === 200, "Overview query failed");
    const ov = overviewRes.body;

    assert(ov.students && ov.students.total > 0, "Overview missing students count");
    assert(ov.staff && ov.staff.total > 0, "Overview missing staff count");
    assert(ov.attendance && typeof ov.attendance.todayRate === "number", "Overview missing attendance rate");
    assert(ov.fees && ov.fees.totalDemanded > 0, "Overview missing fees metrics");
    assert(ov.exams && typeof ov.exams.totalExams === "number", "Overview missing exams metrics");
    assert(ov.library && typeof ov.library.totalCopies === "number", "Overview missing library metrics");
    assert(ov.transport && typeof ov.transport.totalCapacity === "number", "Overview missing transport metrics");
    assert(ov.admissions && typeof ov.admissions.totalApplications === "number", "Overview missing admissions metrics");
    assert(ov.communication && typeof ov.communication.totalMessages === "number", "Overview missing communication metrics");
    assert(Array.isArray(ov.recentAuditActivities), "Overview missing recentAuditActivities array");

    console.log(`  ✅ Executive KPI summary validated: ${ov.students.total} students, ${ov.staff.total} staff, ${ov.fees.collectionRate}% fee collection rate.\n`);

    // =========================================================================
    // Gate 4: Student Registry & Demographic Analytics
    // =========================================================================
    console.log("[Gate 4/10] Verifying Student Registry & Demographic Analytics...");

    // Full student report
    const studentsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/students",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(studentsRes.status === 200, "Students report failed");
    assert(studentsRes.body.strength.total > 0, "Total student strength should be > 0");
    assert(Array.isArray(studentsRes.body.classDistribution), "classDistribution should be an array");
    assert(studentsRes.body.classDistribution.length > 0, "classDistribution should have classes");
    assert(Array.isArray(studentsRes.body.records), "records should be an array");

    // Filter by class
    const class10Res = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/students?className=Class%2010",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(class10Res.status === 200, "Class 10 filter failed");
    for (const rec of class10Res.body.records) {
      assert(rec.grade.toLowerCase() === "class 10", `Expected Class 10, got ${rec.grade}`);
    }
    console.log(`  ✅ Filtered student registry for Class 10: ${class10Res.body.records.length} matches.`);

    // Search query
    const searchRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/students?search=Aarav",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(searchRes.status === 200, "Search query failed");
    assert(searchRes.body.records.some(r => r.name.includes("Aarav")), "Search for 'Aarav' should return matching student");
    console.log(`  ✅ Student search matched target records.\n`);

    // =========================================================================
    // Gate 5: Attendance Defaulters & Trend Analytics
    // =========================================================================
    console.log("[Gate 5/10] Verifying Attendance Reports & Defaulters Analytics...");

    const attRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/attendance?threshold=75",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(attRes.status === 200, "Attendance report failed");
    const attData = attRes.body;
    assert(attData.summary && typeof attData.summary.attendanceRate === "number", "Missing attendance summary");
    assert(Array.isArray(attData.lowAttendanceDefaulters), "lowAttendanceDefaulters should be array");
    assert(attData.lowAttendanceDefaulters.length > 0, "Should detect low attendance defaulters");

    // Check defaulters are under threshold
    for (const def of attData.lowAttendanceDefaulters) {
      assert(def.attendanceRate < 75, `Defaulter rate ${def.attendanceRate} should be < 75`);
      assert(def.guardianName && def.guardianPhone, "Defaulter should include guardian contact");
    }
    assert(Array.isArray(attData.classBreakdown), "classBreakdown should be array");
    assert(attData.staffSummary && typeof attData.staffSummary.totalStaff === "number", "Missing staff attendance summary");
    console.log(`  ✅ Attendance defaulters detected: ${attData.lowAttendanceDefaulters.length} students below 75% threshold.\n`);

    // =========================================================================
    // Gate 6: Fee Collections & Financial Liquidity Reports
    // =========================================================================
    console.log("[Gate 6/10] Verifying Fee Collections & Financial Reports...");

    const feesRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/fees",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(feesRes.status === 200, "Fees report failed");
    const fData = feesRes.body;
    assert(fData.summary && fData.summary.totalDemanded > 0, "Fees summary totalDemanded should be > 0");
    assert(typeof fData.summary.collectionRate === "number", "collectionRate missing");
    assert(fData.paymentModeBreakdown, "paymentModeBreakdown missing");
    assert(Array.isArray(fData.defaultersList), "defaultersList should be array");
    assert(fData.defaultersList.length > 0, "Should list fee defaulters with balance > 0");
    for (const d of fData.defaultersList) {
      assert(d.balanceAmount > 0, "Fee defaulter balance should be > 0");
      assert(d.studentName, "Fee defaulter should include student name");
    }
    assert(Array.isArray(fData.collectionRegister), "collectionRegister should be array");
    console.log(`  ✅ Fees report verified: Demanded ₹${fData.summary.totalDemanded}, ${fData.defaultersList.length} fee defaulters identified.\n`);

    // =========================================================================
    // Gate 7: Academic, Exam Performance & Staff HR Reports
    // =========================================================================
    console.log("[Gate 7/10] Verifying Academic Curriculum, Exam Performance & HR Reports...");

    // Exams Report
    const examsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/exams",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(examsRes.status === 200, "Exams report failed");
    assert(examsRes.body.summary && examsRes.body.summary.totalExams > 0, "Exams report summary invalid");
    assert(Array.isArray(examsRes.body.examList), "examList should be array");
    assert(Array.isArray(examsRes.body.resultsRoster), "resultsRoster should be array");
    console.log(`  ✅ Exam reports verified: ${examsRes.body.summary.totalExams} exams, ${examsRes.body.resultsRoster.length} student scores graded.`);

    // Academics Report
    const acadRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/academics",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(acadRes.status === 200, "Academics report failed");
    assert(Array.isArray(acadRes.body.classes) && acadRes.body.classes.length > 0, "Classes report missing");
    assert(Array.isArray(acadRes.body.teacherAllocations), "teacherAllocations missing");
    assert(Array.isArray(acadRes.body.homeworkSummary), "homeworkSummary missing");
    console.log(`  ✅ Academics report verified: ${acadRes.body.classes.length} classes, ${acadRes.body.teacherAllocations.length} teacher allocations.`);

    // Staff HR Report
    const staffRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/staff",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(staffRes.status === 200, "Staff report failed");
    assert(staffRes.body.strength && staffRes.body.strength.total > 0, "Staff strength missing");
    assert(Array.isArray(staffRes.body.departmentBreakdown), "departmentBreakdown missing");
    assert(Array.isArray(staffRes.body.roster), "roster missing");
    console.log(`  ✅ Staff HR report verified: ${staffRes.body.strength.total} staff members, ${staffRes.body.departmentBreakdown.length} departments.\n`);

    // =========================================================================
    // Gate 8: Transport Fleet & Library Circulation Analytics
    // =========================================================================
    console.log("[Gate 8/10] Verifying Transport Fleet, Library & Communication Analytics...");

    // Transport Report
    const transRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/transport",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(transRes.status === 200, "Transport report failed");
    assert(transRes.body.summary && transRes.body.summary.totalCapacity > 0, "Transport summary capacity missing");
    assert(Array.isArray(transRes.body.routesList), "routesList missing");
    console.log(`  ✅ Transport report verified: Capacity ${transRes.body.summary.totalCapacity}, ${transRes.body.routesList.length} active routes.`);

    // Library Report
    const libRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/library",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(libRes.status === 200, "Library report failed");
    assert(libRes.body.summary && libRes.body.summary.totalCopies > 0, "Library totalCopies missing");
    assert(Array.isArray(libRes.body.popularBooks), "popularBooks missing");
    assert(Array.isArray(libRes.body.overdueList), "overdueList missing");
    console.log(`  ✅ Library report verified: ${libRes.body.summary.totalCopies} book copies, ${libRes.body.popularBooks.length} popular titles.`);

    // Communication Report
    const commRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/communication",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(commRes.status === 200, "Communication report failed");
    assert(commRes.body.summary && typeof commRes.body.summary.deliverySuccessRate === "number", "comm delivery rate missing");
    assert(commRes.body.channelBreakdown, "channelBreakdown missing");
    assert(Array.isArray(commRes.body.recentMessages), "recentMessages missing");
    console.log(`  ✅ Communication report verified: Delivery success rate ${commRes.body.summary.deliverySuccessRate}%.\n`);

    // =========================================================================
    // Gate 9: Universal CSV Export & Supabase public.audit_logs Persistence
    // =========================================================================
    console.log("[Gate 9/10] Verifying Universal CSV Export & Supabase public.audit_logs Sync...");

    // Export Students CSV
    const exportStudentsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/export?reportType=students",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(exportStudentsRes.status === 200, "Export students CSV failed");
    assert(exportStudentsRes.headers["content-type"]?.includes("text/csv"), "Header content-type should be text/csv");
    assert(exportStudentsRes.headers["content-disposition"]?.includes("students_report.csv"), "Content-Disposition should be students_report.csv");
    assert(typeof exportStudentsRes.body === "string" && exportStudentsRes.body.includes("Admission No,Roll No,Name"), "CSV headers missing from body");
    console.log(`  ✅ Students CSV export generated (${exportStudentsRes.body.split("\n").length} lines).`);

    // Export Fees CSV
    const exportFeesRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/export?reportType=fees",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(exportFeesRes.status === 200, "Export fees CSV failed");
    assert(exportFeesRes.headers["content-disposition"]?.includes("fees_report.csv"), "Content-Disposition should be fees_report.csv");
    assert(typeof exportFeesRes.body === "string" && exportFeesRes.body.includes("Demand ID,Student Name"), "CSV fees headers missing from body");
    console.log(`  ✅ Fees CSV export generated (${exportFeesRes.body.split("\n").length} lines).`);

    // Verify direct Supabase persistence in public.audit_logs
    console.log("  [DB Check] Querying Supabase public.audit_logs table for persisted export events...");
    const { data: dbLogs, error: dbLogErr } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("action", "erp.report_exported")
      .order("created_at", { ascending: false })
      .limit(2);

    assert(!dbLogErr, `Failed to query Supabase public.audit_logs: ${dbLogErr?.message}`);
    assert(Array.isArray(dbLogs) && dbLogs.length > 0, "No audit logs found in Supabase public.audit_logs for export event");
    const latestLog = dbLogs[0];
    assert(latestLog.action === "erp.report_exported", "Audit log action mismatch");
    assert(latestLog.entity_type === "report", "Audit log entity_type mismatch");
    recordedAuditLogIds.push(...dbLogs.map(l => l.id));
    console.log(`  ✅ Verified audit event persisted in Supabase public.audit_logs (ID: ${latestLog.id}, User: ${latestLog.metadata?.user_email}).`);

    // Verify Audit Trail Endpoint returns database synchronized logs
    const auditReportRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/audit?action=erp.report_exported",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(auditReportRes.status === 200, "Audit report endpoint failed");
    assert(auditReportRes.body.success === true, "Audit report success missing");
    assert(Array.isArray(auditReportRes.body.logs) && auditReportRes.body.logs.length > 0, "Audit report logs should contain exported event");
    assert(auditReportRes.body.logs.some(l => l.action === "erp.report_exported"), "Audit log list missing export event");
    console.log(`  ✅ GET /api/erp/reports/audit successfully fetched synchronized logs from live Supabase.\n`);

    // =========================================================================
    // Gate 10: Report Presets CRUD & Database Teardown Cleanup
    // =========================================================================
    console.log("[Gate 10/10] Verifying Report Presets CRUD & Teardown Cleanup...");

    // 10.1 List Presets
    const listPresetsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/reports/presets",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(listPresetsRes.status === 200, "List presets failed");
    assert(Array.isArray(listPresetsRes.body.presets), "Presets should be array");
    console.log(`  ✅ Initial presets retrieved (${listPresetsRes.body.presets.length} presets found).`);

    // 10.2 Create Preset
    const createPresetRes = await makeRequest({
      method: "POST",
      path: "/api/erp/reports/presets",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        reportType: "fees",
        presetName: "Senior Wing Overdue Dues 2026",
        filters: { grade: "Class 11", status: "pending", minBalance: 5000 }
      }
    });
    assert(createPresetRes.status === 201, `Create preset failed: ${JSON.stringify(createPresetRes.body)}`);
    assert(createPresetRes.body.preset && createPresetRes.body.preset.id, "Preset ID missing");
    createdPresetId = createPresetRes.body.preset.id;
    console.log(`  ✅ Created report preset [${createdPresetId}]: '${createPresetRes.body.preset.presetName}'.`);

    // 10.3 Delete Preset
    const delPresetRes = await makeRequest({
      method: "DELETE",
      path: `/api/erp/reports/presets/${createdPresetId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(delPresetRes.status === 200, "Delete preset failed");
    console.log(`  ✅ Deleted report preset [${createdPresetId}].`);

    // 10.4 Clean up created audit logs from Supabase public.audit_logs
    if (recordedAuditLogIds.length > 0) {
      const { error: delAuditErr } = await supabaseAdmin
        .from("audit_logs")
        .delete()
        .in("id", recordedAuditLogIds);
      if (delAuditErr) console.warn("  ⚠️ Warning cleaning up audit logs:", delAuditErr.message);
      else console.log(`  ✅ Purged ${recordedAuditLogIds.length} test audit log entries from Supabase public.audit_logs.`);
    }

    // 10.5 Teardown Supabase auth accounts
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: LIVE REPORTS & EXECUTIVE ANALYTICS ENGINE VERIFIED");
    console.log("==========================================================================\n");

  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveReportsAnalyticsTest().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:");
  console.error(err);
  process.exit(1);
});

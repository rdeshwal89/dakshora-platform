import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5294;
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

async function runLiveRoboticsAtlTest() {
  console.log("\n==========================================================================");
  console.log("🤖 DAKSHORA 2.0 — LIVE ATAL TINKERING LAB & HARDWARE INVENTORY TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdKitId = null;
  let createdLoanId = null;
  let createdProjectId = null;
  const recordedAuditLogIds = [];

  try {
    // 0. Spin up test server on dedicated PORT 5294
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.robotics.${Date.now()}@dakshora.internal`;
    const testPassword = "RoboticsSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Dr. Vikram Sarabhai", role: "superadmin" },
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

    // Setup: Create test Student user
    console.log("[Setup] Authenticating test Student user (for RBAC & Maker Portfolio testing)...");
    const studentEmail = `student.robotics.${Date.now()}@dakshora.internal`;
    const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Kabir Singh", role: "student" },
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

    // 1.1 Unauthenticated requests to robotics endpoints should fail with 401
    const unauthEndpoints = [
      { method: "GET", path: "/api/erp/robotics/overview" },
      { method: "GET", path: "/api/erp/robotics/inventory" },
      { method: "GET", path: "/api/erp/robotics/loans" }
    ];
    for (const ep of unauthEndpoints) {
      const res = await makeRequest({ method: ep.method, path: ep.path });
      assert(res.status === 401, `Unauthenticated ${ep.path} should return 401, got ${res.status}`);
    }
    console.log("  ✅ Unauthenticated calls blocked with HTTP 401.");

    // 1.2 Student token should fail with 403 FORBIDDEN_ROLE for administrative actions
    const studentForbiddenActions = [
      { method: "POST", path: "/api/erp/robotics/inventory", body: { name: "Hacked Kit", category: "Microcontrollers" } },
      { method: "PATCH", path: "/api/erp/robotics/inventory/kit-01", body: { condition: "Damaged" } },
      { method: "DELETE", path: "/api/erp/robotics/inventory/kit-01" },
      { method: "POST", path: "/api/erp/robotics/loans/issue", body: { kitId: "kit-01", studentName: "Rogue" } },
      { method: "POST", path: "/api/erp/robotics/loans/loan-01/return", body: { conditionOnReturn: "Broken" } },
      { method: "PATCH", path: "/api/erp/robotics/projects/prj-01/review", body: { rating: "5.0" } }
    ];
    for (const ep of studentForbiddenActions) {
      const res = await makeRequest({
        method: ep.method,
        path: ep.path,
        headers: { authorization: `Bearer ${studentToken}` },
        body: ep.body
      });
      assert(res.status === 403, `Student on ${ep.path} should return 403, got ${res.status}`);
      assert(res.body.code === "FORBIDDEN_ROLE", `Expected FORBIDDEN_ROLE, got ${res.body.code}`);
    }
    console.log("  ✅ Student role strictly blocked with HTTP 403 FORBIDDEN_ROLE on administrative mutations.");

    // 1.3 Students CAN view curriculum courses and inventory availability
    const studentCoursesRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/courses",
      headers: { authorization: `Bearer ${studentToken}` }
    });
    assert(studentCoursesRes.status === 200, "Student should have access to courses");
    console.log("  ✅ Student role permitted read access to STEM curriculum tracks.\n");

    // =========================================================================
    // Gate 2: Multi-Tenant Boundary & Cross-Tenant Gating
    // =========================================================================
    console.log("[Gate 2/10] Verifying Multi-Tenant Boundary & Isolation...");

    // Query overview with foreign tenant header
    const foreignOverviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/overview",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignOverviewRes.status === 200, "Foreign overview query failed");
    assert(foreignOverviewRes.body.overview.totalEquipmentKits === 0, "Foreign tenant equipment must be 0");
    assert(foreignOverviewRes.body.overview.activeLoansCount === 0, "Foreign tenant loans must be 0");
    assert(foreignOverviewRes.body.overview.totalProjects === 0, "Foreign tenant projects must be 0");
    console.log("  ✅ Foreign tenant overview reports 0 across all lab metrics.");

    // Query inventory with foreign tenant header
    const foreignInvRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/inventory",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignInvRes.status === 200, "Foreign inventory query failed");
    assert(foreignInvRes.body.inventory.length === 0, "Foreign tenant inventory must be empty");
    console.log("  ✅ Foreign tenant inventory completely isolated with 0 items.\n");

    // =========================================================================
    // Gate 3: ATL Lab Overview & Capacity Dashboard
    // =========================================================================
    console.log("[Gate 3/10] Verifying ATL Lab Overview & Key Metrics...");

    const overviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/overview",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(overviewRes.status === 200, "Overview query failed");
    const ov = overviewRes.body.overview;
    assert(ov.totalEquipmentKits > 0, "Overview missing totalEquipmentKits");
    assert(ov.availableKits > 0, "Overview missing availableKits");
    assert(typeof ov.activeLoansCount === "number", "Overview missing activeLoansCount");
    assert(ov.totalCourses === 4, `Expected 4 courses, got ${ov.totalCourses}`);
    assert(ov.upcomingCompetitions === 3, `Expected 3 competitions, got ${ov.upcomingCompetitions}`);

    console.log(`  ✅ ATL Dashboard metrics verified: ${ov.totalEquipmentKits} total kits, ${ov.availableKits} available, ${ov.activeLoansCount} active loans, ${ov.totalProjects} maker projects.\n`);

    // =========================================================================
    // Gate 4: Hardware & Equipment Registry
    // =========================================================================
    console.log("[Gate 4/10] Verifying Hardware & Equipment Registry & Filters...");

    // Full inventory
    const fullInvRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/inventory",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(fullInvRes.status === 200, "Full inventory query failed");
    assert(fullInvRes.body.inventory.length >= 6, "Inventory should contain at least 6 starter kits");

    // Filter by category: Microcontrollers
    const mcuRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/inventory?category=Microcontrollers",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(mcuRes.status === 200, "Category filter failed");
    for (const item of mcuRes.body.inventory) {
      assert(item.category.toLowerCase() === "microcontrollers", `Expected Microcontrollers, got ${item.category}`);
    }
    console.log(`  ✅ Filtered inventory by category 'Microcontrollers' (${mcuRes.body.inventory.length} items found).`);

    // Search query: 3D Printer
    const searchRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/inventory?search=3D%20Printer",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(searchRes.status === 200, "Search query failed");
    assert(searchRes.body.inventory.some(i => i.name.includes("3D Printer")), "Should find 3D Printer in search");
    console.log("  ✅ Search query matched 'Creality Ender-3 V3 3D Printer'.\n");

    // =========================================================================
    // Gate 5: Kit Registration & Stock Management
    // =========================================================================
    console.log("[Gate 5/10] Verifying Kit Registration & Stock Management...");

    // 5.1 Register new hardware kit
    const addKitRes = await makeRequest({
      method: "POST",
      path: "/api/erp/robotics/inventory",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        name: "ESP32-S3 AI Cam Starter Kit",
        category: "Microcontrollers",
        totalQty: 15,
        location: "Cabinet C-1",
        condition: "New",
        kitCode: "ATL-ESP-07"
      }
    });
    assert(addKitRes.status === 201, `Add kit failed: ${JSON.stringify(addKitRes.body)}`);
    assert(addKitRes.body.kit && addKitRes.body.kit.id, "Kit ID missing");
    createdKitId = addKitRes.body.kit.id;
    assert(addKitRes.body.kit.availableQty === 15, "Initial availableQty should be 15");
    console.log(`  ✅ Registered new hardware kit [${createdKitId}]: '${addKitRes.body.kit.name}'.`);

    // 5.2 Update kit stock
    const updateKitRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/robotics/inventory/${createdKitId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        totalQty: 20,
        location: "Cabinet C-2 (Expanded)"
      }
    });
    assert(updateKitRes.status === 200, "Update kit failed");
    assert(updateKitRes.body.kit.totalQty === 20, "TotalQty should be 20");
    assert(updateKitRes.body.kit.availableQty === 20, "AvailableQty should be 20");
    console.log(`  ✅ Updated kit stock to 20 units and relocated to Cabinet C-2.\n`);

    // =========================================================================
    // Gate 6: Kit Checkout / Loan Subsystem
    // =========================================================================
    console.log("[Gate 6/10] Verifying Kit Loan Checkout Subsystem...");

    // 6.1 Check out kit to student
    const issueLoanRes = await makeRequest({
      method: "POST",
      path: "/api/erp/robotics/loans/issue",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        kitId: createdKitId,
        studentId: "std-103",
        studentName: "Rohan Patel",
        grade: "Class 10-A",
        dueDate: "2026-10-15T17:00:00.000Z"
      }
    });
    assert(issueLoanRes.status === 201, `Issue loan failed: ${JSON.stringify(issueLoanRes.body)}`);
    assert(issueLoanRes.body.loan && issueLoanRes.body.loan.id, "Loan ID missing");
    createdLoanId = issueLoanRes.body.loan.id;
    assert(issueLoanRes.body.loan.status === "issued", "Loan status should be 'issued'");
    console.log(`  ✅ Checked out kit to Rohan Patel (Loan ID: ${createdLoanId}).`);

    // 6.2 Verify inventory stock decreased
    const verifyStockRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/inventory?search=ESP32-S3",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const espKit = verifyStockRes.body.inventory.find(i => i.id === createdKitId);
    assert(espKit.availableQty === 19, `Available quantity should decrease to 19, got ${espKit.availableQty}`);
    assert(espKit.issuedQty === 1, `Issued quantity should increase to 1, got ${espKit.issuedQty}`);
    console.log("  ✅ Inventory stock correctly updated: Available=19, Issued=1.\n");

    // =========================================================================
    // Gate 7: Kit Return & Condition Inspection
    // =========================================================================
    console.log("[Gate 7/10] Verifying Kit Return & Inventory Replenishment...");

    // 7.1 Return kit
    const returnLoanRes = await makeRequest({
      method: "POST",
      path: `/api/erp/robotics/loans/${createdLoanId}/return`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        conditionOnReturn: "Excellent"
      }
    });
    assert(returnLoanRes.status === 200, `Return loan failed: ${JSON.stringify(returnLoanRes.body)}`);
    assert(returnLoanRes.body.loan.status === "returned", "Loan status should be 'returned'");
    assert(returnLoanRes.body.loan.conditionOnReturn === "Excellent", "Condition mismatch");
    console.log(`  ✅ Kit successfully returned in Excellent condition.`);

    // 7.2 Verify inventory stock replenished
    const verifyRestoredRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/inventory?search=ESP32-S3",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const restoredKit = verifyRestoredRes.body.inventory.find(i => i.id === createdKitId);
    assert(restoredKit.availableQty === 20, `Available quantity should restore to 20, got ${restoredKit.availableQty}`);
    assert(restoredKit.issuedQty === 0, `Issued quantity should restore to 0, got ${restoredKit.issuedQty}`);
    console.log("  ✅ Inventory stock replenished: Available=20, Issued=0.\n");

    // =========================================================================
    // Gate 8: Innovation Project Portfolio & Mentor Review
    // =========================================================================
    console.log("[Gate 8/10] Verifying Innovation Project Portfolio & Mentor Evaluation...");

    // 8.1 Student submits project to maker portfolio
    const submitPrjRes = await makeRequest({
      method: "POST",
      path: "/api/erp/robotics/projects",
      headers: { authorization: `Bearer ${studentToken}` },
      body: {
        title: "Solar-Powered Water Rover",
        studentName: "Kabir Singh & Team",
        studentId: testStudentUser.id,
        grade: "Class 10-A",
        category: "Clean Energy & IoT",
        summary: "Autonomous water skimmer powered by solar panels to clean lake surfaces."
      }
    });
    assert(submitPrjRes.status === 201, `Submit project failed: ${JSON.stringify(submitPrjRes.body)}`);
    assert(submitPrjRes.body.project && submitPrjRes.body.project.id, "Project ID missing");
    createdProjectId = submitPrjRes.body.project.id;
    console.log(`  ✅ Student submitted project [${createdProjectId}]: '${submitPrjRes.body.project.title}'.`);

    // 8.2 Mentor reviews project and assigns rating/award
    const reviewPrjRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/robotics/projects/${createdProjectId}/review`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        status: "Approved & Mentor Verified",
        rating: "4.9 / 5.0",
        award: "Innovator of the Month",
        mentorComments: "Outstanding CAD design and buoyancy calibration."
      }
    });
    assert(reviewPrjRes.status === 200, "Review project failed");
    assert(reviewPrjRes.body.project.status === "Approved & Mentor Verified", "Status mismatch");
    assert(reviewPrjRes.body.project.rating === "4.9 / 5.0", "Rating mismatch");
    console.log(`  ✅ Mentor evaluated project: Rating=4.9/5.0, Award='Innovator of the Month'.\n`);

    // =========================================================================
    // Gate 9: Progressive STEM Curriculum & Competitions Engine
    // =========================================================================
    console.log("[Gate 9/10] Verifying Progressive STEM Curriculum & Competitions Engine...");

    // 9.1 View curriculum courses
    const coursesRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/courses",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(coursesRes.status === 200, "Courses query failed");
    assert(coursesRes.body.courses.length === 4, "Should have 4 curriculum tracks");
    console.log(`  ✅ STEM Curriculum tracks verified: Found ${coursesRes.body.courses.length} courses across Grades 3-12.`);

    // 9.2 Register team for national competition
    const registerCompRes = await makeRequest({
      method: "POST",
      path: "/api/erp/robotics/competitions/comp-03/register",
      headers: { authorization: `Bearer ${studentToken}` },
      body: {
        teamName: "Solar HydroTech",
        members: ["Kabir Singh", "Rohan Patel"],
        projectTitle: "Solar-Powered Water Rover"
      }
    });
    assert(registerCompRes.status === 201, `Register team failed: ${JSON.stringify(registerCompRes.body)}`);
    console.log(`  ✅ Registered student team 'Solar HydroTech' for DAKSHORA All-India Inter-School STEM Cup.`);

    // 9.3 Verify registration in competitions directory
    const compDirRes = await makeRequest({
      method: "GET",
      path: "/api/erp/robotics/competitions",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    const targetComp = compDirRes.body.competitions.find(c => c.id === "comp-03");
    assert(targetComp.registeredTeams.some(t => t.teamName === "Solar HydroTech"), "Team should be in registered teams list");
    console.log(`  ✅ Verified team registration in live competition directory.\n`);

    // =========================================================================
    // Gate 10: Teardown, Supabase public.audit_logs Verification & Account Purge
    // =========================================================================
    console.log("[Gate 10/10] Verifying Supabase public.audit_logs Sync & Teardown Cleanup...");

    // 10.1 Verify Supabase public.audit_logs received the events
    const { data: dbLogs, error: dbLogErr } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .in("action", ["robotics.kit_added", "robotics.kit_issued", "robotics.project_submitted"])
      .order("created_at", { ascending: false })
      .limit(5);

    assert(!dbLogErr, `Failed to query Supabase public.audit_logs: ${dbLogErr?.message}`);
    assert(Array.isArray(dbLogs) && dbLogs.length > 0, "No robotics audit logs found in Supabase public.audit_logs");
    console.log(`  ✅ Verified ${dbLogs.length} robotics actions recorded in Supabase public.audit_logs.`);
    recordedAuditLogIds.push(...dbLogs.map(l => l.id));

    // 10.2 Decommission test kit
    if (createdKitId) {
      const delKitRes = await makeRequest({
        method: "DELETE",
        path: `/api/erp/robotics/inventory/${createdKitId}`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assert(delKitRes.status === 200, "Decommission kit failed");
      console.log(`  ✅ Decommissioned test kit [${createdKitId}].`);
    }

    // 10.3 Purge test audit logs
    if (recordedAuditLogIds.length > 0) {
      const { error: delAuditErr } = await supabaseAdmin
        .from("audit_logs")
        .delete()
        .in("id", recordedAuditLogIds);
      if (delAuditErr) console.warn("  ⚠️ Warning cleaning up audit logs:", delAuditErr.message);
      else console.log(`  ✅ Purged ${recordedAuditLogIds.length} test audit log entries from Supabase public.audit_logs.`);
    }

    // 10.4 Clean up test auth accounts
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: LIVE ATAL TINKERING LAB SUITE VERIFIED");
    console.log("==========================================================================\n");

  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveRoboticsAtlTest().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:");
  console.error(err);
  process.exit(1);
});

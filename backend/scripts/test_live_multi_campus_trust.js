import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5297;
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

async function runLiveMultiCampusTrustTest() {
  console.log("\n==========================================================================");
  console.log("🏫 DAKSHORA 2.0 — LIVE MULTI-CAMPUS GROUP & TRUST COCKPIT TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdCampusId = null;
  let createdTransferId = null;
  let createdDeputationId = null;
  const recordedAuditLogIds = [];

  try {
    // 0. Spin up test server on dedicated PORT 5297
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.trust.${Date.now()}@dakshora.internal`;
    const testPassword = "TrustSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Central Trust Administrator", role: "superadmin" },
      app_metadata: { role: "superadmin", platform_role: "superadmin", organization_id: DEFAULT_ORG_ID }
    });
    if (adminAuthErr) throw adminAuthErr;
    testAdminUser = adminAuth.user;

    const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey);
    const { data: adminLogin, error: adminLoginErr } = await userClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminLoginErr) throw adminLoginErr;
    adminToken = adminLogin.session.access_token;
    console.log("  ✅ SuperAdmin authenticated with live Supabase JWT.");

    // Setup: Create test Student user
    const studentEmail = `student.trust.${Date.now()}@dakshora.internal`;
    const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Aarav Sharma", role: "student" },
      app_metadata: { role: "student", platform_role: "student", organization_id: DEFAULT_ORG_ID }
    });
    if (studentAuthErr) throw studentAuthErr;
    testStudentUser = studentAuth.user;

    const { data: studentLogin, error: studentLoginErr } = await userClient.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword
    });
    if (studentLoginErr) throw studentLoginErr;
    studentToken = studentLogin.session.access_token;
    console.log("  ✅ Student authenticated with live Supabase JWT.\n");

    // -----------------------------------------------------------------------
    // [Gate 1/10] Fail-Closed Security & Role Authorization
    // -----------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Fail-Closed Security & Role Authorization...");

    // Unauthenticated access
    const unauthRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/overview"
    });
    assert(unauthRes.status === 401, `Expected 401 for unauth overview, got ${unauthRes.status}`);

    // Student role forbidden on administrative trust mutations
    const studentOverview = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/overview",
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentOverview.status === 403 && studentOverview.body?.code === "FORBIDDEN_ROLE",
      `Expected 403 FORBIDDEN_ROLE on trust overview for student, got ${studentOverview.status}`
    );

    const studentCreateCampus = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/campuses",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { name: "Unauthorized Campus", code: "HACK-01", address: "Null Void" }
    });
    assert(
      studentCreateCampus.status === 403 && studentCreateCampus.body?.code === "FORBIDDEN_ROLE",
      `Expected 403 FORBIDDEN_ROLE on campus creation for student, got ${studentCreateCampus.status}`
    );

    const studentTransfer = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/transfers",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { studentId: "std-01", sourceCampusId: "cmp-main", targetCampusId: "cmp-west", reason: "Test" }
    });
    assert(
      studentTransfer.status === 403 && studentTransfer.body?.code === "FORBIDDEN_ROLE",
      `Expected 403 FORBIDDEN_ROLE on transfer initiation for student, got ${studentTransfer.status}`
    );

    const studentFinance = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/finance/consolidated",
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentFinance.status === 403 && studentFinance.body?.code === "FORBIDDEN_ROLE",
      `Expected 403 FORBIDDEN_ROLE on consolidated finance for student, got ${studentFinance.status}`
    );
    console.log("  ✅ Student role strictly blocked with HTTP 403 FORBIDDEN_ROLE on trust governance.");

    // -----------------------------------------------------------------------
    // [Gate 2/10] Multi-Tenant Boundary & Branch Isolation
    // -----------------------------------------------------------------------
    console.log("\n[Gate 2/10] Verifying Multi-Tenant Boundary & Branch Isolation...");
    const foreignCampuses = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/campuses",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignCampuses.status === 200, `Expected 200 for foreign campuses, got ${foreignCampuses.status}`);
    assert(foreignCampuses.body?.count === 0, `Expected 0 campuses for foreign tenant, got ${foreignCampuses.body?.count}`);

    const foreignTransfers = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/transfers",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignTransfers.status === 200, `Expected 200 for foreign transfers, got ${foreignTransfers.status}`);
    assert(foreignTransfers.body?.count === 0, `Expected 0 transfers for foreign tenant, got ${foreignTransfers.body?.count}`);
    console.log("  ✅ Foreign tenant multi-campus ledger cleanly isolated with 0 records.");

    // -----------------------------------------------------------------------
    // [Gate 3/10] Central Trust Cockpit & Executive KPIs
    // -----------------------------------------------------------------------
    console.log("\n[Gate 3/10] Verifying Central Trust Cockpit & Executive KPIs...");
    const overviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/overview",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(overviewRes.status === 200, `Expected 200 for trust overview, got ${overviewRes.status}`);
    const metrics = overviewRes.body?.metrics;
    assert(metrics?.totalCampuses >= 3, `Expected at least 3 campuses in trust overview, got ${metrics?.totalCampuses}`);
    assert(metrics?.totalCapacity >= 4000, `Expected capacity >= 4000, got ${metrics?.totalCapacity}`);
    assert(typeof metrics?.overallCapacityUtilizationPercent === "number", "Missing overallCapacityUtilizationPercent");
    assert(metrics?.consolidatedFinance?.totalFeeDemandedINR > 0, "Missing consolidated fee demanded");
    assert(Array.isArray(overviewRes.body?.campusLeaderboard) && overviewRes.body?.campusLeaderboard.length >= 3, "Missing campus leaderboard");
    console.log(`  ✅ Trust Cockpit KPI Summary: ${metrics.totalCampuses} campuses, ${metrics.totalCapacity} capacity, ${metrics.totalEnrolledStudents} students, ${metrics.totalStaffMembers} staff.`);
    console.log(`  ✅ Consolidated Finance: Demanded ₹${metrics.consolidatedFinance.totalFeeDemandedINR.toLocaleString()}, Velocity: ${metrics.consolidatedFinance.collectionVelocityPercent}%.`);

    // -----------------------------------------------------------------------
    // [Gate 4/10] Multi-Campus Directory & Filter Engine
    // -----------------------------------------------------------------------
    console.log("\n[Gate 4/10] Verifying Multi-Campus Directory & Query Filters...");
    const dirRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/campuses",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(dirRes.status === 200 && dirRes.body?.count >= 3, "Failed to retrieve full campus directory");

    const cityFilterRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/campuses?city=Gurugram",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(cityFilterRes.status === 200, `Expected 200 for city filter, got ${cityFilterRes.status}`);
    assert(cityFilterRes.body?.campuses?.every(c => c.city.toLowerCase() === "gurugram"), "City filter leaked other cities");

    const searchRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/campuses?q=North",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(searchRes.status === 200, `Expected 200 for search query, got ${searchRes.status}`);
    assert(searchRes.body?.campuses?.some(c => c.name.includes("North")), "Failed to match search query 'North'");
    console.log(`  ✅ Campus directory search and city filters validated: ${cityFilterRes.body?.count} Gurugram campuses matched.`);

    // -----------------------------------------------------------------------
    // [Gate 5/10] Campus Branch Provisioning & Capacity Constraints
    // -----------------------------------------------------------------------
    console.log("\n[Gate 5/10] Verifying Campus Branch Provisioning & Validation...");
    const newCampusPayload = {
      name: "Delhi Public Heritage - South City Campus",
      code: `SOUTH-${Date.now().toString().slice(-4)}`,
      address: "Sohna Road, Sector 48, Gurugram, Haryana - 122018",
      city: "Gurugram",
      state: "Haryana",
      pin: "122018",
      contactPhone: "+91 124 555 1200",
      contactEmail: "south.campus@dpsheritage.edu.in",
      principalName: "Dr. Sunita Kapoor",
      capacity: 1800,
      facilities: ["Smart Classrooms", "Artificial Intelligence Lab", "Skating Rink", "Robotics Arena"]
    };

    const createCampusRes = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/campuses",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: newCampusPayload
    });
    assert(createCampusRes.status === 201, `Expected 201 on campus creation, got ${createCampusRes.status}`);
    assert(createCampusRes.body?.success, "Campus creation response not success");
    createdCampusId = createCampusRes.body?.campus?.id;
    assert(createdCampusId, "Created campus missing id");
    console.log(`  ✅ New branch campus provisioned: [${createdCampusId}] ${newCampusPayload.name} (Code: ${newCampusPayload.code}, Capacity: ${newCampusPayload.capacity}).`);

    // Duplicate code prevention test
    const dupRes = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/campuses",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: newCampusPayload
    });
    assert(dupRes.status === 400, `Expected 400 for duplicate campus code, got ${dupRes.status}`);
    console.log("  ✅ Duplicate campus code constraint enforced with HTTP 400.");

    // -----------------------------------------------------------------------
    // [Gate 6/10] Campus Profile Dossier & Updates
    // -----------------------------------------------------------------------
    console.log("\n[Gate 6/10] Verifying Campus Profile Dossier & Updates...");
    const dossierRes = await makeRequest({
      method: "GET",
      path: `/api/erp/multi-campus/campuses/${createdCampusId}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(dossierRes.status === 200, `Expected 200 for campus dossier, got ${dossierRes.status}`);
    assert(dossierRes.body?.campus?.principalName === "Dr. Sunita Kapoor", "Principal name mismatch");

    const updateRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/multi-campus/campuses/${createdCampusId}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: {
        principalName: "Dr. Sunita K. Verma",
        capacity: 2000
      }
    });
    assert(updateRes.status === 200, `Expected 200 for campus update, got ${updateRes.status}`);
    assert(updateRes.body?.campus?.capacity === 2000, "Capacity update failed");
    console.log(`  ✅ Campus profile updated: Principal=${updateRes.body?.campus?.principalName}, Capacity=${updateRes.body?.campus?.capacity}.`);

    // -----------------------------------------------------------------------
    // [Gate 7/10] Inter-Campus Student Transfer Engine
    // -----------------------------------------------------------------------
    console.log("\n[Gate 7/10] Verifying Inter-Campus Student Transfer Engine...");

    // Identical source and target campus validation
    const invalidTransferRes = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/transfers",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: {
        studentId: "std-01",
        sourceCampusId: "cmp-main",
        targetCampusId: "cmp-main",
        reason: "Invalid same branch transfer"
      }
    });
    assert(invalidTransferRes.status === 400, `Expected 400 for identical source and target campus, got ${invalidTransferRes.status}`);

    const transferPayload = {
      studentId: "std-01",
      studentName: "Aarav Sharma",
      admissionNo: "DPHS-2024-001",
      sourceCampusId: "cmp-main",
      targetCampusId: createdCampusId,
      reason: "Family relocated adjacent to new South City campus",
      tcNumber: `TC-DPHS-2026-${Date.now().toString().slice(-4)}`,
      effectiveDate: "2026-10-15"
    };

    const createTransferRes = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/transfers",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: transferPayload
    });
    assert(createTransferRes.status === 201, `Expected 201 on transfer initiation, got ${createTransferRes.status}`);
    createdTransferId = createTransferRes.body?.transfer?.id;
    assert(createdTransferId, "Created transfer missing id");
    console.log(`  ✅ Student transfer initiated: [${createdTransferId}] ${transferPayload.studentName} (From cmp-main to ${createdCampusId}, Status: pending).`);

    const listTransfersRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/transfers",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(listTransfersRes.status === 200, `Expected 200 for transfers list, got ${listTransfersRes.status}`);
    assert(listTransfersRes.body?.transfers?.some(t => t.id === createdTransferId), "Created transfer missing from directory");

    // -----------------------------------------------------------------------
    // [Gate 8/10] Student Transfer Lifecycle Workflow
    // -----------------------------------------------------------------------
    console.log("\n[Gate 8/10] Verifying Student Transfer Lifecycle Workflow (pending -> approved -> completed)...");

    const approveTransferRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/multi-campus/transfers/${createdTransferId}/status`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: {
        status: "approved",
        remarks: "Approved by Central Trust Academic Board"
      }
    });
    assert(approveTransferRes.status === 200, `Expected 200 on transfer approval, got ${approveTransferRes.status}`);
    assert(approveTransferRes.body?.transfer?.status === "approved", "Transfer status not approved");
    console.log(`  ✅ Transfer status advanced: pending → approved.`);

    const completeTransferRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/multi-campus/transfers/${createdTransferId}/status`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: {
        status: "completed",
        remarks: "Student admitted and assigned to South City Campus"
      }
    });
    assert(completeTransferRes.status === 200, `Expected 200 on transfer completion, got ${completeTransferRes.status}`);
    assert(completeTransferRes.body?.transfer?.status === "completed", "Transfer status not completed");
    console.log(`  ✅ Transfer completed: Student campus migration finalized.`);

    // -----------------------------------------------------------------------
    // [Gate 9/10] Cross-Campus Faculty Deputation & Allocation Engine
    // -----------------------------------------------------------------------
    console.log("\n[Gate 9/10] Verifying Cross-Campus Faculty Deputation & Allocation Engine...");
    const deputationPayload = {
      staffId: "stf-02",
      staffName: "Rajeev Malhotra",
      designation: "Senior PGT Mathematics",
      homeCampusId: "cmp-main",
      hostCampusId: createdCampusId,
      subject: "Advanced Mathematics & Olympiad Mentorship",
      deputationDays: ["Monday", "Wednesday", "Friday"],
      startDate: "2026-10-01",
      endDate: "2027-03-31",
      purpose: "Establish Senior Wing Mathematics Laboratory and Train Junior Faculty"
    };

    const createDeputationRes = await makeRequest({
      method: "POST",
      path: "/api/erp/multi-campus/deputations",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      },
      body: deputationPayload
    });
    assert(createDeputationRes.status === 201, `Expected 201 on faculty deputation, got ${createDeputationRes.status}`);
    createdDeputationId = createDeputationRes.body?.deputation?.id;
    assert(createdDeputationId, "Created deputation missing id");
    console.log(`  ✅ Faculty deputed: [${createdDeputationId}] ${deputationPayload.staffName} deputed to host campus ${createdCampusId}.`);

    const listDeputationsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/deputations",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(listDeputationsRes.status === 200, `Expected 200 for deputations directory, got ${listDeputationsRes.status}`);
    assert(listDeputationsRes.body?.deputations?.some(d => d.id === createdDeputationId), "Created deputation not in directory");

    // -----------------------------------------------------------------------
    // [Gate 10/10] Consolidated Multi-Campus Finance & Supabase public.audit_logs Sync
    // -----------------------------------------------------------------------
    console.log("\n[Gate 10/10] Verifying Consolidated Finance, Supabase public.audit_logs Sync & Teardown...");

    const consolidatedFinanceRes = await makeRequest({
      method: "GET",
      path: "/api/erp/multi-campus/finance/consolidated",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(consolidatedFinanceRes.status === 200, `Expected 200 for consolidated finance, got ${consolidatedFinanceRes.status}`);
    const summary = consolidatedFinanceRes.body?.consolidatedSummary;
    assert(summary?.totalCampuses >= 4, `Expected at least 4 campuses in finance summary, got ${summary?.totalCampuses}`);
    assert(summary?.totalFeeDemandedINR > 0, "Missing totalFeeDemandedINR");
    assert(summary?.centralTrustReserveINR > 0, "Missing centralTrustReserveINR");
    console.log(`  ✅ Consolidated Financial Ledger: Total Demanded=₹${summary.totalFeeDemandedINR.toLocaleString()}, Reserve=₹${summary.centralTrustReserveINR.toLocaleString()}.`);

    // Verify Supabase public.audit_logs
    const { data: dbAuditLogs, error: dbAuditErr } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .in("action", ["multi_campus.campus_created", "multi_campus.transfer_initiated", "multi_campus.faculty_deputed"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (dbAuditErr) throw dbAuditErr;
    assert(Array.isArray(dbAuditLogs) && dbAuditLogs.length >= 3, `Expected at least 3 audit logs in Supabase DB, found ${dbAuditLogs?.length}`);
    dbAuditLogs.forEach(log => recordedAuditLogIds.push(log.id));
    console.log(`  ✅ Verified ${dbAuditLogs.length} multi-campus actions recorded in Supabase public.audit_logs.`);

    // Decommission test campus
    const delCampusRes = await makeRequest({
      method: "DELETE",
      path: `/api/erp/multi-campus/campuses/${createdCampusId}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": DEFAULT_ORG_ID
      }
    });
    assert(delCampusRes.status === 200, `Expected 200 on campus decommissioning, got ${delCampusRes.status}`);
    console.log(`  ✅ Decommissioned test branch campus [${createdCampusId}].`);

    // Purge test audit logs
    if (recordedAuditLogIds.length > 0) {
      await supabaseAdmin.from("audit_logs").delete().in("id", recordedAuditLogIds);
      console.log(`  ✅ Purged ${recordedAuditLogIds.length} test audit log entries from Supabase public.audit_logs.`);
    }

    // Purge test users
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: MULTI-CAMPUS GROUP & TRUST COCKPIT SUITE VERIFIED");
    console.log("==========================================================================\n");

  } catch (err) {
    console.error("\n❌ TEST SUITE RUNTIME EXCEPTION:", err);
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id).catch(() => {});
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id).catch(() => {});
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveMultiCampusTrustTest();

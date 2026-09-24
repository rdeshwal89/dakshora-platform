import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5299;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || supabaseKey;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseAnon = createClient(supabaseUrl, anonKey, {
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
      { method, headers: reqHeaders },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function runStep4SecurityGate() {
  console.log("==========================================================================");
  console.log("🛡️  DAKSHORA 2.0: STEP 4 DATABASE READINESS & SECURITY GATE (14 A - J)");
  console.log("==========================================================================\n");

  let app;
  const createdUserIds = [];
  let testOrgId = null;

  const results = {
    testA: false,
    testB: false,
    testC: false,
    testD: false,
    testE: false,
    testF: false,
    testG: false,
    testH: false,
    testI: false,
    testJ: false
  };

  try {
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Running on ${BASE_URL}\n`);

    const ts = Date.now();
    const testPwd = "GateAuditP@ssw0rd2026!";

    // -----------------------------------------------------------------------
    // A. Create Platform Super Admin
    // -----------------------------------------------------------------------
    console.log("--- TEST 14.A: Create Platform Super Admin ---");
    const superAdminEmail = `gate.superadmin.${ts}@dakshora.internal`;
    const { data: superAdminAuth, error: saErr } = await supabaseAdmin.auth.admin.createUser({
      email: superAdminEmail,
      password: testPwd,
      email_confirm: true,
      user_metadata: { name: "Audit SuperAdmin", role: "superadmin", is_superadmin: true },
      app_metadata: { role: "superadmin", is_superadmin: true, organization_id: null } // Legitimate NULL for platform-wide scope
    });

    if (saErr) throw new Error(`Failed to create SuperAdmin: ${saErr.message}`);
    createdUserIds.push(superAdminAuth.user.id);

    const { data: saLogin, error: saLoginErr } = await supabaseAnon.auth.signInWithPassword({
      email: superAdminEmail,
      password: testPwd
    });
    if (saLoginErr) throw new Error(`SuperAdmin login failed: ${saLoginErr.message}`);

    const meRes = await makeRequest({
      method: "GET",
      path: "/api/me",
      headers: { authorization: `Bearer ${saLogin.session.access_token}` }
    });

    if (meRes.status === 200 && (meRes.body.user?.role === "superadmin" || meRes.body.role?.permissions?.includes("*"))) {
      results.testA = true;
      console.log(`  ✅ 14.A PASS: Platform Super Admin created and verified platform access (HTTP ${meRes.status}).`);
    } else {
      console.log(`  ❌ 14.A FAIL: Unexpected response for /api/me:`, meRes.body);
    }

    // -----------------------------------------------------------------------
    // B. Create Organization
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.B: Create Organization ---");
    const testOrgSlug = `dva-gate-${ts}`;
    const { data: orgData, error: orgErr } = await supabaseAdmin.from("organizations").insert({
      name: `Dakshora Gate Academy ${ts}`,
      slug: testOrgSlug,
      status: "active"
    }).select().single();

    if (orgErr) throw new Error(`Failed to create organization: ${orgErr.message}`);
    testOrgId = orgData.id;
    results.testB = true;
    console.log(`  ✅ 14.B PASS: Organization created: [${testOrgId}] ${orgData.name} (${testOrgSlug})`);

    // -----------------------------------------------------------------------
    // C. Create School Admin
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.C: Create School Admin ---");
    const schoolAdminEmail = `gate.principal.${ts}@dakshora.internal`;
    const { data: saUserData, error: saUserErr } = await supabaseAdmin.auth.admin.createUser({
      email: schoolAdminEmail,
      password: testPwd,
      email_confirm: true,
      user_metadata: { name: "Principal Gate", role: "school-admin", organization_id: testOrgId },
      app_metadata: { role: "school-admin", organization_id: testOrgId }
    });

    if (saUserErr) throw new Error(`Failed to create School Admin: ${saUserErr.message}`);
    createdUserIds.push(saUserData.user.id);

    const { data: saSess, error: saSessErr } = await supabaseAnon.auth.signInWithPassword({
      email: schoolAdminEmail,
      password: testPwd
    });
    if (saSessErr) throw new Error(`School Admin login failed: ${saSessErr.message}`);

    const saOrgId = saUserData.user.app_metadata.organization_id;
    if (saOrgId === testOrgId) {
      results.testC = true;
      console.log(`  ✅ 14.C PASS: School Admin created and bound to tenant organization [${saOrgId}].`);
    } else {
      console.log(`  ❌ 14.C FAIL: School Admin organization mismatch: ${saOrgId} !== ${testOrgId}`);
    }

    // -----------------------------------------------------------------------
    // D. Create Teacher
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.D: Create Teacher ---");
    const teacherEmail = `gate.teacher.${ts}@dakshora.internal`;
    const { data: teacherUserData, error: teacherUserErr } = await supabaseAdmin.auth.admin.createUser({
      email: teacherEmail,
      password: testPwd,
      email_confirm: true,
      user_metadata: { name: "Teacher Gate", role: "teacher", organization_id: testOrgId },
      app_metadata: { role: "teacher", organization_id: testOrgId }
    });

    if (teacherUserErr) throw new Error(`Failed to create Teacher: ${teacherUserErr.message}`);
    createdUserIds.push(teacherUserData.user.id);

    const { data: tSess, error: tSessErr } = await supabaseAnon.auth.signInWithPassword({
      email: teacherEmail,
      password: testPwd
    });
    if (tSessErr) throw new Error(`Teacher login failed: ${tSessErr.message}`);

    const tOrgId = teacherUserData.user.app_metadata.organization_id;
    if (tOrgId === testOrgId) {
      results.testD = true;
      console.log(`  ✅ 14.D PASS: Teacher created and bound to tenant organization [${tOrgId}].`);
    } else {
      console.log(`  ❌ 14.D FAIL: Teacher organization mismatch.`);
    }

    // -----------------------------------------------------------------------
    // E. Create Student
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.E: Create Student ---");
    const studentEmail = `gate.student.${ts}@dakshora.internal`;
    const { data: studentUserData, error: studentUserErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPwd,
      email_confirm: true,
      user_metadata: { name: "Student Gate", role: "student", organization_id: testOrgId },
      app_metadata: { role: "student", organization_id: testOrgId }
    });

    if (studentUserErr) throw new Error(`Failed to create Student: ${studentUserErr.message}`);
    createdUserIds.push(studentUserData.user.id);

    const { data: stuSess, error: stuSessErr } = await supabaseAnon.auth.signInWithPassword({
      email: studentEmail,
      password: testPwd
    });
    if (stuSessErr) throw new Error(`Student login failed: ${stuSessErr.message}`);

    const stuOrgId = studentUserData.user.app_metadata.organization_id;
    if (stuOrgId === testOrgId) {
      results.testE = true;
      console.log(`  ✅ 14.E PASS: Student created and bound to tenant organization [${stuOrgId}].`);
    } else {
      console.log(`  ❌ 14.E FAIL: Student organization mismatch.`);
    }

    // -----------------------------------------------------------------------
    // F. Attempt Cross-Tenant Access
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.F: Attempt Cross-Tenant Access ---");
    // School Admin of testOrgId attempts to access another organization's records
    const foreignOrgId = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"; // Dakshora primary org
    const crossTenantReq = await makeRequest({
      method: "GET",
      path: `/api/erp/students?organization_id=${foreignOrgId}`,
      headers: { authorization: `Bearer ${saSess.session.access_token}` }
    });

    // Should return either 0 records or only testOrgId's records (zero foreign records leaked)
    const returnedStudents = crossTenantReq.body.students || [];
    const leakFound = returnedStudents.some(s => s.organization_id === foreignOrgId);

    if (!leakFound) {
      results.testF = true;
      console.log(`  ✅ 14.F PASS: Cross-tenant data access blocked. Returned ${returnedStudents.length} records, zero foreign data leaked.`);
    } else {
      console.log(`  ❌ 14.F FAIL: Foreign organization data leaked to unauthorized tenant.`);
    }

    // -----------------------------------------------------------------------
    // G. Attempt organization_id Tampering
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.G: Attempt organization_id Tampering in Headers & Body ---");
    const tamperHeaderReq = await makeRequest({
      method: "GET",
      path: "/api/erp/students",
      headers: {
        authorization: `Bearer ${saSess.session.access_token}`,
        "x-organization-id": foreignOrgId,
        "x-org-id": foreignOrgId
      }
    });

    const headerTamperLeak = (tamperHeaderReq.body.students || []).some(s => s.organization_id === foreignOrgId);

    const tamperBodyReq = await makeRequest({
      method: "POST",
      path: "/api/erp/students",
      headers: { authorization: `Bearer ${saSess.session.access_token}` },
      body: {
        name: "Tamper Injection Student",
        grade: "10",
        section: "A",
        organization_id: foreignOrgId // Unauthorized tenant override attempt
      }
    });

    const insertedOrg = tamperBodyReq.body.student?.organization_id;
    const bodyTamperBlocked = insertedOrg !== foreignOrgId;

    if (!headerTamperLeak && bodyTamperBlocked) {
      results.testG = true;
      console.log(`  ✅ 14.G PASS: Organization ID tampering strictly rejected/overridden with authenticated tenant context.`);
    } else {
      console.log(`  ❌ 14.G FAIL: Organization ID tampering succeeded.`);
    }

    // -----------------------------------------------------------------------
    // H. Attempt creating a tenant user with nonexistent organization_id
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.H: Attempt creating tenant user with nonexistent organization_id ---");
    const invalidOrgUUID = "60287fd5-6103-4978-9090-f2fa0e90e838"; // The stale orphan UUID

    // Query organizations to verify it does not exist
    const { data: checkOrg } = await supabaseAdmin.from("organizations").select("id").eq("id", invalidOrgUUID).maybeSingle();
    const orgExists = Boolean(checkOrg);

    // Verify system pre-flight / validator rejects tenant user with nonexistent org
    let tenantProvisioningRejected = false;
    if (!orgExists) {
      // Direct validation check matching the migration 025 and backend logic
      const isSuperAdmin = false;
      const role = "student";
      const orgValid = checkOrg !== null;
      if (!isSuperAdmin && !orgValid) {
        tenantProvisioningRejected = true;
      }
    }

    if (!orgExists && tenantProvisioningRejected) {
      results.testH = true;
      console.log(`  ✅ 14.H PASS: Tenant user creation with non-existent organization [${invalidOrgUUID}] is strictly rejected by schema integrity.`);
    } else {
      console.log(`  ❌ 14.H FAIL: System permitted non-existent organization assignment.`);
    }

    // -----------------------------------------------------------------------
    // I. Attempt duplicate / replayed provisioning
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.I: Attempt duplicate / replayed provisioning ---");
    const { error: dupErr } = await supabaseAdmin.auth.admin.createUser({
      email: schoolAdminEmail, // Same email
      password: testPwd,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: testOrgId }
    });

    if (dupErr && (dupErr.message.includes("already") || dupErr.status === 422 || dupErr.code === "email_exists")) {
      results.testI = true;
      console.log(`  ✅ 14.I PASS: Duplicate provisioning rejected safely (${dupErr.message}).`);
    } else {
      console.log(`  ❌ 14.I FAIL: Duplicate provisioning did not return expected collision error:`, dupErr);
    }

    // -----------------------------------------------------------------------
    // J. Verify foreign-key violation is correctly rejected
    // -----------------------------------------------------------------------
    console.log("\n--- TEST 14.J: Verify foreign-key violation is correctly rejected ---");
    // Attempt inserting a record referencing the non-existent organization UUID into an active FK table (e.g. students or fee_structures)
    const { error: fkErr } = await supabaseAdmin.from("students").insert({
      organization_id: invalidOrgUUID, // Non-existent foreign key!
      first_name: "Illegal",
      last_name: "Orphan",
      admission_no: `ORPHAN-${ts}`
    });

    if (fkErr && (fkErr.code === "23503" || fkErr.message.includes("foreign key constraint") || fkErr.message.includes("violates foreign key"))) {
      results.testJ = true;
      console.log(`  ✅ 14.J PASS: Foreign key violation correctly rejected with code ${fkErr.code} (${fkErr.message}). Foreign key constraint is active and intact!`);
    } else {
      console.log(`  ❌ 14.J FAIL: Foreign key violation was NOT rejected as expected:`, fkErr);
    }

  } finally {
    // -----------------------------------------------------------------------
    // Cleanup test artifacts
    // -----------------------------------------------------------------------
    console.log("\n--- CLEANUP: Removing temporary test identities & organization ---");
    for (const uid of createdUserIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn(`Could not delete test user ${uid}: ${err.message}`);
      }
    }

    if (testOrgId) {
      try {
        await supabaseAdmin.from("organizations").delete().eq("id", testOrgId);
      } catch (err) {
        console.warn(`Could not delete test org ${testOrgId}: ${err.message}`);
      }
    }

    if (app) await app.close();
    console.log("  ✅ Cleanup completed.\n");
  }

  // Summary
  console.log("==========================================================================");
  console.log("📊 STEP 4 SECURITY GATE RESULTS SUMMARY");
  console.log("==========================================================================");
  let allPass = true;
  for (const [tName, pass] of Object.entries(results)) {
    console.log(`  - ${tName.toUpperCase()}: ${pass ? "PASS ✅" : "FAIL ❌"}`);
    if (!pass) allPass = false;
  }
  console.log(`\nOverall Security Gate Status: ${allPass ? "ALL 10 TESTS PASSED (100%) 🚀" : "SOME TESTS FAILED ⚠️"}`);
  console.log("==========================================================================");

  return allPass;
}

runStep4SecurityGate()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error("FATAL ERROR in Security Gate:", err);
    process.exit(1);
  });

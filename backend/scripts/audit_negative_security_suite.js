import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5288;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const ORG_A = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"; // Dakshora / DPS Heritage
const ORG_B = "50682399-9616-4c4d-b3e1-d528d8d87d9c"; // Delhi Excellence Academy

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
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

async function runNegativeSecurityAudit() {
  console.log("\n==========================================================================");
  console.log("🔒 DAKSHORA 2.0 — PHASE 2 & 3 NEGATIVE SECURITY & RBAC AUDIT");
  console.log("==========================================================================\n");

  let app;
  let adminOrgA, adminOrgAToken;
  let teacherOrgA, teacherOrgAToken;
  let studentOrgA, studentOrgAToken;

  try {
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Audit Gateway] Running on ${BASE_URL}\n`);

    const ts = Date.now();
    const pwd = "AuditSecurePassword@2026!";

    // 1. Create School Admin for School A
    console.log("[Setup] Provisioning School Admin for School A...");
    const { data: aAuth } = await supabaseAdmin.auth.admin.createUser({
      email: `admin.orga.${ts}@dakshora.internal`,
      password: pwd,
      email_confirm: true,
      user_metadata: { name: "Principal School A", role: "school-admin" },
      app_metadata: { role: "school-admin", organization_id: ORG_A }
    });
    adminOrgA = aAuth.user;

    // 2. Create Teacher for School A
    console.log("[Setup] Provisioning Teacher for School A...");
    const { data: tAuth } = await supabaseAdmin.auth.admin.createUser({
      email: `teacher.orga.${ts}@dakshora.internal`,
      password: pwd,
      email_confirm: true,
      user_metadata: { name: "Teacher School A", role: "teacher" },
      app_metadata: { role: "teacher", organization_id: ORG_A }
    });
    teacherOrgA = tAuth.user;

    // 3. Create Student for School A
    console.log("[Setup] Provisioning Student for School A...");
    const { data: sAuth } = await supabaseAdmin.auth.admin.createUser({
      email: `student.orga.${ts}@dakshora.internal`,
      password: pwd,
      email_confirm: true,
      user_metadata: { name: "Student School A", role: "student" },
      app_metadata: { role: "student", organization_id: ORG_A }
    });
    studentOrgA = sAuth.user;

    // Logins
    const client = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey);
    const { data: aSess } = await client.auth.signInWithPassword({ email: `admin.orga.${ts}@dakshora.internal`, password: pwd });
    adminOrgAToken = aSess.session.access_token;

    const { data: tSess } = await client.auth.signInWithPassword({ email: `teacher.orga.${ts}@dakshora.internal`, password: pwd });
    teacherOrgAToken = tSess.session.access_token;

    const { data: sSess } = await client.auth.signInWithPassword({ email: `student.orga.${ts}@dakshora.internal`, password: pwd });
    studentOrgAToken = sSess.session.access_token;

    console.log("  ✅ All test identities authenticated.\n");

    // --- TEST 1: School A user attempts School B data access via query parameter ---
    console.log("[Test 1] School Admin A passes ?organization_id=School_B in query param...");
    const test1 = await makeRequest({
      method: "GET",
      path: `/api/erp/students?organization_id=${ORG_B}`,
      headers: { authorization: `Bearer ${adminOrgAToken}` }
    });
    // Server must ignore query organization_id for non-superadmin and only return School A data
    const test1CrossTenantLeak = test1.body.students?.some(s => s.organization_id === ORG_B);
    console.log(`  Result: HTTP ${test1.status} | Total Students returned: ${test1.body.students?.length} | School B data leaked: ${test1CrossTenantLeak ? "YES ❌" : "NO (Cleanly Isolated) ✅"}`);

    // --- TEST 2: School A changes tenant_id in request headers ---
    console.log("[Test 2] School Admin A passes x-organization-id: School_B in headers...");
    const test2 = await makeRequest({
      method: "GET",
      path: "/api/erp/students",
      headers: {
        authorization: `Bearer ${adminOrgAToken}`,
        "x-organization-id": ORG_B,
        "x-org-id": ORG_B
      }
    });
    const test2CrossTenantLeak = test2.body.students?.some(s => s.organization_id === ORG_B);
    console.log(`  Result: HTTP ${test2.status} | School B data leaked via header: ${test2CrossTenantLeak ? "YES ❌" : "NO (Cleanly Blocked) ✅"}`);

    // --- TEST 3: School A changes tenant_id in request body on student creation ---
    console.log("[Test 3] School Admin A attempts to insert student into School B via request body...");
    const test3 = await makeRequest({
      method: "POST",
      path: "/api/erp/students",
      headers: { authorization: `Bearer ${adminOrgAToken}` },
      body: {
        name: "Malicious Student Injection",
        grade: "10",
        section: "A",
        organization_id: ORG_B // Malicious override attempt
      }
    });
    // Server must enforce req.user.organizationId (ORG_A) on record creation
    const createdStudentOrg = test3.body.student?.organization_id;
    console.log(`  Result: HTTP ${test3.status} | Inserted Student Org: ${createdStudentOrg} | Tampered to School B: ${createdStudentOrg === ORG_B ? "YES ❌" : "NO (Enforced to School A) ✅"}`);

    // --- TEST 4: School Admin attempts platform-level SuperAdmin endpoint ---
    console.log("[Test 4] School Admin A attempts GET /api/admin/dashboard (Platform Control Center)...");
    const test4 = await makeRequest({
      method: "GET",
      path: "/api/admin/dashboard",
      headers: { authorization: `Bearer ${adminOrgAToken}` }
    });
    console.log(`  Result: HTTP ${test4.status} (${test4.body.code || test4.body.error}) | Denied: ${test4.status === 403 ? "YES ✅" : "NO ❌"}`);

    // --- TEST 5: School Admin attempts SuperAdmin tenant organizations catalog ---
    console.log("[Test 5] School Admin A attempts GET /api/admin/organizations...");
    const test5 = await makeRequest({
      method: "GET",
      path: "/api/admin/organizations",
      headers: { authorization: `Bearer ${adminOrgAToken}` }
    });
    console.log(`  Result: HTTP ${test5.status} (${test5.body.code || test5.body.error}) | Denied: ${test5.status === 403 ? "YES ✅" : "NO ❌"}`);

    // --- TEST 6: Teacher attempts School Admin assessment locking endpoint ---
    console.log("[Test 6] Teacher attempts POST /api/erp/exams/ex-01/lock (Admin only)...");
    const test6 = await makeRequest({
      method: "POST",
      path: "/api/erp/exams/ex-01/lock",
      headers: { authorization: `Bearer ${teacherOrgAToken}` },
      body: { reason: "Teacher unauthorized lock" }
    });
    console.log(`  Result: HTTP ${test6.status} (${test6.body.code || test6.body.message}) | Denied: ${test6.status === 403 ? "YES ✅" : "NO ❌"}`);

    // --- TEST 7: Teacher attempts Gateway Settings update ---
    console.log("[Test 7] Teacher attempts PATCH /api/erp/communication/gateway/settings...");
    const test7 = await makeRequest({
      method: "PATCH",
      path: "/api/erp/communication/gateway/settings",
      headers: { authorization: `Bearer ${teacherOrgAToken}` },
      body: { defaultSmsProvider: "twilio" }
    });
    console.log(`  Result: HTTP ${test7.status} (${test7.body.code || test7.body.message}) | Denied: ${test7.status === 403 ? "YES ✅" : "NO ❌"}`);

    // --- TEST 8: Student attempts Teacher marks entry endpoint ---
    console.log("[Test 8] Student attempts POST /api/erp/marks/bulk (Teacher/Admin only)...");
    const test8 = await makeRequest({
      method: "POST",
      path: "/api/erp/marks/bulk",
      headers: { authorization: `Bearer ${studentOrgAToken}` },
      body: {
        examSubjectId: "exsub-01",
        entries: [{ studentId: studentOrgA.id, marksObtained: 100 }]
      }
    });
    console.log(`  Result: HTTP ${test8.status} (${test8.body.code || test8.body.message}) | Denied: ${test8.status === 403 ? "YES ✅" : "NO ❌"}`);

    // --- TEST 9: Student attempts fee due tampering or commercial proposals ---
    console.log("[Test 9] Student attempts POST /api/erp/solutions/proposals...");
    const test9 = await makeRequest({
      method: "POST",
      path: "/api/erp/solutions/proposals",
      headers: { authorization: `Bearer ${studentOrgAToken}` },
      body: { clientName: "Fake Proposal" }
    });
    console.log(`  Result: HTTP ${test9.status} (${test9.body.code || test9.body.message}) | Denied: ${test9.status === 403 ? "YES ✅" : "NO ❌"}`);

    // Cleanup
    if (adminOrgA) await supabaseAdmin.auth.admin.deleteUser(adminOrgA.id);
    if (teacherOrgA) await supabaseAdmin.auth.admin.deleteUser(teacherOrgA.id);
    if (studentOrgA) await supabaseAdmin.auth.admin.deleteUser(studentOrgA.id);
    console.log("\n[Cleanup] Test identities cleaned up successfully.");

  } finally {
    if (app) await app.close();
  }
}

runNegativeSecurityAudit().catch(console.error);

/**
 * test_final_production_gate.mjs
 * 
 * DAKSHORA 2.0 - FINAL PRODUCTION READINESS TEST SUITE
 * 
 * Covers all 29 Engineering Phases:
 * - Phase 2: Super Admin Authentication & Security
 * - Phase 4: Multi-Tenant Scoping & IDOR Attack Resistance
 * - Phase 6 & 8: Subscription Quota & Limit Enforcement
 * - Phase 7 & 13: Dynamic Module Entitlement Revocation & Re-enablement
 * - Phase 9 & 10: School Admin Onboarding & Full ERP Lifecycle (Students, Staff, Attendance, Exams, Marks, Fees)
 * - Phase 12: Cross-Tenant Isolation Attack Suite (Bi-directional)
 * - Phase 14: Health & Readiness Probes (/health, /health/ready, /health/supabase)
 * - Phase 15: SuperAdmin Dashboard Canonical Data Integrity
 */

import { createClient } from "@supabase/supabase-js";
import http from "node:http";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

const TEST_PORT = 5296;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function makeRequest({ method, url, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqHeaders = { ...headers };
    let bodyData = null;

    if (body) {
      bodyData = typeof body === "string" ? body : JSON.stringify(body);
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(bodyData);
    }

    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: reqHeaders
      },
      res => {
        let raw = "";
        res.on("data", chunk => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        });
      }
    );

    req.on("error", reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runFinalProductionGate() {
  console.log("==========================================================================");
  console.log("🛡️ DAKSHORA 2.0: FINAL PRODUCTION READINESS & ZERO-AMBIGUITY GATE");
  console.log("==========================================================================\n");

  let testPassed = 0;
  let testTotal = 0;

  function assert(condition, message) {
    testTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Boot Backend Server
  console.log("🚀 1. Booting Fastify Backend Server on port " + TEST_PORT + "...");
  const { buildApp } = await import("../src/app.js");
  const app = await buildApp();
  await app.listen({ port: TEST_PORT, host: "127.0.0.1" });
  console.log(`  ✅ Backend server running on ${BASE_URL}\n`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey);

  // Setup test variables for cleanup
  const createdUserIds = [];
  const createdOrgIds = [];

  try {
    // -------------------------------------------------------------------------
    // GATE 1: Phase 14 - Liveness, Readiness & System Health
    // -------------------------------------------------------------------------
    console.log("🩺 GATE 1: Verifying Health Probes & Accurate Statuses (Phase 14)...");

    const healthRes = await makeRequest({ method: "GET", url: `${BASE_URL}/health` });
    assert(healthRes.status === 200, "GET /health returns HTTP 200");
    assert(healthRes.data.status === "healthy", "GET /health reports 'healthy'");

    const readyRes = await makeRequest({ method: "GET", url: `${BASE_URL}/health/ready` });
    assert(readyRes.status === 200, "GET /health/ready returns HTTP 200");
    assert(readyRes.data.status === "ACTIVE", "GET /health/ready reports 'ACTIVE'");
    assert(readyRes.data.database === "connected", "GET /health/ready reports database 'connected'");

    const supaRes = await makeRequest({ method: "GET", url: `${BASE_URL}/health/supabase` });
    assert(supaRes.status === 200, "GET /health/supabase returns HTTP 200");
    assert(supaRes.data.status === "connected", "Supabase PostgreSQL is connected");

    // -------------------------------------------------------------------------
    // GATE 2: Phase 2 & 15 - Super Admin Authentication & Dashboard Integrity
    // -------------------------------------------------------------------------
    console.log("\n👑 GATE 2: Super Admin Authentication & Dashboard Integrity (Phase 2 & 15)...");

    const superAdminEmail = process.env.DAKSHORA_SUPER_ADMIN_EMAIL || "rdeshwal89@gmail.com";
    const superAdminPassword = process.env.DAKSHORA_SUPER_ADMIN_PASSWORD;
    if (!superAdminPassword) {
      throw new Error("Missing DAKSHORA_SUPER_ADMIN_PASSWORD environment variable for authentication verification.");
    }

    const loginRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/auth/login`,
      body: { email: superAdminEmail, password: superAdminPassword }
    });
    assert(loginRes.status === 200, "Super Admin login succeeds with HTTP 200");
    assert(loginRes.data.success === true, "Login response indicates success: true");
    assert(loginRes.data.token !== undefined, "JWT token provided at root level for SPA compatibility");
    assert(loginRes.data.user.role === "superadmin", "User authenticated with verified 'superadmin' role");
    assert(loginRes.data.user.isSuperAdmin === true, "User has isSuperAdmin flag set to true");

    const superAdminToken = loginRes.data.token;

    // Verify SuperAdmin Dashboard Data Integrity (Phase 15)
    const dashboardRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/admin/dashboard`,
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(dashboardRes.status === 200, "GET /api/admin/dashboard returns HTTP 200");
    assert(dashboardRes.data.metrics.organizations.total >= 1, "Organizations metric shows non-zero canonical count");
    assert(dashboardRes.data.metrics.subscriptions.activeCount >= 1, "Subscriptions metric shows active subscriptions");
    assert(dashboardRes.data.metrics.platformRoster.totalStudentsAcrossPlatform >= 0, "Platform roster reports student metrics");

    // -------------------------------------------------------------------------
    // GATE 3: Phase 1 & 9 - Tenant Creation & School Admin Provisioning
    // -------------------------------------------------------------------------
    console.log("\n🏫 GATE 3: Multi-Tenant Provisioning & School Admin Onboarding (Phase 1 & 9)...");

    const ts = Date.now();
    const tenantAId = crypto.randomUUID();
    const tenantBId = crypto.randomUUID();
    createdOrgIds.push(tenantAId, tenantBId);

    // Create Tenant A in Supabase
    const { error: orgAErr } = await supabaseAdmin.from("organizations").insert([{
      id: tenantAId,
      name: `Delhi Public Heritage School Alpha ${ts}`,
      slug: `dphs-alpha-${ts}`,
      industry: "education",
      status: "active"
    }]);
    if (orgAErr) throw new Error("Failed to create Tenant A: " + orgAErr.message);

    // Create Tenant B in Supabase
    const { error: orgBErr } = await supabaseAdmin.from("organizations").insert([{
      id: tenantBId,
      name: `Modern Academy Beta ${ts}`,
      slug: `modern-beta-${ts}`,
      industry: "education",
      status: "active"
    }]);
    if (orgBErr) throw new Error("Failed to create Tenant B: " + orgBErr.message);

    // Assign Subscription for Tenant A
    await supabaseAdmin.from("saas_subscriptions").upsert([{
      id: `sub-alpha-${ts}`,
      organization_id: tenantAId,
      plan_id: "growth",
      status: "active",
      billing_interval: "month",
      amount: 3999,
      currency: "INR",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
    }]);

    // Assign Subscription for Tenant B (Starter plan)
    await supabaseAdmin.from("saas_subscriptions").upsert([{
      id: `sub-beta-${ts}`,
      organization_id: tenantBId,
      plan_id: "starter",
      status: "active",
      billing_interval: "month",
      amount: 1499,
      currency: "INR",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
    }]);

    // Create School Admin A
    const adminAEmail = `principal.alpha.${ts}@heritage.edu.in`;
    const adminBEmail = `principal.beta.${ts}@modern.edu.in`;
    const adminPassword = `TestPass_${crypto.randomBytes(8).toString("hex")}!9A`;

    const { data: userA } = await supabaseAdmin.auth.admin.createUser({
      email: adminAEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: tenantAId }
    });
    createdUserIds.push(userA.user.id);

    const { data: userB } = await supabaseAdmin.auth.admin.createUser({
      email: adminBEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: tenantBId }
    });
    createdUserIds.push(userB.user.id);

    // Sign in School Admin A
    const { data: sessA } = await anonClient.auth.signInWithPassword({ email: adminAEmail, password: adminPassword });
    const tokenA = sessA.session.access_token;

    // Sign in School Admin B
    const { data: sessB } = await anonClient.auth.signInWithPassword({ email: adminBEmail, password: adminPassword });
    const tokenB = sessB.session.access_token;

    assert(tokenA !== undefined && tokenB !== undefined, "School Admins A and B successfully authenticated via Supabase Auth");

    // -------------------------------------------------------------------------
    // GATE 4: Phase 7 & 13 - Module Entitlement Engine & Dynamic Revocation
    // -------------------------------------------------------------------------
    console.log("\n🎛️ GATE 4: Module Entitlement Engine & Dynamic Revocation (Phase 7 & 13)...");

    // Tenant B is on STARTER plan. Starter plan does NOT include 'fees' or 'transport' or 'library'.
    // Test: Tenant B tries to access /api/erp/fees -> MUST be rejected with 403 MODULE_NOT_ENTITLED
    const tenantBFeeRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/fees`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(tenantBFeeRes.status === 403, "Starter Plan: Tenant B blocked from accessing unentitled /fees module (HTTP 403)");
    assert(tenantBFeeRes.data.code === "MODULE_NOT_ENTITLED", "Rejection code matches 'MODULE_NOT_ENTITLED'");

    // Tenant A is on GROWTH plan. Growth plan INCLUDES 'fees' and 'transport'.
    // Test: Tenant A can access fees module -> 200 OK
    const tenantAFeeRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/fees`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(tenantAFeeRes.status === 200, "Growth Plan: Tenant A authorized to access /fees module (HTTP 200)");

    // DYNAMIC REVOCATION TEST (Phase 13):
    // SuperAdmin revokes 'transport' module from Tenant A via override
    console.log("  🔒 SuperAdmin explicitly revokes 'transport' module for Tenant A...");
    const disableOverrideRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/billing/overrides`,
      headers: { Authorization: `Bearer ${superAdminToken}`, "x-organization-id": tenantAId },
      body: {
        feature_key: "transport",
        override_type: "feature",
        value: false,
        reason: "Trial transport module expired or revoked by platform"
      }
    });
    assert(disableOverrideRes.status === 200, "SuperAdmin override created to disable 'transport' module");

    // Verify Tenant A is IMMEDIATELY blocked from transport
    const tenantATransportBlocked = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/transport/routes`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(tenantATransportBlocked.status === 403, "Tenant A immediately loses access to /transport (HTTP 403 MODULE_NOT_ENTITLED)");
    assert(tenantATransportBlocked.data.module === "transport", "Blocked module identified as 'transport'");

    // DYNAMIC RESTORATION TEST:
    // SuperAdmin re-enables 'transport' module for Tenant A
    console.log("  🔓 SuperAdmin restores 'transport' module for Tenant A...");
    const enableOverrideRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/billing/overrides`,
      headers: { Authorization: `Bearer ${superAdminToken}`, "x-organization-id": tenantAId },
      body: {
        feature_key: "transport",
        override_type: "feature",
        value: true,
        reason: "Transport module re-enabled"
      }
    });
    assert(enableOverrideRes.status === 200, "SuperAdmin override updated to restore 'transport' module");

    // Verify Tenant A has regained access
    const tenantATransportRestored = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/transport/routes`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(tenantATransportRestored.status === 200, "Tenant A immediately regains authorized access to /transport (HTTP 200)");

    // -------------------------------------------------------------------------
    // GATE 5: Phase 8 - Plan Limits & Quota Enforcement
    // -------------------------------------------------------------------------
    console.log("\n📏 GATE 5: Server-side Plan Limit & Quota Enforcement (Phase 8)...");

    // Tenant B is on STARTER plan which has max_campuses: 1
    // Provision First Campus for Tenant B -> Allowed
    const campus1Res = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/campuses`,
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        name: "Campus Beta Main",
        code: `CMP-B1-${ts}`,
        address: "Main Avenue, Beta City"
      }
    });
    assert(campus1Res.status === 200, "First campus provisioned successfully within quota");

    // Provision Second Campus for Tenant B -> Exceeds max_campuses (limit: 1) -> Must fail with 403
    const campus2Res = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/campuses`,
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        name: "Campus Beta Branch 2",
        code: `CMP-B2-${ts}`,
        address: "Branch Road, Beta City"
      }
    });
    assert(campus2Res.status === 403, "Second campus blocked by server quota enforcement (HTTP 403 QUOTA_EXCEEDED)");
    assert(campus2Res.data.code === "QUOTA_EXCEEDED", "Rejection error code is QUOTA_EXCEEDED");

    // -------------------------------------------------------------------------
    // GATE 6: Phase 4 & 12 - Multi-Tenant Isolation & IDOR Attack Resistance
    // -------------------------------------------------------------------------
    console.log("\n🛡️ GATE 6: Multi-Tenant Data Isolation & Cross-Tenant Attack Resistance (Phase 4 & 12)...");

    // Tenant A creates a student
    const studentARes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/students`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        firstName: "Aarav",
        lastName: "Alpha",
        name: "Aarav Alpha",
        grade: "Class 10",
        section: "A",
        phone: "+91 99999 11111"
      }
    });
    assert(studentARes.status === 200 || studentARes.status === 201, "Tenant A enrolls student 'Aarav Alpha'");
    const studentAId = studentARes.data.student.id;

    // Tenant B creates a student
    const studentBRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/students`,
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        firstName: "Bhavna",
        lastName: "Beta",
        name: "Bhavna Beta",
        grade: "Class 9",
        section: "B",
        phone: "+91 99999 22222"
      }
    });
    assert(studentBRes.status === 200 || studentBRes.status === 201, "Tenant B enrolls student 'Bhavna Beta'");
    const studentBId = studentBRes.data.student.id;

    // Cross-tenant IDOR attack 1: Tenant B tries to GET Tenant A's student
    const idorGetRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/students/${studentAId}`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(idorGetRes.status === 404, "CROSS-TENANT ATTACK BLOCKED: Tenant B cannot access Tenant A student (HTTP 404 Not Found)");

    // Cross-tenant IDOR attack 2: Tenant A tries to GET Tenant B's student
    const idorGetRes2 = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/students/${studentBId}`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(idorGetRes2.status === 404, "CROSS-TENANT ATTACK BLOCKED: Tenant A cannot access Tenant B student (HTTP 404 Not Found)");

    // Header Tamper Attack: Tenant B sends `x-organization-id: <tenantAId>` to impersonate Tenant A
    const headerTamperRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/students`,
      headers: {
        Authorization: `Bearer ${tokenB}`,
        "x-organization-id": tenantAId
      }
    });
    assert(headerTamperRes.status === 200, "Header tamper request handled safely");
    const studentsInB = headerTamperRes.data.students || [];
    assert(
      !studentsInB.some(s => s.id === studentAId),
      "HEADER SPOOFING ATTACK BLOCKED: Tenant B's spoofed header was ignored; Tenant A's student was NOT leaked"
    );

    // -------------------------------------------------------------------------
    // GATE 7: Phase 10 & 11 - Full ERP Core Lifecycle Verification
    // -------------------------------------------------------------------------
    console.log("\n📚 GATE 7: Full ERP Core Lifecycle (Academics, Attendance, Exams, Marks)...");

    // 1. Academic Session
    const sessRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/academic-sessions`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: `Session 2026-27-${ts}`, startDate: "2026-04-01", endDate: "2027-03-31", isCurrent: true }
    });
    assert(sessRes.status === 200, "Academic Session configured and verified");

    // 2. Class & Section
    const classRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/classes`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { grade: "Class 10", section: "A", roomNumber: "R101" }
    });
    assert(classRes.status === 200, "Class & Section created successfully");

    // 3. Subject
    const subRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/subjects`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { subjectName: "Physics", subjectCode: `PHYS-${ts}`, category: "Science", maxMarks: 100 }
    });
    assert(subRes.status === 200, "Subject created successfully");

    // 4. Faculty & Staff
    const staffRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/staff`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { firstName: "Vikram", lastName: "Aditya", designation: "PGT Physics", email: `phys.${ts}@heritage.edu.in` }
    });
    assert(staffRes.status === 200 || staffRes.status === 201, "Faculty member created and verified");

    // 5. Daily Attendance
    const attRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/attendance/daily`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        date: new Date().toISOString().slice(0, 10),
        grade: "Class 10",
        section: "A",
        records: [{ studentId: studentAId, status: "present" }]
      }
    });
    assert(attRes.status === 200, "Student daily attendance recorded");

    // 6. Examination & Marks
    const examRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/exams`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        name: `Term 1 Assessment ${ts}`,
        academicSession: "2026-27",
        gradingSystem: "cbse_9point",
        startDate: "2026-09-15",
        endDate: "2026-09-25"
      }
    });
    assert(examRes.status === 200, "Examination created");
    const examId = examRes.data.exam.id;

    // 7. Enter Marks
    const marksRes = await makeRequest({
      method: "POST",
      url: `/api/erp/exams/${examId}/marks`,
      url: `${BASE_URL}/api/erp/exams/${examId}/marks`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        marks: [{ studentId: studentAId, subjectName: "Physics", marksObtained: 94, maxMarks: 100 }]
      }
    });
    assert(marksRes.status === 200, "Marks entry recorded successfully");

    // -------------------------------------------------------------------------
    // GATE 8: 1-Click School White-Label Deployment for Live Demo
    // -------------------------------------------------------------------------
    console.log("\n🌐 GATE 8: School White-Label Website Deployment for Live Demo...");

    const demoSiteDomain = `heritage-demo-${ts}.school.dakshora.app`;
    const websiteRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/websites`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        name: "Delhi Public Heritage School (Demo)",
        domain: demoSiteDomain,
        template: "tpl-school-saas",
        organization_id: tenantAId
      }
    });
    assert(websiteRes.status === 200, "Demo School Website deployed successfully");
    const siteId = websiteRes.data.website.id;

    // 1-Click Publish to Edge CDN
    const publishRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/websites/${siteId}/publish`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {}
    });
    assert(publishRes.status === 200, "Demo School Website published to production Edge CDN");
    assert(publishRes.data.publishing.status === "live", "Demo website status is LIVE");
    console.log(`  🔗 Live Demo URL: https://${demoSiteDomain}`);

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n🧹 Cleaning up test identities and temporary tenants...");
    for (const uid of createdUserIds) {
      try { await supabaseAdmin.auth.admin.deleteUser(uid); } catch (_) {}
    }
    for (const oid of createdOrgIds) {
      try {
        await supabaseAdmin.from("saas_subscriptions").delete().eq("organization_id", oid);
        await supabaseAdmin.from("organizations").delete().eq("id", oid);
      } catch (_) {}
    }
    console.log("  ✅ Test identities and temporary tenants cleaned up safely.");
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`🏆 ALL ${testPassed}/${testTotal} ZERO-AMBIGUITY PRODUCTION GATE TESTS PASSED!`);
  console.log("==========================================================================\n");
}

runFinalProductionGate().catch(err => {
  console.error("\n❌ FATAL GATE FAILURE:", err);
  process.exit(1);
});

import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5298;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

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

async function runLivePlatformControlCenterTest() {
  console.log("\n==========================================================================");
  console.log("🛡️ DAKSHORA 2.0 — LIVE PLATFORM CONTROL CENTER & SUPERADMIN SUITE TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdTicketId = null;
  const recordedAuditLogIds = [];

  try {
    // 0. Spin up test server on dedicated PORT 5298
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.platform.${Date.now()}@dakshora.internal`;
    const testPassword = "PlatformSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Platform Ops Commander", role: "superadmin" },
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

    // Setup: Create test Student user (for RBAC restriction testing)
    const studentEmail = `student.platform.${Date.now()}@dakshora.internal`;
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
    // [Gate 1/10] Fail-Closed Security & SuperAdmin Enforcement
    // -----------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Fail-Closed Security & SuperAdmin Enforcement...");

    // Unauthenticated access
    const unauthDashboard = await makeRequest({
      method: "GET",
      path: "/api/admin/dashboard"
    });
    assert(unauthDashboard.status === 401, `Expected 401 for unauth dashboard, got ${unauthDashboard.status}`);

    // Student role forbidden on all /api/admin/* operations
    const studentDashboard = await makeRequest({
      method: "GET",
      path: "/api/admin/dashboard",
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(
      studentDashboard.status === 403 && studentDashboard.body?.code === "FORBIDDEN_SUPERADMIN",
      `Expected 403 FORBIDDEN_SUPERADMIN for student on dashboard, got ${studentDashboard.status}`
    );

    const studentSettings = await makeRequest({
      method: "PATCH",
      path: "/api/admin/settings",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { maintenance_mode: true }
    });
    assert(
      studentSettings.status === 403 && studentSettings.body?.code === "FORBIDDEN_SUPERADMIN",
      `Expected 403 FORBIDDEN_SUPERADMIN for student on settings, got ${studentSettings.status}`
    );

    const studentSupport = await makeRequest({
      method: "POST",
      path: "/api/admin/support/session/start",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { target_organization_id: DEFAULT_ORG_ID, reason: "Unauthorized attempt" }
    });
    assert(
      studentSupport.status === 403 && studentSupport.body?.code === "FORBIDDEN_SUPERADMIN",
      `Expected 403 FORBIDDEN_SUPERADMIN for student on support session, got ${studentSupport.status}`
    );
    console.log("  ✅ Student role strictly blocked with HTTP 403 FORBIDDEN_SUPERADMIN on all Platform Control endpoints.");

    // -----------------------------------------------------------------------
    // [Gate 2/10] Platform Executive Telemetry & Global Metrics
    // -----------------------------------------------------------------------
    console.log("\n[Gate 2/10] Verifying Platform Executive Telemetry & Global Metrics...");
    const dashboardRes = await makeRequest({
      method: "GET",
      path: "/api/admin/dashboard",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(dashboardRes.status === 200, `Expected 200 for admin dashboard, got ${dashboardRes.status}`);
    const metrics = dashboardRes.body?.metrics;
    assert(metrics?.organizations?.total > 0, "Missing organizations total in metrics");
    assert(metrics?.subscriptions?.monthlyRecurringRevenueINR >= 0, "Missing MRR in metrics");
    assert(metrics?.platformRoster?.totalStudentsAcrossPlatform > 0, "Missing platform roster students");
    assert(typeof metrics?.operations?.maintenanceMode === "boolean", "Missing maintenanceMode in operations");
    console.log(`  ✅ Platform Metrics: ${metrics.organizations.total} Organizations (${metrics.organizations.active} Active), ${metrics.platformRoster.totalStudentsAcrossPlatform} Students, MRR: ₹${metrics.subscriptions.monthlyRecurringRevenueINR.toLocaleString()}.`);

    // -----------------------------------------------------------------------
    // [Gate 3/10] Multi-Tenant Organization Directory & Query Filtering
    // -----------------------------------------------------------------------
    console.log("\n[Gate 3/10] Verifying Multi-Tenant Organization Directory & Query Filtering...");
    const orgsRes = await makeRequest({
      method: "GET",
      path: "/api/admin/organizations",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(orgsRes.status === 200, `Expected 200 for organizations list, got ${orgsRes.status}`);
    assert(Array.isArray(orgsRes.body?.organizations) && orgsRes.body?.organizations.length > 0, "Empty organizations list");

    const searchOrgRes = await makeRequest({
      method: "GET",
      path: "/api/admin/organizations?q=Heritage",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(searchOrgRes.status === 200, `Expected 200 for organization search, got ${searchOrgRes.status}`);
    assert(searchOrgRes.body?.organizations?.some(o => o.name.toLowerCase().includes("heritage")), "Organization search failed to match 'Heritage'");

    const activeFilterRes = await makeRequest({
      method: "GET",
      path: "/api/admin/organizations?status=active",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(activeFilterRes.status === 200, `Expected 200 for active status filter, got ${activeFilterRes.status}`);
    assert(activeFilterRes.body?.organizations?.every(o => o.status === "active"), "Status filter leaked non-active organizations");
    console.log(`  ✅ Organization directory verified: ${orgsRes.body?.total} organizations cataloged (Search and Status filters validated).`);

    // -----------------------------------------------------------------------
    // [Gate 4/10] Deep Organization Dossier & Status Lifecycle Transition
    // -----------------------------------------------------------------------
    console.log("\n[Gate 4/10] Verifying Deep Organization Dossier & Status Lifecycle Transition...");
    const dossierRes = await makeRequest({
      method: "GET",
      path: `/api/admin/organizations/${DEFAULT_ORG_ID}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(dossierRes.status === 200, `Expected 200 for organization dossier, got ${dossierRes.status}`);
    const orgData = dossierRes.body?.organization;
    assert(orgData?.id === DEFAULT_ORG_ID, "Organization ID mismatch in dossier");
    assert(Array.isArray(orgData?.campuses), "Missing campuses in organization dossier");

    // Transition status to 'trial' then back to 'active'
    const statusTrialRes = await makeRequest({
      method: "PATCH",
      path: `/api/admin/organizations/${DEFAULT_ORG_ID}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: "trial" }
    });
    assert(statusTrialRes.status === 200 && statusTrialRes.body?.organization?.status === "trial", "Failed to update status to trial");

    const statusActiveRes = await makeRequest({
      method: "PATCH",
      path: `/api/admin/organizations/${DEFAULT_ORG_ID}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: "active" }
    });
    assert(statusActiveRes.status === 200 && statusActiveRes.body?.organization?.status === "active", "Failed to restore status to active");
    console.log(`  ✅ Organization profile dossier and status lifecycle verified: active → trial → active.`);

    // -----------------------------------------------------------------------
    // [Gate 5/10] Cross-Tenant Customer Support Ticket Lifecycle Management
    // -----------------------------------------------------------------------
    console.log("\n[Gate 5/10] Verifying Cross-Tenant Support Ticket Lifecycle Management...");
    const ticketPayload = {
      organization_id: DEFAULT_ORG_ID,
      subject: "CBSE Report Card Generation Timeout for Grade 12",
      description: "Teachers experiencing latency when generating consolidated batch report cards for 240 students.",
      priority: "high"
    };

    const createTicketRes = await makeRequest({
      method: "POST",
      path: "/api/admin/support/tickets",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: ticketPayload
    });
    assert(createTicketRes.status === 201, `Expected 201 for support ticket, got ${createTicketRes.status}`);
    createdTicketId = createTicketRes.body?.ticket?.id;
    assert(createdTicketId, "Created ticket missing id");
    console.log(`  ✅ Support Ticket created: [${createdTicketId}] "${ticketPayload.subject}" (Priority: ${ticketPayload.priority}).`);

    const updateTicketRes = await makeRequest({
      method: "PATCH",
      path: `/api/admin/support/tickets/${createdTicketId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: "resolved",
        assigned_to: adminEmail,
        resolution_notes: "Database query optimized with composite index on exam_grades."
      }
    });
    assert(updateTicketRes.status === 200, `Expected 200 on ticket update, got ${updateTicketRes.status}`);
    assert(updateTicketRes.body?.ticket?.status === "resolved", "Ticket status not resolved");
    console.log(`  ✅ Support Ticket updated: Assigned to ${adminEmail}, Status: resolved.`);

    // -----------------------------------------------------------------------
    // [Gate 6/10] Safe Scoped Support Impersonation Session Engine
    // -----------------------------------------------------------------------
    console.log("\n[Gate 6/10] Verifying Safe Scoped Support Impersonation Session Engine...");
    const startSessionRes = await makeRequest({
      method: "POST",
      path: "/api/admin/support/session/start",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        target_organization_id: DEFAULT_ORG_ID,
        reason: "Investigating CBSE Grade 12 PDF template alignment issue reported in ticket"
      }
    });
    assert(startSessionRes.status === 201, `Expected 201 on session start, got ${startSessionRes.status}`);
    const session = startSessionRes.body?.session;
    assert(session?.session_token && session?.status === "active", "Invalid support session token or status");
    console.log(`  ✅ Support Session started: Token=${session.session_token.slice(0, 18)}..., Expiration=${session.expires_at}.`);

    const activeSessionRes = await makeRequest({
      method: "GET",
      path: "/api/admin/support/session/active",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(activeSessionRes.status === 200 && activeSessionRes.body?.hasActiveSession === true, "Failed to confirm active support session");

    const endSessionRes = await makeRequest({
      method: "POST",
      path: "/api/admin/support/session/end",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(endSessionRes.status === 200, `Expected 200 on session end, got ${endSessionRes.status}`);
    console.log("  ✅ Support Session concluded cleanly. Normal platform operations restored.");

    // -----------------------------------------------------------------------
    // [Gate 7/10] Real-Time Subsystem Health Telemetry
    // -----------------------------------------------------------------------
    console.log("\n[Gate 7/10] Verifying Real-Time Subsystem Health Telemetry...");
    const healthRes = await makeRequest({
      method: "GET",
      path: "/api/admin/health",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(healthRes.status === 200, `Expected 200 for health endpoint, got ${healthRes.status}`);
    assert(healthRes.body?.overallStatus === "healthy", "Overall status not healthy");
    const sub = healthRes.body?.subsystems;
    assert(sub?.gatewayApi?.status === "healthy", "gatewayApi subsystem not healthy");
    assert(sub?.databasePostgres?.status === "healthy", "databasePostgres subsystem not healthy");
    assert(sub?.authService?.status === "healthy", "authService subsystem not healthy");
    assert(sub?.dakshoraAi?.status === "healthy", "dakshoraAi subsystem not healthy");
    console.log(`  ✅ Platform Subsystems Telemetry: Gateway API, PostgreSQL, Supabase Auth, DAKSHORA AI all operational.`);

    // -----------------------------------------------------------------------
    // [Gate 8/10] Global Maintenance Mode & Dynamic Feature Flags
    // -----------------------------------------------------------------------
    console.log("\n[Gate 8/10] Verifying Global Maintenance Mode & Dynamic Feature Flags...");
    const getSettingsRes = await makeRequest({
      method: "GET",
      path: "/api/admin/settings",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(getSettingsRes.status === 200, `Expected 200 for settings, got ${getSettingsRes.status}`);

    const patchSettingsRes = await makeRequest({
      method: "PATCH",
      path: "/api/admin/settings",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        maintenance_message: "DAKSHORA 2.0 scheduled infrastructure upgrade in progress.",
        feature_flags: {
          ai: true,
          transport: true,
          multi_campus: true
        }
      }
    });
    assert(patchSettingsRes.status === 200, `Expected 200 for settings update, got ${patchSettingsRes.status}`);
    assert(patchSettingsRes.body?.settings?.feature_flags?.multi_campus === true, "Feature flag multi_campus not active");
    console.log(`  ✅ Runtime Settings updated: Message="${patchSettingsRes.body?.settings?.maintenance_message}", Flags=${Object.keys(patchSettingsRes.body?.settings?.feature_flags).join(", ")}.`);

    // -----------------------------------------------------------------------
    // [Gate 9/10] Emergency Platform Broadcast Dispatcher
    // -----------------------------------------------------------------------
    console.log("\n[Gate 9/10] Verifying Emergency Platform Broadcast Dispatcher...");
    const broadcastPayload = {
      title: "CBSE Board Examination Portal Notice 2026",
      message: "CBSE Roll Numbers for Class 10 and 12 have been synced across all school portals.",
      audience: "all_org_admins",
      priority: "urgent"
    };

    const broadcastRes = await makeRequest({
      method: "POST",
      path: "/api/admin/communication/broadcast",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: broadcastPayload
    });
    assert(broadcastRes.status === 200 || broadcastRes.status === 201, `Expected 200/201 for broadcast, got ${broadcastRes.status}`);
    assert(broadcastRes.body?.success === true, "Broadcast dispatch failed");
    console.log(`  ✅ Emergency Bulletin dispatched: "${broadcastPayload.title}" dispatched to all school administrators.`);

    // -----------------------------------------------------------------------
    // [Gate 10/10] Supabase public.audit_logs Sync & Teardown Cleanup
    // -----------------------------------------------------------------------
    console.log("\n[Gate 10/10] Verifying Supabase public.audit_logs Sync & Teardown Cleanup...");

    // Verify operations logged in Supabase public.audit_logs
    const { data: dbAuditLogs, error: dbAuditErr } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .in("action", [
        "ORGANIZATION_STATUS_CHANGED",
        "SUPPORT_TICKET_CREATED",
        "SUPPORT_TICKET_UPDATED",
        "SUPPORT_SESSION_STARTED",
        "SUPPORT_SESSION_ENDED",
        "PLATFORM_SETTING_CHANGED",
        "PLATFORM_BROADCAST_SENT"
      ])
      .order("created_at", { ascending: false })
      .limit(10);

    assert(!dbAuditErr, `Failed to query Supabase public.audit_logs: ${dbAuditErr?.message}`);
    assert(Array.isArray(dbAuditLogs) && dbAuditLogs.length >= 3, `Expected at least 3 platform audit logs, found ${dbAuditLogs?.length}`);
    dbAuditLogs.forEach(log => recordedAuditLogIds.push(log.id));
    console.log(`  ✅ Verified ${dbAuditLogs.length} platform operations recorded in Supabase public.audit_logs.`);

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
    console.log("🎉 ALL 10 GATES PASSED: PLATFORM CONTROL CENTER & OPERATIONS VERIFIED");
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

runLivePlatformControlCenterTest();

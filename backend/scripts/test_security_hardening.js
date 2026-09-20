import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildApp } from "../src/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSecurityTests() {
  console.log("==========================================================================");
  console.log("🛡️ DAKSHORA 2.0 — COMPREHENSIVE PRODUCTION SECURITY HARDENING TEST SUITE");
  console.log("==========================================================================\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("❌ Missing Supabase configuration in .env");
    process.exit(1);
  }

  // 1. Build and start local server on random port for testing
  const app = await buildApp();
  const PORT = 5099;
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Fastify + Express Gateway listening on http://127.0.0.1:${PORT}\n`);

  const BASE_URL = `http://127.0.0.1:${PORT}`;

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (details) console.error(`     Details: ${details}`);
      failed++;
    }
  }

  // =========================================================================
  // TEST GROUP 1: UN-AUTHENTICATED ACCESS (Expected 401)
  // =========================================================================
  console.log("--- TEST GROUP 1: Unauthenticated Administrative Access ---");

  const unauthEndpoints = [
    { method: "GET", path: "/api/admin/dashboard" },
    { method: "GET", path: "/api/admin/organizations" },
    { method: "GET", path: "/api/admin/users" },
    { method: "GET", path: "/api/auth/users" },
    { method: "DELETE", path: "/api/auth/users/test-user-id" },
    { method: "GET", path: "/api/organizations" },
    { method: "POST", path: "/api/organizations" }
  ];

  for (const ep of unauthEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.path}`, {
      method: ep.method,
      headers: { "Content-Type": "application/json" },
      body: ep.method === "POST" ? JSON.stringify({ name: "Test Org", slug: "test-org" }) : undefined
    });
    assert(
      `No Token: ${ep.method} ${ep.path} -> 401 Unauthorized`,
      res.status === 401,
      `Received HTTP ${res.status}`
    );
  }

  // =========================================================================
  // TEST GROUP 2: FORGED / UNSIGNED JWT (Expected 401)
  // =========================================================================
  console.log("\n--- TEST GROUP 2: Forged & Unsigned JWT Rejection ---");

  // Create forged header.payload claiming superadmin
  const forgedPayload = Buffer.from(JSON.stringify({
    sub: "fake-admin-uuid",
    email: "admin@dakshora.ai",
    role: "superadmin",
    app_metadata: { role: "superadmin" },
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString("base64");
  const forgedToken = `eyJhbGciOiJub25lIn0.${forgedPayload}.invalidsignature`;

  const forgedRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${forgedToken}` }
  });
  assert(
    "Forged JWT to /api/admin/dashboard -> 401 Unauthorized",
    forgedRes.status === 401,
    `Received HTTP ${forgedRes.status}`
  );

  const forgedOrgRes = await fetch(`${BASE_URL}/api/organizations`, {
    headers: { Authorization: `Bearer ${forgedToken}` }
  });
  assert(
    "Forged JWT to /api/organizations -> 401 Unauthorized",
    forgedOrgRes.status === 401,
    `Received HTTP ${forgedOrgRes.status}`
  );

  // =========================================================================
  // TEST GROUP 3: HEADER SPOOFING & DEV BYPASS (Expected 401)
  // =========================================================================
  console.log("\n--- TEST GROUP 3: Header Spoofing & Development Bypass Removal ---");

  const spoofHeaders = [
    { "x-role": "superadmin" },
    { "x-platform-role": "superadmin" },
    { "x-user-email": "admin@dakshora.ai" },
    { "x-role": "superadmin", "x-user-email": "admin@dakshora.ai" }
  ];

  for (let i = 0; i < spoofHeaders.length; i++) {
    const headers = spoofHeaders[i];
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers });
    assert(
      `Spoofed Headers ${JSON.stringify(headers)} -> 401 Unauthorized`,
      res.status === 401,
      `Received HTTP ${res.status}`
    );
  }

  // =========================================================================
  // TEST GROUP 4: SCHOOL ADMIN PRIVILEGE ESCALATION (Expected 403)
  // =========================================================================
  console.log("\n--- TEST GROUP 4: Privilege Escalation Prevention (School Admin -> SuperAdmin) ---");

  const supabaseClient = createClient(supabaseUrl, anonKey);
  const { data: schoolAdminAuth, error: schoolAdminError } = await supabaseClient.auth.signInWithPassword({
    email: "principal@dpsheritage.in",
    password: "Password123!" // If not matching, we'll generate or test with service token
  });

  let schoolAdminToken = schoolAdminAuth?.session?.access_token;
  if (!schoolAdminToken) {
    // Generate a valid Supabase token for school-admin using admin API
    const adminSupabase = createClient(supabaseUrl, serviceKey);
    const { data: schoolAdminUser } = await adminSupabase.auth.admin.listUsers();
    const principal = schoolAdminUser?.users?.find(u => u.email === "principal@dpsheritage.in");
    if (principal) {
      // Create session via link or password update
      await adminSupabase.auth.admin.updateUserById(principal.id, {
        password: "TestPassword2026!",
        app_metadata: { role: "school-admin", organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e" }
      });
      const { data: newAuth } = await supabaseClient.auth.signInWithPassword({
        email: "principal@dpsheritage.in",
        password: "TestPassword2026!"
      });
      schoolAdminToken = newAuth?.session?.access_token;
    }
  }

  if (schoolAdminToken) {
    const privEscRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    assert(
      "School Admin Token to /api/admin/dashboard -> 403 Forbidden",
      privEscRes.status === 403,
      `Received HTTP ${privEscRes.status}`
    );

    const privEscUsersRes = await fetch(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    assert(
      "School Admin Token to /api/auth/users -> 403 Forbidden",
      privEscUsersRes.status === 403,
      `Received HTTP ${privEscUsersRes.status}`
    );

    const privEscOrgPost = await fetch(`${BASE_URL}/api/organizations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${schoolAdminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Rogue Org", slug: "rogue-org" })
    });
    assert(
      "School Admin Token to POST /api/organizations -> 403 Forbidden",
      privEscOrgPost.status === 403,
      `Received HTTP ${privEscOrgPost.status}`
    );
  } else {
    console.warn("  ⚠️ SKIPPED: Could not obtain school-admin token for live test");
  }

  // =========================================================================
  // TEST GROUP 5: LEGITIMATE SUPERADMIN ACCESS (Expected 200)
  // =========================================================================
  console.log("\n--- TEST GROUP 5: Legitimate SuperAdmin Operational Access ---");

  const adminSupabase = createClient(supabaseUrl, serviceKey);
  // Ensure SuperAdmin password is set for test
  const { data: usersList } = await adminSupabase.auth.admin.listUsers();
  const superAdminUser = usersList?.users?.find(u => u.email === "admin@dakshora.ai");
  let superAdminToken = null;

  if (superAdminUser) {
    await adminSupabase.auth.admin.updateUserById(superAdminUser.id, {
      password: "TestSuperAdmin2026!",
      app_metadata: { role: "superadmin" }
    });
    const { data: adminLogin } = await supabaseClient.auth.signInWithPassword({
      email: "admin@dakshora.ai",
      password: "TestSuperAdmin2026!"
    });
    superAdminToken = adminLogin?.session?.access_token;
  }

  if (superAdminToken) {
    const adminDashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const dashJson = await adminDashRes.json();
    assert(
      "Verified SuperAdmin Token to /api/admin/dashboard -> 200 OK",
      adminDashRes.status === 200 && dashJson.success === true,
      `Status: ${adminDashRes.status}, Body: ${JSON.stringify(dashJson)}`
    );

    const adminOrgsRes = await fetch(`${BASE_URL}/api/organizations`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const orgsJson = await adminOrgsRes.json();
    assert(
      "Verified SuperAdmin Token to /api/organizations -> 200 OK",
      adminOrgsRes.status === 200 && Array.isArray(orgsJson.organizations),
      `Status: ${adminOrgsRes.status}, Organizations count: ${orgsJson.organizations?.length}`
    );
  } else {
    console.warn("  ⚠️ SKIPPED: Could not obtain SuperAdmin token for live test");
  }

  // =========================================================================
  // TEST GROUP 6: FRONTEND BUNDLE CREDENTIAL & BYPASS AUDIT
  // =========================================================================
  console.log("\n--- TEST GROUP 6: Frontend Distribution Bundle Secrets & Bypass Audit ---");

  const portalJsPath = path.resolve(__dirname, "../../frontend/public/portal/assets");
  const files = fs.readdirSync(portalJsPath).filter(f => f.endsWith(".js"));
  const latestBundle = files.sort((a, b) => {
    return fs.statSync(path.join(portalJsPath, b)).mtimeMs - fs.statSync(path.join(portalJsPath, a)).mtimeMs;
  })[0];

  const bundleContent = fs.readFileSync(path.join(portalJsPath, latestBundle), "utf8");

  assert(
    "Frontend bundle contains NO hardcoded password 'DakshoraAdmin@2026!'",
    !bundleContent.includes("DakshoraAdmin@2026!"),
    "Hardcoded password found in bundle"
  );

  assert(
    "Frontend bundle contains NO devOtp auto-fill",
    !bundleContent.includes("devOtp"),
    "devOtp leak found in bundle"
  );

  console.log("\n==========================================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================================\n");

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});

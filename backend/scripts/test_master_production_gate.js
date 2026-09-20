import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildApp } from "../src/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMasterProductionGate() {
  console.log("==========================================================================");
  console.log("🛡️ DAKSHORA 2.0 — MASTER PRODUCTION AUDIT & SECURITY GATE TEST SUITE");
  console.log("==========================================================================\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("❌ Missing Supabase configuration in .env");
    process.exit(1);
  }

  // 1. Build and start local server on port 5199 for testing
  const app = await buildApp();
  const PORT = 5199;
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Fastify + Express Gateway listening on http://127.0.0.1:${PORT}\n`);

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  function makeRequest({ method, path, headers = {}, body = null }) {
    return new Promise((resolve) => {
      const options = {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: data });
        });
      });

      req.on("error", (err) => {
        resolve({ status: 500, error: err.message });
      });

      if (body) {
        req.write(typeof body === "string" ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // --------------------------------------------------------------------------
    // TEST GROUP 1: Unauthenticated ERP & Admin Route Gating (Fail-Closed)
    // --------------------------------------------------------------------------
    console.log("--- TEST GROUP 1: Unauthenticated Route Gating (Fail-Closed) ---");

    const erpRoutesToTest = [
      { path: "/api/erp/students", method: "GET" },
      { path: "/api/erp/staff", method: "GET" },
      { path: "/api/erp/attendance/student/daily", method: "GET" },
      { path: "/api/erp/fees/overview", method: "GET" },
      { path: "/api/erp/exams/overview", method: "GET" },
      { path: "/api/erp/timetable/overview", method: "GET" },
      { path: "/api/erp/library/overview", method: "GET" },
      { path: "/api/erp/onboarding/status", method: "GET" },
      { path: "/api/erp/onboarding/checklist", method: "GET" },
      { path: "/api/leads", method: "GET" },
      { path: "/api/websites", method: "GET" },
      { path: "/api/admin/dashboard", method: "GET" },
      { path: "/api/admin/organizations", method: "GET" },
      { path: "/api/admin/users", method: "GET" },
      { path: "/api/auth/users", method: "GET" },
      { path: "/api/organizations", method: "GET" },
      { path: "/api/me", method: "GET" }
    ];

    for (const r of erpRoutesToTest) {
      const res = await makeRequest({ method: r.method, path: r.path });
      assert(res.status === 401, `No Token: ${r.method} ${r.path} -> ${res.status} (Expected 401)`);
    }

    // --------------------------------------------------------------------------
    // TEST GROUP 2: Public Endpoints (Whitelisted & Available)
    // --------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Public Endpoints Whitelist ---");

    const healthRes = await makeRequest({ method: "GET", path: "/health" });
    assert(healthRes.status === 200, `GET /health -> ${healthRes.status} (Expected 200)`);

    const leadCaptureRes = await makeRequest({
      method: "POST",
      path: "/api/erp/admissions/leads/capture",
      body: {
        name: "Test Lead Student",
        email: "test.lead@dakshora.in",
        phone: "+919876543210"
      }
    });
    assert(leadCaptureRes.status === 200, `POST /api/erp/admissions/leads/capture -> ${leadCaptureRes.status} (Expected 200)`);

    // --------------------------------------------------------------------------
    // TEST GROUP 3: Forged & Unsigned JWT Rejection
    // --------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Forged & Unsigned JWT Rejection ---");

    const forgedPayload = Buffer.from(JSON.stringify({
      sub: "forged-superadmin-id",
      email: "fake.admin@attacker.com",
      role: "authenticated",
      app_metadata: { role: "superadmin" },
      user_metadata: { role: "superadmin" },
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString("base64url");
    const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${forgedPayload}.invalid_signature_hash`;

    const forgedRes1 = await makeRequest({
      method: "GET",
      path: "/api/erp/students",
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    assert(forgedRes1.status === 401, `Forged JWT to /api/erp/students -> ${forgedRes1.status} (Expected 401)`);

    const forgedRes2 = await makeRequest({
      method: "GET",
      path: "/api/admin/dashboard",
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    assert(forgedRes2.status === 401, `Forged JWT to /api/admin/dashboard -> ${forgedRes2.status} (Expected 401)`);

    // --------------------------------------------------------------------------
    // TEST GROUP 4: Header Spoofing & Bypass Removal
    // --------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Header Spoofing & Bypass Removal ---");

    const spoofChecks = [
      { "x-role": "superadmin" },
      { "x-role": "admin" },
      { "x-platform-role": "superadmin" },
      { "x-user-email": "admin@dakshora.ai" },
      { "x-bypass-ratelimit": "true" }
    ];

    for (const h of spoofChecks) {
      const res = await makeRequest({
        method: "GET",
        path: "/api/erp/onboarding/status",
        headers: h
      });
      assert(res.status === 401, `Spoofed Headers ${JSON.stringify(h)} to /api/erp/onboarding/status -> ${res.status} (Expected 401)`);
    }

    // --------------------------------------------------------------------------
    // TEST GROUP 5: RBAC & Multi-Tenant Privilege Isolation
    // --------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Privilege Escalation Prevention (School Admin -> SuperAdmin) ---");

    // Provision a clean temporary school-admin user
    const testSchoolAdminEmail = `test.schooladmin.${Date.now()}@dakshora.internal`;
    const testPassword = "TempPassword123!Secure";

    const { data: schoolAdminUser, error: createSchoolAdminErr } = await supabaseAdmin.auth.admin.createUser({
      email: testSchoolAdminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e" }
    });

    if (createSchoolAdminErr) {
      console.error("Failed to create test school admin:", createSchoolAdminErr);
    } else {
      const { data: signInAdmin } = await supabaseAdmin.auth.signInWithPassword({
        email: testSchoolAdminEmail,
        password: testPassword
      });

      const schoolAdminToken = signInAdmin.session?.access_token;

      // School Admin CAN access ERP
      const erpAccessRes = await makeRequest({
        method: "GET",
        path: "/api/erp/students",
        headers: { Authorization: `Bearer ${schoolAdminToken}` }
      });
      assert(erpAccessRes.status === 200, `School Admin Token to /api/erp/students -> ${erpAccessRes.status} (Expected 200)`);

      // School Admin CANNOT access SuperAdmin endpoints (Must be 403)
      const adminDashRes = await makeRequest({
        method: "GET",
        path: "/api/admin/dashboard",
        headers: { Authorization: `Bearer ${schoolAdminToken}` }
      });
      assert(adminDashRes.status === 403, `School Admin Token to /api/admin/dashboard -> ${adminDashRes.status} (Expected 403)`);

      const adminUsersRes = await makeRequest({
        method: "GET",
        path: "/api/admin/users",
        headers: { Authorization: `Bearer ${schoolAdminToken}` }
      });
      assert(adminUsersRes.status === 403, `School Admin Token to /api/admin/users -> ${adminUsersRes.status} (Expected 403)`);

      // Cleanup test user
      await supabaseAdmin.auth.admin.deleteUser(schoolAdminUser.user.id);
    }

    // --------------------------------------------------------------------------
    // TEST GROUP 6: Legitimate SuperAdmin Operational Access
    // --------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: Legitimate SuperAdmin Operational Access ---");

    const testSuperAdminEmail = `test.superadmin.${Date.now()}@dakshora.internal`;
    const { data: superAdminUser, error: createSuperAdminErr } = await supabaseAdmin.auth.admin.createUser({
      email: testSuperAdminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });

    if (createSuperAdminErr) {
      console.error("Failed to create test superadmin:", createSuperAdminErr);
    } else {
      const { data: signInSuper } = await supabaseAdmin.auth.signInWithPassword({
        email: testSuperAdminEmail,
        password: testPassword
      });

      const superAdminToken = signInSuper.session?.access_token;

      const superDashRes = await makeRequest({
        method: "GET",
        path: "/api/admin/dashboard",
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      assert(superDashRes.status === 200, `Verified SuperAdmin Token to /api/admin/dashboard -> ${superDashRes.status} (Expected 200)`);

      const superErpRes = await makeRequest({
        method: "GET",
        path: "/api/erp/onboarding/status",
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      assert(superErpRes.status === 200, `Verified SuperAdmin Token to /api/erp/onboarding/status -> ${superErpRes.status} (Expected 200)`);

      // Cleanup test user
      await supabaseAdmin.auth.admin.deleteUser(superAdminUser.user.id);
    }

    // --------------------------------------------------------------------------
    // TEST GROUP 7: Frontend Bundle Secrets & Leak Audit
    // --------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 7: Frontend Distribution Bundle Secrets Audit ---");

    const frontendAssetDir = path.join(__dirname, "../../frontend/public/assets");
    if (fs.existsSync(frontendAssetDir)) {
      const files = fs.readdirSync(frontendAssetDir);
      let foundSecret = false;
      for (const file of files) {
        if (file.endsWith(".js")) {
          const content = fs.readFileSync(path.join(frontendAssetDir, file), "utf8");
          if (content.includes("DakshoraAdmin@2026!")) {
            foundSecret = true;
          }
        }
      }
      assert(!foundSecret, "Frontend bundle contains NO hardcoded password 'DakshoraAdmin@2026!'");
    }

  } finally {
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`📊 MASTER TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("==========================================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runMasterProductionGate();

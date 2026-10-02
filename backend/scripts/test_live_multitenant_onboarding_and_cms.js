import "dotenv/config";
import http from "http";
import { buildApp } from "../src/app.js";

async function testSuite() {
  console.log("==========================================================================");
  console.log("🧪 DAKSHORA 2.0: MULTI-TENANT ONBOARDING, CMS & TELEMETRY TEST SUITE");
  console.log("==========================================================================\n");

  const app = await buildApp();
  const PORT = 5399;
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Fastify + Express Gateway active on http://127.0.0.1:${PORT}\n`);

  let passCount = 0;
  let failCount = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ""}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
      failCount++;
    }
  }

  function req({ method = "GET", path, headers = {}, body = null }) {
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

      const request = http.request(options, (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: raw });
        });
      });

      request.on("error", (err) => resolve({ status: 500, error: err.message }));
      if (body) request.write(typeof body === "string" ? body : JSON.stringify(body));
      request.end();
    });
  }

  try {
    // 1. Gateway Health
    console.log("1. Checking Gateway Health...");
    const health = await req({ path: "/health" });
    assert(health.status === 200 && health.body?.success === true, "Fastify Gateway is Healthy");

    // 2. Real-Time Telemetry & Control Center
    console.log("\n2. Testing Real-Time Platform Control Center Telemetry...");
    const dash = await req({
      path: "/api/admin/dashboard",
      headers: {
        "x-platform-role": "superadmin",
        "x-role": "superadmin",
        "x-user-email": "superadmin@dakshora.ai"
      }
    });
    assert(dash.status === 200, "Dashboard HTTP Status 200");
    assert(dash.body?.success === true, "Dashboard Success Flag true");
    assert(typeof dash.body?.metrics?.organizations?.total === "number", "Customer Tenants Dynamic Count", `Total: ${dash.body?.metrics?.organizations?.total}`);
    assert(typeof dash.body?.metrics?.subscriptions?.monthlyRecurringRevenueINR === "number", "MRR Dynamic Calculation", `₹${dash.body?.metrics?.subscriptions?.monthlyRecurringRevenueINR}`);
    assert(typeof dash.body?.metrics?.platformRoster?.totalStudentsAcrossPlatform === "number", "Cross-Tenant Roster Count", `Students: ${dash.body?.metrics?.platformRoster?.totalStudentsAcrossPlatform}`);

    // 3. Dynamic Organization Onboarding (Tagore Public Senior Secondary Academy)
    console.log("\n3. Testing Dynamic Organization Onboarding (Tagore Public Senior Secondary Academy)...");
    const testSchoolPayload = {
      schoolName: "Tagore Public Senior Secondary Academy",
      principalName: "Dr. Rajesh Sharma",
      email: "dakshora.ai@gmail.com",
      phone: "8947838668",
      board: "CBSE / RBSE Rajasthan",
      city: "Jaipur, Rajasthan",
      plan: "growth",
      notes: "Requested Dakshora ERP with 30-Sec Attendance & CBSE 2026 Question Paper Generator."
    };

    const onboard = await req({
      method: "POST",
      path: "/api/admin/onboard-school",
      headers: {
        "x-platform-role": "superadmin",
        "x-role": "superadmin",
        "x-user-email": "superadmin@dakshora.ai"
      },
      body: testSchoolPayload
    });

    assert(onboard.status === 200, "Onboarding HTTP Status 200");
    assert(onboard.body?.success === true, "Onboarding Success Flag true");
    assert(!!onboard.body?.tenantId, "Tenant UUID Generated", onboard.body?.tenantId);
    assert(!!onboard.body?.credentials?.initialPassword, "Principal Credentials Provisioned", `Password: ${onboard.body?.credentials?.initialPassword}`);
    assert(!!onboard.body?.website?.domain, "CMS School Portal Bound", onboard.body?.website?.domain);
    assert(onboard.body?.erpBootstrapped === true, "ERP Foundations Bootstrapped");

    const tenantId = onboard.body?.tenantId;
    const orgSlug = onboard.body?.organization?.slug;

    // 4. Dynamic CMS Endpoints
    console.log("\n4. Testing CMS Module Endpoints & Dynamic Resolver...");
    const cmsPages = await req({ path: `/api/cms/pages?organization_id=${tenantId}` });
    assert(cmsPages.status === 200 && cmsPages.body?.success === true, "GET /api/cms/pages works", `Pages: ${cmsPages.body?.pages?.length}`);

    // Public CMS Resolver for School Slug
    const publicCms = await req({ path: `/api/public/schools/${orgSlug}/cms` });
    assert(publicCms.status === 200 && publicCms.body?.success === true, "GET /api/public/schools/:slug/cms works", `Resolved School: ${publicCms.body?.school?.name}`);

    // 5. ERP Student Directory
    console.log("\n5. Testing ERP Student Directory Live Fetching...");
    const students = await req({
      path: "/api/erp/students",
      headers: {
        "x-platform-role": "superadmin",
        "x-role": "superadmin",
        "x-user-email": "superadmin@dakshora.ai",
        "x-organization-id": "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"
      }
    });
    assert(students.status === 200 && students.body?.success === true, "GET /api/erp/students works");
    assert(Array.isArray(students.body?.students) && students.body?.students.length > 0, "Real Students Fetched", `Count: ${students.body?.students?.length}`);

  } catch (err) {
    console.error("Test Suite Execution Error:", err);
    failCount++;
  } finally {
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`🏁 TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
  console.log("==========================================================================\n");

  if (failCount > 0) process.exit(1);
}

testSuite();

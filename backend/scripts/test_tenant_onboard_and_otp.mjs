import crypto from "node:crypto";

const BASE_URL = "http://127.0.0.1:5000";

async function request(path, options = {}) {
  const method = options.method || "GET";
  const headers = { ...options.headers };
  let body = options.body;
  if (body && typeof body === "object") {
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function runTests() {
  console.log("==========================================================================");
  console.log("🧪 TESTING MOBILE OTP AUTH & NEW TENANT ONBOARDING FOUNDATION");
  console.log("==========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, detail = "") {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: OTP Send to Registered Phone
  // --------------------------------------------------------------------------
  console.log("📱 TEST 1: OTP Send to Registered Mobile Number...");
  const sendRes = await request("/api/auth/otp/send", {
    method: "POST",
    body: { phone: "+91 98765 43210" }
  });

  assert("OTP Send returns HTTP 200", sendRes.status === 200, JSON.stringify(sendRes.data));
  assert("Response indicates OTP sent successfully", sendRes.data?.success === true);
  assert("Registered user recognized", sendRes.data?.isRegistered === true);
  assert("API response NEVER exposes devOtp", sendRes.data?.devOtp === undefined);
  assert("API response NEVER exposes raw OTP", sendRes.data?.otp === undefined);
  assert("Generic response message returned", sendRes.data?.message === "OTP sent successfully.");
  const testOtp = process.env.DEV_TEST_OTP || "784920";

  // --------------------------------------------------------------------------
  // TEST 2: OTP Verification & Token Issuance
  // --------------------------------------------------------------------------
  console.log("\n🔐 TEST 2: OTP Verification & Real JWT Issuance...");
  const verifyRes = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { phone: "+91 98765 43210", otp: testOtp }
  });

  assert("OTP Verify returns HTTP 200", verifyRes.status === 200, JSON.stringify(verifyRes.data));
  assert("Access token returned", Boolean(verifyRes.data?.token));
  assert("User profile returned with role and orgId", Boolean(verifyRes.data?.user?.organizationId));

  const phoneToken = verifyRes.data?.token;

  // --------------------------------------------------------------------------
  // TEST 3: Authenticated ERP Call using Mobile OTP Token
  // --------------------------------------------------------------------------
  console.log("\n🚀 TEST 3: Accessing Protected ERP Modules with Mobile OTP Token...");
  const erpStudents = await request("/api/erp/students", {
    headers: { Authorization: `Bearer ${phoneToken}` }
  });
  assert("Protected /api/erp/students responds HTTP 200 with OTP token", erpStudents.status === 200, `Status: ${erpStudents.status}`);

  const erpAttendance = await request("/api/erp/attendance", {
    headers: { Authorization: `Bearer ${phoneToken}` }
  });
  assert("Protected /api/erp/attendance responds HTTP 200 with OTP token", erpAttendance.status === 200, `Status: ${erpAttendance.status}`);

  // --------------------------------------------------------------------------
  // TEST 4: Brand New Tenant Onboarding & Zero-Empty State
  // --------------------------------------------------------------------------
  console.log("\n🏫 TEST 4: Brand New Organization Onboarding & Module Verification...");
  const newTenantId = crypto.randomUUID();
  console.log(`   Simulating freshly onboarded school: Tenant ID ${newTenantId}`);

  // Simulate a token for this new tenant
  const tenantTokenRes = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { phone: "9812345678", otp: "123456", name: "New Principal", organizationId: newTenantId }
  });
  // Now access ERP with this new tenant's organization ID
  const classesRes = await request("/api/erp/academics/classes", {
    headers: {
      Authorization: `Bearer ${tenantTokenRes.data?.token}`
    }
  });
  assert("New Tenant: /api/erp/academics/classes returns HTTP 200", classesRes.status === 200);
  assert("New Tenant: Standard Classes (14) auto-bootstrapped", Array.isArray(classesRes.data?.classes) && classesRes.data.classes.length >= 10, `Classes count: ${classesRes.data?.classes?.length}`);

  const sessionsRes = await request("/api/erp/academics/sessions", {
    headers: {
      Authorization: `Bearer ${tenantTokenRes.data?.token}`
    }
  });
  assert("New Tenant: Active Academic Session auto-bootstrapped", sessionsRes.status === 200 && Array.isArray(sessionsRes.data?.sessions) && sessionsRes.data.sessions.length > 0);

  const feesRes = await request("/api/erp/fees", {
    headers: {
      Authorization: `Bearer ${tenantTokenRes.data?.token}`
    }
  });
  assert("New Tenant: /api/erp/fees accessible with full entitlements (NOT 403)", feesRes.status === 200, `Status: ${feesRes.status}, Body: ${JSON.stringify(feesRes.data)}`);

  const examsRes = await request("/api/erp/exams", {
    headers: {
      Authorization: `Bearer ${tenantTokenRes.data?.token}`
    }
  });
  assert("New Tenant: /api/erp/exams accessible with full entitlements (NOT 403)", examsRes.status === 200, `Status: ${examsRes.status}`);

  const admissionsRes = await request("/api/erp/admissions", {
    headers: {
      Authorization: `Bearer ${tenantTokenRes.data?.token}`
    }
  });
  assert("New Tenant: /api/erp/admissions accessible (NOT 403)", admissionsRes.status === 200, `Status: ${admissionsRes.status}`);

  const transportRes = await request("/api/erp/transport/routes", {
    headers: {
      Authorization: `Bearer ${tenantTokenRes.data?.token}`
    }
  });
  assert("New Tenant: /api/erp/transport accessible (NOT 403)", transportRes.status === 200, `Status: ${transportRes.status}`);

  console.log("\n==========================================================================");
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});

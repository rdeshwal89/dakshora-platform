import "dotenv/config";
import crypto from "node:crypto";

const BASE_URL = "http://127.0.0.1:5000";
const SA_EMAIL = process.env.DAKSHORA_SUPER_ADMIN_EMAIL || "rdeshwal89@gmail.com";
const SA_PASS = process.env.DAKSHORA_SUPER_ADMIN_PASSWORD || "SuperAdmin@2026!";

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
  console.log("🧪 TESTING ATTRACTIVE ROLE-BASED AUTH, SUPERADMIN OTP & FORGOT PASSWORD");
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
  // TEST 1: Super Admin OTP 2-Step Authentication
  // --------------------------------------------------------------------------
  console.log("👑 TEST 1: Super Admin OTP Authentication Flow...");
  const saLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: SA_EMAIL,
      password: SA_PASS,
      requireOtp: true,
      role: "superadmin"
    }
  });

  assert("Super Admin login requires OTP challenge", saLoginRes.data?.otpRequired === true, JSON.stringify(saLoginRes.data));
  assert("Super Admin login NEVER exposes devOtp", saLoginRes.data?.devOtp === undefined);
  assert("Super Admin login NEVER exposes raw OTP", saLoginRes.data?.otp === undefined);
  assert("Generic response message returned", saLoginRes.data?.message === "OTP sent successfully.");

  const testOtp = process.env.DEV_TEST_OTP || "784920";

  // Verify OTP challenge is required
  const otpRes = await request("/api/auth/superadmin/verify-otp", {
    method: "POST",
    body: {
      email: SA_EMAIL,
      otp: testOtp
    }
  });

  assert("Super Admin verify-otp returns HTTP 200", otpRes.status === 200, JSON.stringify(otpRes.data));
  assert("Super Admin JWT issued upon OTP verification", Boolean(otpRes.data?.token));
  assert("Super Admin role and privileges confirmed", otpRes.data?.user?.role === "superadmin" && otpRes.data?.user?.isSuperAdmin === true);

  const saToken = otpRes.data?.token;

  // Verify protected superadmin endpoint with this OTP token
  const saProtectedRes = await request("/api/admin/support/session/active", {
    headers: { Authorization: `Bearer ${saToken}` }
  });
  assert("Super Admin OTP token authenticates protected platform route", saProtectedRes.status === 200 || saProtectedRes.status === 404, `Status: ${saProtectedRes.status}`);

  // --------------------------------------------------------------------------
  // TEST 2: Forgot Password Flow (Zero DEV OTP Leakage)
  // --------------------------------------------------------------------------
  console.log("\n🔑 TEST 2: Forgot Password Flow (Zero DEV OTP Leakage)...");
  const forgotRes = await request("/api/auth/forgot-password", {
    method: "POST",
    body: { email: "principal@dpsheritage.edu.in" }
  });

  assert("Forgot Password request returns HTTP 200", forgotRes.status === 200, JSON.stringify(forgotRes.data));
  assert("Forgot Password identifies staff account", forgotRes.data?.userName === "Dr. Meenakshi Sundaram");
  assert("API response NEVER exposes devOtp", forgotRes.data?.devOtp === undefined);
  assert("API response NEVER exposes raw OTP", forgotRes.data?.otp === undefined);
  assert("Generic response message returned", forgotRes.data?.message === "OTP sent successfully.");

  // Reset Password using backend-configured verification OTP
  const resetRes = await request("/api/auth/reset-password", {
    method: "POST",
    body: {
      identifier: "principal@dpsheritage.edu.in",
      otp: testOtp,
      newPassword: "NewSecurePassword2026!#"
    }
  });

  assert("Reset Password with OTP returns HTTP 200", resetRes.status === 200, JSON.stringify(resetRes.data));
  assert("Confirmation message returned", resetRes.data?.success === true);

  // --------------------------------------------------------------------------
  // TEST 3: Mobile Phone Number OTP for Parents / Students
  // --------------------------------------------------------------------------
  console.log("\n📱 TEST 3: Parent & Student Mobile OTP Login Flow...");
  const sendRes = await request("/api/auth/otp/send", {
    method: "POST",
    body: { phone: "9876543210" }
  });

  assert("OTP Send returns HTTP 200", sendRes.status === 200);
  assert("Parent detected by registered phone", sendRes.data?.isRegistered === true && sendRes.data?.role === "parent");
  assert("Mobile OTP response NEVER exposes devOtp", sendRes.data?.devOtp === undefined);
  assert("Generic response message returned", sendRes.data?.message === "OTP sent successfully.");

  // Test Rate Limiting Cooldown (Immediate resend should be blocked with 429)
  const rateLimitRes = await request("/api/auth/otp/send", {
    method: "POST",
    body: { phone: "9876543210" }
  });
  assert("Rate limit cooldown enforced on immediate resend (HTTP 429)", rateLimitRes.status === 429);

  // Verify mobile OTP
  const verifyRes = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { phone: "9876543210", otp: testOtp }
  });

  assert("Mobile OTP Verify returns HTTP 200", verifyRes.status === 200);
  assert("Bearer token generated for parent session", Boolean(verifyRes.data?.token));
  assert("Parent user profile attached with role", verifyRes.data?.user?.role === "parent");

  // --------------------------------------------------------------------------
  // TEST 4: Frontend Proxy Verification (Port 3000)
  // --------------------------------------------------------------------------
  console.log("\n🌐 TEST 4: Frontend Next.js Proxy Verification (Port 3000)...");
  try {
    const feRes = await fetch("http://127.0.0.1:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@dakshora.com" })
    });
    const feData = await feRes.json();
    assert("Frontend proxy forwards forgot-password to backend (HTTP 200)", feRes.status === 200 && feData.success === true);
  } catch (err) {
    assert("Frontend proxy forwards forgot-password", false, err.message);
  }

  console.log("\n==========================================================================");
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================================\n");

  if (failed > 0) process.exit(1);
}

runTests();

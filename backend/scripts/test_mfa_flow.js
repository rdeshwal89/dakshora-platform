import "dotenv/config";
import http from "http";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { buildApp } from "../src/app.js";

// =========================================================================
// RFC 6238 PURE NODE.JS TOTP GENERATOR (Zero external dependencies)
// =========================================================================
function base32Decode(str) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = str.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned.charAt(i));
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret, timeStep = 30) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, "0");
}

async function runMfaVerificationSuite() {
  console.log("==========================================================================");
  console.log("🔐 DAKSHORA 2.0 — TWO-FACTOR AUTHENTICATION (TOTP / MFA) TEST SUITE");
  console.log("==========================================================================\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("❌ Missing Supabase configuration in .env");
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 1. Provision dedicated temporary test SuperAdmin user
  const TEST_EMAIL = `test.mfa.${Date.now()}@dakshora.internal`;
  const TEST_PASSWORD = "MfaTestPassword2026!Secure";

  console.log(`[Provisioning] Creating dedicated test SuperAdmin: ${TEST_EMAIL}`);
  const { data: testUser, error: createUserErr } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    app_metadata: { role: "superadmin" }
  });

  if (createUserErr || !testUser?.user) {
    console.error("❌ Failed to provision test SuperAdmin:", createUserErr);
    process.exit(1);
  }

  // 2. Start test gateway server on port 5399
  const app = await buildApp();
  const PORT = 5399;
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Gateway listening on http://127.0.0.1:${PORT}\n`);

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

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message} ${details ? "(" + details + ")" : ""}`);
      testsFailed++;
    }
  }

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Initial Standard Login (No MFA Required)
    // --------------------------------------------------------------------------
    console.log("▶ TEST 1: Initial Standard Login (Password Only)");
    const loginRes = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    assert(loginRes.status === 200, "Initial login returns HTTP 200", `status=${loginRes.status}`);
    assert(!loginRes.body?.mfaRequired, "MFA is not required initially");
    assert(loginRes.body?.token || loginRes.body?.access_token || loginRes.body?.session?.access_token, "Returns active session token");

    let authToken = loginRes.body?.access_token || loginRes.body?.token || loginRes.body?.session?.access_token;

    // --------------------------------------------------------------------------
    // TEST 2: Initial MFA Status Check
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 2: Initial MFA Status (Should be Disabled)");
    const statusRes = await makeRequest({
      method: "GET",
      path: "/api/auth/mfa/status",
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(statusRes.status === 200, "GET /api/auth/mfa/status returns HTTP 200");
    assert(statusRes.body?.mfaEnabled === false, "mfaEnabled is false initially");

    // --------------------------------------------------------------------------
    // TEST 3: Enroll New TOTP Factor
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 3: Enroll New TOTP Factor (POST /api/auth/mfa/enroll)");
    const enrollRes = await makeRequest({
      method: "POST",
      path: "/api/auth/mfa/enroll",
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(enrollRes.status === 200 && enrollRes.body?.success, "Enrollment returns HTTP 200 and success: true");
    assert(typeof enrollRes.body?.factorId === "string" && enrollRes.body.factorId.length > 0, "Returns valid factorId");
    assert(typeof enrollRes.body?.secret === "string" && enrollRes.body.secret.length > 0, "Returns valid TOTP secret key");
    assert(typeof enrollRes.body?.qrCode === "string" && enrollRes.body.qrCode.startsWith("data:image"), "Returns valid QR code data URI");

    const factorId = enrollRes.body.factorId;
    const secret = enrollRes.body.secret;

    // --------------------------------------------------------------------------
    // TEST 4: Verify Newly Enrolled TOTP Factor
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 4: Verify Newly Enrolled TOTP Factor (POST /api/auth/mfa/verify)");
    const generatedCode = generateTOTP(secret);
    console.log(`  ℹ️ Computed RFC 6238 TOTP Code: ${generatedCode}`);

    const verifySetupRes = await makeRequest({
      method: "POST",
      path: "/api/auth/mfa/verify",
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        factorId,
        code: generatedCode
      }
    });
    assert(verifySetupRes.status === 200 && verifySetupRes.body?.success, "MFA Verification succeeds with valid code");
    const elevatedToken = verifySetupRes.body?.access_token || verifySetupRes.body?.token;
    assert(typeof elevatedToken === "string", "Returns elevated AAL2 session token");

    // --------------------------------------------------------------------------
    // TEST 5: Verify Active MFA Status
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 5: Verify Active MFA Status (GET /api/auth/mfa/status)");
    const activeStatusRes = await makeRequest({
      method: "GET",
      path: "/api/auth/mfa/status",
      headers: { Authorization: `Bearer ${elevatedToken || authToken}` }
    });
    assert(activeStatusRes.status === 200 && activeStatusRes.body?.mfaEnabled === true, "MFA Status reports mfaEnabled === true");

    // --------------------------------------------------------------------------
    // TEST 6: Enforced Login Check (Must return mfaRequired: true)
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 6: Login with MFA Enforced (Must return mfaRequired: true)");
    const mfaLoginRes = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    assert(mfaLoginRes.status === 200, "MFA Login returns HTTP 200");
    assert(mfaLoginRes.body?.mfaRequired === true, "MFA Login flags mfaRequired: true");
    assert(mfaLoginRes.body?.factorId === factorId, "MFA Login returns matching factorId");
    assert(typeof mfaLoginRes.body?.tempToken === "string", "MFA Login provides temporary verification token");
    assert(!mfaLoginRes.body?.token && !mfaLoginRes.body?.access_token, "MFA Login DOES NOT release full authenticated session");

    // --------------------------------------------------------------------------
    // TEST 7: Reject Invalid TOTP Code
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 7: Reject Invalid TOTP Code (Fail Closed Security)");
    const invalidVerifyRes = await makeRequest({
      method: "POST",
      path: "/api/auth/mfa/verify",
      body: {
        factorId: mfaLoginRes.body.factorId,
        code: "000000",
        tempToken: mfaLoginRes.body.tempToken
      }
    });
    assert(invalidVerifyRes.status === 400 || invalidVerifyRes.body?.success === false, "Invalid TOTP code is rejected (HTTP 400)");

    // --------------------------------------------------------------------------
    // TEST 8: Accept Valid TOTP Code & Release Full Session
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 8: Accept Valid TOTP Code & Release AAL2 Session");
    const validLoginCode = generateTOTP(secret);
    const validVerifyRes = await makeRequest({
      method: "POST",
      path: "/api/auth/mfa/verify",
      body: {
        factorId: mfaLoginRes.body.factorId,
        code: validLoginCode,
        tempToken: mfaLoginRes.body.tempToken
      }
    });
    assert(validVerifyRes.status === 200 && validVerifyRes.body?.success === true, "Valid TOTP code unlocks full session");
    const unlockedToken = validVerifyRes.body?.access_token || validVerifyRes.body?.token;
    assert(typeof unlockedToken === "string", "Returns complete access token");
    assert(validVerifyRes.body?.user?.email === TEST_EMAIL, "Returns authenticated user object");

    // --------------------------------------------------------------------------
    // TEST 9: Unenroll MFA Factor
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 9: Disable / Unenroll MFA (POST /api/auth/mfa/unenroll)");
    const unenrollRes = await makeRequest({
      method: "POST",
      path: "/api/auth/mfa/unenroll",
      headers: {
        Authorization: `Bearer ${unlockedToken}`
      },
      body: { factorId }
    });
    assert(unenrollRes.status === 200 && unenrollRes.body?.success === true, "Unenroll returns HTTP 200 and success: true");

    // --------------------------------------------------------------------------
    // TEST 10: Post-Unenroll Status Check
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 10: Verify Post-Unenroll Status");
    const postStatusRes = await makeRequest({
      method: "GET",
      path: "/api/auth/mfa/status",
      headers: {
        Authorization: `Bearer ${unlockedToken}`
      }
    });
    assert(postStatusRes.status === 200 && postStatusRes.body?.mfaEnabled === false, "MFA Status reports mfaEnabled === false");

    // --------------------------------------------------------------------------
    // TEST 11: Normal Login After Unenroll
    // --------------------------------------------------------------------------
    console.log("\n▶ TEST 11: Normal Login After Unenroll (MFA No Longer Prompted)");
    const postUnenrollLoginRes = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    assert(postUnenrollLoginRes.status === 200 && !postUnenrollLoginRes.body?.mfaRequired, "Post-unenroll login succeeds directly without MFA prompt");

  } catch (err) {
    console.error("FATAL ERROR during test execution:", err);
    testsFailed++;
  } finally {
    // Cleanup test user and close test server
    console.log(`\n[Cleanup] Deleting test SuperAdmin user: ${testUser.user.id}`);
    await supabaseAdmin.auth.admin.deleteUser(testUser.user.id);
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`MFA VERIFICATION SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("==========================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMfaVerificationSuite();

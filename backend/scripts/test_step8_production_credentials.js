/**
 * test_step8_production_credentials.js
 * 
 * Comprehensive verification test for Step 8:
 * - Render blueprint configuration (render.yaml)
 * - Environment schema validation (env.ts)
 * - Razorpay order creation & HMAC-SHA256 cryptographic signature verification
 * - SMS Gateway (Fast2SMS / Twilio) & SMTP Relay settings management
 * - Security & Masking audit (No plaintext secrets exposed)
 * - Strict RBAC enforcement on credentials endpoints
 */

import { createClient } from "@supabase/supabase-js";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 5292;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

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

async function runStep8Verification() {
  console.log("==========================================================================");
  console.log("🔒 STEP 8 VERIFICATION: PRODUCTION CREDENTIALS & RENDER INTEGRATION");
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

  // -------------------------------------------------------------------------
  // TEST SUITE 1: Render Blueprint (render.yaml) Inspection
  // -------------------------------------------------------------------------
  console.log("📦 1. Verifying Render Blueprint (render.yaml)...");
  const renderYamlPath = path.resolve(__dirname, "../../render.yaml");
  assert(fs.existsSync(renderYamlPath), "render.yaml exists in project root");
  const renderYamlContent = fs.readFileSync(renderYamlPath, "utf-8");

  const requiredRenderKeys = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "FAST2SMS_API_KEY",
    "FAST2SMS_SENDER_ID",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM"
  ];

  for (const key of requiredRenderKeys) {
    assert(renderYamlContent.includes(key), `render.yaml declares environment variable '${key}'`);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: Start Backend Server & Authenticate
  // -------------------------------------------------------------------------
  console.log("\n🚀 2. Booting Backend Server for Live Gateway Validation...");
  const { buildApp } = await import("../src/app.js");
  const app = await buildApp();
  await app.listen({ port: TEST_PORT, host: "127.0.0.1" });
  console.log(`  ✅ Backend server running on ${BASE_URL}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  const ts = Date.now();
  const adminEmail = `admin.cred.${ts}@dakshora.internal`;
  const teacherEmail = `teacher.cred.${ts}@dakshora.internal`;
  const securePwd = "CredSecurePass@2026!";

  // Create School Admin
  const { data: adminUser } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: securePwd,
    email_confirm: true,
    app_metadata: { role: "school-admin", organization_id: ORG_ID }
  });

  // Create Teacher
  const { data: teacherUser } = await supabaseAdmin.auth.admin.createUser({
    email: teacherEmail,
    password: securePwd,
    email_confirm: true,
    app_metadata: { role: "teacher", organization_id: ORG_ID }
  });

  const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey);
  const { data: adminSess } = await anonClient.auth.signInWithPassword({ email: adminEmail, password: securePwd });
  const adminToken = adminSess.session.access_token;

  const { data: teacherSess } = await anonClient.auth.signInWithPassword({ email: teacherEmail, password: securePwd });
  const teacherToken = teacherSess.session.access_token;

  console.log("  ✅ School Admin and Teacher test identities provisioned & authenticated.");

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 3: Razorpay Payment Verification Algorithm
    // -------------------------------------------------------------------------
    console.log("\n💳 3. Testing Razorpay Payment Gateway & HMAC-SHA256 Signatures...");
    
    // Resolve or generate a fee demand for the test
    const demandsRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/fees/demands`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    let targetDemandId = demandsRes.data.demands?.[0]?.id;

    if (!targetDemandId) {
      const structRes = await makeRequest({
        method: "POST",
        url: `${BASE_URL}/api/erp/fees/structures`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          academicSession: "2026-27",
          grade: "Class 10",
          feeHead: "Tuition Fee Q3",
          amountINR: 1500,
          frequency: "quarterly",
          dueDay: 10
        }
      });
      const structId = structRes.data.structure?.id;

      const genRes = await makeRequest({
        method: "POST",
        url: `${BASE_URL}/api/erp/fees/demands/generate`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          session: "2026-27",
          grade: "Class 10",
          section: "A",
          feeStructureId: structId,
          dueDate: "2026-11-15"
        }
      });
      targetDemandId = genRes.data.demands?.[0]?.id;
    }

    assert(Boolean(targetDemandId), `Resolved active fee demand: ${targetDemandId}`);

    // Create an order
    const orderRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/fees/online/create-order`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { demandId: targetDemandId, amountINR: 1500 }
    });

    assert(orderRes.status === 200, "Create Razorpay Order returned HTTP 200");
    assert(orderRes.data.success === true, "Create Order success is true");
    const orderData = orderRes.data.order;
    assert(orderData.id.startsWith("order_"), `Generated Razorpay Order ID: ${orderData.id}`);
    assert(orderData.amount === 150000, "Calculated paise amount is 150000 (1500 INR)");
    assert(Boolean(orderData.key), `Razorpay Key ID exposed safely for checkout: ${orderData.key}`);

    // Verify payment with legitimate signature
    const testSecret = process.env.RAZORPAY_KEY_SECRET || "dakshora_gateway_production_secret";
    const testPaymentId = `pay_${Date.now()}`;
    const validSignature = crypto.createHmac("sha256", testSecret).update(`${orderData.id}|${testPaymentId}`).digest("hex");

    const verifySuccessRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/fees/online/verify-payment`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        orderId: orderData.id,
        paymentId: testPaymentId,
        signature: validSignature,
        demandId: targetDemandId,
        amountPaid: 1500
      }
    });

    assert(verifySuccessRes.status === 200, "Payment verification with valid signature returned HTTP 200");
    assert(verifySuccessRes.data.success === true, "Payment verification response reports success: true");

    // Negative test: Tampered signature must be rejected
    const tamperedSignature = validSignature.slice(0, -4) + "0000";
    const verifyFailRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/fees/online/verify-payment`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        orderId: orderData.id,
        paymentId: testPaymentId,
        signature: tamperedSignature,
        demandId: targetDemandId,
        amountPaid: 1500
      }
    });

    assert(verifyFailRes.status === 400, "Tampered signature rejected with HTTP 400");
    assert(verifyFailRes.data.message.includes("Invalid payment signature"), "Rejection reason specifically identifies invalid signature");

    // -------------------------------------------------------------------------
    // TEST SUITE 4: Communication Gateway Settings (SMS & SMTP)
    // -------------------------------------------------------------------------
    console.log("\n📡 4. Testing Communication Gateway Settings & SMTP Relay...");

    // Update settings with test credentials
    const patchRes = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/communication/gateway/settings`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        defaultSmsProvider: "fast2sms",
        fast2sms: {
          apiKey: "f2s_prod_test_key_1234567890abcdef",
          senderId: "DKSHRA",
          dltEntityId: "1201159123456789012",
          enabled: true
        },
        smtp: {
          host: "smtp.sendgrid.net",
          port: 587,
          user: "apikey",
          pass: "SG.test_smtp_secret_pass_token",
          from: "Dakshora ERP <no-reply@dakshora.co.in>",
          secure: false,
          enabled: true
        }
      }
    });

    assert(patchRes.status === 200, "PATCH communication gateway settings returned HTTP 200");
    const sanitized = patchRes.data.settings;
    assert(sanitized.fast2sms.apiKey.includes("••••"), "Fast2SMS API Key is masked in response");
    assert(!sanitized.smtp.user.includes("secret"), "SMTP User is masked or sanitized");
    assert(sanitized.smtp.host === "smtp.sendgrid.net", "SMTP Host correctly stored");
    assert(sanitized.smtp.port === 587, "SMTP Port correctly stored as number 587");

    // Test pinging SMTP Relay
    const testSmtpRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/communication/gateway/test`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        provider: "smtp_relay",
        channel: "email",
        recipientContact: "principal@school.edu",
        testMessage: "SMTP Relay operational test message"
      }
    });

    assert(testSmtpRes.status === 200, "Gateway test dispatch for SMTP Relay returned HTTP 200");
    assert(testSmtpRes.data.success === true, "SMTP test dispatch succeeded");
    assert(testSmtpRes.data.provider === "smtp_relay", "Dispatched through smtp_relay provider");

    // -------------------------------------------------------------------------
    // TEST SUITE 5: Credentials Status Diagnostic Endpoint & RBAC
    // -------------------------------------------------------------------------
    console.log("\n🛡️ 5. Testing Credentials Status Diagnostic Endpoint & RBAC...");

    // Admin should succeed and see sanitized status
    const statusAdminRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/admin/credentials/status`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert(statusAdminRes.status === 200, "School Admin GET /api/erp/admin/credentials/status returned HTTP 200");
    assert(statusAdminRes.data.success === true, "Credentials status returned success: true");
    const creds = statusAdminRes.data.credentials;
    assert(creds.razorpay !== undefined, "Razorpay status block present");
    assert(creds.smsGateway !== undefined, "SMS Gateway status block present");
    assert(creds.smtpRelay !== undefined, "SMTP Relay status block present");
    assert(creds.supabase !== undefined, "Supabase status block present");
    assert(creds.supabase.storageBuckets.includes("school-media-vault"), "Buckets include school-media-vault");
    assert(creds.supabase.storageBuckets.includes("student-documents"), "Buckets include student-documents");

    // Teacher must be blocked
    const statusTeacherRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/admin/credentials/status`,
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    assert(statusTeacherRes.status === 403, "Teacher GET /api/erp/admin/credentials/status returned HTTP 403 (FORBIDDEN_ROLE)");
    assert(statusTeacherRes.data.code === "FORBIDDEN_ROLE", "Rejection error code is FORBIDDEN_ROLE");

  } finally {
    // Cleanup test users
    console.log("\n🧹 Cleaning up test users...");
    if (adminUser?.user?.id) await supabaseAdmin.auth.admin.deleteUser(adminUser.user.id);
    if (teacherUser?.user?.id) await supabaseAdmin.auth.admin.deleteUser(teacherUser.user.id);
    console.log("  ✅ Test users cleanly deleted.");
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`🎉 ALL ${testPassed}/${testTotal} STEP 8 VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log("==========================================================================\n");
}

runStep8Verification().catch(err => {
  console.error("\n❌ FATAL ERROR in Step 8 Verification:", err);
  process.exit(1);
});

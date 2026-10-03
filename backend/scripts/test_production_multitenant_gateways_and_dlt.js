import "dotenv/config";
import http from "http";
import assert from "assert";
import crypto from "crypto";
import { buildApp } from "../src/app.js";

async function runProductionHardeningTests() {
  console.log("==========================================================================");
  console.log("🔒 VERIFYING DAKSHORA 2.0 MULTI-TENANT GATEWAYS & DLT ENHANCEMENT");
  console.log("==========================================================================\n");

  const app = await buildApp();
  const PORT = 5299;
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Live Gateway listening on http://127.0.0.1:${PORT}`);

  function makeRequest({ method, path, headers = {}, body }) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : "";
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: PORT,
          path,
          method,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            ...headers
          }
        },
        res => {
          let data = "";
          res.on("data", chunk => (data += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: SAAS BILLING WEBHOOK CRYPTOGRAPHIC HARDENING
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: Billing Webhook HMAC-SHA256 Signature Verification ---");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "dakshora_webhook_production_secret";
    const testEvent = {
      id: `evt_wh_audit_${Date.now()}`,
      event: "payment.captured",
      payload: { amount: 399900, currency: "INR" }
    };
    const validWebhookSig = crypto.createHmac("sha256", webhookSecret).update(JSON.stringify(testEvent)).digest("hex");

    // 1.1 Missing Signature Header -> Expected 401
    const missingSigRes = await makeRequest({
      method: "POST",
      path: "/api/billing/webhook",
      body: testEvent
    });
    assert.strictEqual(missingSigRes.status, 401, "Webhook without x-razorpay-signature must return 401");
    console.log("  ✅ PASS: Missing webhook signature returns 401 Unauthorized");

    // 1.2 Invalid / Forged Signature Header -> Expected 400
    const fakeSigRes = await makeRequest({
      method: "POST",
      path: "/api/billing/webhook",
      headers: { "x-razorpay-signature": "forged_signature_12345678" },
      body: testEvent
    });
    assert.strictEqual(fakeSigRes.status, 400, "Webhook with tampered signature must return 400");
    console.log("  ✅ PASS: Tampered webhook signature returns 400 Bad Request");

    // 1.3 Genuine Cryptographic HMAC-SHA256 Signature -> Expected 200
    const validSigRes = await makeRequest({
      method: "POST",
      path: "/api/billing/webhook",
      headers: { "x-razorpay-signature": validWebhookSig },
      body: testEvent
    });
    assert.strictEqual(validSigRes.status, 200, "Webhook with valid signature must return 200");
    assert.strictEqual(validSigRes.body.success, true);
    console.log("  ✅ PASS: Valid HMAC-SHA256 signature accepted and processed!");

    // 1.4 Duplicate Webhook Event (Idempotency) -> Expected duplicate: true
    const dupSigRes = await makeRequest({
      method: "POST",
      path: "/api/billing/webhook",
      headers: { "x-razorpay-signature": validWebhookSig },
      body: testEvent
    });
    assert.strictEqual(dupSigRes.status, 200);
    assert.strictEqual(dupSigRes.body.duplicate, true, "Duplicate webhook must be idempotent");
    console.log("  ✅ PASS: Duplicate webhook blocked by idempotency guard!");

    // -------------------------------------------------------------------------
    // TEST GROUP 2: AUTHENTICATION AS SCHOOL ADMIN
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: School Admin Authentication ---");
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const testSchoolAdminEmail = `test.schooladmin.${Date.now()}@dakshora.internal`;
    const testPassword = "TempPassword123!Secure";

    const { data: schoolAdminUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: testSchoolAdminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e" }
    });
    assert.ok(!createErr, "Creation of test school admin must succeed");

    const { data: signInAdmin, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
      email: testSchoolAdminEmail,
      password: testPassword
    });
    assert.ok(!signInErr, "Sign in of test school admin must succeed");

    const token = signInAdmin.session?.access_token;
    assert.ok(token, "Login must return valid JWT token");
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log("  ✅ PASS: Authenticated successfully as School Principal with verified JWT");

    // -------------------------------------------------------------------------
    // TEST GROUP 3: MULTI-TENANT PER-SCHOOL PAYMENT GATEWAY ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Per-School Razorpay Merchant Routing ---");

    // 3.1 Configure School A's Razorpay Merchant Key ID & Secret
    const schoolAKeyId = `rzp_live_dps_heritage_${Date.now().toString().slice(-4)}`;
    const schoolASecret = `dps_heritage_merchant_secret_${Date.now()}`;

    const configGwRes = await makeRequest({
      method: "POST",
      path: "/api/erp/settings/payment-gateway",
      headers: authHeaders,
      body: {
        provider: "razorpay",
        keyId: schoolAKeyId,
        keySecret: schoolASecret,
        mode: "live",
        status: "active"
      }
    });
    assert.strictEqual(configGwRes.status, 200, "Configuring payment gateway must succeed");
    assert.strictEqual(configGwRes.body.gateway.keyId, schoolAKeyId);
    assert.ok(configGwRes.body.gateway.maskedSecret.includes("••••"), "Secret must be masked in response");
    console.log(`  ✅ PASS: School A configured payment gateway: Key ID = ${schoolAKeyId}`);

    // 3.2 Query Gateway Settings
    const getGwRes = await makeRequest({
      method: "GET",
      path: "/api/erp/settings/payment-gateway",
      headers: authHeaders
    });
    assert.strictEqual(getGwRes.status, 200);
    assert.strictEqual(getGwRes.body.isConfigured, true);
    assert.strictEqual(getGwRes.body.gateway.keyId, schoolAKeyId);
    console.log("  ✅ PASS: Retrieved masked gateway configuration successfully");

    // 3.3 Create Online Fee Order for School A
    // First create a fee structure
    const structRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/structures",
      headers: authHeaders,
      body: {
        academicSession: "2026-27",
        grade: "Class 10",
        feeHead: `Tuition Fee Term 1 ${Date.now().toString().slice(-4)}`,
        amountINR: 5000,
        frequency: "quarterly",
        dueDay: 15,
        isMandatory: true
      }
    });
    assert.strictEqual(structRes.status, 200, "Fee structure creation must succeed");
    const feeStructureId = structRes.body.structure?.id;

    // Generate fee demand
    const demandRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/demands/generate",
      headers: authHeaders,
      body: {
        session: "2026-27",
        grade: "Class 10",
        section: "A",
        feeStructureId,
        dueDate: "2026-12-31"
      }
    });
    const demand = demandRes.body.demands?.[0];
    assert.ok(demand, "Fee demand must be generated");
    const demandId = demand.id;

    // Create online payment order
    const orderRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/online/create-order",
      headers: authHeaders,
      body: {
        demandId,
        amountINR: 5000,
        studentId: demand.studentId
      }
    });
    assert.strictEqual(orderRes.status, 200);
    const orderId = orderRes.body.order.id;
    const returnedKey = orderRes.body.order.key;

    // MUST match School A's Key, NOT Dakshora's SaaS Key!
    assert.strictEqual(returnedKey, schoolAKeyId, "Order must use School A's Razorpay Key ID, NOT Dakshora SaaS key!");
    console.log(`  ✅ PASS: Student fee order created with School A merchant key: ${returnedKey}`);

    // 3.4 Verify Payment with School A's Secret
    const paymentId = `pay_sch_isolated_${Date.now()}`;
    const validFeeSig = crypto.createHmac("sha256", schoolASecret).update(`${orderId}|${paymentId}`).digest("hex");

    // Forged signature must fail
    const fakeFeeSigRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/online/verify-payment",
      headers: authHeaders,
      body: {
        orderId,
        paymentId,
        signature: "invalid_sig_test",
        demandId,
        amountPaid: 5000
      }
    });
    assert.strictEqual(fakeFeeSigRes.status, 400, "Invalid fee signature must be rejected");
    console.log("  ✅ PASS: Invalid signature on school fee payment correctly rejected (400)");

    // Valid signature with School A's secret must succeed
    const validFeeRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/online/verify-payment",
      headers: authHeaders,
      body: {
        orderId,
        paymentId,
        signature: validFeeSig,
        demandId,
        amountPaid: 5000
      }
    });
    assert.strictEqual(validFeeRes.status, 200, "Valid school fee signature must succeed");
    assert.strictEqual(validFeeRes.body.success, true);
    assert.strictEqual(validFeeRes.body.demand?.status, "paid");
    console.log(`  ✅ PASS: School fee payment verified with School A secret and settled! Receipt: ${validFeeRes.body.receiptNo}`);

    // -------------------------------------------------------------------------
    // TEST GROUP 4: COMMUNICATION SETTINGS PERSISTENCE & DLT COMPLIANCE
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Communication Gateway & DLT Template IDs ---");

    // 4.1 Update Communication Gateway Settings
    const updateCommRes = await makeRequest({
      method: "PATCH",
      path: "/api/erp/communication/gateway/settings",
      headers: authHeaders,
      body: {
        defaultSmsProvider: "fast2sms",
        fast2sms: {
          apiKey: "f2s_prod_test_api_key_8899",
          senderId: "DPSDEL",
          route: "dlt",
          dltEntityId: "1101234567890123456",
          enabled: true
        }
      }
    });
    assert.strictEqual(updateCommRes.status, 200);
    assert.strictEqual(updateCommRes.body.settings.fast2sms.senderId, "DPSDEL");
    assert.strictEqual(updateCommRes.body.settings.fast2sms.dltEntityId, "1101234567890123456");
    console.log("  ✅ PASS: Communication settings configured with custom DLT Sender ID: DPSDEL");

    // 4.2 Create Message Template with TRAI DLT Template ID
    const dltTemplateCode = `EXAM_SCHED_${Date.now().toString().slice(-4)}`;
    const dltTemplateId = "1207161829304918999";
    const createTplRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/templates",
      headers: authHeaders,
      body: {
        code: dltTemplateCode,
        name: "Term Examination Date Sheet Alert",
        category: "exam",
        channel: "sms",
        subject: "Exam Schedule Announced",
        body: "Dear Parent, Term 1 examinations for your ward will commence on 15-Nov-2026. Please check the portal for syllabus.",
        dlt_template_id: dltTemplateId,
        dlt_sender_id: "DPSDEL"
      }
    });
    assert.strictEqual(createTplRes.status, 201);
    assert.strictEqual(createTplRes.body.template.dlt_template_id, dltTemplateId);
    assert.strictEqual(createTplRes.body.template.dlt_sender_id, "DPSDEL");
    console.log(`  ✅ PASS: Template created with TRAI DLT Template ID: ${dltTemplateId} & Sender ID: DPSDEL`);

    // 4.3 Query Template by ID
    const getTplRes = await makeRequest({
      method: "GET",
      path: `/api/erp/communication/templates/${createTplRes.body.template.id}`,
      headers: authHeaders
    });
    assert.strictEqual(getTplRes.status, 200);
    assert.strictEqual(getTplRes.body.template.dlt_template_id, dltTemplateId);
    console.log("  ✅ PASS: Template fetched with verified DLT fields intact");

    if (schoolAdminUser?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(schoolAdminUser.user.id);
    }
    await app.close();
    console.log("\n==========================================================================");
    console.log("🎉 ALL PRODUCTION HARDENING & MULTI-TENANT TESTS PASSED (100%)!");
    console.log("==========================================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    await app.close();
    process.exit(1);
  }
}

runProductionHardeningTests();

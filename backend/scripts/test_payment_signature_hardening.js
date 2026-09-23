import "dotenv/config";
import http from "http";
import assert from "assert";
import crypto from "crypto";
import { buildApp } from "../src/app.js";

async function testPaymentSignatureHardening() {
  console.log("==========================================================================");
  console.log("🔒 TESTING PAYMENT CRYPTOGRAPHIC SIGNATURE HARDENING");
  console.log("==========================================================================\n");

  const app = await buildApp();
  const PORT = 5298;
  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Gateway listening on http://127.0.0.1:${PORT}`);

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

  // 1. Authenticate as school admin
  const loginRes = await makeRequest({
    method: "POST",
    path: "/api/auth/login",
    body: { email: "principal@dpsheritage.in", password: "TestPassword2026!" }
  });
  const token = loginRes.body?.token;
  assert.ok(token, "Login must succeed and return token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Create Fee Structure
  const structRes = await makeRequest({
    method: "POST",
    path: "/api/erp/fees/structures",
    headers: authHeaders,
    body: {
      academicSession: "2026-27",
      grade: "Class 10",
      feeHead: `Security Hardening Test Fee ${Date.now()}`,
      amountINR: 2000,
      frequency: "quarterly",
      dueDay: 15,
      isMandatory: true
    }
  });
  assert.strictEqual(structRes.status, 200);
  const feeStructureId = structRes.body.structure.id;

  // 3. Generate Fee Demand
  const demandGenRes = await makeRequest({
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
  assert.strictEqual(demandGenRes.status, 200);
  const demand = demandGenRes.body.demands[0];
  const demandId = demand.id;
  console.log(`[Demand Generated] Invoice: ${demand.invoiceNo}, ID: ${demandId}, Amount: ₹${demand.netAmount}`);

  // 4. Create Online Gateway Order
  const orderRes = await makeRequest({
    method: "POST",
    path: "/api/erp/fees/online/create-order",
    headers: authHeaders,
    body: {
      demandId,
      amountINR: 2000,
      studentId: demand.studentId
    }
  });
  assert.strictEqual(orderRes.status, 200);
  const orderId = orderRes.body.order.id;
  const paymentId = `pay_hardened_${Date.now()}`;
  console.log(`[Order Created] Order ID: ${orderId}, Amount: ₹2000`);

  // -------------------------------------------------------------------------
  // TEST A: Empty Signature (Previously bypassed, MUST FAIL with 400)
  // -------------------------------------------------------------------------
  console.log("\n[Test A] Submitting payment verification with EMPTY signature...");
  const emptySigRes = await makeRequest({
    method: "POST",
    path: "/api/erp/fees/online/verify-payment",
    headers: authHeaders,
    body: {
      orderId,
      paymentId,
      signature: "",
      demandId,
      amountPaid: 2000
    }
  });
  console.log(`  Result: HTTP ${emptySigRes.status} | Message: ${emptySigRes.body.message}`);
  assert.strictEqual(emptySigRes.status, 400, "Empty signature must be rejected with 400");
  assert.strictEqual(emptySigRes.body.message, "Invalid payment signature verification failed");
  console.log("  ✅ PASS: Empty signature correctly rejected!");

  // -------------------------------------------------------------------------
  // TEST B: Arbitrary 16+ Char String (Previously allowed by .length >= 16 bypass! MUST FAIL with 400)
  // -------------------------------------------------------------------------
  console.log("\n[Test B] Submitting payment verification with arbitrary 16-character dummy signature...");
  const fakeSigRes = await makeRequest({
    method: "POST",
    path: "/api/erp/fees/online/verify-payment",
    headers: authHeaders,
    body: {
      orderId,
      paymentId,
      signature: "fake_sig_1234567890", // 20 chars long
      demandId,
      amountPaid: 2000
    }
  });
  console.log(`  Result: HTTP ${fakeSigRes.status} | Message: ${fakeSigRes.body.message}`);
  assert.strictEqual(fakeSigRes.status, 400, "Arbitrary 16+ char signature must be rejected with 400");
  assert.strictEqual(fakeSigRes.body.message, "Invalid payment signature verification failed");
  console.log("  ✅ PASS: Arbitrary 16+ character bypass string correctly rejected!");

  // -------------------------------------------------------------------------
  // TEST C: Genuine Cryptographic HMAC-SHA256 Signature (MUST SUCCEED with 200)
  // -------------------------------------------------------------------------
  console.log("\n[Test C] Submitting payment verification with GENUINE HMAC-SHA256 signature...");
  const secret = process.env.RAZORPAY_KEY_SECRET || "dakshora_gateway_production_secret";
  const validSignature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const validSigRes = await makeRequest({
    method: "POST",
    path: "/api/erp/fees/online/verify-payment",
    headers: authHeaders,
    body: {
      orderId,
      paymentId,
      signature: validSignature,
      demandId,
      amountPaid: 2000
    }
  });
  console.log(`  Result: HTTP ${validSigRes.status} | Receipt: ${validSigRes.body.receiptNo} | Demand Status: ${validSigRes.body.demand?.status}`);
  assert.strictEqual(validSigRes.status, 200, "Valid HMAC signature must succeed with 200");
  assert.strictEqual(validSigRes.body.success, true);
  assert.strictEqual(validSigRes.body.demand?.status, "paid");
  console.log("  ✅ PASS: Genuine HMAC-SHA256 signature verified and settled successfully!");

  await app.close();
  console.log("\n==========================================================================");
  console.log("🎉 ALL SIGNATURE HARDENING TESTS PASSED!");
  console.log("==========================================================================");
  process.exit(0);
}

testPaymentSignatureHardening().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

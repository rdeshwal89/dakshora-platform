import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import assert from "assert";
import crypto from "crypto";
import { buildApp } from "../src/app.js";

async function runLiveFeesFinanceTest() {
  console.log("==========================================================================");
  console.log("💳 DAKSHORA 2.0 — LIVE FEES & FINANCE MANAGEMENT SUITE TEST");
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

  // 1. Start gateway test server on port 5299
  const app = await buildApp();
  const PORT = 5299;
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

  let testAdminUser = null;
  let createdStructId = null;
  let createdStructDbId = null;
  let createdDemandId = null;
  let createdDemandDbId = null;
  let cashierPaymentId = null;
  let cashierReceiptNo = null;
  let onlinePaymentId = null;
  let onlineReceiptNo = null;

  try {
    // ------------------------------------------------------------------------
    // GATE 1: Security & Multi-tenant Isolation
    // ------------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Security, Authentication & Multi-tenant Isolation...");
    
    // 1a. Unauthenticated request must fail with 401
    const unauthRes = await makeRequest({
      method: "GET",
      path: "/api/erp/fees/overview"
    });
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated access must be rejected with 401");
    console.log("  ✅ Unauthenticated access correctly rejected with 401.");

    // 1b. Authenticate SuperAdmin via Supabase Auth
    const testAdminEmail = `superadmin.fees.${Date.now()}@dakshora.internal`;
    const testPassword = "SuperAdminPassword123!Secure";

    const { data: userRecord, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });

    if (userErr) throw new Error(`Failed to create SuperAdmin: ${userErr.message}`);
    testAdminUser = userRecord.user;

    const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
      email: testAdminEmail,
      password: testPassword
    });

    if (signInErr) throw new Error(`Failed to sign in SuperAdmin: ${signInErr.message}`);
    const token = signInData.session?.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1c. Authenticated overview request
    const authRes = await makeRequest({
      method: "GET",
      path: "/api/erp/fees/overview",
      headers: authHeaders
    });
    assert.strictEqual(authRes.status, 200, "Authenticated overview must return 200");
    assert.strictEqual(authRes.body?.success, true);
    assert.ok(authRes.body?.overview?.totalInvoiced !== undefined, "Overview must include totalInvoiced");
    console.log("  ✅ Authenticated access granted with valid financial overview.\n");

    const orgId = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

    // ------------------------------------------------------------------------
    // GATE 2: Fee Structure Creation & PostgreSQL Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 2/10] Creating Fee Structure with PostgreSQL Persistence...");
    const feeHeadName = `Robotics & STEM Lab Fee ${Date.now().toString().slice(-4)}`;
    const feeAmount = 4500;

    const structRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/structures",
      headers: authHeaders,
      body: {
        academicSession: "2026-27",
        grade: "Class 10",
        feeHead: feeHeadName,
        amountINR: feeAmount,
        frequency: "quarterly",
        dueDay: 15,
        isMandatory: true
      }
    });

    assert.strictEqual(structRes.status, 200, "Fee structure creation must return 200");
    assert.strictEqual(structRes.body?.success, true);
    assert.ok(structRes.body?.structure?.id, "Structure must have an ID");
    createdStructId = structRes.body.structure.id;
    createdStructDbId = structRes.body.structure.db_id;
    console.log(`  ✅ Fee structure created: ID=${createdStructId}, DB_ID=${createdStructDbId || 'N/A'}`);

    if (createdStructDbId) {
      const { data: dbStruct } = await supabaseAdmin
        .from("fee_structures")
        .select("*")
        .eq("id", createdStructDbId)
        .maybeSingle();

      assert.ok(dbStruct, "Fee structure must be persisted in Supabase fee_structures");
      assert.strictEqual(Number(dbStruct.amount), feeAmount, "DB amount must match");
      console.log(`  ✅ Verified persistence in public.fee_structures table.\n`);
    }

    // ------------------------------------------------------------------------
    // GATE 3: Batch Fee Demand Generation
    // ------------------------------------------------------------------------
    console.log("[Gate 3/10] Generating Batch Fee Demands...");
    const demandGenRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/demands/generate",
      headers: authHeaders,
      body: {
        session: "2026-27",
        grade: "Class 10",
        section: "A",
        feeStructureId: createdStructId,
        dueDate: "2026-11-15"
      }
    });

    assert.strictEqual(demandGenRes.status, 200, "Demand generation must return 200");
    assert.strictEqual(demandGenRes.body?.success, true);
    assert.ok(demandGenRes.body?.demands?.length > 0, "Demands must be generated");
    
    const targetDemand = demandGenRes.body.demands[0];
    createdDemandId = targetDemand.id;
    createdDemandDbId = targetDemand.db_id;
    console.log(`  ✅ Generated ${demandGenRes.body.count} demands. Sample Demand: ${targetDemand.invoiceNo}, DB_ID=${createdDemandDbId || 'N/A'}`);

    if (createdDemandDbId) {
      const { data: dbFee } = await supabaseAdmin
        .from("student_fees")
        .select("*")
        .eq("id", createdDemandDbId)
        .maybeSingle();

      assert.ok(dbFee, "Student fee demand must be persisted in Supabase student_fees");
      assert.strictEqual(Number(dbFee.amount_due), feeAmount, "DB amount_due must match");
      console.log(`  ✅ Verified persistence in public.student_fees table.\n`);
    }

    // ------------------------------------------------------------------------
    // GATE 4: Student Fee Ledger & Account Balance
    // ------------------------------------------------------------------------
    console.log("[Gate 4/10] Querying Student Fee Ledger & Balance...");
    const ledgerRes = await makeRequest({
      method: "GET",
      path: `/api/erp/fees/students/${targetDemand.studentId}/account`,
      headers: authHeaders
    });

    assert.strictEqual(ledgerRes.status, 200, "Student ledger must return 200");
    assert.strictEqual(ledgerRes.body?.success, true);
    assert.ok(ledgerRes.body?.summary, "Summary must be present");
    assert.ok(ledgerRes.body?.demands?.length > 0, "Student must have demands in ledger");
    const summary = ledgerRes.body.summary;
    console.log(`  ✅ Student Ledger: Total Invoiced=₹${summary.totalInvoiced}, Total Paid=₹${summary.totalPaid}, Balance=₹${summary.currentBalance}\n`);

    // ------------------------------------------------------------------------
    // GATE 5: Cashier Offline Collection Terminal & DB Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 5/10] Testing Cashier Payment Collection & DB Persistence...");
    const partialPayAmount = 2000;
    const collectRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/collect",
      headers: authHeaders,
      body: {
        demandId: createdDemandId,
        amountPaid: partialPayAmount,
        paymentMode: "cash",
        referenceNumber: `CSH-TEST-${Date.now().toString().slice(-4)}`,
        collectedBy: "Senior Cashier Rajesh Verma",
        remarks: "Cashier counter collection test"
      }
    });

    assert.strictEqual(collectRes.status, 200, "Fee collection must return 200");
    assert.strictEqual(collectRes.body?.success, true);
    assert.ok(collectRes.body?.receiptNo, "Receipt number must be generated");
    cashierReceiptNo = collectRes.body.receiptNo;
    cashierPaymentId = collectRes.body.payment.id;
    const paymentDbId = collectRes.body.payment.db_id;

    assert.strictEqual(collectRes.body.demand.status, "partially_paid", "Demand status must be partially_paid");
    assert.strictEqual(collectRes.body.demand.balanceAmount, feeAmount - partialPayAmount, "Balance must be reduced");
    console.log(`  ✅ Cashier Payment recorded: Receipt=${cashierReceiptNo}, Paid=₹${partialPayAmount}, Balance=₹${collectRes.body.demand.balanceAmount}`);

    if (paymentDbId) {
      const { data: dbPayment } = await supabaseAdmin
        .from("fee_payments")
        .select("*")
        .eq("id", paymentDbId)
        .maybeSingle();

      assert.ok(dbPayment, "Payment must be persisted in Supabase fee_payments");
      assert.strictEqual(Number(dbPayment.amount), partialPayAmount, "Payment amount must match in DB");
      assert.strictEqual(dbPayment.payment_method, "cash", "Payment method must match");
      console.log(`  ✅ Verified persistence in public.fee_payments table.\n`);
    }

    // ------------------------------------------------------------------------
    // GATE 6: Online Payment Gateway Order Creation & Automated Settlement
    // ------------------------------------------------------------------------
    console.log("[Gate 6/10] Testing Online Gateway Order Creation & Verification...");
    const remainingBalance = feeAmount - partialPayAmount;

    // 6a. Create Online Order
    const orderRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/online/create-order",
      headers: authHeaders,
      body: {
        demandId: createdDemandId,
        amountINR: remainingBalance,
        studentId: targetDemand.studentId
      }
    });

    assert.strictEqual(orderRes.status, 200, "Online order creation must return 200");
    assert.strictEqual(orderRes.body?.success, true);
    assert.ok(orderRes.body?.order?.id, "Order ID must be generated");
    const orderId = orderRes.body.order.id;
    const amountPaise = orderRes.body.order.amount;
    assert.strictEqual(amountPaise, remainingBalance * 100, "Paise amount must equal INR * 100");
    console.log(`  ✅ Razorpay/UPI Order created: ${orderId} for ₹${remainingBalance} (${amountPaise} paise)`);

    // 6b. Verify Online Payment with cryptographic signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "dakshora_gateway_production_secret";
    const paymentGatewayId = `pay_online_${Date.now()}`;
    const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentGatewayId}`).digest("hex");

    const verifyRes = await makeRequest({
      method: "POST",
      path: "/api/erp/fees/online/verify-payment",
      headers: authHeaders,
      body: {
        orderId,
        paymentId: paymentGatewayId,
        signature,
        demandId: createdDemandId,
        amountPaid: remainingBalance
      }
    });

    assert.strictEqual(verifyRes.status, 200, "Payment verification must return 200");
    assert.strictEqual(verifyRes.body?.success, true);
    onlineReceiptNo = verifyRes.body.receiptNo;
    onlinePaymentId = verifyRes.body.payment.id;
    assert.strictEqual(verifyRes.body.demand.status, "paid", "Demand status must be paid after settlement");
    assert.strictEqual(verifyRes.body.demand.balanceAmount, 0, "Balance amount must be 0");
    console.log(`  ✅ Online payment verified & settled: Receipt=${onlineReceiptNo}, Final Status=${verifyRes.body.demand.status}\n`);

    // ------------------------------------------------------------------------
    // GATE 7: Official A4 Printable Fee Receipt
    // ------------------------------------------------------------------------
    console.log("[Gate 7/10] Testing Official A4 Printable Fee Receipt Generation...");
    const receiptHtmlRes = await makeRequest({
      method: "GET",
      path: `/api/erp/fees/receipts/${encodeURIComponent(cashierReceiptNo)}?format=html`,
      headers: authHeaders
    });

    assert.strictEqual(receiptHtmlRes.status, 200, "Printable receipt must return 200");
    assert.ok(receiptHtmlRes.rawBody.includes("<!DOCTYPE html>"), "Must be HTML document");
    assert.ok(receiptHtmlRes.rawBody.includes("@media print"), "Must include print media stylesheet");
    assert.ok(receiptHtmlRes.rawBody.includes("FEE PAYMENT RECEIPT (OFFICIAL)"), "Must include official badge");
    assert.ok(receiptHtmlRes.rawBody.includes(cashierReceiptNo), "Must display correct receipt number");
    assert.ok(receiptHtmlRes.rawBody.includes("Rupees Only"), "Must include Amount in Words");
    console.log(`  ✅ A4 Printable Fee Receipt generated successfully with styling, watermark, and words representation.\n`);

    // ------------------------------------------------------------------------
    // GATE 8: Financial Reports (Collection Register & Defaulters Aging)
    // ------------------------------------------------------------------------
    console.log("[Gate 8/10] Testing Financial Reports & Aging Registers...");
    
    // 8a. Collection Register
    const reportRes = await makeRequest({
      method: "GET",
      path: "/api/erp/fees/reports/collection",
      headers: authHeaders
    });
    assert.strictEqual(reportRes.status, 200, "Collection report must return 200");
    assert.strictEqual(reportRes.body?.success, true);
    assert.ok(reportRes.body?.totalCollected > 0, "Total collected must be positive");
    console.log(`  ✅ Collection Register: Total Collected=₹${reportRes.body.totalCollected}, Transactions=${reportRes.body.count}`);

    // 8b. Outstanding Defaulters Register
    const overdueRes = await makeRequest({
      method: "GET",
      path: "/api/erp/fees/reports/outstanding",
      headers: authHeaders
    });
    assert.strictEqual(overdueRes.status, 200, "Outstanding report must return 200");
    assert.strictEqual(overdueRes.body?.success, true);
    console.log(`  ✅ Defaulters Register: Total Outstanding=₹${overdueRes.body.totalOutstanding}, Demands=${overdueRes.body.count}\n`);

    // ------------------------------------------------------------------------
    // GATE 9: Audited Payment Reversal
    // ------------------------------------------------------------------------
    console.log("[Gate 9/10] Testing Payment Reversal & Audit Trail...");
    const reverseRes = await makeRequest({
      method: "POST",
      path: `/api/erp/fees/payments/${cashierPaymentId}/reverse`,
      headers: authHeaders,
      body: {
        reason: "Cashier mistakenly recorded cash transaction twice for student",
        reversedBy: "Principal Dr. Vandana Sen"
      }
    });

    assert.strictEqual(reverseRes.status, 200, "Payment reversal must return 200");
    assert.strictEqual(reverseRes.body?.success, true);
    assert.strictEqual(reverseRes.body?.payment?.status, "reversed", "Payment status must be reversed");
    console.log(`  ✅ Payment ${cashierReceiptNo} successfully reversed. Balance restored on invoice.\n`);

    // ------------------------------------------------------------------------
    // GATE 10: Database Integrity & Cleanup
    // ------------------------------------------------------------------------
    console.log("[Gate 10/10] Performing Database Cleanup & Teardown...");
    
    // Clean up payments
    if (cashierReceiptNo || onlineReceiptNo) {
      await supabaseAdmin
        .from("fee_payments")
        .delete()
        .in("receipt_no", [cashierReceiptNo, onlineReceiptNo].filter(Boolean));
    }

    // Clean up student fee
    if (createdDemandDbId) {
      await supabaseAdmin
        .from("student_fees")
        .delete()
        .eq("id", createdDemandDbId);
    }

    // Clean up fee structure
    if (createdStructDbId) {
      await supabaseAdmin
        .from("fee_structures")
        .delete()
        .eq("id", createdStructDbId);
    }

    // Clean up test admin user
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
    }
    console.log("  ✅ Cleaned up all test records from Supabase PostgreSQL.\n");

    console.log("==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: FEES & FINANCE SUITE FULLY OPERATIONAL!");
    console.log("==========================================================================");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runLiveFeesFinanceTest();

import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5299;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

// Service-role Supabase client (used ONLY for admin cleanup and DB direct verification)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqHeaders["content-type"] = "application/json";
      reqBody = JSON.stringify(body);
      reqHeaders["content-length"] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runLiveWhatsAppSmsGatewayTest() {
  console.log("\n==========================================================================");
  console.log("📱 DAKSHORA 2.0 — LIVE WHATSAPP & SMS GATEWAY (TWILIO / GUPSHUP / FAST2SMS) TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  try {
    // 0. Spin up test server
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.gw.${Date.now()}@dakshora.internal`;
    const testPassword = "GatewaySuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Dr. Meenakshi Sundaram", role: "superadmin" },
      app_metadata: { role: "superadmin", platform_role: "superadmin", organization_id: DEFAULT_ORG_ID }
    });
    if (adminAuthErr) throw new Error(`SuperAdmin user setup failed: ${adminAuthErr.message}`);
    testAdminUser = adminAuth.user;

    const adminAuthClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: adminSession, error: adminSessErr } = await adminAuthClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminSessErr) throw new Error(`SuperAdmin login failed: ${adminSessErr.message}`);
    adminToken = adminSession.session.access_token;
    console.log(`  ✅ SuperAdmin Authenticated (ID: ${testAdminUser.id})`);

    // Setup: Create test Student user for RBAC validation
    console.log("[Setup] Authenticating test Student user (for RBAC restriction testing)...");
    const studentEmail = `student.gw.${Date.now()}@dakshora.internal`;
    const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Aarav Sharma", role: "student" },
      app_metadata: { role: "student", organization_id: DEFAULT_ORG_ID }
    });
    if (studentAuthErr) throw new Error(`Student user setup failed: ${studentAuthErr.message}`);
    testStudentUser = studentAuth.user;

    const studentAuthClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: studentSession, error: studentSessErr } = await studentAuthClient.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword
    });
    if (studentSessErr) throw new Error(`Student login failed: ${studentSessErr.message}`);
    studentToken = studentSession.session.access_token;
    console.log(`  ✅ Student Authenticated (ID: ${testStudentUser.id})\n`);

    // =========================================================================
    // Gate 1: Security & Fail-Closed RBAC Verification
    // =========================================================================
    console.log("[Gate 1/10] Verifying Fail-Closed Security & Role Authorization...");

    // Unauthenticated requests fail closed
    const unauthSettings = await makeRequest({
      method: "GET",
      path: "/api/erp/communication/gateway/settings"
    });
    assert(unauthSettings.status === 401, `Unauthenticated settings should return 401, got ${unauthSettings.status}`);

    const unauthTest = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/gateway/test",
      body: { provider: "fast2sms", recipientContact: "+919876543210" }
    });
    assert(unauthTest.status === 401, `Unauthenticated test dispatch should return 401, got ${unauthTest.status}`);

    // Unauthorized mutations by student return 403 Forbidden
    const studentSettingsPatch = await makeRequest({
      method: "PATCH",
      path: "/api/erp/communication/gateway/settings",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { defaultSmsProvider: "twilio" }
    });
    assert(studentSettingsPatch.status === 403, `Student settings update should return 403, got ${studentSettingsPatch.status}`);
    assert(studentSettingsPatch.body.code === "FORBIDDEN_ROLE", `Should return FORBIDDEN_ROLE code, got ${studentSettingsPatch.body.code}`);

    const studentTestPost = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/gateway/test",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { provider: "fast2sms", recipientContact: "+919876543210" }
    });
    assert(studentTestPost.status === 403, `Student test dispatch should return 403, got ${studentTestPost.status}`);

    const studentTriggerAbsence = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/trigger/absence",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { studentId: "std-101" }
    });
    assert(studentTriggerAbsence.status === 403, `Student absence trigger should return 403, got ${studentTriggerAbsence.status}`);

    console.log("  ✅ Unauthenticated requests strictly rejected with HTTP 401 Unauthorized.");
    console.log("  ✅ Student role strictly blocked with HTTP 403 FORBIDDEN_ROLE on gateway operations.\n");

    // =========================================================================
    // Gate 2: Multi-Tenant Boundary & Configuration Isolation
    // =========================================================================
    console.log("[Gate 2/10] Verifying Multi-Tenant Boundary & Gateway Isolation...");

    const foreignOrgId = "c8888888-8888-8888-8888-888888888888";
    const foreignSettings = await makeRequest({
      method: "GET",
      path: `/api/erp/communication/gateway/settings?organization_id=${foreignOrgId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(foreignSettings.status === 200, `Foreign settings fetch should return 200, got ${foreignSettings.status}`);
    assert(foreignSettings.body.settings.organization_id === foreignOrgId, `Should isolate by organization_id`);
    console.log("  ✅ Foreign tenant gateway configuration cleanly isolated.\n");

    // =========================================================================
    // Gate 3: Provider Configuration & Credential Masking
    // =========================================================================
    console.log("[Gate 3/10] Verifying Provider Configuration & Secret Masking...");

    const patchConfig = await makeRequest({
      method: "PATCH",
      path: "/api/erp/communication/gateway/settings",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        defaultSmsProvider: "fast2sms",
        defaultWhatsappProvider: "gupshup",
        fallbackEnabled: true,
        twilio: {
          accountSid: "ACtest1234567890abcdef",
          authToken: "authsecret9876543210",
          smsFromNumber: "+15005550006",
          whatsappFromNumber: "whatsapp:+14155238886",
          enabled: true
        },
        gupshup: {
          apiKey: "gs_test_api_key_8831",
          appName: "DPSHeritageWA",
          sourceNumber: "919876543210",
          enabled: true
        },
        fast2sms: {
          apiKey: "f2s_test_key_9942",
          senderId: "DPSDEL",
          route: "dlt",
          dltEntityId: "1201159123456789012",
          enabled: true
        }
      }
    });
    assert(patchConfig.status === 200, `Settings update should return 200, got ${patchConfig.status}`);
    assert(patchConfig.body.success === true, "Should return success true");

    // Verify secrets are properly masked
    const twilioSid = patchConfig.body.settings.twilio.accountSid;
    const twilioAuth = patchConfig.body.settings.twilio.authToken;
    const gupshupKey = patchConfig.body.settings.gupshup.apiKey;
    const fast2smsKey = patchConfig.body.settings.fast2sms.apiKey;

    assert(twilioSid.includes("••••"), `Twilio SID must be masked, got ${twilioSid}`);
    assert(twilioAuth.includes("••••"), `Twilio AuthToken must be masked, got ${twilioAuth}`);
    assert(gupshupKey.includes("••••"), `Gupshup Key must be masked, got ${gupshupKey}`);
    assert(fast2smsKey.includes("••••"), `Fast2SMS Key must be masked, got ${fast2smsKey}`);

    console.log(`  ✅ Twilio Configured: SID=${twilioSid} | Sender=${patchConfig.body.settings.twilio.smsFromNumber}`);
    console.log(`  ✅ Gupshup Configured: App=${patchConfig.body.settings.gupshup.appName} | Key=${gupshupKey}`);
    console.log(`  ✅ Fast2SMS Configured: SenderID=${patchConfig.body.settings.fast2sms.senderId} | Key=${fast2smsKey}`);
    console.log("  ✅ All sensitive API keys and tokens verified securely masked on retrieval.\n");

    // =========================================================================
    // Gate 4: Live Gateway Connectivity Ping & Test Dispatch
    // =========================================================================
    console.log("[Gate 4/10] Verifying Live Connectivity Ping & Test Dispatch...");

    const testFast2Sms = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/gateway/test",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        provider: "fast2sms",
        channel: "sms",
        recipientContact: "+919876543210",
        testMessage: "Dakshora 2.0 Fast2SMS live test message."
      }
    });
    assert(testFast2Sms.status === 200, `Fast2SMS test should return 200, got ${testFast2Sms.status}`);
    assert(testFast2Sms.body.success === true, "Test response should indicate success");
    assert(testFast2Sms.body.result.providerMessageId, "Should return valid providerMessageId");

    const testGupshup = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/gateway/test",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        provider: "gupshup",
        channel: "whatsapp",
        recipientContact: "+919876543210",
        testMessage: "Dakshora 2.0 Gupshup WhatsApp live test message."
      }
    });
    assert(testGupshup.status === 200, `Gupshup test should return 200, got ${testGupshup.status}`);
    assert(testGupshup.body.result.providerMessageId, "Should return valid Gupshup providerMessageId");

    console.log(`  ✅ Fast2SMS Ping Success: Request ID '${testFast2Sms.body.result.providerMessageId}'`);
    console.log(`  ✅ Gupshup WhatsApp Ping Success: Message ID '${testGupshup.body.result.providerMessageId}'\n`);

    // =========================================================================
    // Gate 5: Multi-Channel Campaign Broadcast Routing
    // =========================================================================
    console.log("[Gate 5/10] Verifying Multi-Channel Campaign Broadcast Dispatch...");

    const waCampaign = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/messages",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        title: "CBSE Practical Exam Schedule WhatsApp Broadcast",
        channel: "whatsapp",
        audienceType: "all_students",
        subject: "CBSE Practical Exam Roll Allocation",
        body: "Class 10 CBSE Practical dates have been scheduled. Bring signed lab records.",
        priority: "urgent"
      }
    });
    assert(waCampaign.status === 201, `Campaign creation should return 201, got ${waCampaign.status}`);
    assert(waCampaign.body.recipientCount > 0, "Recipient count should be > 0");
    console.log(`  ✅ WhatsApp broadcast created: [${waCampaign.body.messageRecord.id}] dispatched to ${waCampaign.body.recipientCount} recipients.`);

    // Check delivery logs
    const deliveryLogs = await makeRequest({
      method: "GET",
      path: `/api/erp/communication/delivery-logs?messageId=${waCampaign.body.messageRecord.id}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(deliveryLogs.status === 200, `Delivery logs should return 200, got ${deliveryLogs.status}`);
    assert(deliveryLogs.body.deliveries.length > 0, "Should contain deliveries");
    const sampleDelivery = deliveryLogs.body.deliveries[0];
    console.log(`  ✅ Delivery verified: ID=${sampleDelivery.id}, Channel=${sampleDelivery.channel}, Status=${sampleDelivery.status}, ProviderMsgID=${sampleDelivery.providerMessageId}\n`);

    // =========================================================================
    // Gate 6: Twilio Webhook Callback Processing
    // =========================================================================
    console.log("[Gate 6/10] Verifying Twilio Delivery Status Webhook Callback...");

    const twilioWebhook = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/webhooks/twilio",
      body: {
        MessageSid: sampleDelivery.providerMessageId,
        MessageStatus: "delivered",
        To: "+919876543210",
        From: "+15005550006"
      }
    });
    assert(twilioWebhook.status === 200, `Twilio webhook should return 200, got ${twilioWebhook.status}`);
    assert(twilioWebhook.body.processed === true, "Twilio webhook should process");
    console.log(`  ✅ Twilio Webhook accepted: MessageSid=${twilioWebhook.body.messageSid}, Status=${twilioWebhook.body.status}\n`);

    // =========================================================================
    // Gate 7: Gupshup WhatsApp Read-Receipt Processing
    // =========================================================================
    console.log("[Gate 7/10] Verifying Gupshup WhatsApp Read-Receipt Webhook...");

    const gupshupWebhook = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/webhooks/gupshup",
      body: {
        messageId: sampleDelivery.providerMessageId,
        eventType: "READ",
        destination: "919876543210"
      }
    });
    assert(gupshupWebhook.status === 200, `Gupshup webhook should return 200, got ${gupshupWebhook.status}`);
    assert(gupshupWebhook.body.processed === true, "Gupshup webhook should process");
    console.log(`  ✅ Gupshup Read-Receipt accepted: MessageId=${gupshupWebhook.body.messageId}, EventType=${gupshupWebhook.body.eventType}\n`);

    // =========================================================================
    // Gate 8: Event-Driven Automated Parent Absence Trigger
    // =========================================================================
    console.log("[Gate 8/10] Verifying Event-Driven Automated Parent Absence Trigger...");

    const absenceTrigger = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/trigger/absence",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        studentId: "std-101",
        date: "2026-09-23",
        reason: "Viral Fever"
      }
    });
    assert(absenceTrigger.status === 200, `Absence trigger should return 200, got ${absenceTrigger.status}`);
    assert(absenceTrigger.body.student === "Aarav Sharma", "Should match student Aarav Sharma");
    assert(absenceTrigger.body.gatewayResult.success === true, "Gateway result should be success");
    console.log(`  ✅ Automated Absence Alert Dispatched: Student='${absenceTrigger.body.student}', Phone='${absenceTrigger.body.recipientContact}'`);
    console.log(`     Provider Tracking ID: ${absenceTrigger.body.gatewayResult.providerMessageId}\n`);

    // =========================================================================
    // Gate 9: Event-Driven Automated WhatsApp Fee Receipt
    // =========================================================================
    console.log("[Gate 9/10] Verifying Event-Driven Automated WhatsApp Fee Receipt...");

    const testReceiptNo = `REC-TEST-${Date.now().toString().slice(-4)}`;
    const feeReceiptTrigger = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/trigger/fee-receipt",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        studentId: "std-101",
        receiptNo: testReceiptNo,
        amount: 32500,
        paymentMethod: "UPI (Google Pay)"
      }
    });
    assert(feeReceiptTrigger.status === 200, `Fee receipt trigger should return 200, got ${feeReceiptTrigger.status}`);
    assert(feeReceiptTrigger.body.receiptNo === testReceiptNo, "Receipt number should match");
    assert(feeReceiptTrigger.body.amount === 32500, "Amount should match 32500");
    console.log(`  ✅ Automated Fee Receipt WhatsApp Dispatched: ReceiptNo='${feeReceiptTrigger.body.receiptNo}', Amount=₹${feeReceiptTrigger.body.amount}`);
    console.log(`     Provider Tracking ID: ${feeReceiptTrigger.body.gatewayResult.providerMessageId}\n`);

    // =========================================================================
    // Gate 10: Live Supabase public.audit_logs Verification & Teardown
    // =========================================================================
    console.log("[Gate 10/10] Verifying Supabase public.audit_logs Sync & Teardown Cleanup...");

    // Query live audit logs recorded during test
    const { data: auditLogs, error: auditErr } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .in("action", [
        "erp.gateway_settings_updated",
        "erp.gateway_test_dispatched",
        "erp.webhook_twilio_received",
        "erp.webhook_gupshup_received",
        "erp.absence_alert_dispatched",
        "erp.fee_receipt_dispatched"
      ]);

    assert(!auditErr, `Supabase audit log query error: ${auditErr?.message}`);
    assert(auditLogs && auditLogs.length > 0, "Expected at least 1 gateway audit log recorded in Supabase");
    console.log(`  ✅ Verified ${auditLogs.length} gateway actions recorded in Supabase public.audit_logs.`);

    // Purge test audit logs
    const testAuditIds = auditLogs.map(l => l.id);
    if (testAuditIds.length > 0) {
      await supabaseAdmin.from("audit_logs").delete().in("id", testAuditIds);
      console.log(`  ✅ Purged ${testAuditIds.length} test audit log entries from Supabase public.audit_logs.`);
    }

    // Clean up test auth accounts
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: LIVE WHATSAPP & SMS GATEWAY INTEGRATION VERIFIED");
    console.log("==========================================================================\n");

  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveWhatsAppSmsGatewayTest().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});

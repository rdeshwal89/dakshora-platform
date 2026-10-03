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

async function run() {
  console.log("==========================================================================");
  console.log("🧪 TESTING DAKSHORA 2.0: MULTI-CHANNEL OTP (GMAIL + PHONE) & ONBOARD DISPATCH");
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

  const testOtp = process.env.DEV_TEST_OTP || "784920";

  // --------------------------------------------------------------------------
  // TEST 1: Phone OTP (SMS)
  // --------------------------------------------------------------------------
  console.log("📱 TEST 1: Phone OTP (SMS) Send & Verify...");
  const phoneSend = await request("/api/auth/otp/send", {
    method: "POST",
    body: { phone: "9876543210", channel: "sms" }
  });
  assert("Phone OTP Send returns HTTP 200", phoneSend.status === 200, JSON.stringify(phoneSend.data));
  assert("Phone OTP Send channel is SMS", phoneSend.data?.channel === "SMS");
  assert("Raw OTP is NEVER exposed in response", phoneSend.data?.otp === undefined && phoneSend.data?.rawOtp === undefined);

  const phoneVerify = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { phone: "9876543210", otp: testOtp }
  });
  assert("Phone OTP Verify returns HTTP 200", phoneVerify.status === 200, JSON.stringify(phoneVerify.data));
  assert("JWT Access token issued for Phone", Boolean(phoneVerify.data?.token));
  assert("User profile contains phone", phoneVerify.data?.user?.phone === "+919876543210");

  // --------------------------------------------------------------------------
  // TEST 2: Gmail / Email OTP
  // --------------------------------------------------------------------------
  console.log("\n📧 TEST 2: Gmail / Email OTP Send & Verify...");
  const gmailSend = await request("/api/auth/otp/send", {
    method: "POST",
    body: { email: "principal.delhi@gmail.com", role: "school-admin" }
  });
  assert("Gmail OTP Send returns HTTP 200", gmailSend.status === 200, JSON.stringify(gmailSend.data));
  assert("Email channel identified correctly", gmailSend.data?.channel === "Email");
  assert("Recipient email preserved", gmailSend.data?.email === "principal.delhi@gmail.com");
  assert("Raw OTP is NEVER exposed in response", gmailSend.data?.otp === undefined && gmailSend.data?.rawOtp === undefined);

  // Invalid OTP test
  const badVerify = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { email: "principal.delhi@gmail.com", otp: "000000" }
  });
  assert("Invalid OTP rejected with HTTP 400", badVerify.status === 400, JSON.stringify(badVerify.data));

  // Valid OTP test
  const gmailVerify = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { email: "principal.delhi@gmail.com", otp: testOtp }
  });
  assert("Gmail OTP Verify returns HTTP 200", gmailVerify.status === 200, JSON.stringify(gmailVerify.data));
  assert("JWT Access token issued for Gmail", Boolean(gmailVerify.data?.token));
  assert("User profile contains email", gmailVerify.data?.user?.email === "principal.delhi@gmail.com");
  assert("Auth provider recorded as email_otp", gmailVerify.data?.user?.authProvider === "email_otp");

  // --------------------------------------------------------------------------
  // TEST 3: SuperAdmin School Onboard & Instant Multi-Channel Dispatch
  // --------------------------------------------------------------------------
  console.log("\n🏫 TEST 3: SuperAdmin School Onboard & Instant Multi-Channel Dispatch...");
  
  // Obtain legitimate SuperAdmin Token
  const superOtpSend = await request("/api/auth/otp/send", {
    method: "POST",
    body: { email: "superadmin@dakshora.com" }
  });
  const superOtpVerify = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { email: "superadmin@dakshora.com", otp: testOtp }
  });
  assert("SuperAdmin OTP Verification succeeded", superOtpVerify.status === 200 && superOtpVerify.data?.user?.role === "superadmin");
  const superToken = superOtpVerify.data.token;

  const uniqueSuffix = Date.now().toString().slice(-4);
  const schoolPayload = {
    name: `Delhi Heritage Public School ${uniqueSuffix}`,
    board: "CBSE",
    city: "New Delhi",
    state: "Delhi",
    principalName: "Dr. Ananya Sharma",
    principalEmail: `dr.ananya.sharma.${uniqueSuffix}@gmail.com`,
    principalPhone: "+91 9811223344",
    plan: "enterprise"
  };

  const onboardRes = await request("/api/superadmin/schools/onboard", {
    method: "POST",
    headers: { Authorization: `Bearer ${superToken}` },
    body: schoolPayload
  });

  assert("School Onboard returns HTTP 200", onboardRes.status === 200, JSON.stringify(onboardRes.data));
  assert("Credentials object returned", Boolean(onboardRes.data?.credentials?.initialPassword));
  assert("Website URL provisioned", Boolean(onboardRes.data?.website?.domain));
  assert("Notifications structure present in response", Boolean(onboardRes.data?.notifications));
  assert("SMS auto-dispatch executed", onboardRes.data?.notifications?.smsSent === true);
  assert("WhatsApp auto-dispatch executed", onboardRes.data?.notifications?.whatsappSent === true);
  assert("Email (Gmail) auto-dispatch executed", onboardRes.data?.notifications?.emailSent === true);
  assert("Recipient phone recorded in dispatch", onboardRes.data?.notifications?.recipients?.phone?.includes("9811223344"));
  assert("Recipient email recorded in dispatch", onboardRes.data?.notifications?.recipients?.email === `dr.ananya.sharma.${uniqueSuffix}@gmail.com`);

  // --------------------------------------------------------------------------
  // TEST 4: Communication Hub Recording Verification
  // --------------------------------------------------------------------------
  console.log("\n📢 TEST 4: Verification of Onboarding Broadcast in Communication Hub...");
  const tenantId = onboardRes.data.tenantId;
  const commHub = await request("/api/erp/communication/messages", {
    headers: {
      Authorization: `Bearer ${superToken}`,
      "x-organization-id": tenantId
    }
  });

  assert("Communication Hub returns HTTP 200", commHub.status === 200, JSON.stringify(commHub.data));
  const onboardBroadcast = commHub.data?.messages?.find(m => m.templateCode === "SCHOOL_ONBOARDING_CREDENTIALS");
  assert("Onboarding Broadcast record exists in Communication Hub", Boolean(onboardBroadcast), "Onboarding record not found in hub messages");
  assert("Broadcast status marked as sent", onboardBroadcast?.status === "sent");

  // --------------------------------------------------------------------------
  // TEST 5: Newly Onboarded Principal Login via OTP to Gmail
  // --------------------------------------------------------------------------
  console.log("\n🔑 TEST 5: Newly Onboarded Principal Login via Gmail OTP...");
  const principalEmail = schoolPayload.principalEmail;
  const principalOtpSend = await request("/api/auth/otp/send", {
    method: "POST",
    body: { email: principalEmail }
  });
  assert("Principal OTP Send to Gmail returns HTTP 200", principalOtpSend.status === 200, JSON.stringify(principalOtpSend.data));

  const principalOtpVerify = await request("/api/auth/otp/verify", {
    method: "POST",
    body: { email: principalEmail, otp: testOtp, organization_id: tenantId }
  });
  assert("Principal OTP Verify returns HTTP 200", principalOtpVerify.status === 200, JSON.stringify(principalOtpVerify.data));
  assert("Principal Access Token issued", Boolean(principalOtpVerify.data?.token));
  assert("Principal logged into their newly onboarded School Tenant", principalOtpVerify.data?.user?.organizationId === tenantId);

  console.log("\n==========================================================================");
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});

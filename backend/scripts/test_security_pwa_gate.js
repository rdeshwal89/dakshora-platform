// DAKSHORA 2.0 Security, PWA, & Production Verification Test Suite
// Run via: node backend/scripts/test_security_pwa_gate.js

const API_BASE = process.env.API_BASE || "http://127.0.0.1:5000";
const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("🔒 DAKSHORA 2.0 SECURITY, PWA & PRODUCTION VERIFICATION SUITE");
  console.log(`Target Backend: ${API_BASE}`);
  console.log(`Target Frontend: ${FRONTEND_BASE}`);
  console.log("================================================================================\n");

  // TEST 1: Rate Limiting on /api/auth/otp/send (Max 5 per minute)
  console.log("--- 1. Security: OTP Send Rate Limiter (Max 5/min) ---");
  const testPhone = "+919999900001";
  let got429 = false;
  let retryAfter = null;

  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${API_BASE}/api/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, channel: "sms" })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      got429 = true;
      retryAfter = res.headers.get("retry-after");
      break;
    }
  }
  assert(got429, "Rate limiter triggers HTTP 429 after 5 rapid OTP send attempts");
  assert(retryAfter !== null && Number(retryAfter) > 0, `Retry-After header returned: ${retryAfter}s`);

  // TEST 2: Rate Limiting on /api/auth/otp/verify (Max 10 per minute)
  console.log("\n--- 2. Security: OTP Verify Rate Limiter (Max 10/min) ---");
  let gotVerify429 = false;
  const verifyPhone = "+919999900002";

  for (let i = 1; i <= 11; i++) {
    const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: verifyPhone, otp: "000000" })
    });
    if (res.status === 429) {
      gotVerify429 = true;
      break;
    }
  }
  assert(gotVerify429, "Rate limiter triggers HTTP 429 on /api/auth/otp/verify after 10 failed attempts");

  // TEST 3: CORS Security Validation
  console.log("\n--- 3. Security: CORS Configuration ---");
  const corsAllowedRes = await fetch(`${API_BASE}/health`, {
    headers: { Origin: "https://dakshora.co.in" }
  });
  const allowOrigin = corsAllowedRes.headers.get("access-control-allow-origin");
  assert(
    allowOrigin === "https://dakshora.co.in" || allowOrigin === "*",
    `Allowed origin gets Access-Control-Allow-Origin: ${allowOrigin}`
  );

  // TEST 4: Security Headers (Helmet)
  console.log("\n--- 4. Security: Helmet HTTP Headers ---");
  const healthRes = await fetch(`${API_BASE}/health`);
  const nosniff = healthRes.headers.get("x-content-type-options");
  const frameOptions = healthRes.headers.get("x-frame-options");
  assert(nosniff === "nosniff", `X-Content-Type-Options is nosniff: ${nosniff}`);
  assert(
    frameOptions === "SAMEORIGIN" || frameOptions === "DENY",
    `X-Frame-Options is SAMEORIGIN/DENY: ${frameOptions}`
  );

  // TEST 5: Tenant Isolation Across Organizations
  console.log("\n--- 5. Multi-Tenancy: Tenant Data Isolation ---");
  // Create journal entry under Org Alpha
  const orgAlphaId = "tenant-alpha-" + Date.now();
  const orgBetaId = "tenant-beta-" + Date.now();

  const createRes = await fetch(`${API_BASE}/api/erp/teaching-journal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-organization-id": orgAlphaId,
      "x-bypass-ratelimit": "true"
    },
    body: JSON.stringify({
      teacher_id: "teacher-alpha-1",
      staff_name: "Alpha Teacher",
      grade: "Class 10",
      section: "A",
      subject: "Science",
      topic: "Alpha Tenant Private Topic",
      learning_objectives: "Verify isolation",
      homework: "None",
      status: "completed"
    })
  });
  const createData = await createRes.json();
  assert(createData.success === true, "Successfully created entry for Org Alpha");

  // Query as Org Beta -> entry should NOT appear
  const betaRes = await fetch(`${API_BASE}/api/erp/teaching-journal`, {
    headers: {
      "x-organization-id": orgBetaId,
      "x-bypass-ratelimit": "true"
    }
  });
  const betaData = await betaRes.json();
  const leakedInBeta = (betaData.entries || []).some(e => e.topic === "Alpha Tenant Private Topic");
  assert(!leakedInBeta, "Org Beta CANNOT see Org Alpha's journal entries (Tenant Isolation Verified)");

  // TEST 6: Audit Logs Recording & Retrieval
  console.log("\n--- 6. Security: Audit Trail Verification ---");
  const auditRes = await fetch(`${API_BASE}/api/audit-logs`, {
    headers: { "x-bypass-ratelimit": "true" }
  });
  const auditData = await auditRes.json();
  assert(auditData.success === true, "Audit logs query successful");
  assert(Array.isArray(auditData.logs) && auditData.logs.length > 0, `Audit logs retrieved: ${auditData.logs?.length} records`);
  assert(auditData.logs[0]?.action !== undefined, `Most recent audit log action: ${auditData.logs[0]?.action}`);

  // TEST 7: PWA Manifest & Service Worker Serving
  console.log("\n--- 7. PWA: Manifest & Service Worker Verification ---");
  try {
    const manifestRes = await fetch(`${FRONTEND_BASE}/manifest.webmanifest`);
    assert(manifestRes.status === 200, `manifest.webmanifest served with HTTP 200 (status: ${manifestRes.status})`);
    const manifestData = await manifestRes.json();
    assert(manifestData.short_name === "DAKSHORA", `PWA short_name is DAKSHORA: ${manifestData.short_name}`);
    assert(manifestData.display === "standalone", `PWA display is standalone: ${manifestData.display}`);

    const swRes = await fetch(`${FRONTEND_BASE}/sw.js`);
    assert(swRes.status === 200, `sw.js served with HTTP 200 (status: ${swRes.status})`);
    const swText = await swRes.text();
    assert(swText.includes("CACHE_NAME"), "sw.js contains valid service worker cache logic");

    const offlineRes = await fetch(`${FRONTEND_BASE}/offline.html`);
    assert(offlineRes.status === 200, `offline.html served with HTTP 200 (status: ${offlineRes.status})`);
  } catch (err) {
    console.error("  ❌ PWA fetch error:", err.message);
    failed++;
  }

  // TEST 8: SuperAdmin Support Ticket Lifecycle
  console.log("\n--- 8. SuperAdmin: Support Ticket System ---");
  const ticketRes = await fetch(`${API_BASE}/api/admin/support/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-platform-role": "superadmin",
      "x-bypass-ratelimit": "true"
    },
    body: JSON.stringify({
      subject: "CBSE Affiliation Inspection Assistance",
      description: "Need verification on digital report card compliance.",
      priority: "high",
      organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"
    })
  });
  const ticketData = await ticketRes.json();
  assert(ticketData.success === true, "Support ticket created successfully");
  const ticketId = ticketData.ticket?.id;

  if (ticketId) {
    const patchRes = await fetch(`${API_BASE}/api/admin/support/tickets/${ticketId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-platform-role": "superadmin",
        "x-bypass-ratelimit": "true"
      },
      body: JSON.stringify({
        status: "resolved",
        resolution_notes: "Affiliation report card template verified with CBSE circular."
      })
    });
    const patchData = await patchRes.json();
    assert(patchData.success === true, "Support ticket resolved successfully");
    assert(patchData.ticket?.status === "resolved", `Ticket status updated to: ${patchData.ticket?.status}`);
  }

  // Summary
  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  if (failed === 0) {
    console.log("🎉 ALL SECURITY, PWA, AND AUDIT VERIFICATIONS PASSED WITH 100% SUCCESS!");
  }
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

/**
 * test_school_onboarding_and_isolation.mjs
 * 
 * Comprehensive E2E Verification Test Suite:
 * 1. School ERP 16-Step Onboarding Engine (Status, Step Mutation, Drafts, Validation, Activation)
 * 2. Key Personnel / Administrator Invitations
 * 3. Batch Student & Staff CSV Imports (Dry-run preview + Commit)
 * 4. Strict Commercial Isolation: Level 1 (Dakshora SaaS Billing) vs Level 2 (School Student Tuition Fees)
 * 5. School White-label Website CMS Engine & Subdomain Routing
 */

import { createClient } from "@supabase/supabase-js";
import http from "node:http";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

const TEST_PORT = 5294;
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

async function runOnboardingAndIsolationVerification() {
  console.log("==========================================================================");
  console.log("🏫 DAKSHORA 2.0: SCHOOL ONBOARDING WIZARD & COMMERCIAL ISOLATION AUDIT");
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

  // 1. Boot Backend Server
  console.log("🚀 1. Booting Backend Server on port " + TEST_PORT + "...");
  const { buildApp } = await import("../src/app.js");
  const app = await buildApp();
  await app.listen({ port: TEST_PORT, host: "127.0.0.1" });
  console.log(`  ✅ Backend server running on ${BASE_URL}`);

  // 2. Provision Test Users with Supabase Auth
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  const ts = Date.now();
  const adminEmail = `onboard.admin.${ts}@dakshora.internal`;
  const teacherEmail = `onboard.teacher.${ts}@dakshora.internal`;
  const securePwd = "OnboardPass@2026!";

  console.log("👥 2. Provisioning authentic School Admin & Teacher test identities...");
  const { data: adminUser, error: adminCreateErr } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: securePwd,
    email_confirm: true,
    app_metadata: { role: "school-admin", organization_id: ORG_ID }
  });
  if (adminCreateErr) throw new Error("Failed to create test admin user: " + adminCreateErr.message);

  const { data: teacherUser, error: teacherCreateErr } = await supabaseAdmin.auth.admin.createUser({
    email: teacherEmail,
    password: securePwd,
    email_confirm: true,
    app_metadata: { role: "teacher", organization_id: ORG_ID }
  });
  if (teacherCreateErr) throw new Error("Failed to create test teacher user: " + teacherCreateErr.message);

  const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey);
  const { data: adminSess } = await anonClient.auth.signInWithPassword({ email: adminEmail, password: securePwd });
  const adminToken = adminSess.session.access_token;

  const { data: teacherSess } = await anonClient.auth.signInWithPassword({ email: teacherEmail, password: securePwd });
  const teacherToken = teacherSess.session.access_token;
  console.log("  ✅ Test tokens obtained via Supabase Auth.\n");

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 1: RBAC Enforcement on Onboarding Engine
    // -------------------------------------------------------------------------
    console.log("🔒 SUITE 1: RBAC Access Control on Onboarding Endpoints...");

    // 1a. Unauthenticated request -> 401
    const unauthRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/onboarding/status`
    });
    assert(unauthRes.status === 401, "Unauthenticated GET /api/erp/onboarding/status rejected with 401");

    // 1b. Teacher (Unauthorized role) -> 403
    const teacherRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/onboarding/status`,
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(teacherRes.status === 403, "Teacher GET /api/erp/onboarding/status rejected with 403 (FORBIDDEN)");
    assert(teacherRes.data.code === "FORBIDDEN", "Error code matches FORBIDDEN");

    // 1c. School Admin (Authorized) -> 200
    const adminStatusRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/erp/onboarding/status`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminStatusRes.status === 200, "School Admin GET /api/erp/onboarding/status authorized with 200");
    assert(adminStatusRes.data.totalSteps === 16, "Onboarding engine declares 16 complete steps");
    assert(Array.isArray(adminStatusRes.data.stepTitles) && adminStatusRes.data.stepTitles.length === 16, "16 step titles returned in order");
    assert(adminStatusRes.data.checklist !== undefined, "Checklist status evaluated and returned");

    // -------------------------------------------------------------------------
    // TEST SUITE 2: 16-Step Sequential Onboarding Flow
    // -------------------------------------------------------------------------
    console.log("\n👣 SUITE 2: Executing 16-Step School Onboarding Wizard...");

    // Step 0 invalid bounds check
    const step0Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/0`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {}
    });
    assert(step0Res.status === 400, "Invalid step 0 rejected with 400");

    // Step 1: Organization
    const step1Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/1`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: "Heritage International Academy", slug: "heritage-intl", plan: "growth" }
    });
    assert(step1Res.status === 200, "Step 1 (Organization) configured successfully");
    assert(step1Res.data.onboarding.completed_steps.includes(1), "Step 1 marked complete in onboarding state");

    // Step 2: School Profile
    const step2Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/2`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        schoolName: "Heritage International Academy",
        schoolCode: "HIA-2026",
        board: "CBSE",
        email: "contact@heritage.edu.in",
        phone: "+91 124 456 7890",
        affiliationNo: "CBSE-AFF-998811",
        principalName: "Dr. Meenakshi Sundaram"
      }
    });
    assert(step2Res.status === 200, "Step 2 (School Profile) configured successfully");

    // Step 3: Campus
    const step3Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/3`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: "Main Heritage Campus",
        code: "MHC-01",
        address: "Sector 45, Institutional Area",
        city: "Gurugram",
        state: "Haryana",
        pin: "122003",
        contactPhone: "+91 124 456 7890",
        contactEmail: "campus@heritage.edu.in",
        isMain: true,
        capacity: 2000
      }
    });
    assert(step3Res.status === 200, "Step 3 (Campus Setup) configured successfully");

    // Step 4: Academic Session
    const step4Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/4`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: "2026-27",
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        status: "active",
        isCurrent: true
      }
    });
    assert(step4Res.status === 200, "Step 4 (Academic Session 2026-27) configured successfully");

    // Step 5: Classes & Sections
    const step5Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/5`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        classes: [
          { grade: "Class 10", section: "A", roomNumber: "R101", totalStudents: 35 },
          { grade: "Class 9", section: "B", roomNumber: "R102", totalStudents: 30 }
        ]
      }
    });
    assert(step5Res.status === 200, "Step 5 (Classes & Sections) configured successfully");

    // Step 6: Subjects Catalog
    const step6Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/6`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        subjects: [
          { subjectName: "Advanced Mathematics", subjectCode: "MATH-101", category: "Core", maxMarks: 100 },
          { subjectName: "Physics & Chemistry", subjectCode: "SCI-101", category: "Core", maxMarks: 100 }
        ]
      }
    });
    assert(step6Res.status === 200, "Step 6 (Subjects Catalog) configured successfully");

    // Step 7: Staff Directory
    const step7Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/7`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        staff: [
          { name: "Suresh Menon", email: "suresh.menon@heritage.edu.in", role: "teacher", department: "Science" }
        ]
      }
    });
    assert(step7Res.status === 200, "Step 7 (Faculty & Staff) configured successfully");

    // Step 8: Student Enrollment
    const step8Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/8`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        students: [
          { name: "Aarav Sharma", grade: "Class 10", section: "A", rollNo: "DPS-2026-099" }
        ]
      }
    });
    assert(step8Res.status === 200, "Step 8 (Students Directory) configured successfully");

    // Step 9: Fee Configuration
    const step9Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/9`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        feeStructures: [
          { feeHead: "Tuition Fee", amountInr: 18000, grade: "Class 10", frequency: "quarterly" }
        ]
      }
    });
    assert(step9Res.status === 200, "Step 9 (Fee Structures) configured successfully");

    // Step 10: Exam Configuration
    const step10Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/10`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { gradingSystem: "cbse_9point", passPercentage: 33.0 }
    });
    assert(step10Res.status === 200, "Step 10 (Exam Configuration) configured successfully");

    // Step 11: Communication Settings
    const step11Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/11`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        autoAdmissionNotifications: true,
        autoFeeDueReminders: true,
        preferredChannels: { in_app: true, sms: true, email: true, whatsapp: false }
      }
    });
    assert(step11Res.status === 200, "Step 11 (Communication Channels) configured successfully");

    // Step 12: Transport (Enabled with fleet route)
    const step12Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/12`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        enabled: true,
        routes: [
          { routeNumber: "RT-01", routeName: "Cyber City Route", vehicleNumber: "HR 26 TR 1010", capacity: 40 }
        ]
      }
    });
    assert(step12Res.status === 200, "Step 12 (Transport Fleet) configured successfully");

    // Step 13: Library
    const step13Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/13`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { enabled: true, settings: { maxBooksPerStudent: 4 } }
    });
    assert(step13Res.status === 200, "Step 13 (Digital Library) configured successfully");

    // Step 14: HR & Payroll
    const step14Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/14`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { enabled: true }
    });
    assert(step14Res.status === 200, "Step 14 (HR & Payroll) configured successfully");

    // Step 15: Dakshora AI Engine
    const step15Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/15`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { aiEnabled: true, monthlyQuota: 10000, allowedRoles: ["admin", "teacher"] }
    });
    assert(step15Res.status === 200, "Step 15 (Dakshora AI Engine) configured successfully");

    // Step 16: Review & Final Checklist
    const step16Res = await makeRequest({
      method: "PATCH",
      url: `${BASE_URL}/api/erp/onboarding/step/16`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {}
    });
    assert(step16Res.status === 200, "Step 16 (Review & Verification) completed");
    assert(step16Res.data.onboarding.completed_steps.length === 16, "All 16 steps completed successfully (100% progress)");

    // -------------------------------------------------------------------------
    // TEST SUITE 3: Draft Save, Validation & 1-Click Activation
    // -------------------------------------------------------------------------
    console.log("\n💾 SUITE 3: Draft Persistence, Validation Checklist & 1-Click Activation...");

    // Draft save
    const draftRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/save-draft`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { currentStep: 16, draftData: { notes: "Ready for live inspection", auditedBy: "Dakshora QA" } }
    });
    assert(draftRes.status === 200, "Draft save endpoint returned 200 OK");
    assert(draftRes.data.onboarding.draft_data.auditedBy === "Dakshora QA", "Draft data preserved in session");

    // Pre-activation verification checklist
    const validateRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/validate`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {}
    });
    assert(validateRes.status === 200, "Validation checklist returned 200 OK");
    assert(validateRes.data.isReadyForActivation === true, "Pre-activation readiness verified: isReadyForActivation === true");
    assert(validateRes.data.missingMandatoryItems.length === 0, "No missing mandatory items");

    // 1-Click Final Activation
    const activateRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/activate`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {}
    });
    assert(activateRes.status === 200, "POST /api/erp/onboarding/activate returned 200 OK");
    assert(activateRes.data.onboarding.status === "active", "Onboarding status transitioned to 'active'");
    assert(activateRes.data.onboarding.activated_at !== null, "Activation timestamp recorded");

    // Verify Supabase persistence of School and Session
    const { data: dbSchool } = await supabaseAdmin.from("schools").select("*").eq("organization_id", ORG_ID).maybeSingle();
    assert(dbSchool !== null, "School record confirmed active in Supabase schools table");
    const { data: dbSessions } = await supabaseAdmin.from("academic_sessions").select("*").eq("organization_id", ORG_ID);
    assert(dbSessions && dbSessions.length > 0, "Academic session confirmed active in Supabase academic_sessions table");

    // -------------------------------------------------------------------------
    // TEST SUITE 4: Key Personnel & Administrator Invitations
    // -------------------------------------------------------------------------
    console.log("\n✉️ SUITE 4: School Administrator & Faculty Invitations...");

    const inviteRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/invite-admin`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        email: "viceprincipal@heritage.edu.in",
        name: "Dr. Ananya Mukherjee",
        role: "admin"
      }
    });
    assert(inviteRes.status === 201, "POST /api/erp/onboarding/invite-admin returned HTTP 201");
    assert(inviteRes.data.invitation.email === "viceprincipal@heritage.edu.in", "Invitee email correctly registered");
    assert(inviteRes.data.invitation.token.startsWith("tok_inv_"), "Secure onboarding invitation token generated");
    assert(inviteRes.data.invitation.status === "pending", "Invitation status initial state is pending");

    // -------------------------------------------------------------------------
    // TEST SUITE 5: Batch CSV Student & Staff Imports (Dry-run & Commit)
    // -------------------------------------------------------------------------
    console.log("\n📊 SUITE 5: Batch CSV/JSON Directory Import Engine...");

    const studentBatch = [
      { name: "Ishaan Verma", grade: "Class 10", section: "A", rollNo: "DPS-2026-801", parentPhone: "9876543210" },
      { name: "Diya Chawla", grade: "Class 10", section: "B", rollNo: "DPS-2026-802", parentPhone: "9876543211" },
      { name: "Invalid Row Missing Grade", grade: "", section: "A", rollNo: "DPS-2026-803" } // invalid
    ];

    // Dry Run (Preview Mode)
    const studentPreviewRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/import/students`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { students: studentBatch, dryRun: true }
    });
    assert(studentPreviewRes.status === 200, "Student CSV dryRun returned HTTP 200");
    assert(studentPreviewRes.data.preview.validRows === 2, "Dry-run correctly validated 2 valid rows");
    assert(studentPreviewRes.data.preview.invalidRows === 1, "Dry-run correctly caught 1 invalid row");

    // Commit Mode
    const studentCommitRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/import/students`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { students: [studentBatch[0], studentBatch[1]], dryRun: false }
    });
    assert(studentCommitRes.status === 200, "Student batch commit returned HTTP 200");
    assert(studentCommitRes.data.importedCount === 2, "2 students committed into tenant directory");

    // Staff Batch Commit
    const staffCommitRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/onboarding/import/staff`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        staff: [
          { name: "Naveen Singhania", email: "naveen.s@heritage.edu.in", role: "teacher", empId: "EMP-HIA-90" }
        ],
        dryRun: false
      }
    });
    assert(staffCommitRes.status === 200, "Staff batch commit returned HTTP 200");
    assert(staffCommitRes.data.importedCount === 1, "1 staff member committed into faculty directory");

    // -------------------------------------------------------------------------
    // TEST SUITE 6: Commercial Strict Isolation
    // Level 1 (DAKSHORA Platform SaaS Billing) vs Level 2 (School Tuition Collections)
    // -------------------------------------------------------------------------
    console.log("\n💰 SUITE 6: Commercial Strict Separation (Level 1 SaaS Billing vs Level 2 Student Fees)...");

    // 6a. Snapshot Level 1 SaaS Subscriptions & Invoices before student fee payment
    const { data: initialSaasSubs } = await supabaseAdmin.from("saas_subscriptions").select("*").eq("organization_id", ORG_ID);
    const { data: initialSaasInvoices } = await supabaseAdmin.from("saas_invoices").select("*").eq("organization_id", ORG_ID);
    const initialSaasInvoiceCount = initialSaasInvoices?.length || 0;
    const initialSaasSubStatus = initialSaasSubs?.[0]?.status;

    console.log(`  ℹ️ Level 1 SaaS Subscriptions for org: status='${initialSaasSubStatus}', invoices=${initialSaasInvoiceCount}`);

    // 6b. Create Level 2 Student Fee Online Order
    const feeOrderRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/fees/online/create-order`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { demandId: "inv-102", amountINR: 3600 }
    });
    assert(feeOrderRes.status === 200, "Level 2 Student Fee order created via POST /api/erp/fees/online/create-order");
    const orderData = feeOrderRes.data.order;
    assert(orderData.id.startsWith("order_"), "Student fee orderId generated");
    assert(orderData.amount === 360000, "Student fee amount converted to paise (3600 INR = 360000 paise)");

    // 6c. Tamper Protection on School Student Fee Payment
    const forgedFeeSignature = "tampered_fee_hash_fake_signature_99999999";
    const tamperFeeRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/fees/online/verify-payment`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        orderId: orderData.id,
        paymentId: "pay_student_test_123",
        signature: forgedFeeSignature,
        demandId: "inv-102",
        amountPaid: 3600
      }
    });
    assert(tamperFeeRes.status === 400, "Forged signature on student fee payment rejected with HTTP 400");

    // 6d. Genuine HMAC-SHA256 Signature on School Student Fee Payment
    const secret = process.env.RAZORPAY_KEY_SECRET || "dakshora_gateway_production_secret";
    const paymentId = "pay_student_legit_456";
    const genuineFeeSignature = crypto.createHmac("sha256", secret).update(`${orderData.id}|${paymentId}`).digest("hex");

    const legitimateFeeRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/erp/fees/online/verify-payment`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        orderId: orderData.id,
        paymentId,
        signature: genuineFeeSignature,
        demandId: "inv-102",
        amountPaid: 3600
      }
    });
    assert(legitimateFeeRes.status === 200, "Genuine student fee payment verified and receipt generated");
    assert(legitimateFeeRes.data.receiptNo.startsWith("REC/"), "School receipt format generated (REC/...)");
    assert(legitimateFeeRes.data.demand.status === "paid", "Student fee demand marked 'paid'");

    // 6e. Verify Level 1 SaaS Tables were NOT polluted or modified by Level 2 Fee Collection
    const { data: postFeeSaasSubs } = await supabaseAdmin.from("saas_subscriptions").select("*").eq("organization_id", ORG_ID);
    const { data: postFeeSaasInvoices } = await supabaseAdmin.from("saas_invoices").select("*").eq("organization_id", ORG_ID);

    assert(
      postFeeSaasInvoices?.length === initialSaasInvoiceCount,
      `Level 1 Isolation Confirmed: Student tuition fee of ₹3,600 did NOT create any saas_invoices (Count remained ${initialSaasInvoiceCount})`
    );
    assert(
      postFeeSaasSubs?.[0]?.amount === initialSaasSubs?.[0]?.amount,
      `Level 1 SaaS subscription amount unchanged (Still ₹${postFeeSaasSubs?.[0]?.amount} / month)`
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 7: School White-Label Website CMS Engine & Subdomain Routing
    // -------------------------------------------------------------------------
    console.log("\n🌐 SUITE 7: School White-Label Website CMS Engine & Subdomain Routing...");

    // 7a. Get templates catalog
    const tplRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/templates`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(tplRes.status === 200, "GET /api/templates returned HTTP 200");
    assert(Array.isArray(tplRes.data.templates) && tplRes.data.templates.length > 0, "Templates catalog contains templates");

    // 7b. Deploy new School Website
    const siteDomain = `heritage-academy-${Date.now().toString().slice(-4)}.school.dakshora.app`;
    const createSiteRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/websites`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: "Heritage Academy Official",
        domain: siteDomain,
        template: "tpl-school-saas",
        organization_id: ORG_ID
      }
    });
    assert(createSiteRes.status === 200, "POST /api/websites deployed new school website");
    const site = createSiteRes.data.website;
    assert(site.domain === siteDomain, `School subdomain assigned: ${site.domain}`);

    // 7c. Inspect full 9-layer CMS tree
    const cmsRes = await makeRequest({
      method: "GET",
      url: `${BASE_URL}/api/websites/${site.id}/cms`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(cmsRes.status === 200, "GET /api/websites/:id/cms retrieved 9-layer CMS tree");
    const tree = cmsRes.data.tree;
    assert(Array.isArray(tree.pages) && tree.pages.length >= 7, "CMS tree includes standard 7 school pages");
    assert(Array.isArray(tree.sections) && tree.sections.length >= 3, "CMS tree includes modular sections");
    assert(tree.domain.subdomain !== undefined, "CMS tree contains domain and SSL configuration");

    // 7d. Update CMS Tree
    tree.template.themeColor = "#10B981";
    tree.pages[0].title = "Welcome to Heritage Academy";
    const updateCmsRes = await makeRequest({
      method: "PUT",
      url: `${BASE_URL}/api/websites/${site.id}/cms`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: tree
    });
    assert(updateCmsRes.status === 200, "PUT /api/websites/:id/cms successfully updated CMS layers");

    // 7e. 1-Click Publish to Production CDN
    const publishRes = await makeRequest({
      method: "POST",
      url: `${BASE_URL}/api/websites/${site.id}/publish`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {}
    });
    assert(publishRes.status === 200, "POST /api/websites/:id/publish successfully published to Edge CDN");
    assert(publishRes.data.publishing.status === "live", "Website status is live on production edge");
    assert(publishRes.data.publishing.version >= 2, "Published version incremented");

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n🧹 Cleaning up test identities...");
    if (adminUser?.user?.id) await supabaseAdmin.auth.admin.deleteUser(adminUser.user.id);
    if (teacherUser?.user?.id) await supabaseAdmin.auth.admin.deleteUser(teacherUser.user.id);
    console.log("  ✅ Test identities cleanly removed from Supabase Auth.");
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`🎉 ALL ${testPassed}/${testTotal} SCHOOL ONBOARDING & ISOLATION VERIFICATION CHECKS PASSED!`);
  console.log("==========================================================================\n");
}

runOnboardingAndIsolationVerification().catch(err => {
  console.error("\n❌ FATAL ERROR in Verification Test:", err);
  process.exit(1);
});

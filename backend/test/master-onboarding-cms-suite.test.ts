import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { buildApp } from "../src/app.js";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });
dotenv.config();

let app: any;
let BASE_URL = "";
let superAdminToken = "";
let nonAdminToken = "";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function getHeaders(token?: string, orgId?: string) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { "x-organization-id": orgId } : {})
  };
}

describe("DAKSHORA 2.0 — MASTER ONBOARDING, CMS & 16-STEP WIZARD PRODUCTION SUITE", () => {
  let testSchoolSlug = "";
  let testTenantId = "";
  let testTenantCode = "";
  let testActivationToken = "";
  let testPrincipalEmail = "";

  before(async () => {
    app = await buildApp();
    const address = await app.listen({ port: 0, host: "127.0.0.1" });
    BASE_URL = address;

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    const adminClient = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;
    const anonClient = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

    // 1. Authenticate or create SuperAdmin test user
    const saEmail = process.env.DAKSHORA_SUPER_ADMIN_EMAIL || "";
    const saPassword = process.env.DAKSHORA_SUPER_ADMIN_PASSWORD || "";
    if (anonClient && saEmail && saPassword) {
      const { data: saData } = await anonClient.auth.signInWithPassword({
        email: saEmail,
        password: saPassword
      });
      if (saData?.session?.access_token) {
        superAdminToken = saData.session.access_token;
      }
    }

    if (!superAdminToken && adminClient && anonClient) {
      const saDynamicEmail = "master_superadmin@dakshora.test";
      const saDynamicPass = "SuperAdmin@Audit2026!";
      try {
        const { data: list } = await adminClient.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === saDynamicEmail);
        if (existing) {
          await adminClient.auth.admin.deleteUser(existing.id);
        }
        await adminClient.auth.admin.createUser({
          email: saDynamicEmail,
          password: saDynamicPass,
          email_confirm: true,
          app_metadata: { role: "superadmin" }
        });
        const { data: signIn } = await anonClient.auth.signInWithPassword({ email: saDynamicEmail, password: saDynamicPass });
        superAdminToken = signIn?.session?.access_token || "";
      } catch (err: any) {
        console.warn("Could not create dynamic SuperAdmin:", err.message);
      }
    }

    // 2. Create non-superadmin user to test RBAC isolation
    if (adminClient && anonClient) {
      const nonAdminEmail = "regular_teacher@dakshora.test";
      const nonAdminPass = "Teacher@Audit2026!";
      try {
        const { data: list } = await adminClient.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === nonAdminEmail);
        if (existing) {
          await adminClient.auth.admin.deleteUser(existing.id);
        }
        await adminClient.auth.admin.createUser({
          email: nonAdminEmail,
          password: nonAdminPass,
          email_confirm: true,
          app_metadata: { role: "teacher" }
        });
        const { data: signIn } = await anonClient.auth.signInWithPassword({ email: nonAdminEmail, password: nonAdminPass });
        nonAdminToken = signIn?.session?.access_token || "";
      } catch (err: any) {
        console.warn("Could not create regular teacher:", err.message);
      }
    }
  });

  after(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // TEST 1: Public Board Catalogue & Options
  // =========================================================================
  test("1. Public Board & Metadata Catalogue Verification", async () => {
    const res = await fetch(`${BASE_URL}/api/public/catalogue/boards`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.boards), "Boards must be an array");

    const boardCodes = data.boards.map((b: any) => b.code);
    assert.ok(boardCodes.includes("CBSE"), "CBSE must be in catalogue");
    assert.ok(boardCodes.includes("CISCE"), "CISCE must be in catalogue");
    assert.ok(boardCodes.includes("RBSE"), "RBSE must be in catalogue");
    assert.ok(boardCodes.includes("UPMSP"), "UPMSP must be in catalogue");

    assert.ok(data.mediums.includes("Hindi"), "Hindi must be in mediums");
    assert.ok(data.mediums.includes("English"), "English must be in mediums");
    assert.ok(data.mediums.includes("Bilingual"), "Bilingual must be in mediums");
    assert.ok(data.schoolTypes.includes("Preschool/Nursery/Kindergarten"));
    assert.ok(data.schoolTypes.includes("Secondary School"));
    const headRoles = data.schoolHeadRoles || data.headRoles;
    assert.ok(headRoles.includes("Principal"));
    assert.ok(headRoles.includes("Director"));
  });

  // =========================================================================
  // TEST 2: SuperAdmin Authorization & Validation Guards
  // =========================================================================
  test("2. SuperAdmin RBAC Guard & Subdomain Validation", async () => {
    // A. Anonymous request must be rejected
    const unauthRes = await fetch(`${BASE_URL}/api/admin/onboard-school`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolName: "Unauthorized High School" })
    });
    assert.ok(unauthRes.status === 401 || unauthRes.status === 403, "Unauthenticated request must be rejected");

    // B. Non-superadmin request must be rejected
    if (nonAdminToken) {
      const forbiddenRes = await fetch(`${BASE_URL}/api/admin/onboard-school`, {
        method: "POST",
        headers: getHeaders(nonAdminToken),
        body: JSON.stringify({ schoolName: "Forbidden High School" })
      });
      assert.equal(forbiddenRes.status, 403, "Non-superadmin must be denied onboarding permission");
    }

    // C. Validation: Reserved subdomain slug rejection
    const reservedRes = await fetch(`${BASE_URL}/api/admin/onboard-school`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        schoolName: "System Admin Academy",
        requestedSlug: "admin", // reserved keyword!
        principalName: "Dr. Admin",
        email: "admin@system.test",
        phone: "9876543210"
      })
    });
    assert.equal(reservedRes.status, 400);
    const reservedData = await reservedRes.json();
    assert.equal(reservedData.success, false);
    assert.ok(reservedData.message.includes("reserved") || reservedData.message.includes("Reserved"));
  });

  // =========================================================================
  // TEST 3: Atomic School Onboarding & 10-Digit Tenant Code Generation
  // =========================================================================
  test("3. Atomic School Onboarding with Canonical UUID & 10-Digit Tenant Code", async () => {
    const timestamp = Date.now().toString().slice(-5);
    testSchoolSlug = `horizonacademy${timestamp}`;
    testPrincipalEmail = `principal_hzn${timestamp}@horizon.test`;
    const schoolName = `Horizon International Academy ${timestamp}`;
    const phone = `98290${timestamp}`;

    const res = await fetch(`${BASE_URL}/api/admin/onboard-school`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        schoolName,
        requestedSlug: testSchoolSlug,
        board: "CBSE",
        medium: "English",
        schoolType: "Senior Secondary School",
        schoolHeadRole: "Principal",
        principalName: "Dr. Vikramaditya Rathore",
        email: testPrincipalEmail,
        phone,
        city: "Jaipur",
        state: "Rajasthan",
        plan: "growth"
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.tenantId, "Canonical UUID tenantId must be returned");
    assert.ok(data.tenantCode, "10-digit tenantCode must be returned");
    assert.equal(data.tenantCode.length, 10, "Tenant code must be exactly 10 digits");
    assert.match(data.tenantCode, /^\d{10}$/, "Tenant code must be purely numeric");

    testTenantId = data.tenantId;
    testTenantCode = data.tenantCode;
    testActivationToken = data.credentials?.activationToken;

    assert.ok(testActivationToken, "Single-use activation token must be generated");
    assert.equal(data.credentials.initialPassword, null, "Plaintext password must NOT be generated or exposed");
    assert.ok(data.credentials.activationUrl.includes(testActivationToken), "Activation URL must embed token");

    // Verify PostgreSQL Supabase authoritative records
    // 1. Organization record
    const { data: dbOrg, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", testTenantId)
      .maybeSingle();
    assert.equal(orgErr, null);
    assert.ok(dbOrg, "Organization record must exist in PostgreSQL");
    assert.equal(dbOrg.slug, testSchoolSlug);

    // 2. School record with 10-digit school_code
    const { data: dbSchool, error: schoolErr } = await supabase
      .from("schools")
      .select("*")
      .eq("organization_id", testTenantId)
      .maybeSingle();
    assert.equal(schoolErr, null);
    assert.ok(dbSchool, "School record must exist in PostgreSQL");
    assert.equal(dbSchool.school_code, testTenantCode, "school_code must store the 10-digit tenant code");
    assert.equal(dbSchool.board, "CBSE");

    // 3. School onboarding invitation record with hashed token (NOT plaintext)
    const tokenHash = crypto.createHash("sha256").update(testActivationToken).digest("hex");
    let invitationRecord: any = null;
    const { data: dbInvite, error: invErr } = await supabase
      .from("school_onboarding_invitations")
      .select("*")
      .eq("organization_id", testTenantId)
      .maybeSingle();

    if (!invErr && dbInvite) {
      invitationRecord = dbInvite;
    } else {
      const { data: dbOnb } = await supabase
        .from("school_onboarding")
        .select("*")
        .eq("organization_id", testTenantId)
        .maybeSingle();
      invitationRecord = dbOnb?.draft_data?.invitation;
    }
    assert.ok(invitationRecord, "Invitation record must exist in PostgreSQL");
    assert.equal(invitationRecord.token, tokenHash, "Invitation table must store SHA-256 hash, NOT plaintext token");
    assert.equal(invitationRecord.status, "pending");

    // 4. Website and settings initialized
    const { data: dbSite } = await supabase
      .from("websites")
      .select("*")
      .eq("organization_id", testTenantId)
      .maybeSingle();
    assert.ok(dbSite, "Website record must be provisioned in PostgreSQL");
  });

  // =========================================================================
  // TEST 4: Principal Activation Token Verification & Password Setup
  // =========================================================================
  test("4. Principal Single-Use Cryptographic Account Activation Workflow", async () => {
    assert.ok(testActivationToken, "Activation token from Step 3 required");

    // A. Verify token via GET /api/auth/verify-activation-token
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-activation-token?token=${testActivationToken}`);
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.valid, true);
    assert.equal(verifyData.email, testPrincipalEmail);
    assert.equal(verifyData.tenantCode, testTenantCode);

    // B. Verify invalid token returns 404
    const fakeToken = crypto.randomBytes(32).toString("hex");
    const bogusRes = await fetch(`${BASE_URL}/api/auth/verify-activation-token?token=${fakeToken}`);
    assert.equal(bogusRes.status, 404);

    // C. Activate account with strong password via POST /api/auth/activate-account
    const newPrincipalPassword = "PrincipalSecure@2026!";
    const actRes = await fetch(`${BASE_URL}/api/auth/activate-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: testActivationToken,
        password: newPrincipalPassword,
        confirmPassword: newPrincipalPassword
      })
    });

    assert.equal(actRes.status, 200);
    const actData = await actRes.json();
    assert.equal(actData.success, true);
    assert.ok(actData.message.includes("activated successfully"));

    // D. Second attempt with same token must fail (Single-use enforcement)
    const secondActRes = await fetch(`${BASE_URL}/api/auth/activate-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: testActivationToken,
        password: "AnotherPassword123!",
        confirmPassword: "AnotherPassword123!"
      })
    });
    assert.equal(secondActRes.status, 400);
    const secondActData = await secondActRes.json();
    assert.equal(secondActData.code, "ALREADY_ACTIVATED");

    // E. Verify invitation status updated to 'accepted' in PostgreSQL
    let acceptedRecord: any = null;
    const { data: updatedInvite } = await supabase
      .from("school_onboarding_invitations")
      .select("*")
      .eq("organization_id", testTenantId)
      .maybeSingle();

    if (updatedInvite) {
      acceptedRecord = updatedInvite;
    } else {
      const { data: dbOnb } = await supabase
        .from("school_onboarding")
        .select("*")
        .eq("organization_id", testTenantId)
        .maybeSingle();
      acceptedRecord = dbOnb?.draft_data?.invitation;
    }
    assert.equal(acceptedRecord?.status, "accepted");
    assert.ok(acceptedRecord?.accepted_at);
  });

  // =========================================================================
  // TEST 5: SuperAdmin Resend Activation Link
  // =========================================================================
  test("5. SuperAdmin Resend Activation Link Control", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/resend-activation`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        organizationId: testTenantId,
        email: testPrincipalEmail,
        phone: "9829012345"
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.activationToken, "A refreshed activation token must be returned");
    assert.ok(data.activationUrl.includes(data.activationToken));

    // Verify new hash stored in PostgreSQL
    const newHash = crypto.createHash("sha256").update(data.activationToken).digest("hex");
    let refreshedRecord: any = null;
    const { data: refreshedInvite } = await supabase
      .from("school_onboarding_invitations")
      .select("*")
      .eq("organization_id", testTenantId)
      .maybeSingle();

    if (refreshedInvite) {
      refreshedRecord = refreshedInvite;
    } else {
      const { data: dbOnb } = await supabase
        .from("school_onboarding")
        .select("*")
        .eq("organization_id", testTenantId)
        .maybeSingle();
      refreshedRecord = dbOnb?.draft_data?.invitation;
    }
    assert.equal(refreshedRecord?.token, newHash);
    assert.equal(refreshedRecord?.status, "pending");
  });

  // =========================================================================
  // TEST 6: Board-Aware & Medium-Aware Configuration Profile
  // =========================================================================
  test("6. Board-Aware and Medium-Aware School Configuration Profile Engine", async () => {
    // Case A: CBSE English Senior Secondary
    const cbseRes = await fetch(`${BASE_URL}/api/erp/school-config/profile?board=CBSE&medium=English&schoolType=Senior%20Secondary%20School`);
    assert.equal(cbseRes.status, 200);
    const cbseData = await cbseRes.json();
    assert.equal(cbseData.success, true);
    assert.equal(cbseData.profile.board, "CBSE");
    assert.equal(cbseData.profile.terminology.school, "School");
    assert.equal(cbseData.profile.terminology.principal, "Principal");
    assert.ok(cbseData.profile.classesOffered.includes("Grade 12"));
    assert.equal(cbseData.profile.recommendedTemplate, "tpl-senior-secondary");

    // Case B: RBSE Hindi Middle School
    const rbseRes = await fetch(`${BASE_URL}/api/erp/school-config/profile?board=RBSE&medium=Hindi&schoolType=Middle%20School`);
    assert.equal(rbseRes.status, 200);
    const rbseData = await rbseRes.json();
    assert.equal(rbseData.success, true);
    assert.equal(rbseData.profile.board, "RBSE");
    assert.equal(rbseData.profile.terminology.school, "विद्यालय");
    assert.equal(rbseData.profile.terminology.principal, "प्रधानाचार्य");
    assert.equal(rbseData.profile.terminology.teacher, "अध्यापक");
    assert.ok(rbseData.profile.classesOffered.includes("Class 8"));
    assert.ok(!rbseData.profile.classesOffered.includes("Class 12"));
    assert.equal(rbseData.profile.recommendedTemplate, "tpl-rbse-hindi");

    // Case C: Preschool Bilingual
    const preRes = await fetch(`${BASE_URL}/api/erp/school-config/profile?board=CBSE&medium=Bilingual&schoolType=Preschool/Nursery/Kindergarten`);
    assert.equal(preRes.status, 200);
    const preData = await preRes.json();
    assert.equal(preData.success, true);
    assert.ok(preData.profile.classesOffered.includes("Nursery"));
    assert.ok(preData.profile.classesOffered.includes("UKG"));
    assert.equal(preData.profile.recommendedTemplate, "tpl-play-school");
  });

  // =========================================================================
  // TEST 7: "Hindi Mein Likhein" Devanagari Transliteration Service
  // =========================================================================
  test("7. 'Hindi mein likhein' Devanagari Transliteration Engine", async () => {
    const testCases = [
      {
        input: "hamare school mein aapka swagat hai",
        expected: "हमारे स्कूल में आपका स्वागत है।"
      },
      {
        input: "admission open",
        expected: "प्रवेश प्रारंभ (Admissions Open)"
      },
      {
        input: "shiksha aur sanskar",
        expected: "शिक्षा और संस्कार"
      }
    ];

    for (const tc of testCases) {
      const res = await fetch(`${BASE_URL}/api/cms/transliterate-hindi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tc.input })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.devanagari, tc.expected);
    }
  });

  // =========================================================================
  // TEST 8: 9-Category Production Website Templates
  // =========================================================================
  test("8. Production-Grade 9-Category Website Template Engine Verification", async () => {
    const res = await fetch(`${BASE_URL}/api/templates`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.templates), "Templates must be an array");

    const templateIds = data.templates.map((t: any) => t.id);
    const requiredTemplates = [
      "tpl-play-school",
      "tpl-primary-school",
      "tpl-middle-school",
      "tpl-senior-secondary",
      "tpl-cbse-secondary",
      "tpl-rbse-hindi",
      "tpl-hindi-medium",
      "tpl-english-medium",
      "tpl-bilingual-campus"
    ];

    for (const reqId of requiredTemplates) {
      assert.ok(templateIds.includes(reqId), `Template ${reqId} must be present in catalogue`);
    }

    // Verify category presence
    const categories = data.templates.map((t: any) => t.category);
    assert.ok(categories.includes("Preschool & Kindergarten"));
    assert.ok(categories.includes("Primary School"));
    assert.ok(categories.includes("Middle School"));
    assert.ok(categories.includes("CBSE School"));
    assert.ok(categories.includes("Secondary and Senior Secondary School"));
    assert.ok(categories.includes("State Board School"));
    assert.ok(categories.includes("Hindi-Medium School"));
    assert.ok(categories.includes("English-Medium School"));
    assert.ok(categories.includes("Bilingual School"));
  });

  // =========================================================================
  // TEST 9: Public Website Admissions & CRM Lead Capture to PostgreSQL
  // =========================================================================
  test("9. Public Website Lead Capture Pipeline Persisting to PostgreSQL leads", async () => {
    assert.ok(testSchoolSlug, "School slug required from Step 3");

    const parentName = "Rajendra Pratap Singh";
    const parentEmail = `lead_${Date.now().toString().slice(-4)}@parent.test`;
    const parentPhone = "9829988776";
    const childName = "Shaurya Pratap Singh";

    const res = await fetch(`${BASE_URL}/api/public/schools/${testSchoolSlug}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: parentName,
        email: parentEmail,
        phone: parentPhone,
        childName,
        grade: "Class 1",
        message: "Requesting fee prospectus and admission procedure details."
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.inquiryNo, "Inquiry registration number must be generated");

    // Verify lead stored in authoritative PostgreSQL leads table
    const { data: dbLead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("email", parentEmail)
      .maybeSingle();

    assert.equal(leadErr, null);
    assert.ok(dbLead, "Lead record must exist in PostgreSQL public.leads table");
    assert.equal(dbLead.organization_id, testTenantId, "Lead must be bound to school's organization_id");
    assert.equal(dbLead.name, parentName);
  });

  // =========================================================================
  // TEST 10: 16-Step Assisted Setup Wizard Prefill & Draft Sync to PostgreSQL
  // =========================================================================
  test("10. 16-Step Organization Setup Wizard Database Prefill & Save-Draft", async () => {
    assert.ok(testTenantId, "Tenant ID required from Step 3");

    // A. Fetch wizard status: Must prefill existing school info from PostgreSQL
    const statusRes = await fetch(`${BASE_URL}/api/erp/onboarding/status`, {
      headers: getHeaders(superAdminToken, testTenantId)
    });

    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.success, true);
    assert.ok(statusData.onboarding, "Onboarding object must be returned");

    // Verify intelligent prefill:
    // Step 1: Basic Info prefilled with school name and slug from Phase 2
    assert.equal(statusData.onboarding.data.basicInfo?.slug, testSchoolSlug);
    assert.equal(statusData.onboarding.organizationId, testTenantId);

    // Step 2: Academic Year prefilled
    assert.ok(statusData.onboarding.data.academicYear?.name);

    // Step 3: Classes prefilled
    assert.ok(Array.isArray(statusData.onboarding.data.classes?.classes));

    // B. Save draft via POST /api/erp/onboarding/save-draft
    const updatedDraft = {
      ...statusData.onboarding.data,
      feeStructure: {
        tuitionFeeAnnual: 45000,
        admissionFee: 10000,
        installments: 4,
        paymentModes: ["UPI", "NetBanking", "Cash"]
      },
      staff: {
        principalAssigned: true,
        teachersCount: 24,
        supportStaffCount: 8
      }
    };

    const saveRes = await fetch(`${BASE_URL}/api/erp/onboarding/save-draft`, {
      method: "POST",
      headers: getHeaders(superAdminToken, testTenantId),
      body: JSON.stringify({
        step: 5,
        data: updatedDraft
      })
    });

    assert.equal(saveRes.status, 200);
    const saveData = await saveRes.json();
    assert.equal(saveData.success, true);
    assert.equal(saveData.onboarding.currentStep, 5);

    // C. Verify persistent sync in PostgreSQL public.school_onboarding
    const { data: dbOnboard, error: onbErr } = await supabase
      .from("school_onboarding")
      .select("*")
      .eq("organization_id", testTenantId)
      .maybeSingle();

    assert.equal(onbErr, null);
    assert.ok(dbOnboard, "School onboarding record must exist in PostgreSQL");
    assert.equal(dbOnboard.draft_data?.feeStructure?.tuitionFeeAnnual || dbOnboard.data?.feeStructure?.tuitionFeeAnnual, 45000);
  });
});

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

let tenantA_Id = "";
let tenantA_Slug = "";
let tenantA_AdminToken = "";
let tenantA_AdminEmail = "";

let tenantB_Id = "";
let tenantB_Slug = "";
let tenantB_AdminToken = "";
let tenantB_AdminEmail = "";

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

describe("DAKSHORA 2.0 — PHASE 1 MANDATORY TENANT ISOLATION, ZERO-STATE & RESCUE SUITE", () => {
  before(async () => {
    app = await buildApp();
    const address = await app.listen({ port: 0, host: "127.0.0.1" });
    BASE_URL = address;

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    // 1. SuperAdmin token
    const saEmail = process.env.DAKSHORA_SUPER_ADMIN_EMAIL || "";
    const saPassword = process.env.DAKSHORA_SUPER_ADMIN_PASSWORD || "";
    if (anonClient && saEmail && saPassword) {
      const { data: saLogin } = await anonClient.auth.signInWithPassword({
        email: saEmail,
        password: saPassword
      });
      if (saLogin?.session) {
        superAdminToken = saLogin.session.access_token;
      }
    }

    // 2. Provision Tenant A ("Apex Modern Academy")
    const tsA = Date.now().toString().slice(-5);
    tenantA_Id = crypto.randomUUID();
    tenantA_Slug = `apexmodern${tsA}`;
    tenantA_AdminEmail = `principal.apex.${tsA}@dakshora-test.in`;

    await supabase.from("organizations").insert([{
      id: tenantA_Id,
      name: `Apex Modern Academy ${tsA}`,
      slug: tenantA_Slug,
      industry: "Education",
      status: "active"
    }]);

    await supabase.from("schools").insert([{
      id: crypto.randomUUID(),
      organization_id: tenantA_Id,
      name: `Apex Modern Academy ${tsA}`,
      school_code: `APX-${tsA}`,
      board: "CBSE",
      city: "Jaipur",
      email: tenantA_AdminEmail,
      phone: "9876543210",
      status: "active"
    }]);

    // Create Tenant A admin in Supabase Auth
    const passA = `Apex@${tsA}!2026`;
    const { data: userA } = await supabase.auth.admin.createUser({
      email: tenantA_AdminEmail,
      password: passA,
      email_confirm: true,
      user_metadata: {
        role: "school-admin",
        organization_id: tenantA_Id,
        name: "Dr. Arvind Saxena"
      },
      app_metadata: {
        role: "school-admin",
        organization_id: tenantA_Id
      }
    });

    if (userA?.user) {
      await supabase.from("users").upsert([{
        id: userA.user.id,
        email: tenantA_AdminEmail,
        name: "Dr. Arvind Saxena",
        role: "school-admin",
        organization_id: tenantA_Id,
        status: "active"
      }], { onConflict: "id" });

      await supabase.from("organization_members").insert([{
        id: crypto.randomUUID(),
        organization_id: tenantA_Id,
        user_id: userA.user.id,
        role: "principal"
      }]);

      const { data: loginA } = await anonClient.auth.signInWithPassword({
        email: tenantA_AdminEmail,
        password: passA
      });
      if (loginA?.session) {
        tenantA_AdminToken = loginA.session.access_token;
      }
    }

    // 3. Provision Tenant B ("Beacon International Convent")
    const tsB = (Date.now() + 1).toString().slice(-5);
    tenantB_Id = crypto.randomUUID();
    tenantB_Slug = `beaconconvent${tsB}`;
    tenantB_AdminEmail = `principal.beacon.${tsB}@dakshora-test.in`;

    await supabase.from("organizations").insert([{
      id: tenantB_Id,
      name: `Beacon International Convent ${tsB}`,
      slug: tenantB_Slug,
      industry: "Education",
      status: "active"
    }]);

    await supabase.from("schools").insert([{
      id: crypto.randomUUID(),
      organization_id: tenantB_Id,
      name: `Beacon International Convent ${tsB}`,
      school_code: `BCN-${tsB}`,
      board: "ICSE",
      city: "Bengaluru",
      email: tenantB_AdminEmail,
      phone: "9123456780",
      status: "active"
    }]);

    // Create Tenant B admin in Supabase Auth
    const passB = `Beacon@${tsB}!2026`;
    const { data: userB } = await supabase.auth.admin.createUser({
      email: tenantB_AdminEmail,
      password: passB,
      email_confirm: true,
      user_metadata: {
        role: "school-admin",
        organization_id: tenantB_Id,
        name: "Sr. Catherine D'Silva"
      },
      app_metadata: {
        role: "school-admin",
        organization_id: tenantB_Id
      }
    });

    if (userB?.user) {
      await supabase.from("users").upsert([{
        id: userB.user.id,
        email: tenantB_AdminEmail,
        name: "Sr. Catherine D'Silva",
        role: "school-admin",
        organization_id: tenantB_Id,
        status: "active"
      }], { onConflict: "id" });

      await supabase.from("organization_members").insert([{
        id: crypto.randomUUID(),
        organization_id: tenantB_Id,
        user_id: userB.user.id,
        role: "principal"
      }]);

      const { data: loginB } = await anonClient.auth.signInWithPassword({
        email: tenantB_AdminEmail,
        password: passB
      });
      if (loginB?.session) {
        tenantB_AdminToken = loginB.session.access_token;
      }
    }
  });

  after(async () => {
    if (app) await app.close();
    // Cleanup disposable test records
    if (tenantA_Id) {
      try { await supabase.from("students").delete().eq("organization_id", tenantA_Id); } catch (_) {}
      try { await supabase.from("staff").delete().eq("organization_id", tenantA_Id); } catch (_) {}
      try { await supabase.from("schools").delete().eq("organization_id", tenantA_Id); } catch (_) {}
      try { await supabase.from("organizations").delete().eq("id", tenantA_Id); } catch (_) {}
    }
    if (tenantB_Id) {
      try { await supabase.from("students").delete().eq("organization_id", tenantB_Id); } catch (_) {}
      try { await supabase.from("staff").delete().eq("organization_id", tenantB_Id); } catch (_) {}
      try { await supabase.from("schools").delete().eq("organization_id", tenantB_Id); } catch (_) {}
      try { await supabase.from("organizations").delete().eq("id", tenantB_Id); } catch (_) {}
    }
  });

  test("1. Unauthenticated Request to /api/erp/dashboard rejects with HTTP 401 & zero demo fallback", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    assert.strictEqual(res.status, 401, "Unauthenticated request must be rejected with 401");
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.code.includes("AUTH"), "Must return authentication required error code");
  });

  test("2. Tenant A Login dynamically resolves Tenant A branding & ZERO students (Pure Zero-State)", async () => {
    // Check Tenant A dashboard
    const res = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      method: "GET",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id)
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    // School identity must match Tenant A, NEVER Delhi Public Heritage
    assert.ok(body.school.name.includes("Apex Modern Academy"), `Expected Apex Modern Academy, got: ${body.school.name}`);
    assert.strictEqual(body.school.board, "CBSE");
    assert.strictEqual(body.school.city, "Jaipur");
    assert.ok(!body.school.name.toLowerCase().includes("delhi public heritage"), "Must not leak demo school name");

    // Pure Zero-State: Tenant A has 0 students in DB, must return 0 students
    assert.strictEqual(body.students.total, 0, "Must display exactly 0 students in zero-state");
    assert.strictEqual(body.staff.total, 0, "Must display exactly 0 staff in zero-state");
    assert.strictEqual(body.fees.totalCollectedINR, 0, "Fee collected must be 0 in zero-state");
  });

  test("3. Tenant B Login dynamically resolves Tenant B branding & ZERO students (Pure Zero-State)", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      method: "GET",
      headers: getHeaders(tenantB_AdminToken, tenantB_Id)
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    // School identity must match Tenant B
    assert.ok(body.school.name.includes("Beacon International Convent"), `Expected Beacon International Convent, got: ${body.school.name}`);
    assert.strictEqual(body.school.board, "ICSE");
    assert.strictEqual(body.school.city, "Bengaluru");
    assert.ok(!body.school.name.toLowerCase().includes("delhi public heritage"), "Must not leak demo school name");

    // Zero-State for Tenant B
    assert.strictEqual(body.students.total, 0);
    assert.strictEqual(body.staff.total, 0);
  });

  test("4. Enrolling Student in Tenant A increments Tenant A to 1, while Tenant B remains strictly 0", async () => {
    // 1. Enroll student in Tenant A
    const enrollRes = await fetch(`${BASE_URL}/api/erp/students`, {
      method: "POST",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id),
      body: JSON.stringify({
        firstName: "Aarav",
        lastName: "Saxena",
        grade: "Class 10",
        section: "A",
        gender: "male",
        phone: "9876543211",
        email: "aarav.saxena@example.com"
      })
    });
    assert.strictEqual(enrollRes.status, 201, "Student enrolment must succeed with 201");
    const enrollBody = await enrollRes.json();
    assert.strictEqual(enrollBody.success, true);
    assert.ok(enrollBody.student.admissionNo, "Student ID must be generated");

    // 2. Verify Tenant A dashboard now has 1 student
    const resA = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      method: "GET",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id)
    });
    const bodyA = await resA.json();
    assert.strictEqual(bodyA.students.total, 1, "Tenant A must have exactly 1 student");

    // 3. Verify Tenant B dashboard STILL has 0 students (Zero Cross-Tenant Leakage)
    const resB = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      method: "GET",
      headers: getHeaders(tenantB_AdminToken, tenantB_Id)
    });
    const bodyB = await resB.json();
    assert.strictEqual(bodyB.students.total, 0, "Tenant B must remain at 0 students");
  });

  test("5. Cross-Tenant IDOR Attack: Tenant B cannot query Tenant A students (returns HTTP 403 Forbidden)", async () => {
    // Tenant B attempts to send header with Tenant A's organization ID
    const crossRes = await fetch(`${BASE_URL}/api/erp/students`, {
      method: "GET",
      headers: getHeaders(tenantB_AdminToken, tenantA_Id)
    });
    assert.strictEqual(crossRes.status, 403, "Cross-tenant access must strictly return HTTP 403 Forbidden");
    const crossBody = await crossRes.json();
    assert.strictEqual(crossBody.success, false);
  });

  test("6. Dynamic Settings API resolves real school settings for both tenants", async () => {
    // Tenant A settings
    const setA = await fetch(`${BASE_URL}/api/erp/settings`, {
      method: "GET",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id)
    });
    assert.strictEqual(setA.status, 200);
    const bodyA = await setA.json();
    assert.ok(bodyA.settings.schoolName.includes("Apex Modern Academy"));
    assert.strictEqual(bodyA.settings.board, "CBSE");

    // Tenant B settings
    const setB = await fetch(`${BASE_URL}/api/erp/settings`, {
      method: "GET",
      headers: getHeaders(tenantB_AdminToken, tenantB_Id)
    });
    assert.strictEqual(setB.status, 200);
    const bodyB = await setB.json();
    assert.ok(bodyB.settings.schoolName.includes("Beacon International Convent"));
    assert.strictEqual(bodyB.settings.board, "ICSE");
  });

  test("7. Phase 3: Official ERP Kit Delivery Endpoint generates branded pack and logs dispatch", async () => {
    const kitRes = await fetch(`${BASE_URL}/api/admin/tenants/${tenantA_Id}/send-erp-kit`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        channels: ["email", "whatsapp", "sms"]
      })
    });
    assert.strictEqual(kitRes.status, 200);
    const kitBody = await kitRes.json();
    assert.strictEqual(kitBody.success, true);
    assert.ok(kitBody.kit.schoolName.includes("Apex Modern Academy"));
    assert.ok(kitBody.kit.activationUrl.includes("action=activate"));
    assert.strictEqual(kitBody.kit.board, "CBSE");

    // Check delivery logs
    const logRes = await fetch(`${BASE_URL}/api/admin/tenants/${tenantA_Id}/delivery-logs`, {
      method: "GET",
      headers: getHeaders(superAdminToken)
    });
    assert.strictEqual(logRes.status, 200);
    const logBody = await logRes.json();
    assert.strictEqual(logBody.success, true);
    assert.ok(logBody.count >= 1);
  });

  test("8. Phase 2: Superadmin Onboarding Requests Management retrieves requests & updates status", async () => {
    const reqRes = await fetch(`${BASE_URL}/api/admin/onboarding-requests`, {
      method: "GET",
      headers: getHeaders(superAdminToken)
    });
    assert.strictEqual(reqRes.status, 200);
    const reqBody = await reqRes.json();
    assert.strictEqual(reqBody.success, true);
    assert.ok(reqBody.requests.length >= 2);

    // Update status of req-89478 to contacted_interested
    const patchRes = await fetch(`${BASE_URL}/api/admin/onboarding-requests/req-89478/status`, {
      method: "PATCH",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({ status: "contacted_interested" })
    });
    assert.strictEqual(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.strictEqual(patchBody.success, true);
    assert.strictEqual(patchBody.request.status, "contacted_interested");
  });

  test("9. Phase 5: Reconstructed 11-Step CMS Tree contains Step 10 (Website) & Step 11 (App)", async () => {
    // Create website for Tenant A
    const siteRes = await fetch(`${BASE_URL}/api/websites`, {
      method: "POST",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id),
      body: JSON.stringify({
        name: `Apex Modern Academy Portal`,
        template: "tpl-primary-school"
      })
    });
    assert.ok(siteRes.status === 200 || siteRes.status === 201, `Website creation should return 200 or 201, got ${siteRes.status}`);
    const siteBody = await siteRes.json();
    const siteId = siteBody.website?.id || siteBody.id;

    // Fetch CMS Tree
    const cmsRes = await fetch(`${BASE_URL}/api/websites/${siteId}/cms`, {
      method: "GET",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id)
    });
    assert.strictEqual(cmsRes.status, 200);
    const cmsBody = await cmsRes.json();
    assert.strictEqual(cmsBody.success, true);

    // Step 10: Website Integration
    assert.ok(cmsBody.tree.website_integration, "Step 10 website_integration must exist");
    assert.ok(cmsBody.tree.website_integration.subdomain);
    assert.ok(Array.isArray(cmsBody.tree.website_integration.dnsRecords));

    // Step 11: White-Label Custom School Mobile App
    assert.ok(cmsBody.tree.mobile_app, "Step 11 mobile_app must exist");
    assert.ok(cmsBody.tree.mobile_app.appName);
    assert.ok(cmsBody.tree.mobile_app.packageName);
    assert.ok(Array.isArray(cmsBody.tree.mobile_app.enabledModules));
  });

  test("10. Unified Ecosystem: ERP, Mobile App & Public School Website sync notices, rosters, and enforce draft privacy", async () => {
    // 1. Publish a public notice for Tenant A
    const pubNoticeRes = await fetch(`${BASE_URL}/api/cms/notices`, {
      method: "POST",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id),
      body: JSON.stringify({
        title: "Annual Robotics & AI Olympiad 2026",
        body: "All students of Class 6-12 are invited to register.",
        status: "published",
        is_published: true
      })
    });
    assert.strictEqual(pubNoticeRes.status, 200);

    // 2. Create a private draft notice for Tenant A
    const draftNoticeRes = await fetch(`${BASE_URL}/api/cms/notices`, {
      method: "POST",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id),
      body: JSON.stringify({
        title: "Confidential Internal Draft Circular",
        body: "Draft memo not for public website.",
        status: "draft",
        is_published: false
      })
    });
    assert.strictEqual(draftNoticeRes.status, 200);

    // 3. Public School Website resolver returns Tenant A branding + published notice, hides draft notice
    const pubWebRes = await fetch(`${BASE_URL}/api/public/schools/${tenantA_Id}/cms`);
    assert.strictEqual(pubWebRes.status, 200);
    const pubWebBody = await pubWebRes.json();
    assert.strictEqual(pubWebBody.success, true);
    assert.ok(pubWebBody.school.name.includes("Apex Modern Academy"));
    assert.ok(pubWebBody.cmsTree.website_integration);
    assert.ok(pubWebBody.cmsTree.mobile_app);
    assert.ok(
      pubWebBody.notices.some((n: any) => n.title === "Annual Robotics & AI Olympiad 2026"),
      "Published notice must appear on public school website"
    );
    assert.ok(
      !pubWebBody.notices.some((n: any) => n.title === "Confidential Internal Draft Circular"),
      "Draft notice must never be exposed on public school website"
    );

    // 4. Unified ERP + Mobile App dashboard payload contains live studentRoster and syncTimestamp
    const appSyncRes = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      method: "GET",
      headers: getHeaders(tenantA_AdminToken, tenantA_Id)
    });
    assert.strictEqual(appSyncRes.status, 200);
    const appSyncBody = await appSyncRes.json();
    assert.strictEqual(appSyncBody.success, true);
    assert.ok(Array.isArray(appSyncBody.studentRoster), "studentRoster must be returned for Mobile App sync");
    assert.strictEqual(appSyncBody.studentRoster.length, 1, "Tenant A must have 1 student in live roster");
    assert.ok(appSyncBody.syncTimestamp, "syncTimestamp must be present");
  });

  test("11. Phase 4: Guarded Safe Deletion Preview protects production data and allows safe accidental cleanup", async () => {
    // 1. Seed demo tenant protected from deletion
    const seedPreview = await fetch(`${BASE_URL}/api/admin/organizations/b17780e5-3832-4ac6-9aeb-33fd80c5cb0e/delete-preview`, {
      method: "GET",
      headers: getHeaders(superAdminToken)
    });
    assert.strictEqual(seedPreview.status, 403, "Seed demo tenant must be protected from deletion");

    // 2. Test tenant deletion preview
    const previewRes = await fetch(`${BASE_URL}/api/admin/organizations/${tenantA_Id}/delete-preview`, {
      method: "GET",
      headers: getHeaders(superAdminToken)
    });
    assert.strictEqual(previewRes.status, 200);
    const previewBody = await previewRes.json();
    assert.strictEqual(previewBody.success, true);
    assert.strictEqual(previewBody.canSafelyDelete, true, "0 financial transactions qualifies for safe deletion");
    assert.ok(previewBody.confirmationCodeRequired);

    // 3. Permanent delete requires valid confirmation code
    const badCodeRes = await fetch(`${BASE_URL}/api/admin/organizations/${tenantA_Id}/delete-permanent`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({ confirmationCode: "WRONG_CODE" })
    });
    assert.strictEqual(badCodeRes.status, 400, "Must reject incorrect confirmation code");

    // 4. Permanent delete with valid code succeeds
    const goodDeleteRes = await fetch(`${BASE_URL}/api/admin/organizations/${tenantA_Id}/delete-permanent`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({ confirmationCode: previewBody.confirmationCodeRequired })
    });
    assert.strictEqual(goodDeleteRes.status, 200);
    const goodDeleteBody = await goodDeleteRes.json();
    assert.strictEqual(goodDeleteBody.success, true);
    assert.strictEqual(goodDeleteBody.deletedId, tenantA_Id);

    // Reset tenantA_Id so after hook won't double delete
    tenantA_Id = "";
  });
});

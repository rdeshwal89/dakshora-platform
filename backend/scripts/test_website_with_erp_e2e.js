import "dotenv/config";
import http from "http";
import { buildApp } from "../src/app.js";

async function runWebsiteWithErpTest() {
  console.log("==========================================================================");
  console.log("🌐 DAKSHORA 2.0 — WEBSITE WITH ERP INTEGRATION & DEPLOYMENT GATEWAY TEST");
  console.log("==========================================================================\n");

  const app = await buildApp();
  const PORT = 5399;

  await app.listen({ port: PORT, host: "127.0.0.1" });
  console.log(`[Test Server] Live Gateway listening on http://127.0.0.1:${PORT}\n`);

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

  const BASE_URL = `http://127.0.0.1:${PORT}`;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Public CMS Resolver Endpoint
    // ------------------------------------------------------------------------
    console.log("--- TEST GROUP 1: Public CMS Resolver Endpoint ---");
    const cmsRes = await fetch(`${BASE_URL}/api/public/schools/heritage/cms`);
    const cmsData = await cmsRes.json();

    assert(cmsRes.status === 200 && cmsData.success === true, "GET /api/public/schools/heritage/cms returns 200 OK with success=true");
    assert(Boolean(cmsData.school && cmsData.school.name), `School metadata resolved: ${cmsData.school?.name}`);
    assert(Boolean(cmsData.website && cmsData.website.domain), `Website domain resolved: ${cmsData.website?.domain}`);
    assert(Array.isArray(cmsData.pages) && cmsData.pages.length > 0, `Website pages resolved: ${cmsData.pages?.length} pages`);
    assert(Boolean(cmsData.cmsTree && cmsData.cmsTree.sections), "9-Layer CMS tree returned with tactile sections and components");
    assert(Array.isArray(cmsData.notices), `Public notices resolved: ${cmsData.notices?.length} notices`);

    // ------------------------------------------------------------------------
    // TEST 2: Dynamic Domain & Subdomain Resolver
    // ------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Dynamic Domain & Subdomain Resolver ---");
    const domRes = await fetch(`${BASE_URL}/api/public/schools/resolve-domain?host=heritage.dakshora.app`);
    const domData = await domRes.json();

    assert(domRes.status === 200 && domData.success === true, "GET /api/public/schools/resolve-domain resolves heritage.dakshora.app");
    assert(Boolean(domData.school && domData.website), `School '${domData.school?.name}' matched to domain '${domData.website?.domain}'`);

    // ------------------------------------------------------------------------
    // TEST 2B: Per-School White-Label Mobile App & PWA Manifest
    // ------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2B: Dynamic White-Label Mobile App Kit ---");
    const pwaRes = await fetch(`${BASE_URL}/api/public/schools/heritage/manifest.json`);
    const pwaData = await pwaRes.json();

    assert(pwaRes.status === 200, "GET /api/public/schools/heritage/manifest.json returns 200 OK");
    assert(pwaData.display === "standalone", `PWA display mode is standalone: ${pwaData.display}`);
    assert(Boolean(pwaData.name && pwaData.short_name), `Dynamic school app title generated: ${pwaData.name}`);
    assert(pwaData.start_url === "/portal", `App start_url points to portal: ${pwaData.start_url}`);

    const twaRes = await fetch(`${BASE_URL}/api/public/schools/heritage/mobile-app/twa-config`);
    const twaData = await twaRes.json();

    assert(twaRes.status === 200 && twaData.success === true, "GET /api/public/schools/heritage/mobile-app/twa-config returns 200 OK");
    assert(Boolean(twaData.twaManifest?.packageId), `Android Package ID generated: ${twaData.twaManifest?.packageId}`);
    assert(Boolean(twaData.playStoreChecklist?.buildEngine), `Play Store TWA pipeline verified: ${twaData.playStoreChecklist?.buildEngine}`);

    // ------------------------------------------------------------------------
    // TEST 3: Public Website Lead Capture & Auto-Sync into ERP Admissions
    // ------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Public Lead Capture & Direct ERP Sync ---");
    const testLead = {
      name: "Rohan Verma",
      email: `rohan.parent.${Date.now()}@gmail.com`,
      phone: "+91 98123 45678",
      grade: "Class 9",
      session: "2026-27",
      message: "Interested in CBSE Class 9 admission with integrated robotics lab.",
      parentName: "Sanjay Verma"
    };

    const leadRes = await fetch(`${BASE_URL}/api/public/schools/heritage/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testLead)
    });
    const leadData = await leadRes.json();

    assert(leadRes.status === 200 && leadData.success === true, `POST /api/public/schools/heritage/leads captured lead successfully (ID: ${leadData.lead?.id})`);
    assert(Boolean(leadData.inquiryNo && leadData.inquiryNo.startsWith("INQ-")), `Generated ERP Admission Inquiry Number: ${leadData.inquiryNo}`);

    // ------------------------------------------------------------------------
    // Authenticate School Admin to test protected CRM & Admissions Endpoints
    // ------------------------------------------------------------------------
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const testAdminEmail = `schooladmin.${Date.now()}@dpsheritage.edu.in`;
    const testAdminPass = "SecureAdmin@2026!";
    const { data: adminAuthData } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: testAdminPass,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e" }
    });

    const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: sessionData } = await supabaseAnon.auth.signInWithPassword({
      email: testAdminEmail,
      password: testAdminPass
    });
    const adminToken = sessionData?.session?.access_token;
    assert(Boolean(adminToken), "School Administrator authenticated with valid JWT token");

    // Verify lead exists in CRM Leads
    const crmLeadsRes = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const crmLeadsData = await crmLeadsRes.json();
    const capturedCrmLead = crmLeadsData.leads?.find(l => l.email === testLead.email);
    assert(Boolean(capturedCrmLead), `Lead '${testLead.name}' verified in CRM Leads collection`);

    // Verify inquiry exists directly in ERP Admissions
    const erpAdmissionsRes = await fetch(`${BASE_URL}/api/erp/admissions?search=${encodeURIComponent("Rohan Verma")}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const erpAdmissionsData = await erpAdmissionsRes.json();
    const autoSyncedInquiry = erpAdmissionsData.admissions?.find(a => a.studentName === testLead.name);
    assert(Boolean(autoSyncedInquiry), `Inquiry '${testLead.name}' automatically populated in ERP Admissions Table`);
    assert(autoSyncedInquiry?.source === "website", `Admission inquiry source is tagged as '${autoSyncedInquiry?.source}'`);
    assert(autoSyncedInquiry?.appliedGrade === "Class 9", `Applied grade correctly recorded: ${autoSyncedInquiry?.appliedGrade}`);

    // ------------------------------------------------------------------------
    // TEST 4: Lead Conversion & Admission Confirmation Flow
    // ------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Admission Confirmation Pipeline ---");
    if (autoSyncedInquiry) {
      // Confirm admission
      const confirmRes = await fetch(`${BASE_URL}/api/erp/admissions/${autoSyncedInquiry.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          grade: "Class 9",
          section: "A",
          parentOccupation: "Senior Engineer"
        })
      });
      const confirmData = await confirmRes.json();

      assert(confirmRes.status === 200 && confirmData.success === true, `Admission confirmed! Student enrolled: ${confirmData.student?.name} (${confirmData.student?.admissionNo})`);
      assert(Boolean(confirmData.student?.rollNo), `Assigned Roll No: ${confirmData.student?.rollNo}`);
      assert(Boolean(confirmData.feeDemand), `Auto-generated Initial Fee Demand ID: ${confirmData.feeDemand?.id}`);
    }

    // ------------------------------------------------------------------------
    // TEST 4B: Dynamic School Re-Branding & Morphing upon Login
    // ------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4B: Single Master App Dynamic Re-Branding & Morphing ---");
    const portalLoginRes = await fetch(`${BASE_URL}/api/erp/portal/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "9876543210" })
    });
    const portalLoginData = await portalLoginRes.json();

    assert(portalLoginRes.status === 200 && portalLoginData.success === true, "Parent login on Master App succeeds");
    assert(Boolean(portalLoginData.school?.name), `Master App dynamically received School Name: '${portalLoginData.school?.name}'`);
    assert(Boolean(portalLoginData.school?.logoUrl), `Master App received School Logo: '${portalLoginData.school?.logoUrl}'`);
    assert(Boolean(portalLoginData.school?.branding?.primaryColor), `Master App received School Primary Color: '${portalLoginData.school?.branding?.primaryColor}'`);

    // Cleanup test user
    if (adminAuthData?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(adminAuthData.user.id).catch(() => {});
    }

    // ------------------------------------------------------------------------
    // TEST 5: CORS Headers for Custom Domains & *.dakshora.app
    // ------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: CORS Configuration for School Websites ---");
    const corsRes = await fetch(`${BASE_URL}/health`, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://dpsheritage.school.dakshora.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,x-school-slug"
      }
    });

    assert(corsRes.status === 204 || corsRes.status === 200, "Preflight OPTIONS request to school subdomain succeeds");
    const acaoHeader = corsRes.headers.get("access-control-allow-origin");
    assert(acaoHeader === "https://dpsheritage.school.dakshora.app" || acaoHeader === "*", `CORS Allow-Origin correctly reflects school subdomain: ${acaoHeader}`);

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await app.close();
  }

  console.log("\n==========================================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runWebsiteWithErpTest();

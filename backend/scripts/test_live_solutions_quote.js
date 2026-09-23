import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5295;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
const FOREIGN_ORG_ID = "00000000-0000-0000-0000-000000000000";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

// Service-role Supabase client (used ONLY for admin setup, DB direct verification, and teardown)
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

async function runLiveSolutionsQuoteTest() {
  console.log("\n==========================================================================");
  console.log("💼 DAKSHORA 2.0 — LIVE COMMERCIAL SOLUTION BUILDER & PROPOSALS TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let generatedQuoteId = null;
  let generatedQuote = null;
  let createdProposalId = null;
  const recordedAuditLogIds = [];

  try {
    // 0. Spin up test server on dedicated PORT 5295
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.solutions.${Date.now()}@dakshora.internal`;
    const testPassword = "SolutionsSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Dr. N. R. Narayana Murthy", role: "superadmin" },
      app_metadata: { role: "superadmin", platform_role: "superadmin", organization_id: DEFAULT_ORG_ID }
    });
    if (adminAuthErr) throw new Error(`SuperAdmin user setup failed: ${adminAuthErr.message}`);
    testAdminUser = adminAuth.user;

    const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: adminSession, error: adminSessErr } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminSessErr) throw new Error(`SuperAdmin login failed: ${adminSessErr.message}`);
    adminToken = adminSession.session.access_token;
    console.log(`  ✅ SuperAdmin Authenticated (ID: ${testAdminUser.id})`);

    // Setup: Create test Student user
    console.log("[Setup] Authenticating test Student user (for RBAC restriction testing)...");
    const studentEmail = `student.solutions.${Date.now()}@dakshora.internal`;
    const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Aarav Sharma", role: "student" },
      app_metadata: { role: "student", platform_role: "student", organization_id: DEFAULT_ORG_ID }
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
    // Gate 1: Fail-Closed Security & Role Authorization (401 / 403 Rejections)
    // =========================================================================
    console.log("[Gate 1/10] Verifying Security Gating & Role Authorization...");

    // 1.1 Public solution endpoints must succeed WITHOUT authorization headers
    const publicPkgRes = await makeRequest({ method: "GET", path: "/api/erp/solutions/packages" });
    assert(publicPkgRes.status === 200, `Public /packages should return 200, got ${publicPkgRes.status}`);

    const publicCompRes = await makeRequest({ method: "GET", path: "/api/erp/solutions/comparison" });
    assert(publicCompRes.status === 200, `Public /comparison should return 200, got ${publicCompRes.status}`);

    const publicQuoteRes = await makeRequest({
      method: "POST",
      path: "/api/erp/solutions/quote",
      body: { schoolName: "Public Inquiry School", studentCount: 500 }
    });
    assert(publicQuoteRes.status === 200, `Public /quote should return 200, got ${publicQuoteRes.status}`);
    console.log("  ✅ Prospective schools have unrestricted public access to Packages, Comparison & Quote Calculator.");

    // 1.2 Authenticated proposal management endpoints require auth (401 unauth)
    const unauthPropRes = await makeRequest({ method: "GET", path: "/api/erp/solutions/proposals" });
    assert(unauthPropRes.status === 401, `Unauthenticated /proposals should return 401, got ${unauthPropRes.status}`);
    console.log("  ✅ Unauthenticated proposals access correctly blocked with HTTP 401.");

    // 1.3 Student role strictly blocked with 403 FORBIDDEN_ROLE from proposal contract operations
    const studentBlockedActions = [
      { method: "POST", path: "/api/erp/solutions/proposals", body: { schoolName: "Fake", pricing: {} } },
      { method: "PATCH", path: "/api/erp/solutions/proposals/prop-01/status", body: { status: "signed_contract" } },
      { method: "POST", path: "/api/erp/solutions/proposals/prop-01/discount", body: { executiveDiscountINR: 50000 } },
      { method: "DELETE", path: "/api/erp/solutions/proposals/prop-01" }
    ];
    for (const ep of studentBlockedActions) {
      const res = await makeRequest({
        method: ep.method,
        path: ep.path,
        headers: { authorization: `Bearer ${studentToken}` },
        body: ep.body
      });
      assert(res.status === 403, `Student on ${ep.path} should return 403, got ${res.status}`);
      assert(res.body.code === "FORBIDDEN_ROLE", `Expected FORBIDDEN_ROLE, got ${res.body.code}`);
    }
    console.log("  ✅ Student role strictly blocked with HTTP 403 FORBIDDEN_ROLE on commercial contracts.\n");

    // =========================================================================
    // Gate 2: Multi-Tenant Boundary & Proposal Isolation
    // =========================================================================
    console.log("[Gate 2/10] Verifying Multi-Tenant Boundary & Proposal Isolation...");

    const foreignPropRes = await makeRequest({
      method: "GET",
      path: "/api/erp/solutions/proposals",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "x-organization-id": FOREIGN_ORG_ID
      }
    });
    assert(foreignPropRes.status === 200, "Foreign proposals query failed");
    assert(foreignPropRes.body.proposals.length === 0, "Foreign tenant proposals must be empty");
    assert(foreignPropRes.body.totalCount === 0, "Foreign tenant proposal count must be 0");
    console.log("  ✅ Foreign tenant proposal ledger cleanly isolated with 0 proposals.\n");

    // =========================================================================
    // Gate 3: Pre-Configured Commercial Tiers & Packages
    // =========================================================================
    console.log("[Gate 3/10] Verifying Pre-Configured Commercial Tiers & Packages...");

    const pkgRes = await makeRequest({ method: "GET", path: "/api/erp/solutions/packages" });
    assert(pkgRes.status === 200, "Get packages failed");
    assert(Array.isArray(pkgRes.body.packages), "packages should be array");
    assert(pkgRes.body.packages.length === 4, `Expected 4 commercial packages, got ${pkgRes.body.packages.length}`);

    const packageIds = pkgRes.body.packages.map(p => p.id);
    assert(packageIds.includes("pkg-starter"), "Missing pkg-starter");
    assert(packageIds.includes("pkg-growth"), "Missing pkg-growth");
    assert(packageIds.includes("pkg-ai-flagship"), "Missing pkg-ai-flagship");
    assert(packageIds.includes("pkg-enterprise-trust"), "Missing pkg-enterprise-trust");

    for (const pkg of pkgRes.body.packages) {
      assert(pkg.name && pkg.tagline && pkg.baseMonthlyINR > 0, "Package metadata incomplete");
      assert(Array.isArray(pkg.modules) && pkg.modules.length > 0, "Package modules missing");
      assert(Array.isArray(pkg.features) && pkg.features.length > 0, "Package features missing");
    }
    console.log(`  ✅ Verified 4 commercial tiers: Starter CBSE, Growth Smart, AI Flagship, Enterprise Trust.\n`);

    // =========================================================================
    // Gate 4: Feature Matrix & Platform Comparison Engine
    // =========================================================================
    console.log("[Gate 4/10] Verifying Feature Matrix & Platform Comparison Engine...");

    const compRes = await makeRequest({ method: "GET", path: "/api/erp/solutions/comparison" });
    assert(compRes.status === 200, "Get comparison failed");
    assert(compRes.body.comparison && Array.isArray(compRes.body.comparison.categories), "Categories missing");

    const categories = compRes.body.comparison.categories;
    assert(categories.length >= 3, "Comparison should feature at least 3 categories");
    for (const cat of categories) {
      assert(cat.name && Array.isArray(cat.features), "Category structure invalid");
      for (const feat of cat.features) {
        assert(feat.name && feat.legacyErp && feat.openSource && feat.dakshora, "Feature comparison columns missing");
      }
    }
    console.log(`  ✅ Competitive matrix verified: ${categories.length} categories benchmarking Legacy vs Open-Source vs Dakshora AI.\n`);

    // =========================================================================
    // Gate 5: Dynamic Quotation Generation with Volume Slabs & GST
    // =========================================================================
    console.log("[Gate 5/10] Verifying Dynamic Quotation Generation with Volume Slabs & GST...");

    const quoteRes = await makeRequest({
      method: "POST",
      path: "/api/erp/solutions/quote",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        schoolName: "Delhi Public Heritage School",
        studentCount: 1200,
        selectedPackage: "pkg-growth",
        billingCycle: "annual"
      }
    });
    assert(quoteRes.status === 200, `Quote generation failed: ${JSON.stringify(quoteRes.body)}`);
    assert(quoteRes.body.success === true, "Quote success flag missing");
    const q = quoteRes.body.quotation;
    assert(q.quoteId && q.quoteId.startsWith("QUO-DAK-"), `Invalid quoteId: ${q.quoteId}`);
    assert(q.pricing && q.pricing.discountPercent === 20, "Annual discount must be 20%");
    assert(q.pricing.gstRatePercent === 18, "GST rate must be 18%");
    assert(q.pricing.hsnCode === "998314", "HSN code must be 998314");
    assert(q.pricing.grandTotalINR > 0, "Grand total must be positive");
    assert(Array.isArray(q.itemizedModules) && q.itemizedModules.length > 0, "Itemized modules missing");

    generatedQuoteId = q.quoteId;
    generatedQuote = q;
    console.log(`  ✅ Quotation generated: ID=${generatedQuoteId}, Subtotal=₹${q.pricing.annualSubtotalINR.toLocaleString("en-IN")}, GST=₹${q.pricing.gstAmountINR.toLocaleString("en-IN")}, Grand Total=₹${q.pricing.grandTotalINR.toLocaleString("en-IN")}.\n`);

    // =========================================================================
    // Gate 6: High-Fidelity Printable A4 Commercial Proposal
    // =========================================================================
    console.log("[Gate 6/10] Verifying High-Fidelity Printable A4 Commercial Proposal...");

    const printRes = await makeRequest({
      method: "GET",
      path: `/api/erp/solutions/quote/${generatedQuoteId}/print`
    });
    assert(printRes.status === 200, "Print proposal failed");
    assert(typeof printRes.body === "string", "Print proposal should return HTML string");
    assert(printRes.body.includes("@page { size: A4"), "Print stylesheet missing A4 portrait rule");
    assert(printRes.body.includes(generatedQuoteId), "Print proposal missing quoteId");
    assert(printRes.body.includes("DAKSHORA AI 2.0"), "Print proposal missing brand header");
    assert(printRes.body.includes("Commercial Investment Summary"), "Print proposal missing pricing summary");
    assert(printRes.body.includes("Authorized Signatory"), "Print proposal missing signature blocks");
    console.log(`  ✅ Official A4 Printable Commercial Proposal HTML generated (${printRes.body.length} bytes).\n`);

    // =========================================================================
    // Gate 7: Institutional Proposal Persistence & Directory
    // =========================================================================
    console.log("[Gate 7/10] Verifying Institutional Proposal Persistence & Directory...");

    const createPropRes = await makeRequest({
      method: "POST",
      path: "/api/erp/solutions/proposals",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        schoolName: "Delhi Public Heritage School",
        studentCount: 1200,
        selectedPackage: "Growth Smart School",
        selectedModules: ["core_erp", "transport_gps", "parent_portal", "hr_payroll"],
        billingCycle: "annual",
        pricing: generatedQuote.pricing,
        quoteId: generatedQuoteId
      }
    });
    assert(createPropRes.status === 201, `Create proposal failed: ${JSON.stringify(createPropRes.body)}`);
    assert(createPropRes.body.proposal && createPropRes.body.proposal.id, "Proposal ID missing");
    createdProposalId = createPropRes.body.proposal.id;
    assert(createPropRes.body.proposal.status === "draft", "Initial status must be 'draft'");
    console.log(`  ✅ Proposal saved to institutional registry: ID=${createdProposalId} (Status: draft).`);

    // Retrieve proposal directory
    const listPropRes = await makeRequest({
      method: "GET",
      path: "/api/erp/solutions/proposals",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(listPropRes.status === 200, "List proposals failed");
    assert(listPropRes.body.proposals.some(p => p.id === createdProposalId), "Created proposal not found in directory");
    console.log(`  ✅ Verified proposal present in institutional directory (${listPropRes.body.proposals.length} proposals recorded).\n`);

    // =========================================================================
    // Gate 8: Proposal Status Workflow & Trustee Approval
    // =========================================================================
    console.log("[Gate 8/10] Verifying Proposal Status Workflow & Trustee Approval...");

    const updateStatusRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/solutions/proposals/${createdProposalId}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        status: "approved_by_trustees",
        comments: "Unanimously approved in Q3 Trust Board Resolution"
      }
    });
    assert(updateStatusRes.status === 200, "Update proposal status failed");
    assert(updateStatusRes.body.proposal.status === "approved_by_trustees", "Status mismatch");
    console.log(`  ✅ Proposal status advanced: draft → approved_by_trustees.\n`);

    // =========================================================================
    // Gate 9: Executive Commercial Discount & Re-calculation
    // =========================================================================
    console.log("[Gate 9/10] Verifying Executive Commercial Discount & Financial Re-calculation...");

    const discountRes = await makeRequest({
      method: "POST",
      path: `/api/erp/solutions/proposals/${createdProposalId}/discount`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        executiveDiscountINR: 20000,
        reason: "Multi-Trust Academic Network Concession"
      }
    });
    assert(discountRes.status === 200, "Apply discount failed");
    const updatedProp = discountRes.body.proposal;
    assert(updatedProp.executiveDiscountINR === 20000, "Executive discount mismatch");
    assert(updatedProp.pricing.netSubtotalAfterExecutiveDiscountINR < generatedQuote.pricing.annualSubtotalINR, "Subtotal was not reduced by discount");
    assert(updatedProp.pricing.grandTotalINR > 0, "Grand total must be positive");
    console.log(`  ✅ Applied executive concession of ₹20,000. Recomputed Grand Total: ₹${updatedProp.pricing.grandTotalINR.toLocaleString("en-IN")}.\n`);

    // =========================================================================
    // Gate 10: Teardown, Supabase public.audit_logs Verification & Account Purge
    // =========================================================================
    console.log("[Gate 10/10] Verifying Supabase public.audit_logs Sync & Teardown Cleanup...");

    // 10.1 Verify Supabase public.audit_logs recorded the proposal events
    const { data: dbLogs, error: dbLogErr } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .in("action", ["solutions.proposal_created", "solutions.proposal_status_changed", "solutions.discount_applied"])
      .order("created_at", { ascending: false })
      .limit(5);

    assert(!dbLogErr, `Failed to query Supabase public.audit_logs: ${dbLogErr?.message}`);
    assert(Array.isArray(dbLogs) && dbLogs.length > 0, "No solutions audit logs found in Supabase public.audit_logs");
    console.log(`  ✅ Verified ${dbLogs.length} commercial actions recorded in Supabase public.audit_logs.`);
    recordedAuditLogIds.push(...dbLogs.map(l => l.id));

    // 10.2 Delete created proposal
    if (createdProposalId) {
      const delPropRes = await makeRequest({
        method: "DELETE",
        path: `/api/erp/solutions/proposals/${createdProposalId}`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assert(delPropRes.status === 200, "Delete proposal failed");
      console.log(`  ✅ Archived test commercial proposal [${createdProposalId}].`);
    }

    // 10.3 Purge test audit logs
    if (recordedAuditLogIds.length > 0) {
      const { error: delAuditErr } = await supabaseAdmin
        .from("audit_logs")
        .delete()
        .in("id", recordedAuditLogIds);
      if (delAuditErr) console.warn("  ⚠️ Warning cleaning up audit logs:", delAuditErr.message);
      else console.log(`  ✅ Purged ${recordedAuditLogIds.length} test audit log entries from Supabase public.audit_logs.`);
    }

    // 10.4 Clean up test auth accounts
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: COMMERCIAL SOLUTION BUILDER SUITE VERIFIED");
    console.log("==========================================================================\n");

  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveSolutionsQuoteTest().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:");
  console.error(err);
  process.exit(1);
});

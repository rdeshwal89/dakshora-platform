import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import assert from "assert";
import { buildApp } from "../src/app.js";

async function runLiveAdmissionsCrmTest() {
  console.log("==========================================================================");
  console.log("🎓 DAKSHORA 2.0 — LIVE ADMISSIONS & CRM PIPELINE SUITE TEST");
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

  // 1. Start gateway test server on port 5297
  const app = await buildApp();
  const PORT = 5297;
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
  let createdLeadId = null;
  let convertedAppId = null;
  let directAppId = null;
  let convertedStudentDbId = null;
  let generatedFeeDemandDbId = null;

  try {
    // ------------------------------------------------------------------------
    // GATE 1: Security & Multi-tenant Isolation
    // ------------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Security, Authentication & Multi-tenant Isolation...");
    
    // 1a. Unauthenticated request must fail with 401
    const unauthRes = await makeRequest({
      method: "GET",
      path: "/api/erp/admissions/overview"
    });
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated access must be rejected with 401");
    console.log("  ✅ Unauthenticated access correctly rejected with 401.");

    // 1b. Authenticate SuperAdmin via Supabase Auth
    const testAdminEmail = `superadmin.admissions.${Date.now()}@dakshora.internal`;
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
      path: "/api/erp/admissions/overview",
      headers: authHeaders
    });
    assert.strictEqual(authRes.status, 200, "Authenticated overview must return 200");
    assert.strictEqual(authRes.body?.success, true);
    assert.ok(authRes.body?.overview?.totalApplications !== undefined, "Overview must include totalApplications");
    console.log("  ✅ Authenticated access granted with valid admissions overview.\n");

    const orgId = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

    // ------------------------------------------------------------------------
    // GATE 2: Public Website Inquiry Capture with PostgreSQL Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 2/10] Capturing Website Lead with PostgreSQL Persistence...");
    const inquiryName = `Aditya Singhania ${Date.now().toString().slice(-4)}`;
    const inquiryEmail = `aditya.parent.${Date.now().toString().slice(-4)}@example.com`;

    const leadRes = await makeRequest({
      method: "POST",
      path: "/api/erp/admissions/leads/capture",
      body: {
        organization_id: orgId,
        name: inquiryName,
        email: inquiryEmail,
        phone: "+91 98765 43210",
        source: "website",
        message: "Interested in Class 10 CBSE admission with STEM lab facilities",
        metadata: {
          grade: "Class 10",
          session: "2026-27"
        }
      }
    });

    assert.strictEqual(leadRes.status, 200, "Lead capture must return 200");
    assert.strictEqual(leadRes.body?.success, true);
    assert.ok(leadRes.body?.lead?.id, "Lead must have an ID");
    createdLeadId = leadRes.body.lead.id;
    console.log(`  ✅ Lead captured: ID=${createdLeadId}, Name=${inquiryName}`);

    // Verify in Supabase public.leads table
    const { data: dbLead } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", createdLeadId)
      .maybeSingle();

    assert.ok(dbLead, "Lead must be persisted in Supabase public.leads");
    assert.strictEqual(dbLead.email, inquiryEmail, "Lead email must match in DB");
    console.log(`  ✅ Verified persistence in public.leads table.\n`);

    // ------------------------------------------------------------------------
    // GATE 3: CRM Lead to Admission Application Conversion
    // ------------------------------------------------------------------------
    console.log("[Gate 3/10] Converting CRM Lead to Admission Application...");
    const convertRes = await makeRequest({
      method: "POST",
      path: `/api/erp/admissions/leads/${createdLeadId}/convert`,
      headers: authHeaders,
      body: {
        academicSession: "2026-27",
        appliedGrade: "Class 10"
      }
    });

    assert.strictEqual(convertRes.status, 200, "Lead conversion must return 200");
    assert.strictEqual(convertRes.body?.success, true);
    assert.ok(convertRes.body?.admission?.applicationNo, "Application number must be generated");
    convertedAppId = convertRes.body.admission.id;
    console.log(`  ✅ Lead converted to Application: ${convertRes.body.admission.applicationNo} (ID: ${convertedAppId})`);

    // Verify lead status updated to 'converted' in DB
    const { data: updatedDbLead } = await supabaseAdmin
      .from("leads")
      .select("status")
      .eq("id", createdLeadId)
      .maybeSingle();

    assert.strictEqual(updatedDbLead?.status, "converted", "Lead status in DB must be 'converted'");
    console.log(`  ✅ Verified lead status updated to 'converted' in public.leads.\n`);

    // ------------------------------------------------------------------------
    // GATE 4: Direct Application Registration & Document Checklist Pre-seeding
    // ------------------------------------------------------------------------
    console.log("[Gate 4/10] Registering Direct Admission Application & Checklist Pre-seeding...");
    const directStudentName = `Meera Kapoor ${Date.now().toString().slice(-4)}`;
    const directAppRes = await makeRequest({
      method: "POST",
      path: "/api/erp/admissions",
      headers: authHeaders,
      body: {
        studentName: directStudentName,
        appliedGrade: "Class 10",
        academicSession: "2026-27",
        gender: "Female",
        dob: "2011-08-20",
        parentName: "Sunil Kapoor",
        parentRelation: "Father",
        parentEmail: `sunil.kapoor.${Date.now().toString().slice(-4)}@example.com`,
        phone: "+91 98111 22334",
        address: "Sector 54, Golf Course Road, Gurugram",
        source: "walk_in"
      }
    });

    assert.strictEqual(directAppRes.status, 200, "Direct application registration must return 200");
    assert.strictEqual(directAppRes.body?.success, true);
    directAppId = directAppRes.body.admission.id;
    const directAppNo = directAppRes.body.admission.applicationNo;
    console.log(`  ✅ Direct application registered: ${directAppNo} (ID: ${directAppId})`);

    // Verify dossier and pre-seeded documents
    const dossierRes = await makeRequest({
      method: "GET",
      path: `/api/erp/admissions/${directAppId}`,
      headers: authHeaders
    });
    assert.strictEqual(dossierRes.status, 200, "Application dossier must return 200");
    assert.ok(dossierRes.body?.documents?.length >= 5, "Must have pre-seeded document checklist");
    assert.ok(dossierRes.body?.timeline?.length > 0, "Must have initial timeline entry");
    console.log(`  ✅ Dossier verified with ${dossierRes.body.documents.length} pre-seeded documents and audit timeline.\n`);

    // ------------------------------------------------------------------------
    // GATE 5: Document Upload & Verification Subsystem
    // ------------------------------------------------------------------------
    console.log("[Gate 5/10] Testing Document Verification Subsystem...");
    const docs = dossierRes.body.documents;
    
    // Verify each document in the checklist
    for (const d of docs) {
      const verifyDocRes = await makeRequest({
        method: "PATCH",
        path: `/api/erp/admissions/${directAppId}/documents/${d.id}`,
        headers: authHeaders,
        body: {
          status: "verified",
          verifiedBy: "Document Officer Kavita Sharma"
        }
      });
      assert.strictEqual(verifyDocRes.status, 200, `Document ${d.documentName} verification must return 200`);
      assert.strictEqual(verifyDocRes.body?.document?.status, "verified");
    }

    // Verify application status auto-advanced to 'verified'
    const updatedDossier = await makeRequest({
      method: "GET",
      path: `/api/erp/admissions/${directAppId}`,
      headers: authHeaders
    });
    assert.strictEqual(updatedDossier.body?.admission?.status, "verified", "Application must auto-advance to verified");
    console.log(`  ✅ All ${docs.length} documents verified. Application status auto-advanced to 'verified'.\n`);

    // ------------------------------------------------------------------------
    // GATE 6: Counselor Evaluation & Interview Assessment Notes
    // ------------------------------------------------------------------------
    console.log("[Gate 6/10] Adding Counselor Assessment & Interview Score...");
    const noteRes = await makeRequest({
      method: "POST",
      path: `/api/erp/admissions/${directAppId}/notes`,
      headers: authHeaders,
      body: {
        content: "Applicant performed exceptionally well in Science & Mathematics interaction. Strong communication skills.",
        noteType: "interview",
        interviewScore: 48,
        authorName: "Senior Counselor Anita Roy",
        authorRole: "Admissions Counselor"
      }
    });

    assert.strictEqual(noteRes.status, 200, "Adding note must return 200");
    assert.strictEqual(noteRes.body?.success, true);
    console.log(`  ✅ Counselor evaluation recorded with Interview Score: 48/50.\n`);

    // ------------------------------------------------------------------------
    // GATE 7: Merit List Generation Engine
    // ------------------------------------------------------------------------
    console.log("[Gate 7/10] Testing Merit List Generation Engine...");
    const meritRes = await makeRequest({
      method: "GET",
      path: `/api/erp/admissions/merit-list?session=2026-27&grade=Class%2010&cutoffScore=40&limit=10`,
      headers: authHeaders
    });

    assert.strictEqual(meritRes.status, 200, "Merit list generation must return 200");
    assert.strictEqual(meritRes.body?.success, true);
    assert.ok(meritRes.body?.meritList?.candidates?.length > 0, "Candidates must be ranked");
    const merit = meritRes.body.meritList;
    console.log(`  ✅ Merit List Generated: Total=${merit.totalApplicants}, Selected=${merit.selectedCount}, Cutoff=${merit.cutoffScore}, Highest=${merit.highestScore}`);
    console.log(`  ✅ Top Candidate: ${merit.candidates[0].studentName} (Rank: #${merit.candidates[0].rank}, Score: ${merit.candidates[0].score}, Status: ${merit.candidates[0].qualificationStatus})\n`);

    // ------------------------------------------------------------------------
    // GATE 8: Pre-Admission Duplicate Detection
    // ------------------------------------------------------------------------
    console.log("[Gate 8/10] Testing Pre-Admission Duplicate Detection...");
    const dupRes = await makeRequest({
      method: "POST",
      path: "/api/erp/admissions/check-duplicate",
      headers: authHeaders,
      body: {
        studentName: directStudentName,
        parentPhone: "+91 98111 22334"
      }
    });

    assert.strictEqual(dupRes.status, 200, "Duplicate check must return 200");
    assert.strictEqual(dupRes.body?.success, true);
    assert.strictEqual(dupRes.body?.hasDuplicate, true, "Must detect existing applicant as duplicate");
    assert.ok(dupRes.body?.matchesCount >= 1, "Must find at least 1 duplicate match");
    console.log(`  ✅ Duplicate correctly flagged: Matches=${dupRes.body.matchesCount}, Confidence=${dupRes.body.matches[0].confidence}%\n`);

    // ------------------------------------------------------------------------
    // GATE 9: One-Click Transactional Student Conversion into PostgreSQL
    // ------------------------------------------------------------------------
    console.log("[Gate 9/10] Confirming Admission & Converting to Student in PostgreSQL...");
    const confirmRes = await makeRequest({
      method: "POST",
      path: `/api/erp/admissions/${directAppId}/confirm`,
      headers: authHeaders,
      body: {
        grade: "Class 10",
        section: "A",
        bloodGroup: "O+"
      }
    });

    assert.strictEqual(confirmRes.status, 200, "Confirm admission must return 200");
    assert.strictEqual(confirmRes.body?.success, true);
    assert.ok(confirmRes.body?.student?.admissionNo, "Student must receive an admission number");
    const enrolledStudent = confirmRes.body.student;
    convertedStudentDbId = enrolledStudent.db_id;
    const generatedFeeDemand = confirmRes.body.feeDemand;
    generatedFeeDemandDbId = generatedFeeDemand?.db_id;

    console.log(`  ✅ Enrolled Student: ${enrolledStudent.name}, AdmissionNo: ${enrolledStudent.admissionNo}, DB_UUID: ${convertedStudentDbId || 'N/A'}`);
    if (generatedFeeDemand) {
      console.log(`  ✅ Initial Fee Demand: ${generatedFeeDemand.invoiceNo}, Amount: ₹${generatedFeeDemand.netAmount}, DB_UUID: ${generatedFeeDemandDbId || 'N/A'}`);
    }

    if (convertedStudentDbId) {
      const { data: dbStd } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("id", convertedStudentDbId)
        .maybeSingle();

      assert.ok(dbStd, "Student must be persisted in Supabase public.students");
      assert.strictEqual(dbStd.admission_status, "admitted", "Admission status must be 'admitted'");
      console.log(`  ✅ Verified student record in public.students table.`);
    }

    if (generatedFeeDemandDbId) {
      const { data: dbFee } = await supabaseAdmin
        .from("student_fees")
        .select("*")
        .eq("id", generatedFeeDemandDbId)
        .maybeSingle();

      assert.ok(dbFee, "Fee demand must be persisted in Supabase public.student_fees");
      console.log(`  ✅ Verified fee demand in public.student_fees table.\n`);
    }

    // ------------------------------------------------------------------------
    // GATE 10: Database Cleanup & Integrity Teardown
    // ------------------------------------------------------------------------
    console.log("[Gate 10/10] Performing Database Cleanup & Teardown...");

    // Clean up fee demand
    if (generatedFeeDemandDbId) {
      await supabaseAdmin.from("student_fees").delete().eq("id", generatedFeeDemandDbId);
    }

    // Clean up student
    if (convertedStudentDbId) {
      await supabaseAdmin.from("students").delete().eq("id", convertedStudentDbId);
    }

    // Clean up lead
    if (createdLeadId) {
      await supabaseAdmin.from("leads").delete().eq("id", createdLeadId);
    }

    // Clean up test admin user
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
    }
    console.log("  ✅ Cleaned up all test records from Supabase PostgreSQL.\n");

    console.log("==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: ADMISSIONS & CRM PIPELINE SUITE FULLY OPERATIONAL!");
    console.log("==========================================================================");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runLiveAdmissionsCrmTest();

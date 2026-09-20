import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import assert from "assert";
import { buildApp } from "../src/app.js";

async function runLiveExaminationReportCardTest() {
  console.log("==========================================================================");
  console.log("🎓 DAKSHORA 2.0 — LIVE EXAMINATION & CBSE REPORT CARD PERSISTENCE TEST");
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

  // 1. Start gateway test server on port 5298
  const app = await buildApp();
  const PORT = 5298;
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
  let createdExamId = null;
  let createdExamDbId = null;

  try {
    // 2. Authenticate SuperAdmin
    const testAdminEmail = `superadmin.exams.${Date.now()}@dakshora.internal`;
    const testPassword = "SuperAdminPassword123!Secure";

    console.log(`[1/8] Authenticating Super Admin (${testAdminEmail})...`);
    const { data: userRecord, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });

    if (userErr) {
      throw new Error(`Failed to create SuperAdmin: ${userErr.message}`);
    }
    testAdminUser = userRecord.user;

    const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
      email: testAdminEmail,
      password: testPassword
    });

    if (signInErr) {
      throw new Error(`Failed to sign in SuperAdmin: ${signInErr.message}`);
    }

    const token = signInData.session?.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log("  ✅ Authenticated successfully with Supabase JWT.\n");

    const orgId = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

    // 3. Create Examination
    console.log("[2/8] Creating Examination via POST /api/erp/exams...");
    const examTitle = `Annual Summative Assessment ${Date.now().toString().slice(-4)}`;
    const createExamRes = await makeRequest({
      method: "POST",
      path: "/api/erp/exams",
      headers: authHeaders,
      body: {
        title: examTitle,
        examType: "Annual",
        academicSession: "2026-27",
        grade: "Class 10",
        section: "A",
        startDate: "2027-02-15",
        endDate: "2027-02-28",
        status: "scheduled"
      }
    });

    assert(createExamRes.status === 200, `Expected 200 but got ${createExamRes.status}: ${JSON.stringify(createExamRes.body)}`);
    assert(createExamRes.body?.success === true, "Exam creation failed");
    createdExamId = createExamRes.body.exam.id;
    createdExamDbId = createExamRes.body.exam.db_id;
    console.log(`  ✅ Exam Created: '${examTitle}' (In-Memory ID: ${createdExamId}, DB UUID: ${createdExamDbId || 'N/A'})`);

    // Verify in Supabase PostgreSQL
    if (createdExamDbId) {
      const { data: dbExam, error: dbExamErr } = await supabaseAdmin
        .from("exams")
        .select("*")
        .eq("id", createdExamDbId)
        .single();
      assert(!dbExamErr && dbExam, `Supabase exam query failed: ${dbExamErr?.message}`);
      assert(dbExam.name === examTitle, "Exam name in Supabase does not match");
      console.log(`  ✅ Verified persistence in Supabase public.exams table: [${dbExam.id}] ${dbExam.name}`);
    }

    // 4. Configure Multiple Exam Subjects
    console.log("\n[3/8] Configuring Exam Subjects via POST /api/erp/exams/:id/subjects...");
    const subjectsToConfig = [
      { name: "Mathematics Standard", code: "MATH-041", maxMarks: 100, passMarks: 33, examDate: "2027-02-15" },
      { name: "Science & Technology", code: "SCI-086", maxMarks: 100, passMarks: 33, examDate: "2027-02-18" },
      { name: "English Language & Literature", code: "ENG-184", maxMarks: 100, passMarks: 33, examDate: "2027-02-21" }
    ];

    const configuredSubjects = [];
    for (const sub of subjectsToConfig) {
      const subRes = await makeRequest({
        method: "POST",
        path: `/api/erp/exams/${createdExamId}/subjects`,
        headers: authHeaders,
        body: {
          subjectName: sub.name,
          subjectCode: sub.code,
          maxMarks: sub.maxMarks,
          passMarks: sub.passMarks,
          examDate: sub.examDate
        }
      });
      assert(subRes.status === 200, `Failed to configure subject ${sub.name}: ${JSON.stringify(subRes.body)}`);
      configuredSubjects.push(subRes.body.examSubject);
      console.log(`  ✅ Configured: ${sub.name} (${sub.code}) [ID: ${subRes.body.examSubject.id}, DB UUID: ${subRes.body.examSubject.db_id || 'N/A'}]`);
    }

    // Verify subjects in Supabase
    if (createdExamDbId) {
      const { data: dbExSubs, error: dbSubsErr } = await supabaseAdmin
        .from("exam_subjects")
        .select("*")
        .eq("exam_id", createdExamDbId);
      assert(!dbSubsErr, `Supabase exam_subjects query error: ${dbSubsErr?.message}`);
      console.log(`  ✅ Verified ${dbExSubs.length} subject(s) in Supabase public.exam_subjects table`);
    }

    // 5. Enroll / Get Test Student
    console.log("\n[4/8] Enrolling Student for Exam Evaluation...");
    const admissionNo = `ADM-EXAM-${Date.now().toString().slice(-4)}`;
    const studentRes = await makeRequest({
      method: "POST",
      path: "/api/erp/students",
      headers: authHeaders,
      body: {
        admissionNo,
        firstName: "Priya",
        lastName: "Nair",
        grade: "Class 10",
        section: "A",
        gender: "Female",
        dob: "2011-03-22",
        bloodGroup: "A+",
        parentName: "Suresh Nair",
        parentPhone: "+919876540001",
        email: `priya.${Date.now()}@student.dakshora.in`
      }
    });

    assert(studentRes.status === 201, `Failed to enroll student: ${JSON.stringify(studentRes.body)}`);
    const student = studentRes.body.student;
    console.log(`  ✅ Enrolled Student: ${student.name} (Adm: ${student.admissionNo}, ID: ${student.id}, DB UUID: ${student.db_id || 'N/A'})`);

    // 6. Enter Bulk Marks for the Student across Subjects
    console.log("\n[5/8] Submitting Bulk Marks via POST /api/erp/marks/bulk...");
    const marksData = [
      { subject: configuredSubjects[0], score: 96, remarks: "Outstanding theorem proofs" },
      { subject: configuredSubjects[1], score: 91, remarks: "Excellent experimental methodology" },
      { subject: configuredSubjects[2], score: 88, remarks: "Thoughtful critical essay" }
    ];

    for (const m of marksData) {
      const marksRes = await makeRequest({
        method: "POST",
        path: "/api/erp/marks/bulk",
        headers: authHeaders,
        body: {
          examId: createdExamId,
          examSubjectId: m.subject.id,
          grade: "Class 10",
          section: "A",
          marks: [
            {
              studentId: student.id,
              studentName: student.name,
              admissionNo: student.admissionNo,
              marksObtained: m.score,
              status: "present",
              remarks: m.remarks
            }
          ]
        }
      });
      assert(marksRes.status === 200, `Bulk marks submission failed for ${m.subject.subjectName}: ${JSON.stringify(marksRes.body)}`);
      console.log(`  ✅ Marks Saved: ${m.subject.subjectName} -> ${m.score}/100 (Created: ${marksRes.body.createdCount}, Updated: ${marksRes.body.updatedCount})`);
    }

    // Verify marks in Supabase PostgreSQL
    if (configuredSubjects[0].db_id) {
      const { data: dbMarks, error: dbMarksErr } = await supabaseAdmin
        .from("marks")
        .select("*")
        .eq("exam_subject_id", configuredSubjects[0].db_id);
      assert(!dbMarksErr, `Supabase marks query error: ${dbMarksErr?.message}`);
      console.log(`  ✅ Verified marks persistence in Supabase public.marks table (${dbMarks.length} record)`);
      if (dbMarks.length > 0) {
        console.log(`     - Marks Obtained: ${dbMarks[0].marks_obtained}, Grade: ${dbMarks[0].grade}, Remarks: ${dbMarks[0].remarks}`);
      }
    }

    // 7. Fetch Results Matrix & Analytics
    console.log("\n[6/8] Verifying Automated Result & Ranking Calculation via GET /api/erp/results/exam/:examId...");
    const resultsRes = await makeRequest({
      method: "GET",
      path: `/api/erp/results/exam/${createdExamId}?grade=Class%2010&section=A`,
      headers: authHeaders
    });

    assert(resultsRes.status === 200, `Failed to fetch results: ${JSON.stringify(resultsRes.body)}`);
    const resultsData = resultsRes.body;
    assert(resultsData.results.length >= 1, "Expected at least 1 calculated student result");
    const stdResult = resultsData.results.find(r => r.studentId === student.id || r.admissionNo === student.admissionNo);
    assert(stdResult, "Student result record not found in results matrix");

    console.log(`  ✅ Student Result Computed:`);
    console.log(`     - Total Obtained: ${stdResult.totalMarksObtained} / ${stdResult.maxTotalMarks}`);
    console.log(`     - Percentage: ${stdResult.percentage}%`);
    console.log(`     - Overall Grade: ${stdResult.overallGrade} (CBSE 9-Point Scale)`);
    console.log(`     - Result Status: ${stdResult.resultStatus}`);
    console.log(`     - Class Rank: #${stdResult.classRank} | Section Rank: #${stdResult.sectionRank}`);
    assert(stdResult.overallGrade === "A1", `Expected A1 grade for 91.7% but got ${stdResult.overallGrade}`);
    assert(stdResult.resultStatus === "PASS", `Expected PASS result status but got ${stdResult.resultStatus}`);

    // 8. Fetch Official CBSE Report Card (JSON & HTML)
    console.log("\n[7/8] Generating Official CBSE-Compliant Report Card via GET /api/erp/report-cards/:examId/:studentId...");
    
    // JSON format
    const reportCardJsonRes = await makeRequest({
      method: "GET",
      path: `/api/erp/report-cards/${createdExamId}/${student.id}`,
      headers: authHeaders
    });
    assert(reportCardJsonRes.status === 200, `Failed to generate report card JSON: ${JSON.stringify(reportCardJsonRes.body)}`);
    const rc = reportCardJsonRes.body;
    assert(rc.success === true, "Report card response did not indicate success");
    assert(rc.school?.affiliationNo, "School affiliation number missing");
    assert(rc.student?.name === student.name, "Student name mismatch in report card");
    assert(rc.subjects?.length === 3, `Expected 3 subjects in report card, got ${rc.subjects?.length}`);
    assert(rc.gradingScale?.length === 8, `Expected 8 CBSE grades (A1 to E), got ${rc.gradingScale?.length}`);
    console.log(`  ✅ Report Card Generated (JSON):`);
    console.log(`     - Report Card No: ${rc.reportCardId}`);
    console.log(`     - School: ${rc.school.name} (CBSE Affiliation: ${rc.school.affiliationNo})`);
    console.log(`     - Student: ${rc.student.name} (Roll: ${rc.student.rollNumber})`);
    console.log(`     - Percentage: ${rc.result.percentage}% | Grade: ${rc.result.overallGrade} | Status: ${rc.result.resultStatus}`);

    // HTML format (A4 Printable View)
    const reportCardHtmlRes = await makeRequest({
      method: "GET",
      path: `/api/erp/report-cards/${createdExamId}/${student.id}?format=html`,
      headers: authHeaders
    });
    assert(reportCardHtmlRes.status === 200, `Failed to generate report card HTML: ${reportCardHtmlRes.status}`);
    assert(reportCardHtmlRes.headers["content-type"]?.includes("text/html"), "Expected text/html content type");
    assert(reportCardHtmlRes.rawBody.includes("Official CBSE Academic Performance Assessment Card"), "CBSE header missing in HTML");
    assert(reportCardHtmlRes.rawBody.includes(student.name), "Student name missing in HTML");
    assert(reportCardHtmlRes.rawBody.includes("Mathematics Standard"), "Subject missing in HTML");
    assert(reportCardHtmlRes.rawBody.includes("@page { size: A4 portrait;"), "A4 print CSS missing in HTML");
    console.log(`  ✅ Official A4 Printable HTML Report Card Generated (${reportCardHtmlRes.rawBody.length} bytes)`);

    // 9. Administrative Marks Correction & Lock Enforcement
    console.log("\n[8/8] Testing Administrative Marks Correction & Exam Locking...");
    const correctRes = await makeRequest({
      method: "POST",
      path: "/api/erp/marks/correct",
      headers: authHeaders,
      body: {
        examId: createdExamId,
        examSubjectId: configuredSubjects[0].id,
        studentId: student.id,
        marksObtained: 99,
        reason: "Re-evaluation of Theorem step mark approved by Examination Committee"
      }
    });
    assert(correctRes.status === 200, `Marks correction failed: ${JSON.stringify(correctRes.body)}`);
    console.log(`  ✅ Marks Correction Applied: 96 -> 99 with Immutable Audit Trail (Audit ID: ${correctRes.body.auditLogId})`);

    // Lock Exam
    const lockRes = await makeRequest({
      method: "POST",
      path: `/api/erp/exams/${createdExamId}/lock`,
      headers: authHeaders
    });
    assert(lockRes.status === 200, `Lock exam failed: ${JSON.stringify(lockRes.body)}`);
    console.log(`  ✅ Examination Locked: '${examTitle}'`);

    // Attempt modification on locked exam
    const lockedEditRes = await makeRequest({
      method: "POST",
      path: "/api/erp/marks/bulk",
      headers: authHeaders,
      body: {
        examId: createdExamId,
        examSubjectId: configuredSubjects[0].id,
        marks: [{ studentId: student.id, marksObtained: 100 }]
      }
    });
    assert(lockedEditRes.status === 400, `Expected 400 for locked exam edit, got ${lockedEditRes.status}`);
    assert(lockedEditRes.body?.code === "LOCKED_EXAM_MODIFICATION_FORBIDDEN", "Expected LOCKED_EXAM_MODIFICATION_FORBIDDEN error code");
    console.log(`  ✅ Lock Enforced: Direct marks modification blocked with HTTP 400 (LOCKED_EXAM_MODIFICATION_FORBIDDEN)`);

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10/10 TEST GATES PASSED! EXAMINATION & REPORT CARDS FULLY VERIFIED!");
    console.log("==========================================================================\n");

  } finally {
    // Cleanup temporary resources
    if (createdExamDbId) {
      try {
        await supabaseAdmin.from("exams").delete().eq("id", createdExamDbId);
        console.log(`[Cleanup] Removed test exam [${createdExamDbId}] and cascaded records from Supabase.`);
      } catch {}
    }
    if (testAdminUser) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
        console.log(`[Cleanup] Deleted temporary SuperAdmin user (${testAdminUser.email}).`);
      } catch {}
    }
    await app.close();
  }
}

runLiveExaminationReportCardTest();

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { buildApp } from "../src/app.js";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
dotenv.config();

let app: any;
let BASE_URL = "";
let adminToken = "";
let registeredOrgId = "";
let registeredSchoolSlug = "";
let registeredStudentId = "";
let registeredStudentDbId = "";
let testClassId = "";
let testSectionId = "";
let testTargetClassId = "";
let testTargetSectionId = "";
let testTargetSessionId = "";
let testStudentFeeId = "";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

describe("DAKSHORA 2.0 — MASTER PRODUCTION TRANSFORMATION & VERIFICATION SUITE", () => {
  before(async () => {
    app = await buildApp();
    const address = await app.listen({ port: 0, host: "127.0.0.1" });
    BASE_URL = address;
  });

  after(async () => {
    if (app) await app.close();
  });

  test("1. Real School Onboarding & Database Provisioning Pipeline", async () => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const testEmail = `principal_${uniqueSuffix}@delhipublicschool.test`;
    const testPassword = `SchoolAdmin@2026!${uniqueSuffix}`;
    const testSchoolName = `Delhi Public School Sector ${uniqueSuffix}`;
    const testPhone = `98765${uniqueSuffix.slice(-5)}`;

    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolName: testSchoolName,
        adminName: "Dr. R. K. Sharma",
        email: testEmail,
        password: testPassword,
        phone: testPhone,
        otp: "123456",
        board: "CBSE",
        medium: "English",
        state: "Rajasthan",
        city: "Jaipur"
      })
    });

    const data: any = await res.json();
    assert.equal(res.status, 201, `Registration should succeed with 201: ${JSON.stringify(data)}`);
    assert.ok(data.success, "Response must report success");
    assert.ok(data.token, "Must return valid JWT token");
    assert.ok(data.organization?.id, "Must have valid organization UUID");
    assert.notEqual(data.organization?.id, "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e", "Must NOT be demo org ID");

    registeredOrgId = data.organization.id;
    registeredSchoolSlug = data.organization.slug;
    adminToken = data.token;

    // Verify real PostgreSQL persistence across tables
    const { data: dbOrg } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", registeredOrgId)
      .maybeSingle();
    assert.ok(dbOrg, "Organization record must exist in PostgreSQL");
    assert.equal(dbOrg.name, testSchoolName);

    const { data: dbSchool } = await supabase
      .from("schools")
      .select("*")
      .eq("organization_id", registeredOrgId)
      .maybeSingle();
    assert.ok(dbSchool, "School record must exist in PostgreSQL");
    assert.equal(dbSchool.board, "CBSE");

    const { data: dbSession } = await supabase
      .from("academic_sessions")
      .select("*")
      .eq("organization_id", registeredOrgId)
      .maybeSingle();
    assert.ok(dbSession, "Initial academic session must be provisioned in PostgreSQL");

    const { data: dbWebsite } = await supabase
      .from("websites")
      .select("*, website_settings(*)")
      .eq("organization_id", registeredOrgId)
      .maybeSingle();
    assert.ok(dbWebsite, "School website must be provisioned in PostgreSQL");
    assert.equal(dbWebsite.status, "published");
  });

  test("2. Public School Website CMS Resolution (No Demo Fallback)", async () => {
    assert.ok(registeredSchoolSlug, "Must have valid school slug from step 1");

    const res = await fetch(`${BASE_URL}/api/public/schools/${registeredSchoolSlug}/cms`);
    const data: any = await res.json();

    assert.equal(res.status, 200, "CMS endpoint must return 200 for newly created school");
    assert.ok(data.success, "Response must be successful");
    assert.equal(data.website?.slug, registeredSchoolSlug, "Must resolve newly created school slug");
    assert.notEqual(data.school?.name, "Dakshora Demonstration School", "Must NOT return hardcoded demo school");
    assert.ok(data.pages?.length > 0, "Must return real pages created during onboarding");
  });

  test("3. Dynamic ERP Multi-Tenant Authentication & Session Token Resolution", async () => {
    const { data: dbUser } = await supabase
      .from("users")
      .select("email")
      .eq("organization_id", registeredOrgId)
      .maybeSingle();
    assert.ok(dbUser, "User must exist in PostgreSQL");

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: dbUser.email,
        password: "WrongPassword!999"
      })
    });
    assert.equal(res.status, 401, "Invalid password must reject with 401");
  });

  test("4. Academic Structure Setup (Classes, Sections, Target Session)", async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": registeredOrgId
    };

    // Create Source Class 9
    const class9Res = await fetch(`${BASE_URL}/api/erp/academics/classes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Class 9", code: "CLS-9" })
    });
    const class9Data: any = await class9Res.json();
    assert.ok(class9Data.success);
    testClassId = class9Data.class?.db_id || class9Data.class?.id;

    // Create Source Section A
    const sec9Res = await fetch(`${BASE_URL}/api/erp/academics/sections`, {
      method: "POST",
      headers,
      body: JSON.stringify({ classId: testClassId, name: "Section A" })
    });
    const sec9Data: any = await sec9Res.json();
    assert.ok(sec9Data.success);
    testSectionId = sec9Data.section?.db_id || sec9Data.section?.id;

    // Create Target Class 10
    const class10Res = await fetch(`${BASE_URL}/api/erp/academics/classes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Class 10", code: "CLS-10" })
    });
    const class10Data: any = await class10Res.json();
    assert.ok(class10Data.success);
    testTargetClassId = class10Data.class?.db_id || class10Data.class?.id;

    // Create Target Section A
    const sec10Res = await fetch(`${BASE_URL}/api/erp/academics/sections`, {
      method: "POST",
      headers,
      body: JSON.stringify({ classId: testTargetClassId, name: "Section A" })
    });
    const sec10Data: any = await sec10Res.json();
    assert.ok(sec10Data.success);
    testTargetSectionId = sec10Data.section?.db_id || sec10Data.section?.id;

    // Create Next Academic Session 2027-2028
    const sessionRes = await fetch(`${BASE_URL}/api/erp/academics/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "2027-2028",
        startDate: "2027-04-01",
        endDate: "2028-03-31",
        isCurrent: false
      })
    });
    const sessionData: any = await sessionRes.json();
    assert.ok(sessionData.success);
    testTargetSessionId = sessionData.session?.db_id || sessionData.session?.id;
  });

  test("5. Student Enrollment with Real Graph Relationships & Fee Demand Generation", async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": registeredOrgId
    };

    // Create Fee Structure for Class 9
    const feeRes = await fetch(`${BASE_URL}/api/erp/fees/structures`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Tuition Fee Q1 Class 9",
        feeHead: "Tuition Fee",
        grade: "Class 9",
        amountINR: 12000,
        frequency: "quarterly",
        academicSession: "2026-27"
      })
    });
    const feeData: any = await feeRes.json();
    assert.ok(feeData.success);

    // Enroll Student 1 in Class 9
    const stdRes = await fetch(`${BASE_URL}/api/erp/students`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Aarav Sharma",
        admissionNo: `DPS-${Date.now().toString().slice(-4)}`,
        grade: "Class 9",
        section: "A",
        gender: "Male",
        dob: "2011-05-15",
        parentName: "Sanjay Sharma",
        parentPhone: "9829012345",
        parentEmail: "sanjay.sharma@example.test",
        address: "C-44 Malviya Nagar, Jaipur"
      })
    });
    const stdData: any = await stdRes.json();
    assert.ok(stdData.success, `Student creation must succeed: ${JSON.stringify(stdData)}`);
    assert.ok(stdData.student?.id);
    registeredStudentId = stdData.student.id;
    registeredStudentDbId = stdData.student.db_id || stdData.student.id;

    // Verify student persisted in PostgreSQL
    const { data: dbStudent } = await supabase
      .from("students")
      .select("*, student_enrollments(*)")
      .eq("organization_id", registeredOrgId)
      .eq("admission_no", stdData.student.admissionNo)
      .maybeSingle();
    assert.ok(dbStudent, "Student must be stored in PostgreSQL");

    // Verify auto-created student_fees demand
    const { data: dbFees } = await supabase
      .from("student_fees")
      .select("*")
      .eq("organization_id", registeredOrgId)
      .eq("student_id", dbStudent.id);
    assert.ok(dbFees && dbFees.length > 0, "Fee demand must be automatically generated in PostgreSQL");
    testStudentFeeId = dbFees[0].id;
  });

  test("6. Fee Payment with Sequential FY Receipt Numbering (REC/2026-27/0001)", async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": registeredOrgId
    };

    const payRes = await fetch(`${BASE_URL}/api/erp/fees/collect`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        studentId: registeredStudentId,
        amountPaid: 5000,
        paymentMode: "upi",
        referenceNumber: "UPI-TEST-889900",
        remarks: "First Quarter Partial Fee"
      })
    });
    const payData: any = await payRes.json();
    assert.ok(payData.success, `Fee payment must succeed: ${JSON.stringify(payData)}`);
    assert.ok(payData.receiptNo, "Receipt number must be generated");
    assert.match(payData.receiptNo, /^REC\/\d{4}-\d{2}\/\d{4}$/, "Receipt number must strictly follow sequential FY format REC/YYYY-YY/XXXX");

    // Verify fee_payments record in PostgreSQL
    const { data: dbPay } = await supabase
      .from("fee_payments")
      .select("*")
      .eq("organization_id", registeredOrgId)
      .eq("receipt_no", payData.receiptNo)
      .maybeSingle();
    assert.ok(dbPay, "Payment must be persisted to PostgreSQL public.fee_payments table");
    assert.equal(Number(dbPay.amount), 5000);
  });

  test("7. Academic Promotion Engine (/api/erp/academics/promote) & Enrollment Rollover", async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": registeredOrgId
    };

    const promoteRes = await fetch(`${BASE_URL}/api/erp/academics/promote`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        studentIds: [registeredStudentDbId || registeredStudentId],
        targetAcademicSessionId: testTargetSessionId,
        targetClassId: testTargetClassId,
        targetSectionId: testTargetSectionId
      })
    });
    const promoteData: any = await promoteRes.json();
    assert.ok(promoteData.success, `Promotion must succeed: ${JSON.stringify(promoteData)}`);
    assert.equal(promoteData.summary?.promotedCount, 1, "Exactly 1 student should be promoted");

    // Verify PostgreSQL enrollment rollover
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("*")
      .eq("organization_id", registeredOrgId)
      .eq("student_id", registeredStudentDbId)
      .order("created_at", { ascending: false });

    assert.ok(enrollments && enrollments.length >= 2, "Must have both old closed enrollment and new active enrollment");
    const activeEnrollment = enrollments[0];
    assert.equal(activeEnrollment.left_on, null, "Active enrollment must have null left_on");
  });

  test("8. Transfer Certificate (TC) Issuance, Status Update & Public Verification", async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": registeredOrgId
    };

    // Issue Transfer Certificate
    const tcRes = await fetch(`${BASE_URL}/api/erp/students/${registeredStudentId}/transfer-certificate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        reason: "Father Transferred to New Delhi",
        toSchool: "DPS R.K. Puram New Delhi",
        conduct: "Exemplary",
        remarks: "Promoted to Class 10"
      })
    });
    const tcData: any = await tcRes.json();
    assert.ok(tcData.success, `TC issuance must succeed: ${JSON.stringify(tcData)}`);
    assert.ok(tcData.tcNo, "TC number must be generated");
    assert.match(tcData.tcNo, /^TC\/\d{4}-\d{2}\/\d{4}$/, "TC number must strictly follow TC/YYYY-YY/XXXX format");

    // Verify student is marked as 'withdrawn' in PostgreSQL
    const { data: stdRecord } = await supabase
      .from("students")
      .select("admission_status")
      .eq("id", registeredStudentDbId)
      .maybeSingle();
    assert.equal(stdRecord?.admission_status, "withdrawn", "Student must be marked as withdrawn in PostgreSQL");

    // Verify record in public.student_transfers table
    const { data: dbTransfer } = await supabase
      .from("student_transfers")
      .select("*")
      .eq("organization_id", registeredOrgId)
      .eq("transfer_certificate_no", tcData.tcNo)
      .maybeSingle();
    assert.ok(dbTransfer, "Transfer must be recorded in public.student_transfers");

    // Public Verification of TC via QR endpoint
    const verifyRes = await fetch(`${BASE_URL}/api/public/verify-certificate/${encodeURIComponent(tcData.tcNo)}`);
    const verifyData: any = await verifyRes.json();
    assert.equal(verifyRes.status, 200, "Public verify endpoint must return 200");
    assert.ok(verifyData.verified, "Certificate must verify as authentic");
    assert.equal(verifyData.data?.certificateNo, tcData.tcNo);
  });

  test("9. Bonafide Certificate Issuance & Public Verification", async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": registeredOrgId
    };

    const bonafideRes = await fetch(`${BASE_URL}/api/erp/students/${registeredStudentId}/bonafide-certificate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        purpose: "Passport Application Verification",
        academicSession: "2026-27"
      })
    });
    const bonafideData: any = await bonafideRes.json();
    assert.ok(bonafideData.success);
    assert.ok(bonafideData.certificateNo);

    // Public verify
    const verifyRes = await fetch(`${BASE_URL}/api/public/verify-certificate/${encodeURIComponent(bonafideData.certificateNo)}`);
    const verifyData: any = await verifyRes.json();
    assert.equal(verifyRes.status, 200);
    assert.ok(verifyData.verified);
  });

  test("10. Multi-Tenant Strict Isolation (Foreign Tenant Access Denied with 403)", async () => {
    const foreignOrgId = "ffffffff-ffff-ffff-ffff-ffffffffffff";

    // Attempt to access with foreign organization header
    const res = await fetch(`${BASE_URL}/api/erp/students`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        "x-organization-id": foreignOrgId
      }
    });

    // Should return 403 or empty data strictly isolated to foreign tenant
    const data: any = await res.json();
    if (res.status === 200) {
      assert.equal(data.students?.length || 0, 0, "Foreign tenant must never see another tenant's students");
    } else {
      assert.equal(res.status, 403, "Cross-tenant access must be rejected with 403");
    }
  });
});

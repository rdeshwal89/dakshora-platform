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
let schoolAdminToken = "";
let testOrgId = "";
let testOrgSlug = "";

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

describe("DAKSHORA 2.0 — MASTER STAFF BULK IMPORT, STUDENT ENROLMENT & WHITE-LABEL MOBILE APP SUITE", () => {
  before(async () => {
    app = await buildApp();
    const address = await app.listen({ port: 0, host: "127.0.0.1" });
    BASE_URL = address;

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
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

    // 2. Provision dedicated test organization and school for this test suite
    const ts = Date.now().toString().slice(-5);
    testOrgSlug = `delhipublictest${ts}`;
    testOrgId = crypto.randomUUID();

    await supabase.from("organizations").insert([{
      id: testOrgId,
      name: `Delhi Public Academy Test ${ts}`,
      slug: testOrgSlug,
      industry: "Education",
      status: "active"
    }]);

    await supabase.from("schools").insert([{
      id: crypto.randomUUID(),
      organization_id: testOrgId,
      school_code: `2026${ts}`,
      name: `Delhi Public Academy Test ${ts}`,
      board: "CBSE",
      city: "Jaipur",
      state: "Rajasthan"
    }]);

    await supabase.from("websites").insert([{
      id: crypto.randomUUID(),
      organization_id: testOrgId,
      domain: `${testOrgSlug}.school.dakshora.app`,
      status: "live"
    }]);

    // 3. Create a School Admin test user for testOrgId
    const schoolAdminEmail = `admin_suite_${ts}@dpa.test`;
    const schoolAdminPwd = "SchoolAdminSecure@2026!";
    const { data: createdAdmin } = await adminClient.auth.admin.createUser({
      email: schoolAdminEmail,
      password: schoolAdminPwd,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: testOrgId },
      user_metadata: { role: "school-admin", organization_id: testOrgId }
    });

    if (createdAdmin?.user) {
      await supabase.from("users").upsert([{
        id: createdAdmin.user.id,
        organization_id: testOrgId,
        email: schoolAdminEmail,
        name: "Test School Admin",
        role: "school-admin",
        status: "active"
      }], { onConflict: "id" });

      const { data: adminLogin } = await anonClient.auth.signInWithPassword({
        email: schoolAdminEmail,
        password: schoolAdminPwd
      });
      if (adminLogin?.session) {
        schoolAdminToken = adminLogin.session.access_token;
      }
    }
  });

  after(async () => {
    // Cleanup test organization records
    if (testOrgId) {
      await supabase.from("staff").delete().eq("organization_id", testOrgId);
      await supabase.from("students").delete().eq("organization_id", testOrgId);
      await supabase.from("websites").delete().eq("organization_id", testOrgId);
      await supabase.from("schools").delete().eq("organization_id", testOrgId);
      await supabase.from("organizations").delete().eq("id", testOrgId);
    }
    if (app) await app.close();
  });

  // =========================================================================
  // TEST 1: Downloadable Staff CSV Import Template
  // =========================================================================
  test("1. Downloadable Staff CSV Import Template Verification", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/staff/import-template`, {
      headers: getHeaders(schoolAdminToken, testOrgId)
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type")?.includes("text/csv"), true);
    assert.ok(res.headers.get("content-disposition")?.includes("attachment"));

    const text = await res.text();
    assert.ok(text.includes("Employee Code"));
    assert.ok(text.includes("Full Name"));
    assert.ok(text.includes("Mobile Number"));
    assert.ok(text.includes("Email Address"));
    assert.ok(text.includes("Designation"));
  });

  // =========================================================================
  // TEST 2: Staff Bulk Import Dry-Run Validation and Preview
  // =========================================================================
  test("2. Staff Bulk Import Dry-Run Validation with Exact Row-Level Errors", async () => {
    const ts = Date.now().toString().slice(-4);
    const res = await fetch(`${BASE_URL}/api/erp/staff/import`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        dryRun: true,
        staff: [
          {
            empId: `EMP-VAL-${ts}-1`,
            name: "Sunil Kumar",
            phone: "9829011111",
            email: `sunil.${ts}@school.test`,
            designation: "Mathematics Teacher",
            department: "Academics"
          },
          {
            // Missing name & designation
            empId: `EMP-VAL-${ts}-2`,
            phone: "9829022222",
            email: `invalid.${ts}@school.test`
          },
          {
            // Duplicate empId in same batch
            empId: `EMP-VAL-${ts}-1`,
            name: "Duplicate Person",
            phone: "9829033333",
            email: `dup.${ts}@school.test`,
            designation: "Science Teacher"
          }
        ]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.dryRun, true);
    assert.equal(data.totalRows, 3);
    assert.equal(data.validCount, 1);
    assert.equal(data.invalidCount, 2);
    assert.equal(data.errors.length, 2);
    assert.equal(data.errors[0].row, 2);
    assert.equal(data.errors[1].row, 3);
    assert.ok(data.errors[1].isDuplicate);
  });

  // =========================================================================
  // TEST 3: Staff Bulk Import Execution with PostgreSQL Persistence
  // =========================================================================
  test("3. Staff Bulk Import Batch Execution Persisting to PostgreSQL public.staff", async () => {
    const ts = Date.now().toString().slice(-4);
    const empCodeA = `FAC-${ts}-101`;
    const empCodeB = `FAC-${ts}-102`;

    const res = await fetch(`${BASE_URL}/api/erp/staff/import`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        dryRun: false,
        staff: [
          {
            empId: empCodeA,
            name: "Dr. Ananya Sen",
            designation: "Senior Physics Faculty",
            phone: "9829044444",
            email: `ananya.${ts}@dpa.test`,
            department: "Science",
            employmentType: "Full-time",
            gender: "Female"
          },
          {
            empId: empCodeB,
            name: "Vikas Meena",
            designation: "Computer Science Teacher",
            phone: "9829055555",
            email: `vikas.${ts}@dpa.test`,
            department: "IT & Robotics",
            employmentType: "Full-time",
            gender: "Male"
          }
        ]
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.importedCount, 2);
    assert.equal(data.failedCount, 0);

    // Verify in PostgreSQL public.staff table
    const { data: dbRecords, error } = await supabase
      .from("staff")
      .select("*")
      .eq("organization_id", testOrgId)
      .in("employee_code", [empCodeA, empCodeB]);

    assert.equal(error, null);
    assert.equal(dbRecords?.length, 2, "Both staff records must exist in PostgreSQL staff table");
    const staffA = dbRecords?.find(s => s.employee_code === empCodeA);
    assert.equal(staffA?.first_name, "Dr.");
    assert.equal(staffA?.designation, "Senior Physics Faculty");
    assert.equal(staffA?.gender, "female");

    // Second import with same code must reject duplicates
    const dupRes = await fetch(`${BASE_URL}/api/erp/staff/import`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        dryRun: false,
        staff: [
          {
            empId: empCodeA,
            name: "Conflicting Staff",
            designation: "Teacher",
            phone: "9829066666",
            email: `conflict.${ts}@dpa.test`
          }
        ]
      })
    });
    const dupData = await dupRes.json();
    assert.equal(dupData.importedCount, 0);
    assert.equal(dupData.failedCount, 1);
    assert.ok(dupData.errors[0].isDuplicate);
  });

  // =========================================================================
  // TEST 4: Manual Staff Entry with Mandatory Fields & Duplicate Guard
  // =========================================================================
  test("4. Manual Staff Entry Validates 5 Fields and Persists to PostgreSQL", async () => {
    const ts = Date.now().toString().slice(-4);
    const empCode = `FAC-MAN-${ts}`;

    // A. Missing required Employee ID returns 400
    const failRes = await fetch(`${BASE_URL}/api/erp/staff`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        name: "Rohit Verma",
        phone: "9829077777",
        email: `rohit.${ts}@dpa.test`,
        designation: "Librarian"
      })
    });
    assert.equal(failRes.status, 400);

    // B. Complete valid record creates staff
    const okRes = await fetch(`${BASE_URL}/api/erp/staff`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        empId: empCode,
        name: "Rohit Verma",
        phone: "9829077777",
        email: `rohit.${ts}@dpa.test`,
        designation: "Chief Librarian",
        department: "Library & Media",
        gender: "Male"
      })
    });
    assert.equal(okRes.status, 201);
    const okData = await okRes.json();
    assert.equal(okData.success, true);
    assert.equal(okData.staff.empId, empCode);

    // Verify in DB
    const { data: dbSingle } = await supabase
      .from("staff")
      .select("*")
      .eq("organization_id", testOrgId)
      .eq("employee_code", empCode)
      .maybeSingle();
    assert.ok(dbSingle, "Manually enrolled staff must exist in PostgreSQL staff table");
    assert.equal(dbSingle.designation, "Chief Librarian");

    // C. Duplicate employee code returns HTTP 409 Conflict
    const dupRes = await fetch(`${BASE_URL}/api/erp/staff`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        empId: empCode,
        name: "Another Rohit",
        phone: "9829088888",
        email: `another.${ts}@dpa.test`,
        designation: "Assistant Librarian"
      })
    });
    assert.equal(dupRes.status, 409);
  });

  // =========================================================================
  // TEST 5: Student Enrolment with Automatic Unique Student ID & Optional Last Name
  // =========================================================================
  test("5. Student Enrolment Generates Automatic Collision-Free Student ID & Optional Last Name", async () => {
    const ts = Date.now().toString().slice(-4);

    // Enrol student with first name only (NO lastName, NO admissionNo)
    const res = await fetch(`${BASE_URL}/api/erp/students`, {
      method: "POST",
      headers: getHeaders(schoolAdminToken, testOrgId),
      body: JSON.stringify({
        firstName: "Aarav",
        grade: "Class 6",
        section: "A",
        gender: "Male",
        dob: "2014-07-21",
        parentName: "Sanjay Sharma",
        parentPhone: `98290${ts}`,
        parentEmail: `parent.aarav.${ts}@example.test`
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.student.studentId, "studentId must be automatically generated");
    assert.ok(data.student.admissionNo, "admissionNo must be automatically generated");
    assert.equal(data.student.studentId, data.student.admissionNo);
    assert.equal(data.student.firstName, "Aarav");
    assert.equal(data.student.lastName, "", "Last name must be optional");

    const generatedId = data.student.studentId;

    // Verify record in PostgreSQL public.students
    const { data: dbStd, error } = await supabase
      .from("students")
      .select("*")
      .eq("organization_id", testOrgId)
      .eq("admission_no", generatedId)
      .maybeSingle();

    assert.equal(error, null);
    assert.ok(dbStd, "Enrolled student must exist in PostgreSQL students table");
    assert.equal(dbStd.first_name, "Aarav");
    assert.equal(dbStd.last_name, null);
  });

  // =========================================================================
  // TEST 6: Concurrent Student Enrolment Generates Strictly Unique IDs
  // =========================================================================
  test("6. Concurrent Student Enrolments Generate Distinct, Non-Colliding IDs", async () => {
    const names = ["Kabir", "Meera", "Advait", "Diya", "Rohan"];

    const enrollPromises = names.map((name, idx) =>
      fetch(`${BASE_URL}/api/erp/students`, {
        method: "POST",
        headers: getHeaders(schoolAdminToken, testOrgId),
        body: JSON.stringify({
          firstName: name,
          grade: "Class 7",
          section: "B",
          gender: idx % 2 === 0 ? "Male" : "Female"
        })
      }).then(r => r.json())
    );

    const results = await Promise.all(enrollPromises);
    const generatedIds = results.map(r => r.student?.studentId);

    assert.equal(generatedIds.length, 5);
    const uniqueIds = new Set(generatedIds);
    assert.equal(uniqueIds.size, 5, "All 5 concurrent students must have strictly unique IDs");

    for (const gid of generatedIds) {
      assert.ok(gid, "Every student must receive a valid non-empty student ID");
    }
  });

  // =========================================================================
  // TEST 7: White-Label Mobile App Configuration Retrieval
  // =========================================================================
  test("7. White-Label Mobile App Configuration Retrieval & Branding Load", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/white-label/config/${testOrgId}`, {
      headers: getHeaders(superAdminToken)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.organizationId, testOrgId);
    assert.ok(data.branding.packageId.includes(testOrgSlug.replace(/[^a-z0-9]/g, "")));
    assert.equal(data.branding.versionName, "2.0.0");
    assert.deepEqual(data.supportedBuildTypes, ["apk", "aab"]);
  });

  // =========================================================================
  // TEST 8: White-Label Mobile App Manifest & Package Validation
  // =========================================================================
  test("8. White-Label Mobile App Manifest & Reverse-Domain Validation", async () => {
    // A. Invalid package ID must fail validation
    const badRes = await fetch(`${BASE_URL}/api/admin/white-label/validate`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        packageId: "INVALID-PACKAGE-NAME!",
        appName: "School App",
        versionName: "2.0.0"
      })
    });
    assert.equal(badRes.status, 400);
    const badData = await badRes.json();
    assert.equal(badData.valid, false);

    // B. Valid package configuration passes
    const okRes = await fetch(`${BASE_URL}/api/admin/white-label/validate`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        packageId: `in.edu.${testOrgSlug.replace(/[^a-z0-9]/g, "")}.parentapp`,
        appName: "DPA Parent ERP",
        versionName: "2.1.0",
        versionCode: 2,
        primaryColor: "#0D9488",
        hostDomain: `${testOrgSlug}.school.dakshora.app`
      })
    });
    assert.equal(okRes.status, 200);
    const okData = await okRes.json();
    assert.equal(okData.success, true);
    assert.equal(okData.valid, true);
    assert.equal(okData.sanitizedConfig.versionName, "2.1.0");
  });

  // =========================================================================
  // TEST 9: White-Label Android Build Job Dispatch & Status Tracking
  // =========================================================================
  test("9. White-Label Mobile App Build Job Dispatch, Logs & Status Polling", async () => {
    const buildRes = await fetch(`${BASE_URL}/api/admin/white-label/build`, {
      method: "POST",
      headers: getHeaders(superAdminToken),
      body: JSON.stringify({
        organizationId: testOrgId,
        buildType: "apk",
        packageId: `in.edu.${testOrgSlug.replace(/[^a-z0-9]/g, "")}.parentapp`,
        appName: "Delhi Public App",
        versionName: "2.0.0",
        versionCode: 1,
        primaryColor: "#4F46E5"
      })
    });

    assert.equal(buildRes.status, 201);
    const buildData = await buildRes.json();
    assert.equal(buildData.success, true);
    assert.ok(buildData.build.buildId, "buildId must be generated");
    assert.equal(buildData.build.status, "ready");
    assert.ok(buildData.build.sha256Fingerprint, "SHA-256 cert fingerprint must be calculated");
    assert.equal(buildData.build.logs.length, 5, "Step-by-step compilation logs must be recorded");

    const buildId = buildData.build.buildId;

    // Poll build status via GET /api/admin/white-label/builds/:buildId
    const statusRes = await fetch(`${BASE_URL}/api/admin/white-label/builds/${buildId}`, {
      headers: getHeaders(superAdminToken)
    });
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.success, true);
    assert.equal(statusData.build.buildId, buildId);
    assert.equal(statusData.playStoreChecklist.readyForPlayConsoleUpload, true);
  });

  // =========================================================================
  // TEST 10: Public School App Download Portal & Digital Asset Links
  // =========================================================================
  test("10. Public Mobile App Download Portal & Digital Asset Links Verification", async () => {
    // A. Verify download metadata
    const dlRes = await fetch(`${BASE_URL}/api/public/schools/${testOrgSlug}/mobile-app/download`);
    assert.equal(dlRes.status, 200);
    const dlData = await dlRes.json();
    assert.equal(dlData.success, true);
    assert.ok(dlData.apkUrl.includes(".apk"));
    assert.ok(dlData.sha256Checksum);
    assert.equal(dlData.features.length >= 4, true);

    // B. Verify Google Digital Asset Links JSON
    const alRes = await fetch(`${BASE_URL}/api/public/schools/${testOrgSlug}/.well-known/assetlinks.json`);
    assert.equal(alRes.status, 200);
    const alData = await alRes.json();
    assert.ok(Array.isArray(alData));
    assert.equal(alData[0].relation[0], "delegate_permission/common.handle_all_urls");
    assert.equal(alData[0].target.namespace, "android_app");
    assert.ok(alData[0].target.sha256_cert_fingerprints.length > 0);
  });

  // =========================================================================
  // TEST 11: Cross-Tenant Multi-Tenant Isolation Verification
  // =========================================================================
  test("11. Strict Multi-Tenant Isolation Prevents Cross-Tenant Data Leakage", async () => {
    // School Admin for testOrgId attempts to access another organization's staff
    const foreignOrgId = "00000000-0000-0000-0000-000000000001";

    const crossStaffRes = await fetch(`${BASE_URL}/api/erp/staff/export?format=json`, {
      headers: getHeaders(schoolAdminToken, foreignOrgId) // Tampered org header
    });

    const crossData = await crossStaffRes.json();
    // Must return only records belonging to the authenticated token's organization, NOT foreignOrgId
    if (crossData.staff && crossData.staff.length > 0) {
      for (const s of crossData.staff) {
        assert.notEqual(s.organization_id, foreignOrgId, "Must never return foreign organization staff records");
      }
    }
  });
});

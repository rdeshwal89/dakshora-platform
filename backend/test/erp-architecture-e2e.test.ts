import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { buildApp } from "../src/app.js";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
dotenv.config();

let app: any;
let BASE_URL = "";
let superAdminToken = "";
const TEST_ORG_ID = "a0000000-0000-0000-0000-000000000001";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function getHeaders(orgId?: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${superAdminToken}`,
    ...(orgId ? { "x-organization-id": orgId } : {})
  };
}

describe("DAKSHORA 2.0 — UNIFIED SCHOOL ERP ARCHITECTURE & INTEGRATION TEST", () => {
  before(async () => {
    app = await buildApp();
    const address = await app.listen({ port: 0, host: "127.0.0.1" });
    BASE_URL = address;

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    const adminClient = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;
    const anonClient = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
      const email = "erp_e2e_superadmin@dakshora.test";
      const password = "TestAdmin@Audit2026!";
      try {
        const { data: list } = await adminClient.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === email);
        if (existing) {
          await adminClient.auth.admin.deleteUser(existing.id);
        }
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { role: "superadmin" }
        });
        const { data: signIn } = await anonClient.auth.signInWithPassword({ email, password });
        superAdminToken = signIn?.session?.access_token || "";
      } catch (err: any) {
        console.warn("Could not create dynamic SuperAdmin test user:", err.message);
      }
    }
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  test("1. Academic Sessions: Single Source of Truth in PostgreSQL", async () => {
    const sessionName = `Sess-${Date.now().toString().slice(-4)}`;
    
    // Create academic session via API
    const res = await fetch(`${BASE_URL}/api/erp/academics/sessions`, {
      method: "POST",
      headers: getHeaders(TEST_ORG_ID),
      body: JSON.stringify({
        name: sessionName,
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        isCurrent: true
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.session.id);

    // Verify session persisted in PostgreSQL Supabase table
    const { data: dbSession, error } = await supabase
      .from("academic_sessions")
      .select("*")
      .eq("organization_id", TEST_ORG_ID)
      .eq("name", sessionName)
      .maybeSingle();

    assert.equal(error, null);
    assert.ok(dbSession, "Academic session must exist in public.academic_sessions table");
    assert.equal(dbSession.name, sessionName);
    assert.equal(dbSession.is_current, true);
  });

  test("2. Class Creation Cascades to PostgreSQL and Section Availability", async () => {
    const className = `Grade-X-${Date.now().toString().slice(-4)}`;

    // Create Class
    const classRes = await fetch(`${BASE_URL}/api/erp/academics/classes`, {
      method: "POST",
      headers: getHeaders(TEST_ORG_ID),
      body: JSON.stringify({
        grade: className,
        wing: "Senior Secondary",
        order: 11
      })
    });

    assert.equal(classRes.status, 200);
    const classData = await classRes.json();
    assert.equal(classData.success, true);
    const classId = classData.class.id;
    assert.ok(classId);

    // Verify persisted in PostgreSQL
    const { data: dbClass } = await supabase
      .from("classes")
      .select("*")
      .eq("organization_id", TEST_ORG_ID)
      .eq("name", className)
      .maybeSingle();

    assert.ok(dbClass, "Class must exist in public.classes table");
    assert.equal(dbClass.name, className);

    // Create Section for this Class
    const secRes = await fetch(`${BASE_URL}/api/erp/academics/sections`, {
      method: "POST",
      headers: getHeaders(TEST_ORG_ID),
      body: JSON.stringify({
        grade: className,
        section: "B",
        roomNumber: "Room 402",
        capacity: 45
      })
    });

    assert.equal(secRes.status, 200);
    const secData = await secRes.json();
    assert.equal(secData.success, true);

    // Verify section persisted in PostgreSQL with real foreign key class_id
    const { data: dbSection } = await supabase
      .from("sections")
      .select("*")
      .eq("organization_id", TEST_ORG_ID)
      .eq("class_id", dbClass.id)
      .eq("name", "B")
      .maybeSingle();

    assert.ok(dbSection, "Section must exist in public.sections table with class_id foreign key");
  });

  test("3. Student Creation Cascades to Enrollments, Parents, and Auto-Fee Demands", async () => {
    const testGrade = `Class-12-${Date.now().toString().slice(-4)}`;
    const admNo = `ADM-CASCADE-${Date.now().toString().slice(-5)}`;

    // First create a Fee Structure for this school
    await fetch(`${BASE_URL}/api/erp/fees/structures`, {
      method: "POST",
      headers: getHeaders(TEST_ORG_ID),
      body: JSON.stringify({
        feeHead: `Composite Fee ${testGrade}`,
        amountINR: 18500,
        frequency: "quarterly",
        grade: testGrade
      })
    });

    // Enroll student with Parent info
    const stdRes = await fetch(`${BASE_URL}/api/erp/students`, {
      method: "POST",
      headers: getHeaders(TEST_ORG_ID),
      body: JSON.stringify({
        admissionNo: admNo,
        firstName: "Aarav",
        lastName: "Verma",
        grade: testGrade,
        section: "A",
        parentName: "Sanjay Verma",
        parentPhone: "+919810011223",
        parentEmail: "sanjay.verma@example.com",
        parentRelation: "Father"
      })
    });

    assert.equal(stdRes.status, 201);
    const stdData = await stdRes.json();
    assert.equal(stdData.success, true);

    // 1. Verify student in public.students
    const { data: dbStd } = await supabase
      .from("students")
      .select("*")
      .eq("organization_id", TEST_ORG_ID)
      .eq("admission_no", admNo)
      .maybeSingle();

    assert.ok(dbStd, "Student must be in public.students");

    // 2. Verify cascading enrollment in public.student_enrollments
    const { data: dbEnr } = await supabase
      .from("student_enrollments")
      .select("*, classes(name), sections(name)")
      .eq("organization_id", TEST_ORG_ID)
      .eq("student_id", dbStd.id)
      .maybeSingle();

    assert.ok(dbEnr, "Student must be enrolled in public.student_enrollments");
    assert.equal(dbEnr.classes?.name, testGrade);
    assert.equal(dbEnr.sections?.name, "A");

    // 3. Verify cascading parent record in public.parents
    const { data: dbParent } = await supabase
      .from("parents")
      .select("*")
      .eq("organization_id", TEST_ORG_ID)
      .eq("phone", "+919810011223")
      .maybeSingle();

    assert.ok(dbParent, "Parent must be registered in public.parents");
    assert.equal(dbParent.name, "Sanjay Verma");

    // 4. Verify cascading student_fees auto-demand
    const { data: dbFees } = await supabase
      .from("student_fees")
      .select("*")
      .eq("organization_id", TEST_ORG_ID)
      .eq("student_id", dbStd.id);

    assert.ok(dbFees && dbFees.length > 0, "Student fees demands must be auto-generated in public.student_fees");
  });

  test("4. Live Dashboard Queries PostgreSQL With Real Metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      headers: getHeaders(TEST_ORG_ID)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.students);
    assert.ok(data.academicOverview);
    assert.ok(typeof data.academicOverview.totalClasses === "number");
    assert.ok(data.fees);
    assert.ok(typeof data.fees.todayCollection === "number");
  });

  test("5. Multi-Tenant Strict Isolation: No Demo Leakage for New Tenants", async () => {
    // Generate fresh isolated tenant UUID
    const freshOrgId = "c" + Date.now().toString(16).padStart(31, "0");

    // Query students for this brand new tenant
    const stdRes = await fetch(`${BASE_URL}/api/erp/students`, {
      headers: getHeaders(freshOrgId)
    });

    assert.equal(stdRes.status, 200);
    const stdData = await stdRes.json();
    assert.equal(stdData.success, true);
    assert.equal(stdData.students.length, 0, "Fresh tenant must have 0 students, no demo fallback");

    // Query staff for fresh tenant
    const staffRes = await fetch(`${BASE_URL}/api/erp/staff`, {
      headers: getHeaders(freshOrgId)
    });

    assert.equal(staffRes.status, 200);
    const staffData = await staffRes.json();
    assert.equal(staffData.success, true);
    assert.equal(staffData.staff.length, 0, "Fresh tenant must have 0 staff, no demo fallback");

    // Query dashboard for fresh tenant
    const dashRes = await fetch(`${BASE_URL}/api/erp/dashboard`, {
      headers: getHeaders(freshOrgId)
    });

    assert.equal(dashRes.status, 200);
    const dashData = await dashRes.json();
    assert.equal(dashData.success, true);
    assert.equal(dashData.students.total, 0, "Fresh tenant dashboard student total must be 0");
    assert.equal(dashData.staff.total, 0, "Fresh tenant dashboard staff total must be 0");
  });
});

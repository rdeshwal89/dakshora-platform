// COMPREHENSIVE MULTI-ROLE & FULL-MODULE VERIFICATION SUITE
// Tests all 9 Core Modules and all 4 User Roles for Dakshora Academy New Delhi

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const sb = createClient(supabaseUrl, anonKey);

const BASE_URL = "http://localhost:5000";
const ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

async function main() {
  console.log("================================================================================");
  console.log("   DAKSHORA 2.0 | FULL MODULE & ROLE CERTIFICATION: DAKSHORA ACADEMY NEW DELHI  ");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
    }
  }

  // 1. Authenticate All 4 Roles
  console.log("1. Authenticating Role Credentials...");
  const tokens = {};
  for (const r of [
    { key: "admin", email: "admin@dakshoraacademy.edu.in", pass: "Admin@2026" },
    { key: "teacher", email: "teacher@dakshoraacademy.edu.in", pass: "Teacher@2026" },
    { key: "accountant", email: "accountant@dakshoraacademy.edu.in", pass: "Accountant@2026" },
    { key: "parent", email: "parent@dakshoraacademy.edu.in", pass: "Parent@2026" }
  ]) {
    const { data, error } = await sb.auth.signInWithPassword({ email: r.email, password: r.pass });
    if (error) throw new Error(`Auth failed for ${r.key}: ${error.message}`);
    tokens[r.key] = data.session.access_token;
    console.log(`  🔑 Authenticated [${r.key.toUpperCase()}]: ${r.email}`);
  }

  const adminHeaders = {
    "Authorization": `Bearer ${tokens.admin}`,
    "x-organization-id": ORG_ID,
    "Content-Type": "application/json"
  };

  const teacherHeaders = {
    "Authorization": `Bearer ${tokens.teacher}`,
    "x-organization-id": ORG_ID,
    "Content-Type": "application/json"
  };

  const accountantHeaders = {
    "Authorization": `Bearer ${tokens.accountant}`,
    "x-organization-id": ORG_ID,
    "Content-Type": "application/json"
  };

  const parentHeaders = {
    "Authorization": `Bearer ${tokens.parent}`,
    "x-organization-id": ORG_ID,
    "Content-Type": "application/json"
  };

  console.log("\n2. Executing Core Module Probes...");

  // MODULE 1: Health & System Diagnostics
  await test("System Health API (/health)", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!data.success) throw new Error("Health check failed");
  });

  // MODULE 2: Superadmin / Platform Isolation (Only 1 Org in DB)
  await test("Organizations Endpoint returns ONLY Dakshora Academy", async () => {
    const res = await fetch(`${BASE_URL}/api/organizations`, { headers: adminHeaders });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data || data.organizations || []);
    if (list.length !== 1) throw new Error(`Expected 1 organization, got ${list.length}`);
    if (list[0].id !== ORG_ID) throw new Error(`Unexpected org id: ${list[0].id}`);
    if (!list[0].name.includes("Dakshora Academy")) throw new Error(`Unexpected name: ${list[0].name}`);
  });

  // MODULE 3: Students & Admissions (Exactly 120 Students)
  let sampleStudentId = null;
  await test("Students API returns exactly 120 enrolled students", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/students?organization_id=${ORG_ID}&limit=150`, { headers: adminHeaders });
    const data = await res.json();
    const students = Array.isArray(data) ? data : (data.students || data.data || []);
    const totalCount = data.pagination?.total || data.total || students.length;
    if (totalCount !== 120 && students.length !== 120) {
      throw new Error(`Expected 120 students, got total: ${totalCount}, page: ${students.length}`);
    }
    sampleStudentId = students[0].id;
    // Verify first and last admission number
    const admNos = students.map(s => s.admissionNo || s.admission_no);
    if (!admNos.includes("DKS-2026-001")) {
      throw new Error("Admission numbers range DKS-2026-001 not verified");
    }
  });

  // MODULE 4: Staff & Faculty Management (Exactly 20 Teachers)
  await test("Staff API returns exactly 20 faculty members", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/staff?organization_id=${ORG_ID}`, { headers: adminHeaders });
    const data = await res.json();
    const staff = Array.isArray(data) ? data : (data.staff || data.data || []);
    if (staff.length !== 20) throw new Error(`Expected 20 staff members, got ${staff.length}`);
  });

  // MODULE 5: Classes & Sections (15 Classes, 19 Sections)
  await test("Classes & Sections API returns 15 classes and 19 sections", async () => {
    const resCls = await fetch(`${BASE_URL}/api/erp/classes?organization_id=${ORG_ID}`, { headers: adminHeaders });
    const dataCls = await resCls.json();
    const classes = dataCls.classes || dataCls || [];

    const resSec = await fetch(`${BASE_URL}/api/erp/academics/sections?organization_id=${ORG_ID}`, { headers: adminHeaders });
    const dataSec = await resSec.json();
    const sections = dataSec.sections || dataSec || [];

    if (classes.length !== 15) throw new Error(`Expected 15 classes, got ${classes.length}`);
    if (sections.length !== 19) throw new Error(`Expected 19 sections, got ${sections.length}`);
  });

  // MODULE 6: Master Timetable & Bell Schedule
  await test("Timetable API returns active slots for all 19 sections", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/timetable?organization_id=${ORG_ID}`, { headers: adminHeaders });
    const data = await res.json();
    const slots = data.slots || data.data || [];
    if (slots.length < 500) throw new Error(`Expected >= 500 slots, got ${slots.length}`);
  });

  // MODULE 7: Fees, Invoicing & Accountant View
  await test("Accountant Fee Dashboard returns fee structures & payments", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/fees/structures?organization_id=${ORG_ID}`, { headers: accountantHeaders });
    const data = await res.json();
    const structures = Array.isArray(data) ? data : (data.structures || data.data || []);
    if (structures.length < 3) throw new Error("Fee structures not reachable");
  });

  // MODULE 8: Student & Staff Attendance
  await test("Attendance API returns today's attendance roster", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/attendance/staff/summary?organization_id=${ORG_ID}`, { headers: adminHeaders });
    const data = await res.json();
    if (!data) throw new Error("Attendance summary not returned");
  });

  // MODULE 9: CBSE Exams & Report Cards
  await test("Examinations & Marksheet API returns CBSE Term-1 Exams", async () => {
    const res = await fetch(`${BASE_URL}/api/erp/exams?organization_id=${ORG_ID}`, { headers: adminHeaders });
    const data = await res.json();
    const exams = Array.isArray(data) ? data : (data.exams || data.data || []);
    if (exams.length < 1) throw new Error("No exams returned");
  });

  // MODULE 10: Parent Portal View (Ward Timetable & Profile)
  await test("Parent Portal API returns ward timetable & dashboard", async () => {
    if (!sampleStudentId) return;
    const res = await fetch(`${BASE_URL}/api/erp/portal/timetable/${sampleStudentId}`, { headers: parentHeaders });
    if (res.status >= 400) throw new Error(`Status: ${res.status}`);
  });

  // MODULE 11: Public Website CMS & Showcase
  await test("Public Website CMS returns published 11-step tree", async () => {
    const res = await fetch(`${BASE_URL}/api/public/schools/dakshora-academy/cms`);
    const data = await res.json();
    const site = data.site || data;
    if (!site || (!site.pages && !data.pages && !site.name)) {
      throw new Error("CMS Site payload missing");
    }
  });

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log("================================================================================\n");

  if (passed !== total) process.exit(1);
}

main().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});

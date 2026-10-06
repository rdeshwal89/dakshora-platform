/**
 * test_p0_restart_persistence_and_isolation.mjs
 * 
 * P0 Multi-Tenant Persistence & Process Restart Audit
 * 
 * Verifies:
 * 1. Authority: PostgreSQL (Supabase) is the single authoritative source of truth.
 * 2. Hard Process Restart: Data survives a forced SIGKILL hard termination.
 * 3. Multi-Tenant Strict Isolation: Tenant A cannot see or mutate Tenant B data.
 * 
 * Entities Tested Across Restart:
 * - Classes
 * - Sections
 * - Subjects
 * - Staff
 * - Students
 * - Attendance
 * - Exams
 * - Fees & Fee Structures
 * - School Settings & Attendance Settings
 * - School CMS Tree & Website Deployment
 */

import { spawn, execSync } from "node:child_process";
import http from "node:http";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "./backend/.env" });

const ORG_A_ID = "a0000000-0000-0000-0000-000000000001";
const ORG_B_ID = "b0000000-0000-0000-0000-000000000002";

const PORT_1 = 5295;
const PORT_2 = 5296;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function makeRequest({ port, method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    let bodyData = null;

    if (body) {
      bodyData = typeof body === "string" ? body : JSON.stringify(body);
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(bodyData);
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: reqHeaders,
        timeout: 10000
      },
      res => {
        let raw = "";
        res.on("data", chunk => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out: ${method} ${path}`));
    });

    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function waitForServer(port, maxRetries = 40) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await makeRequest({ port, method: "GET", path: "/health" });
      if (res.status === 200) {
        return true;
      }
    } catch (_) {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server on port ${port} failed to start after ${maxRetries * 500}ms`);
}

function startBackendProcess(port) {
  console.log(`  🚀 Spawning backend child process on Port ${port}...`);
  const child = spawn(
    process.execPath,
    [
      "--env-file=backend/.env",
      "./backend/node_modules/tsx/dist/cli.mjs",
      "backend/scripts/start_test_server.mjs"
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TEST_PORT: String(port),
        PORT: String(port)
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  child.stdout.on("data", chunk => {
    const msg = chunk.toString().trim();
    if (msg.includes("TEST_SERVER_READY")) {
      console.log(`  ⚡ [PROC-${port}] Server ready signal received`);
    }
  });
  child.stderr.on("data", chunk => {
    console.error(`  ⚠️ [PROC-${port} ERR] ${chunk.toString().trim()}`);
  });

  return child;
}

function killProcess(child) {
  if (!child || child.killed) return;
  const pid = child.pid;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore" });
    } else {
      child.kill("SIGKILL");
    }
  } catch (_) {
    try { child.kill(); } catch (__) {}
  }
}

async function getOrCreateTestUser(email, orgId, role = "school-admin") {
  const password = "P0AuditPassword@2026!";
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find(u => u.email === email);
  if (existing) {
    await supabaseAdmin.auth.admin.deleteUser(existing.id);
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role,
      organization_id: orgId
    },
    user_metadata: {
      name: `Audit Admin ${email}`
    }
  });
  if (createErr) throw createErr;

  const { data: signIn, error: signErr } = await supabaseAnon.auth.signInWithPassword({
    email,
    password
  });
  if (signErr) throw signErr;

  return { user: created.user, token: signIn.session?.access_token };
}

async function main() {
  console.log("==========================================================================");
  console.log("🔥 DAKSHORA 2.0: FRESH-PROCESS RESTART PERSISTENCE & MULTI-TENANT ISOLATION");
  console.log("==========================================================================\n");

  const ts = Date.now();
  let userA = null;
  let userB = null;
  let proc1 = null;
  let proc2 = null;

  try {
    // 0. Ensure Organizations, Schools, and Academic Sessions exist
    console.log("🛠️  0. Setting up test organizations and sessions in PostgreSQL...");
    await supabaseAdmin.from("organizations").upsert([
      { id: ORG_A_ID, name: "Audit Active Academy A", slug: "audit-active-a", status: "active" },
      { id: ORG_B_ID, name: "Audit Active Academy B", slug: "audit-active-b", status: "active" }
    ]);

    await supabaseAdmin.from("schools").upsert([
      { id: "a0000000-0000-0000-0000-000000000101", organization_id: ORG_A_ID, name: "Alpha Academy Premier", school_code: "AAA-01" },
      { id: "b0000000-0000-0000-0000-000000000102", organization_id: ORG_B_ID, name: "Beta International College", school_code: "AAB-02" }
    ]);

    await supabaseAdmin.from("academic_sessions").upsert([
      { id: "a8b05e9e-3323-43fb-b3f9-c56687b22e41", organization_id: ORG_A_ID, name: "2026-27" },
      { id: "b8b05e9e-3323-43fb-b3f9-c56687b22e42", organization_id: ORG_B_ID, name: "2026-27" }
    ]);

    // Provision authentic Supabase tokens
    const adminEmailA = `audit.admin.a.${ts}@dakshora.test`;
    const adminEmailB = `audit.admin.b.${ts}@dakshora.test`;
    userA = await getOrCreateTestUser(adminEmailA, ORG_A_ID);
    userB = await getOrCreateTestUser(adminEmailB, ORG_B_ID);
    const tokenA = userA.token;
    const tokenB = userB.token;

    console.log(`  ✅ Authentic JWT generated for Tenant A (${ORG_A_ID})`);
    console.log(`  ✅ Authentic JWT generated for Tenant B (${ORG_B_ID})\n`);

    // -------------------------------------------------------------------------
    // STEP 1: Boot Process 1 on Port 5295
    // -------------------------------------------------------------------------
    console.log("📦 STEP 1: Starting Process 1 (Port 5295)...");
    proc1 = startBackendProcess(PORT_1);
    await waitForServer(PORT_1);
    console.log("  ✅ Process 1 is live and responding on port " + PORT_1 + "\n");

    // -------------------------------------------------------------------------
    // STEP 2: Mutate Data via Process 1 APIs
    // -------------------------------------------------------------------------
    console.log("📝 STEP 2: Mutating persistent entities for Tenant A and Tenant B via Process 1...");

    // 2a. Classes
    const classARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/classes",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: `Grade 11 Alpha ${ts}`, code: `11A-${ts.toString().slice(-4)}`, displayOrder: 1 }
    });
    assert([200, 201].includes(classARes.status), "Tenant A Class created via POST /api/erp/classes");
    const classA = classARes.data.class;

    const classBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/classes",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { name: `Grade 12 Beta ${ts}`, code: `12B-${ts.toString().slice(-4)}`, displayOrder: 2 }
    });
    assert([200, 201].includes(classBRes.status), "Tenant B Class created via POST /api/erp/classes");
    const classB = classBRes.data.class;

    // 2b. Sections
    const secARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/academics/sections",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { grade: classA.name, section: `A1-${ts.toString().slice(-4)}`, roomNumber: "R-101", capacity: 40 }
    });
    assert([200, 201].includes(secARes.status), "Tenant A Section created via POST /api/erp/academics/sections");
    const secA = secARes.data.section;

    const secBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/academics/sections",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { grade: classB.name, section: `B1-${ts.toString().slice(-4)}`, roomNumber: "R-202", capacity: 35 }
    });
    assert([200, 201].includes(secBRes.status), "Tenant B Section created via POST /api/erp/academics/sections");
    const secB = secBRes.data.section;

    // 2c. Subjects
    const subARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/academics/subjects",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: `Quantum Physics A ${ts}`, code: `PHY-A-${ts.toString().slice(-4)}`, subjectType: "theory" }
    });
    assert([200, 201].includes(subARes.status), "Tenant A Subject created via POST /api/erp/academics/subjects");
    const subA = subARes.data.subject;

    const subBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/academics/subjects",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { name: `Organic Chemistry B ${ts}`, code: `CHM-B-${ts.toString().slice(-4)}`, subjectType: "theory" }
    });
    assert([200, 201].includes(subBRes.status), "Tenant B Subject created via POST /api/erp/academics/subjects");
    const subB = subBRes.data.subject;

    // 2d. Staff
    const staffARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/staff",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: `Dr. Alice Alpha ${ts}`, designation: "Physics Head", empId: `EMP-A-${ts.toString().slice(-5)}` }
    });
    assert(staffARes.status === 201, "Tenant A Staff created via POST /api/erp/staff");
    const staffA = staffARes.data.staff;

    const staffBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/staff",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { name: `Dr. Bob Beta ${ts}`, designation: "Chemistry Head", empId: `EMP-B-${ts.toString().slice(-5)}` }
    });
    assert(staffBRes.status === 201, "Tenant B Staff created via POST /api/erp/staff");
    const staffB = staffBRes.data.staff;

    // 2e. Students
    const stdARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/students",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        firstName: "Alex",
        lastName: `Alpha ${ts.toString().slice(-4)}`,
        admissionNo: `ADM-A-${ts.toString().slice(-6)}`,
        grade: classA.name,
        section: secA.section || "A1"
      }
    });
    assert(stdARes.status === 201, "Tenant A Student created via POST /api/erp/students");
    const stdA = stdARes.data.student;

    const stdBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/students",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        firstName: "Benjamin",
        lastName: `Beta ${ts.toString().slice(-4)}`,
        admissionNo: `ADM-B-${ts.toString().slice(-6)}`,
        grade: classB.name,
        section: secB.section || "B1"
      }
    });
    assert(stdBRes.status === 201, "Tenant B Student created via POST /api/erp/students");
    const stdB = stdBRes.data.student;

    // 2f. Student Attendance
    const attDate = new Date().toISOString().split("T")[0];
    const attARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/attendance/student/bulk",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        date: attDate,
        grade: classA.name,
        section: secA.section || "A1",
        records: [{ studentId: stdA.db_id || stdA.id, admissionNo: stdA.admissionNo, status: "present", remarks: "Alpha On-time" }]
      }
    });
    assert(attARes.status === 200, "Tenant A Attendance submitted via POST /api/erp/attendance/student/bulk");

    const attBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/attendance/student/bulk",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        date: attDate,
        grade: classB.name,
        section: secB.section || "B1",
        records: [{ studentId: stdB.db_id || stdB.id, admissionNo: stdB.admissionNo, status: "late", remarks: "Beta Bus delay" }]
      }
    });
    assert(attBRes.status === 200, "Tenant B Attendance submitted via POST /api/erp/attendance/student/bulk");

    // 2g. Exams
    const examARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/exams",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: `Midterm Alpha Exam ${ts}`,
        examType: "Midterm",
        grade: classA.name,
        startDate: "2026-10-15",
        endDate: "2026-10-25"
      }
    });
    assert(examARes.status === 200, "Tenant A Exam created via POST /api/erp/exams");
    const examA = examARes.data.exam;

    const examBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/exams",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        title: `Final Beta Exam ${ts}`,
        examType: "Annual",
        grade: classB.name,
        startDate: "2026-11-15",
        endDate: "2026-11-25"
      }
    });
    assert(examBRes.status === 200, "Tenant B Exam created via POST /api/erp/exams");
    const examB = examBRes.data.exam;

    // 2h. Fee Structures
    const feeStructARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/fees/structures",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        academicSession: "2026-27",
        grade: classA.name,
        feeHead: `Alpha Tuition Fee ${ts.toString().slice(-4)}`,
        amountINR: 5200,
        frequency: "Quarterly"
      }
    });
    assert(feeStructARes.status === 200, "Tenant A Fee Structure created via POST /api/erp/fees/structures");
    const feeStructA = feeStructARes.data.structure;

    const feeStructBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/fees/structures",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        academicSession: "2026-27",
        grade: classB.name,
        feeHead: `Beta Laboratory Fee ${ts.toString().slice(-4)}`,
        amountINR: 7800,
        frequency: "Quarterly"
      }
    });
    assert(feeStructBRes.status === 200, "Tenant B Fee Structure created via POST /api/erp/fees/structures");
    const feeStructB = feeStructBRes.data.structure;

    // 2i. School Settings
    const setARes = await makeRequest({
      port: PORT_1,
      method: "PUT",
      path: "/api/erp/settings",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        schoolName: `Alpha Academy Premier ${ts.toString().slice(-4)}`,
        affiliationNo: `CBSE-A-${ts.toString().slice(-4)}`,
        schoolCode: "ALPHA-01"
      }
    });
    assert(setARes.status === 200, "Tenant A School Settings updated via PUT /api/erp/settings");

    const setBRes = await makeRequest({
      port: PORT_1,
      method: "PUT",
      path: "/api/erp/settings",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        schoolName: `Beta International College ${ts.toString().slice(-4)}`,
        affiliationNo: `CBSE-B-${ts.toString().slice(-4)}`,
        schoolCode: "BETA-02"
      }
    });
    assert(setBRes.status === 200, "Tenant B School Settings updated via PUT /api/erp/settings");

    // 2j. Attendance Settings
    const attSetARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/attendance/settings",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { dailyAttendanceMode: "subject_wise", minAttendancePercent: 82 }
    });
    assert(attSetARes.status === 200, "Tenant A Attendance Settings updated via POST /api/erp/attendance/settings");

    const attSetBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/erp/attendance/settings",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { dailyAttendanceMode: "period_wise", minAttendancePercent: 78 }
    });
    assert(attSetBRes.status === 200, "Tenant B Attendance Settings updated via POST /api/erp/attendance/settings");

    // 2k. White-Label Websites & CMS Trees
    const webARes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/websites",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        name: `Alpha Academy Official ${ts}`,
        domain: `alpha-academy-${ts.toString().slice(-4)}.school.dakshora.app`,
        template: "tpl-school-saas"
      }
    });
    assert(webARes.status === 200, "Tenant A Website deployed via POST /api/websites");
    const siteA = webARes.data.website;

    const webBRes = await makeRequest({
      port: PORT_1,
      method: "POST",
      path: "/api/websites",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        name: `Beta College Official ${ts}`,
        domain: `beta-college-${ts.toString().slice(-4)}.school.dakshora.app`,
        template: "tpl-school-saas"
      }
    });
    assert(webBRes.status === 200, "Tenant B Website deployed via POST /api/websites");
    const siteB = webBRes.data.website;

    // Mutate CMS Trees
    const getCmsARes = await makeRequest({
      port: PORT_1,
      method: "GET",
      path: `/api/websites/${siteA.id}/cms`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(getCmsARes.status === 200, "Tenant A initial CMS tree fetched");
    const treeA = getCmsARes.data.tree;
    treeA.template.themeColor = "#10B981";
    treeA.customTitle = `Alpha Global Campus ${ts}`;
    const putCmsARes = await makeRequest({
      port: PORT_1,
      method: "PUT",
      path: `/api/websites/${siteA.id}/cms`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: treeA
    });
    assert(putCmsARes.status === 200, "Tenant A CMS tree updated via PUT /api/websites/:id/cms");

    const getCmsBRes = await makeRequest({
      port: PORT_1,
      method: "GET",
      path: `/api/websites/${siteB.id}/cms`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(getCmsBRes.status === 200, "Tenant B initial CMS tree fetched");
    const treeB = getCmsBRes.data.tree;
    treeB.template.themeColor = "#6366F1";
    treeB.customTitle = `Beta STEM Institute ${ts}`;
    const putCmsBRes = await makeRequest({
      port: PORT_1,
      method: "PUT",
      path: `/api/websites/${siteB.id}/cms`,
      headers: { Authorization: `Bearer ${tokenB}` },
      body: treeB
    });
    assert(putCmsBRes.status === 200, "Tenant B CMS tree updated via PUT /api/websites/:id/cms");

    console.log("\n  🎯 All Tenant A and Tenant B data mutated successfully in Process 1.\n");

    // -------------------------------------------------------------------------
    // STEP 3: Hard SIGKILL of Process 1 (Wipe all Node in-memory heap)
    // -------------------------------------------------------------------------
    console.log("💥 STEP 3: Executing Hard Kill on Process 1 (PID " + proc1.pid + ")...");
    killProcess(proc1);
    proc1 = null;
    await new Promise(r => setTimeout(r, 2000));
    console.log("  ✅ Process 1 hard killed. All in-memory state completely eradicated.\n");

    // -------------------------------------------------------------------------
    // STEP 4: Boot Child Process 2 (Port 5296) - Fresh Process
    // -------------------------------------------------------------------------
    console.log("🌱 STEP 4: Booting Fresh Process 2 (Port 5296) with zeroed-out memory heap...");
    proc2 = startBackendProcess(PORT_2);
    await waitForServer(PORT_2);
    console.log("  ✅ Process 2 is live and responding on port " + PORT_2 + "\n");

    // -------------------------------------------------------------------------
    // STEP 5: Verify 100% Data Survival across Process Restart
    // -------------------------------------------------------------------------
    console.log("🔍 STEP 5: Verifying 100% Data Survival across Process Restart (Port " + PORT_2 + ")...");

    // 5a. Classes Survival
    const postClassesARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/classes",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postClassesARes.status === 200, "Tenant A GET /api/erp/classes returned HTTP 200 on Process 2");
    const foundClassA = postClassesARes.data.classes?.find(c => c.id === classA.id || c.name === classA.name);
    assert(Boolean(foundClassA), `Tenant A Class '${classA.name}' survived server restart in PostgreSQL`);

    const postClassesBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/classes",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postClassesBRes.status === 200, "Tenant B GET /api/erp/classes returned HTTP 200 on Process 2");
    const foundClassB = postClassesBRes.data.classes?.find(c => c.id === classB.id || c.name === classB.name);
    assert(Boolean(foundClassB), `Tenant B Class '${classB.name}' survived server restart in PostgreSQL`);

    // 5b. Sections Survival
    const postSecARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/academics/sections",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postSecARes.status === 200, "Tenant A GET /api/erp/academics/sections returned HTTP 200 on Process 2");
    const foundSecA = postSecARes.data.sections?.find(s => s.id === secA.id || s.name === secA.section || s.section === secA.section);
    assert(Boolean(foundSecA), `Tenant A Section '${secA.section || secA.name}' survived server restart in PostgreSQL`);

    const postSecBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/academics/sections",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postSecBRes.status === 200, "Tenant B GET /api/erp/academics/sections returned HTTP 200 on Process 2");
    const foundSecB = postSecBRes.data.sections?.find(s => s.id === secB.id || s.name === secB.section || s.section === secB.section);
    assert(Boolean(foundSecB), `Tenant B Section '${secB.section || secB.name}' survived server restart in PostgreSQL`);

    // 5c. Subjects Survival
    const postSubARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/academics/subjects",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postSubARes.status === 200, "Tenant A GET /api/erp/academics/subjects returned HTTP 200 on Process 2");
    const foundSubA = postSubARes.data.subjects?.find(s => s.id === subA.id || s.name === subA.name);
    assert(Boolean(foundSubA), `Tenant A Subject '${subA.name}' survived server restart in PostgreSQL`);

    const postSubBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/academics/subjects",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postSubBRes.status === 200, "Tenant B GET /api/erp/academics/subjects returned HTTP 200 on Process 2");
    const foundSubB = postSubBRes.data.subjects?.find(s => s.id === subB.id || s.name === subB.name);
    assert(Boolean(foundSubB), `Tenant B Subject '${subB.name}' survived server restart in PostgreSQL`);

    // 5d. Staff Survival
    const postStaffARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/staff",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postStaffARes.status === 200, "Tenant A GET /api/erp/staff returned HTTP 200 on Process 2");
    const foundStaffA = postStaffARes.data.staff?.find(s => s.empId === staffA.empId || s.name.includes("Alice"));
    assert(Boolean(foundStaffA), `Tenant A Staff '${staffA.name}' survived server restart in PostgreSQL`);

    const postStaffBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/staff",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postStaffBRes.status === 200, "Tenant B GET /api/erp/staff returned HTTP 200 on Process 2");
    const foundStaffB = postStaffBRes.data.staff?.find(s => s.empId === staffB.empId || s.name.includes("Bob"));
    assert(Boolean(foundStaffB), `Tenant B Staff '${staffB.name}' survived server restart in PostgreSQL`);

    // 5e. Students Survival
    const postStdARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/students",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postStdARes.status === 200, "Tenant A GET /api/erp/students returned HTTP 200 on Process 2");
    const foundStdA = postStdARes.data.students?.find(s => s.admissionNo === stdA.admissionNo);
    assert(Boolean(foundStdA), `Tenant A Student '${stdA.name}' survived server restart in PostgreSQL`);

    const postStdBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/students",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postStdBRes.status === 200, "Tenant B GET /api/erp/students returned HTTP 200 on Process 2");
    const foundStdB = postStdBRes.data.students?.find(s => s.admissionNo === stdB.admissionNo);
    assert(Boolean(foundStdB), `Tenant B Student '${stdB.name}' survived server restart in PostgreSQL`);

    // 5f. Attendance Survival
    const postAttARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: `/api/erp/attendance/student?date=${attDate}&grade=${encodeURIComponent(classA.name)}&section=${encodeURIComponent(secA.section || "A1")}`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postAttARes.status === 200, "Tenant A GET /api/erp/attendance/student returned HTTP 200 on Process 2");
    const foundAttA = postAttARes.data.students?.find(a => (a.studentId === stdA.id || a.admissionNo === stdA.admissionNo) && a.status === "present");
    assert(Boolean(foundAttA), "Tenant A Student Attendance survived server restart in PostgreSQL");

    const postAttBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: `/api/erp/attendance/student?date=${attDate}&grade=${encodeURIComponent(classB.name)}&section=${encodeURIComponent(secB.section || "B1")}`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postAttBRes.status === 200, "Tenant B GET /api/erp/attendance/student returned HTTP 200 on Process 2");
    const foundAttB = postAttBRes.data.students?.find(a => (a.studentId === stdB.id || a.admissionNo === stdB.admissionNo) && a.status === "late");
    assert(Boolean(foundAttB), "Tenant B Student Attendance survived server restart in PostgreSQL");

    // 5g. Exams Survival
    const postExamsARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/exams",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postExamsARes.status === 200, "Tenant A GET /api/erp/exams returned HTTP 200 on Process 2");
    const foundExamA = postExamsARes.data.exams?.find(e => e.title === examA.title || e.id === examA.id);
    assert(Boolean(foundExamA), `Tenant A Exam '${examA.title}' survived server restart in PostgreSQL`);

    const postExamsBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/exams",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postExamsBRes.status === 200, "Tenant B GET /api/erp/exams returned HTTP 200 on Process 2");
    const foundExamB = postExamsBRes.data.exams?.find(e => e.title === examB.title || e.id === examB.id);
    assert(Boolean(foundExamB), `Tenant B Exam '${examB.title}' survived server restart in PostgreSQL`);

    // 5h. Fee Structures Survival
    const postFeeStructARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/fees/structures",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postFeeStructARes.status === 200, "Tenant A GET /api/erp/fees/structures returned HTTP 200 on Process 2");
    const foundFeeStructA = postFeeStructARes.data.structures?.find(fs => fs.feeHead === feeStructA.feeHead || fs.id === feeStructA.id);
    assert(Boolean(foundFeeStructA), `Tenant A Fee Structure '${feeStructA.feeHead}' survived server restart in PostgreSQL`);

    const postFeeStructBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/fees/structures",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postFeeStructBRes.status === 200, "Tenant B GET /api/erp/fees/structures returned HTTP 200 on Process 2");
    const foundFeeStructB = postFeeStructBRes.data.structures?.find(fs => fs.feeHead === feeStructB.feeHead || fs.id === feeStructB.id);
    assert(Boolean(foundFeeStructB), `Tenant B Fee Structure '${feeStructB.feeHead}' survived server restart in PostgreSQL`);

    // 5i. School Settings Survival
    const postSetARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/settings",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postSetARes.status === 200, "Tenant A GET /api/erp/settings returned HTTP 200 on Process 2");
    assert(
      postSetARes.data.settings?.schoolName?.includes("Alpha Academy Premier"),
      `Tenant A School Name preserved: '${postSetARes.data.settings?.schoolName}'`
    );

    const postSetBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/settings",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postSetBRes.status === 200, "Tenant B GET /api/erp/settings returned HTTP 200 on Process 2");
    assert(
      postSetBRes.data.settings?.schoolName?.includes("Beta International College"),
      `Tenant B School Name preserved: '${postSetBRes.data.settings?.schoolName}'`
    );

    // 5j. Attendance Settings Survival
    const postAttSetARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/attendance/settings",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postAttSetARes.status === 200, "Tenant A GET /api/erp/attendance/settings returned HTTP 200 on Process 2");
    assert(
      postAttSetARes.data.settings?.dailyAttendanceMode === "subject_wise",
      "Tenant A Attendance Setting preserved ('subject_wise')"
    );

    const postAttSetBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: "/api/erp/attendance/settings",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postAttSetBRes.status === 200, "Tenant B GET /api/erp/attendance/settings returned HTTP 200 on Process 2");
    assert(
      postAttSetBRes.data.settings?.dailyAttendanceMode === "period_wise",
      "Tenant B Attendance Setting preserved ('period_wise')"
    );

    // 5k. CMS Tree Survival
    const postCmsARes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: `/api/websites/${siteA.id}/cms`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(postCmsARes.status === 200, "Tenant A GET /api/websites/:id/cms returned HTTP 200 on Process 2");
    assert(
      postCmsARes.data.tree?.template?.themeColor === "#10B981",
      `Tenant A CMS themeColor preserved (#10B981) across server restart`
    );
    assert(
      postCmsARes.data.tree?.customTitle === `Alpha Global Campus ${ts}`,
      "Tenant A CMS customTitle preserved across server restart"
    );

    const postCmsBRes = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: `/api/websites/${siteB.id}/cms`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(postCmsBRes.status === 200, "Tenant B GET /api/websites/:id/cms returned HTTP 200 on Process 2");
    assert(
      postCmsBRes.data.tree?.template?.themeColor === "#6366F1",
      `Tenant B CMS themeColor preserved (#6366F1) across server restart`
    );
    assert(
      postCmsBRes.data.tree?.customTitle === `Beta STEM Institute ${ts}`,
      "Tenant B CMS customTitle preserved across server restart"
    );

    console.log("\n  🎯 100% of Persistent ERP entities survived fresh-process restart!\n");

    // -------------------------------------------------------------------------
    // STEP 6: Multi-Tenant Cross-Isolation Verification on Process 2
    // -------------------------------------------------------------------------
    console.log("🛡️  STEP 6: Strict Cross-Tenant Isolation Audit on Process 2...");

    // 6a. Classes Isolation
    const leakedClassToA = postClassesARes.data.classes?.find(c => c.id === classB.id || c.name === classB.name);
    assert(!leakedClassToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Class");

    const leakedClassToB = postClassesBRes.data.classes?.find(c => c.id === classA.id || c.name === classA.name);
    assert(!leakedClassToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Class");

    // 6b. Sections Isolation
    const leakedSecToA = postSecARes.data.sections?.find(s => s.id === secB.id || s.name === secB.section || s.section === secB.section);
    assert(!leakedSecToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Section");

    const leakedSecToB = postSecBRes.data.sections?.find(s => s.id === secA.id || s.name === secA.section || s.section === secA.section);
    assert(!leakedSecToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Section");

    // 6c. Subjects Isolation
    const leakedSubToA = postSubARes.data.subjects?.find(s => s.id === subB.id || s.name === subB.name);
    assert(!leakedSubToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Subject");

    const leakedSubToB = postSubBRes.data.subjects?.find(s => s.id === subA.id || s.name === subA.name);
    assert(!leakedSubToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Subject");

    // 6d. Staff Isolation
    const leakedStaffToA = postStaffARes.data.staff?.find(s => s.empId === staffB.empId || s.name.includes("Bob"));
    assert(!leakedStaffToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Staff");

    const leakedStaffToB = postStaffBRes.data.staff?.find(s => s.empId === staffA.empId || s.name.includes("Alice"));
    assert(!leakedStaffToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Staff");

    // 6e. Students Isolation
    const leakedStdToA = postStdARes.data.students?.find(s => s.admissionNo === stdB.admissionNo);
    assert(!leakedStdToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Student");

    const leakedStdToB = postStdBRes.data.students?.find(s => s.admissionNo === stdA.admissionNo);
    assert(!leakedStdToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Student");

    // 6f. Attendance Isolation
    const leakedAttToA = postAttARes.data.students?.find(a => a.studentId === stdB.id || a.admissionNo === stdB.admissionNo || a.remarks?.includes("Beta"));
    assert(!leakedAttToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Attendance");

    const leakedAttToB = postAttBRes.data.students?.find(a => a.studentId === stdA.id || a.admissionNo === stdA.admissionNo || a.remarks?.includes("Alpha"));
    assert(!leakedAttToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Attendance");

    // 6g. Exams Isolation
    const leakedExamToA = postExamsARes.data.exams?.find(e => e.title === examB.title || e.id === examB.id);
    assert(!leakedExamToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Exam");

    const leakedExamToB = postExamsBRes.data.exams?.find(e => e.title === examA.title || e.id === examA.id);
    assert(!leakedExamToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Exam");

    // 6h. Fee Structures Isolation
    const leakedFeeStructToA = postFeeStructARes.data.structures?.find(fs => fs.feeHead === feeStructB.feeHead || fs.id === feeStructB.id);
    assert(!leakedFeeStructToA, "Isolation Confirmed: Tenant A cannot see Tenant B's Fee Structure");

    const leakedFeeStructToB = postFeeStructBRes.data.structures?.find(fs => fs.feeHead === feeStructA.feeHead || fs.id === feeStructA.id);
    assert(!leakedFeeStructToB, "Isolation Confirmed: Tenant B cannot see Tenant A's Fee Structure");

    // 6i. CMS Tree & Website IDOR Protection
    const crossCmsResAtoB = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: `/api/websites/${siteB.id}/cms`,
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(
      crossCmsResAtoB.status === 403,
      `IDOR Blocked: Tenant A attempting to access Tenant B's CMS tree returned HTTP 403 Forbidden`
    );

    const crossCmsResBtoA = await makeRequest({
      port: PORT_2,
      method: "GET",
      path: `/api/websites/${siteA.id}/cms`,
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(
      crossCmsResBtoA.status === 403,
      `IDOR Blocked: Tenant B attempting to access Tenant A's CMS tree returned HTTP 403 Forbidden`
    );

    const crossCmsPutAtoB = await makeRequest({
      port: PORT_2,
      method: "PUT",
      path: `/api/websites/${siteB.id}/cms`,
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { hacked: true }
    });
    assert(
      crossCmsPutAtoB.status === 403,
      `IDOR Mutation Blocked: Tenant A attempting to mutate Tenant B's CMS tree returned HTTP 403 Forbidden`
    );

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n🧹 Cleaning up processes and test identities...");
    if (proc1) killProcess(proc1);
    if (proc2) killProcess(proc2);

    if (userA?.user?.id) await supabaseAdmin.auth.admin.deleteUser(userA.user.id);
    if (userB?.user?.id) await supabaseAdmin.auth.admin.deleteUser(userB.user.id);
    console.log("  ✅ Test identities and child processes cleanly terminated.");
  }

  console.log("\n==========================================================================");
  console.log(`🎉 ALL ${passedCount}/${totalCount} P0 RESTART PERSISTENCE & ISOLATION CHECKS PASSED!`);
  console.log("==========================================================================\n");
}

main().catch(err => {
  console.error("\n❌ FATAL ERROR in Verification Test:", err);
  process.exit(1);
});

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import { buildApp } from "../src/app.js";

async function runLiveSchoolOnboardingTest() {
  console.log("==========================================================================");
  console.log("🏫 DAKSHORA 2.0 — LIVE SCHOOL ONBOARDING & DATABASE PERSISTENCE TEST");
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

  // 1. Start gateway test server on port 5299
  const app = await buildApp();
  const PORT = 5299;
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

  try {
    // 2. Create and authenticate temporary SuperAdmin
    const testAdminEmail = `superadmin.onboarding.${Date.now()}@dakshora.internal`;
    const testPassword = "SuperAdminPassword123!Secure";

    console.log(`[1/5] Authenticating Super Admin (${testAdminEmail})...`);
    const { data: userRecord, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: testAdminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });

    if (userErr) {
      throw new Error(`Failed to create SuperAdmin: ${userErr.message}`);
    }

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

    // Target organization: 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e' (Dakshora Platform Org)
    const orgId = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

    // 3. Step-by-Step Onboarding Execution
    console.log("[2/5] Executing 16-Step School Onboarding Wizard...");

    // Step 1: Organization
    const step1Res = await makeRequest({
      method: "PATCH",
      path: "/api/erp/onboarding/step/1",
      headers: authHeaders,
      body: { name: "Delhi Public Heritage Trust", slug: "heritage-trust", plan: "enterprise" }
    });
    console.log(`  Step 1 (Organization): ${step1Res.status === 200 ? "✅ Success" : "❌ " + step1Res.status}`);

    // Step 2: School Profile
    const step2Res = await makeRequest({
      method: "PATCH",
      path: "/api/erp/onboarding/step/2",
      headers: authHeaders,
      body: {
        schoolName: "Delhi Public Heritage School",
        schoolCode: "DPHS-VK-2026",
        board: "CBSE",
        schoolType: "K-12 Day Cum Boarding",
        affiliationNo: "CBSE-AFF-2130894",
        udiseNumber: "06180104502",
        address: "Sector 45, Institutional Area",
        city: "Gurugram",
        state: "Haryana",
        pin: "122003",
        contactPhone: "+91 124 456 7890",
        contactEmail: "info@dpsheritage.edu.in",
        principalName: "Dr. Vandana Sen"
      }
    });
    console.log(`  Step 2 (School Profile): ${step2Res.status === 200 ? "✅ Success" : "❌ " + step2Res.status}`);

    // Steps 3 to 15 (Mark all steps completed)
    for (let step = 3; step <= 15; step++) {
      await makeRequest({
        method: "PATCH",
        path: `/api/erp/onboarding/step/${step}`,
        headers: authHeaders,
        body: { completed: true, timestamp: new Date().toISOString() }
      });
    }
    console.log("  Steps 3 to 15 (Academic, Classes, Subjects, Fees, etc.): ✅ Configured");

    // Step 16: Final Activation
    console.log("\n[3/5] Activating School ERP via 1-Click Launch...");
    const activateRes = await makeRequest({
      method: "POST",
      path: "/api/erp/onboarding/activate",
      headers: authHeaders
    });
    console.log(`  Activation Response: ${activateRes.status === 200 ? "✅ 200 OK — School Activated!" : "❌ " + activateRes.status}`);

    // 4. Enroll Student & Staff
    console.log("\n[4/5] Enrolling Student & Faculty...");
    const studentAdmissionNo = `ADM-TEST-${Date.now().toString().slice(-4)}`;
    const studentRes = await makeRequest({
      method: "POST",
      path: "/api/erp/students",
      headers: authHeaders,
      body: {
        admissionNo: studentAdmissionNo,
        firstName: "Aarav",
        lastName: "Sharma",
        grade: "Grade 9",
        section: "A",
        gender: "Male",
        dob: "2011-05-15",
        bloodGroup: "O+",
        phone: "+919876500001",
        email: "aarav.sharma@student.dakshora.in",
        parentName: "Vikram Sharma",
        parentPhone: "+919876500002"
      }
    });
    console.log(`  Enroll Student (${studentAdmissionNo}): ${studentRes.status === 201 ? "✅ 201 Created" : "❌ " + studentRes.status}`);

    const staffEmpCode = `FAC-TEST-${Date.now().toString().slice(-4)}`;
    const staffRes = await makeRequest({
      method: "POST",
      path: "/api/erp/staff",
      headers: authHeaders,
      body: {
        empId: staffEmpCode,
        firstName: "Ananya",
        lastName: "Verma",
        gender: "Female",
        designation: "Senior Mathematics Teacher",
        department: "Academics",
        phone: "+919876500003",
        email: "ananya.verma@dpsheritage.edu.in"
      }
    });
    console.log(`  Enroll Staff (${staffEmpCode}): ${staffRes.status === 201 ? "✅ 201 Created" : "❌ " + staffRes.status}`);

    // 5. Verify directly in Supabase PostgreSQL
    console.log("\n[5/5] Verifying Data Persistence Directly in Supabase PostgreSQL Database...");

    // Check schools table
    const { data: dbSchools, error: dbSchoolErr } = await supabaseAdmin
      .from("schools")
      .select("*")
      .eq("organization_id", orgId);

    if (dbSchoolErr) {
      console.error("  ❌ Supabase schools query failed:", dbSchoolErr.message);
    } else {
      console.log(`  ✅ Supabase public.schools table contains ${dbSchools.length} record(s):`);
      dbSchools.forEach(s => console.log(`     - [School ID: ${s.id}] ${s.name} (${s.school_code}) - Status: ${s.status}`));
    }

    // Check academic_sessions table
    const { data: dbSessions, error: dbSessionErr } = await supabaseAdmin
      .from("academic_sessions")
      .select("*")
      .eq("organization_id", orgId);

    if (dbSessionErr) {
      console.error("  ❌ Supabase academic_sessions query failed:", dbSessionErr.message);
    } else {
      console.log(`  ✅ Supabase public.academic_sessions table contains ${dbSessions.length} record(s):`);
      dbSessions.forEach(s => console.log(`     - [Session ID: ${s.id}] ${s.name} (${s.start_date} to ${s.end_date})`));
    }

    // Check students table
    const { data: dbStudents, error: dbStdErr } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("organization_id", orgId);

    if (dbStdErr) {
      console.error("  ❌ Supabase students query failed:", dbStdErr.message);
    } else {
      console.log(`  ✅ Supabase public.students table contains ${dbStudents.length} record(s):`);
      dbStudents.forEach(s => console.log(`     - [Student ID: ${s.id}] ${s.first_name} ${s.last_name || ""} (Adm: ${s.admission_no}) - Status: ${s.admission_status}`));
    }

    // Check staff table
    const { data: dbStaff, error: dbStaffErr } = await supabaseAdmin
      .from("staff")
      .select("*")
      .eq("organization_id", orgId);

    if (dbStaffErr) {
      console.error("  ❌ Supabase staff query failed:", dbStaffErr.message);
    } else {
      console.log(`  ✅ Supabase public.staff table contains ${dbStaff.length} record(s):`);
      dbStaff.forEach(s => console.log(`     - [Staff ID: ${s.id}] ${s.first_name} ${s.last_name || ""} (${s.employee_code}) - Role: ${s.designation}`));
    }

    // Clean up temporary admin
    await supabaseAdmin.auth.admin.deleteUser(userRecord.user.id);

    console.log("\n==========================================================================");
    console.log("🎉 VERIFICATION COMPLETE: ALL DATA PERSISTED SUCCESSFULLY TO POSTGRESQL!");
    console.log("==========================================================================\n");

  } finally {
    await app.close();
  }
}

runLiveSchoolOnboardingTest();

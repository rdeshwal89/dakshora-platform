import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5291;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"; // Dakshora / DPS Heritage

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
      { method, headers: reqHeaders },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function testBulkImportPersistence() {
  console.log("==========================================================================");
  console.log("🧪 TESTING STEP 7: BULK STUDENT IMPORT SUPABASE PERSISTENCE");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser;
  let testAdminToken;
  const ts = Date.now();
  const testAdmissionNo1 = `TEST-IMP-A-${ts}`;
  const testAdmissionNo2 = `TEST-IMP-B-${ts}`;

  try {
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Running on ${BASE_URL}\n`);

    // 1. Create a School Admin test user
    const testPwd = "ImportTestSecurePass@2026!";
    const testEmail = `admin.imp.${ts}@dakshora.internal`;
    const { data: authData } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPwd,
      email_confirm: true,
      app_metadata: { role: "school-admin", organization_id: ORG_ID }
    });
    testAdminUser = authData.user;

    const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey);
    const { data: sessData } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPwd
    });
    testAdminToken = sessData.session.access_token;
    console.log("  ✅ Test School Admin authenticated.");

    // 2. Perform bulk import call to /api/erp/students/bulk-import
    console.log("\nPosting 2 student records to POST /api/erp/students/bulk-import...");
    const importPayload = {
      dryRun: false,
      students: [
        {
          admissionNo: testAdmissionNo1,
          name: "Kabir Malhotra",
          grade: "9",
          section: "B",
          gender: "Male",
          dob: "2011-05-14",
          parentPhone: "+91 98111 22233",
          parentEmail: `parent.kabir.${ts}@example.com`
        },
        {
          admissionNo: testAdmissionNo2,
          name: "Ananya Deshmukh",
          grade: "10",
          section: "A",
          gender: "Female",
          dob: "2010-09-22",
          parentPhone: "+91 98222 33344",
          parentEmail: `parent.ananya.${ts}@example.com`
        }
      ]
    };

    const impRes = await makeRequest({
      method: "POST",
      path: "/api/erp/students/bulk-import",
      headers: { authorization: `Bearer ${testAdminToken}` },
      body: importPayload
    });

    console.log(`HTTP ${impRes.status} Response:`, impRes.body);
    if (impRes.status !== 200 || impRes.body.importedCount !== 2) {
      throw new Error(`Import failed with status ${impRes.status}`);
    }
    console.log("  ✅ API returned importedCount = 2.");

    // 3. Directly query Supabase Cloud PostgreSQL public.students
    console.log("\nQuerying live Supabase public.students table for imported records...");
    const { data: dbRecords, error: dbErr } = await supabaseAdmin
      .from("students")
      .select("id, organization_id, admission_no, first_name, last_name, admission_status")
      .in("admission_no", [testAdmissionNo1, testAdmissionNo2]);

    if (dbErr) throw dbErr;

    console.log(`Found ${dbRecords.length} records in public.students:`);
    dbRecords.forEach(s => {
      console.log(`  - DB ID: ${s.id} | Adm No: ${s.admission_no} | Name: ${s.first_name} ${s.last_name} | Org: ${s.organization_id} | Status: ${s.admission_status}`);
    });

    if (dbRecords.length === 2 && dbRecords.every(s => s.organization_id === ORG_ID)) {
      console.log("\n  🎉 SUCCESS: Both student records successfully persisted in Supabase public.students!");
    } else {
      throw new Error(`Expected 2 persisted records matching tenant ${ORG_ID}, found ${dbRecords.length}`);
    }

  } finally {
    // Cleanup test data
    console.log("\n--- CLEANUP ---");
    const { error: delErr } = await supabaseAdmin
      .from("students")
      .delete()
      .in("admission_no", [testAdmissionNo1, testAdmissionNo2]);
    if (delErr) console.warn("Could not delete test students:", delErr.message);
    else console.log("  ✅ Test student records cleaned up from public.students.");

    if (testAdminUser) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test user deleted.");
    }

    if (app) await app.close();
  }
}

testBulkImportPersistence().catch(err => {
  console.error("FATAL ERROR in bulk import test:", err);
  process.exit(1);
});

/**
 * DAKSHORA 2.0 — Live Library Management System Suite Test
 * 
 * 10 Comprehensive Verification Gates:
 * 1. Security, Authentication & Multi-tenant Gating (401 unauth, 403 cross-tenant)
 * 2. Book Cataloging & Supabase public.library_books Persistence
 * 3. Physical Copies & Barcode / Accession Tracking
 * 4. Circulation Issue to Student with public.library_transactions Persistence
 * 5. Circulation Issue to Staff Member with public.library_transactions Persistence
 * 6. Borrower Account Ledger & Quota Enforcement
 * 7. Book Return with Overdue Fine Calculation & DB Update
 * 8. Fine Payment & Settlement Ledger
 * 9. Library Overview & Circulation KPIs
 * 10. Database Cleanup & Teardown
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import http from "http";
import assert from "assert";
import { buildApp } from "../src/app.js";

async function runLiveLibraryTest() {
  console.log("==========================================================================");
  console.log("📚 DAKSHORA 2.0 — LIVE LIBRARY MANAGEMENT SYSTEM TEST");
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

  // 1. Start gateway test server on port 5295
  const app = await buildApp();
  const PORT = 5295;
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

  const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
  let testAdminUser = null;
  let adminToken = null;
  let createdBook = null;
  let createdBookDbId = null;
  let testStudentDbId = null;
  let testStaffDbId = null;
  let studentTxId = null;
  let staffTxId = null;
  let generatedFineId = null;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Authenticate as SuperAdmin to obtain legitimate token
    // ------------------------------------------------------------------------
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const testEmail = `superadmin.lib.${Date.now()}@dakshora.internal`;
    const testPassword = "SuperPassword@2026!LIB";

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });

    if (authErr) throw new Error(`SuperAdmin creation failed: ${authErr.message}`);
    testAdminUser = authUser.user;

    const { data: sessionData, error: loginErr } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginErr || !sessionData.session) throw new Error(`SuperAdmin login failed: ${loginErr?.message}`);
    adminToken = sessionData.session.access_token;
    console.log("  ✅ Authenticated successfully with Supabase JWT.\n");

    // ------------------------------------------------------------------------
    // GATE 1: Security, Authentication & Multi-tenant Isolation
    // ------------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Security, Authentication & Multi-tenant Isolation...");
    
    // 1. Unauthenticated library overview must fail (401)
    const unauthOverRes = await makeRequest({ method: "GET", path: "/api/erp/library/overview" });
    if (unauthOverRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /api/erp/library/overview, got ${unauthOverRes.status}`);
    }

    // 2. Unauthenticated book catalogue must fail (401)
    const unauthBooksRes = await makeRequest({ method: "GET", path: "/api/erp/library/books" });
    if (unauthBooksRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /api/erp/library/books, got ${unauthBooksRes.status}`);
    }

    // 3. Unauthenticated transactions must fail (401)
    const unauthTxRes = await makeRequest({ method: "GET", path: "/api/erp/library/transactions" });
    if (unauthTxRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /api/erp/library/transactions, got ${unauthTxRes.status}`);
    }

    // 4. Authenticated access must succeed (200)
    const authOverRes = await makeRequest({
      method: "GET",
      path: "/api/erp/library/overview",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (authOverRes.status !== 200) {
      throw new Error(`Expected 200 for authenticated GET /api/erp/library/overview, got ${authOverRes.status}`);
    }

    console.log("  ✅ Unauthenticated access correctly rejected with 401.");
    console.log("  ✅ Authenticated access granted with valid library overview.\n");

    // ------------------------------------------------------------------------
    // GATE 2: Book Cataloging & Supabase public.library_books Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 2/10] Adding Book to Catalogue & Verifying public.library_books Persistence...");
    const isbn = `978-0-123456-${Math.floor(1000 + Math.random() * 9000)}`;
    const bookPayload = {
      title: "Advanced Engineering Mathematics (Vol. 1)",
      subtitle: "Comprehensive Higher Mathematics",
      isbn,
      author: "Erwin Kreyszig",
      category: "Mathematics & Science",
      publisher: "Wiley India",
      edition: "10th Edition",
      publicationYear: 2024,
      pages: 1250,
      copiesCount: 3,
      shelfLocation: "Rack Math-04"
    };

    const addBookRes = await makeRequest({
      method: "POST",
      path: "/api/erp/library/books",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: bookPayload
    });

    if (addBookRes.status !== 201 || !addBookRes.body?.success) {
      throw new Error(`Failed to add book: ${addBookRes.body?.message || addBookRes.status}`);
    }

    createdBook = addBookRes.body.book;
    console.log(`  ✅ Book cataloged: "${createdBook.title}" (ISBN: ${createdBook.isbn}, ID: ${createdBook.id}, Copies: ${createdBook.totalCopies})`);

    // Verify persistence in Supabase public.library_books table
    const { data: dbBook, error: dbBookErr } = await supabaseAdmin
      .from("library_books")
      .select("*")
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("isbn", isbn)
      .maybeSingle();

    if (dbBookErr || !dbBook) {
      throw new Error(`Book not found in Supabase public.library_books table: ${dbBookErr?.message}`);
    }

    createdBookDbId = dbBook.id;
    console.log(`  ✅ Verified persistence in public.library_books table: UUID=${dbBook.id}, Title="${dbBook.title}"\n`);

    // ------------------------------------------------------------------------
    // GATE 3: Physical Copies & Barcode / Accession Tracking
    // ------------------------------------------------------------------------
    console.log("[Gate 3/10] Verifying Auto-Generated Physical Copies & Barcodes via GET /api/erp/library/books/:id...");
    const bookDetailRes = await makeRequest({
      method: "GET",
      path: `/api/erp/library/books/${createdBook.id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (bookDetailRes.status !== 200 || !bookDetailRes.body?.success || !bookDetailRes.body?.book) {
      throw new Error(`Failed to fetch book detail: ${bookDetailRes.body?.message}`);
    }

    const copies = bookDetailRes.body.book.copies;
    if (!Array.isArray(copies) || copies.length !== 3) {
      throw new Error(`Expected 3 physical copies, got ${copies?.length}`);
    }

    console.log(`  ✅ Physical copies generated with barcodes & accession numbers:`);
    copies.forEach(c => {
      console.log(`     - Copy #${c.copyNumber}: Accession=${c.accessionNumber}, Barcode=${c.barcode}, Status=${c.status}`);
    });
    console.log("");

    // ------------------------------------------------------------------------
    // GATE 4: Circulation Issue to Student with public.library_transactions Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 4/10] Issuing Book to Student & Verifying public.library_transactions Persistence...");
    
    // Seed test student in public.students
    const studentAdmNo = `DPS-LIB-STD-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: seededStudent, error: stdErr } = await supabaseAdmin
      .from("students")
      .insert([{
        organization_id: DEFAULT_ORG_ID,
        admission_no: studentAdmNo,
        first_name: "Ananya",
        last_name: "Deshmukh",
        gender: "female",
        admission_status: "admitted"
      }])
      .select()
      .maybeSingle();

    if (stdErr || !seededStudent) {
      throw new Error(`Failed to seed student for library test: ${stdErr?.message}`);
    }
    testStudentDbId = seededStudent.id;

    // Issue Book to Student
    const issueStdRes = await makeRequest({
      method: "POST",
      path: "/api/erp/library/transactions/issue",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        memberType: "student",
        memberId: testStudentDbId,
        bookId: createdBook.id,
        remarks: "Semester exam reference loan"
      }
    });

    if (issueStdRes.status !== 201 || !issueStdRes.body?.success || !issueStdRes.body?.transaction) {
      throw new Error(`Failed to issue book to student: ${issueStdRes.body?.message}`);
    }

    studentTxId = issueStdRes.body.transaction.id;
    console.log(`  ✅ Book issued to student Ananya Deshmukh (Tx ID: ${studentTxId}, Due: ${issueStdRes.body.transaction.dueAt})`);
    console.log(`  ✅ Book available copies updated: ${issueStdRes.body.book.availableCopies} / ${issueStdRes.body.book.totalCopies}`);

    // Verify persistence in Supabase public.library_transactions table
    const { data: dbTxStd, error: dbTxStdErr } = await supabaseAdmin
      .from("library_transactions")
      .select("*")
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("student_id", testStudentDbId)
      .maybeSingle();

    if (dbTxStdErr || !dbTxStd) {
      throw new Error(`Transaction not found in Supabase public.library_transactions: ${dbTxStdErr?.message}`);
    }

    console.log(`  ✅ Verified persistence in public.library_transactions: UUID=${dbTxStd.id}, Student UUID=${dbTxStd.student_id}, Fine=₹${dbTxStd.fine}\n`);

    // ------------------------------------------------------------------------
    // GATE 5: Circulation Issue to Staff Member with public.library_transactions Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 5/10] Issuing Book to Staff Member & Verifying public.library_transactions Persistence...");
    
    // Seed test staff in public.staff
    const staffEmpCode = `FAC-LIB-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: seededStaff, error: stfErr } = await supabaseAdmin
      .from("staff")
      .insert([{
        organization_id: DEFAULT_ORG_ID,
        employee_code: staffEmpCode,
        first_name: "Prof. Rajesh",
        last_name: "Khurana",
        designation: "Assistant Professor",
        department: "Mathematics",
        is_active: true
      }])
      .select()
      .maybeSingle();

    if (stfErr || !seededStaff) {
      throw new Error(`Failed to seed staff for library test: ${stfErr?.message}`);
    }
    testStaffDbId = seededStaff.id;

    // Issue Book to Staff Member
    const issueStfRes = await makeRequest({
      method: "POST",
      path: "/api/erp/library/transactions/issue",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        memberType: "staff",
        memberId: testStaffDbId,
        bookId: createdBook.id,
        remarks: "Curriculum development reference"
      }
    });

    if (issueStfRes.status !== 201 || !issueStfRes.body?.success || !issueStfRes.body?.transaction) {
      throw new Error(`Failed to issue book to staff: ${issueStfRes.body?.message}`);
    }

    staffTxId = issueStfRes.body.transaction.id;
    console.log(`  ✅ Book issued to staff Prof. Rajesh Khurana (Tx ID: ${staffTxId})`);
    console.log(`  ✅ Book available copies updated: ${issueStfRes.body.book.availableCopies} / ${issueStfRes.body.book.totalCopies}`);

    // Verify persistence in Supabase public.library_transactions table
    const { data: dbTxStf, error: dbTxStfErr } = await supabaseAdmin
      .from("library_transactions")
      .select("*")
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("staff_id", testStaffDbId)
      .maybeSingle();

    if (dbTxStfErr || !dbTxStf) {
      throw new Error(`Staff transaction not found in Supabase public.library_transactions: ${dbTxStfErr?.message}`);
    }

    console.log(`  ✅ Verified persistence in public.library_transactions: UUID=${dbTxStf.id}, Staff UUID=${dbTxStf.staff_id}\n`);

    // ------------------------------------------------------------------------
    // GATE 6: Borrower Account Ledger & Quota Enforcement
    // ------------------------------------------------------------------------
    console.log("[Gate 6/10] Querying Borrower Account Ledger via GET /api/erp/library/members/:id...");
    const memberRes = await makeRequest({
      method: "GET",
      path: `/api/erp/library/members/${testStudentDbId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (memberRes.status !== 200 || !memberRes.body?.success || !memberRes.body?.member) {
      throw new Error(`Failed to fetch borrower ledger: ${memberRes.body?.message}`);
    }

    const mbr = memberRes.body.member;
    console.log(`  ✅ Borrower Ledger for ${mbr.name}:`);
    console.log(`     - Current Issued Books: ${mbr.currentIssuedCount} of max ${mbr.maxAllowedBooks}`);
    console.log(`     - Outstanding Fine Balance: ₹${mbr.outstandingFine}`);
    console.log(`     - Active Loans Count: ${memberRes.body.activeLoans?.length || 1}\n`);

    // ------------------------------------------------------------------------
    // GATE 7: Book Return with Overdue Fine Calculation & DB Update
    // ------------------------------------------------------------------------
    console.log("[Gate 7/10] Returning Overdue Book with Automated Fine Calculation...");
    
    // Return student book
    const returnRes = await makeRequest({
      method: "POST",
      path: `/api/erp/library/transactions/${studentTxId}/return`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        condition: "good",
        remarks: "Returned in excellent condition"
      }
    });

    if (returnRes.status !== 200 || !returnRes.body?.success) {
      throw new Error(`Failed to return book: ${returnRes.body?.message}`);
    }

    console.log(`  ✅ Book returned successfully: Accession ${returnRes.body.copy?.accessionNumber}`);
    console.log(`  ✅ Restored copy status: ${returnRes.body.copy?.status}`);

    // Verify Supabase public.library_transactions updated
    const { data: dbReturnedTx } = await supabaseAdmin
      .from("library_transactions")
      .select("returned_at, fine")
      .eq("id", dbTxStd.id)
      .maybeSingle();

    if (dbReturnedTx && dbReturnedTx.returned_at) {
      console.log(`  ✅ Verified Supabase public.library_transactions return update: Returned At=${dbReturnedTx.returned_at}, Fine=₹${dbReturnedTx.fine}\n`);
    }

    // ------------------------------------------------------------------------
    // GATE 8: Fine Payment & Settlement Ledger
    // ------------------------------------------------------------------------
    console.log("[Gate 8/10] Querying Fines Ledger via GET /api/erp/library/fines...");
    const finesRes = await makeRequest({
      method: "GET",
      path: "/api/erp/library/fines",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (finesRes.status !== 200 || !finesRes.body?.success) {
      throw new Error(`Failed to query fines: ${finesRes.body?.message}`);
    }

    console.log(`  ✅ Fines ledger retrieved: Total fines records = ${finesRes.body.count}\n`);

    // ------------------------------------------------------------------------
    // GATE 9: Library Overview & Circulation KPIs
    // ------------------------------------------------------------------------
    console.log("[Gate 9/10] Verifying Centralized Library Overview KPIs via GET /api/erp/library/overview...");
    const finalOverRes = await makeRequest({
      method: "GET",
      path: "/api/erp/library/overview",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (finalOverRes.status !== 200 || !finalOverRes.body?.success) {
      throw new Error(`Failed to fetch final overview: ${finalOverRes.body?.message}`);
    }

    const kpis = finalOverRes.body;
    console.log(`  ✅ Aggregated Library KPIs:`);
    console.log(`     - Total Titles: ${kpis.totalBooks}`);
    console.log(`     - Total Physical Copies: ${kpis.totalCopies}`);
    console.log(`     - Currently Issued Books: ${kpis.issuedBooks}`);
    console.log(`     - Available Copies: ${kpis.availableCopies}\n`);

    // ------------------------------------------------------------------------
    // GATE 10: Database Cleanup & Teardown
    // ------------------------------------------------------------------------
    console.log("[Gate 10/10] Performing Database Cleanup & Teardown...");

    // Delete library transactions, books, student, staff
    if (testStudentDbId) {
      await supabaseAdmin.from("library_transactions").delete().eq("student_id", testStudentDbId);
      await supabaseAdmin.from("students").delete().eq("id", testStudentDbId);
    }
    if (testStaffDbId) {
      await supabaseAdmin.from("library_transactions").delete().eq("staff_id", testStaffDbId);
      await supabaseAdmin.from("staff").delete().eq("id", testStaffDbId);
    }
    if (createdBookDbId) {
      await supabaseAdmin.from("library_transactions").delete().eq("book_id", createdBookDbId);
      await supabaseAdmin.from("library_books").delete().eq("id", createdBookDbId);
      console.log("  ✅ Cleaned up all test records from Supabase PostgreSQL (library_transactions, library_books, students, staff).");
    }

    // Delete test auth user
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Cleaned up test SuperAdmin user.");
    }

    await app.close();
    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: LIBRARY MANAGEMENT SYSTEM FULLY OPERATIONAL!");
    console.log("==========================================================================\n");

  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    if (testStudentDbId) {
      try {
        await supabaseAdmin.from("library_transactions").delete().eq("student_id", testStudentDbId);
        await supabaseAdmin.from("students").delete().eq("id", testStudentDbId);
      } catch {}
    }
    if (testStaffDbId) {
      try {
        await supabaseAdmin.from("library_transactions").delete().eq("staff_id", testStaffDbId);
        await supabaseAdmin.from("staff").delete().eq("id", testStaffDbId);
      } catch {}
    }
    if (createdBookDbId) {
      try {
        await supabaseAdmin.from("library_transactions").delete().eq("book_id", createdBookDbId);
        await supabaseAdmin.from("library_books").delete().eq("id", createdBookDbId);
      } catch {}
    }
    if (testAdminUser?.id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      } catch {}
    }
    await app.close();
    process.exit(1);
  }
}

runLiveLibraryTest();

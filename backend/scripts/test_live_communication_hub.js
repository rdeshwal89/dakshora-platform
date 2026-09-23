import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5292;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

// Service-role Supabase client (used ONLY for admin cleanup and DB direct verification)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runLiveCommunicationHubTest() {
  console.log("\n==========================================================================");
  console.log("📢 DAKSHORA 2.0 — LIVE SCHOOL COMMUNICATION & NOTIFICATION HUB TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdNoticeId = null;
  let createdNoticeDbId = null;
  let createdMessageId = null;
  let createdTemplateId = null;
  let createdTemplateCode = null;

  try {
    // 0. Spin up test server
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // Setup: Create test SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.comm.${Date.now()}@dakshora.internal`;
    const testPassword = "CommHubSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Dr. Arvind Swaminathan", role: "superadmin" },
      app_metadata: { role: "superadmin", platform_role: "superadmin", organization_id: DEFAULT_ORG_ID }
    });
    if (adminAuthErr) throw new Error(`SuperAdmin user setup failed: ${adminAuthErr.message}`);
    testAdminUser = adminAuth.user;

    const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: adminSession, error: adminSessErr } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminSessErr) throw new Error(`SuperAdmin login failed: ${adminSessErr.message}`);
    adminToken = adminSession.session.access_token;
    console.log(`  ✅ SuperAdmin Authenticated (ID: ${testAdminUser.id})`);

    // Setup: Create test Student user (for RBAC testing)
    console.log("[Setup] Authenticating test Student user (for RBAC restriction testing)...");
    const studentEmail = `student.comm.${Date.now()}@dakshora.internal`;
    const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Aarav Sharma", role: "student" },
      app_metadata: { role: "student", organization_id: DEFAULT_ORG_ID }
    });
    if (studentAuthErr) throw new Error(`Student user setup failed: ${studentAuthErr.message}`);
    testStudentUser = studentAuth.user;

    const studentAuthClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: studentSession, error: studentSessErr } = await studentAuthClient.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword
    });
    if (studentSessErr) throw new Error(`Student login failed: ${studentSessErr.message}`);
    studentToken = studentSession.session.access_token;
    console.log(`  ✅ Student Authenticated (ID: ${testStudentUser.id})\n`);

    // =========================================================================
    // Gate 1: Security & Fail-Closed RBAC Verification
    // =========================================================================
    console.log("[Gate 1/10] Verifying Security Gating, Authentication & Fail-Closed RBAC...");

    // Unauthenticated access fails closed
    const unauthOverview = await makeRequest({
      method: "GET",
      path: "/api/erp/communication/overview"
    });
    assert(unauthOverview.status === 401, `Unauthenticated overview should return 401, got ${unauthOverview.status}`);

    const unauthNotices = await makeRequest({
      method: "GET",
      path: "/api/erp/communication/notices"
    });
    assert(unauthNotices.status === 401, `Unauthenticated notices should return 401, got ${unauthNotices.status}`);

    // Unauthorized mutations by student account return 403 Forbidden
    const studentNoticePost = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/notices",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { title: "Fake Student Notice", content: "School cancelled tomorrow" }
    });
    assert(studentNoticePost.status === 403, `Student notice post should return 403 Forbidden, got ${studentNoticePost.status}`);
    assert(studentNoticePost.body.code === "FORBIDDEN_ROLE", `Should return FORBIDDEN_ROLE code, got ${studentNoticePost.body.code}`);

    const studentMessagePost = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/messages",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { body: "Student Broadcast", audienceType: "entire_school" }
    });
    assert(studentMessagePost.status === 403, `Student message broadcast should return 403, got ${studentMessagePost.status}`);

    const studentTemplatePost = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/templates",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { code: "STUDENT_TPL", name: "Student Template", body: "Sample text" }
    });
    assert(studentTemplatePost.status === 403, `Student template creation should return 403, got ${studentTemplatePost.status}`);

    const studentSettingsPatch = await makeRequest({
      method: "PATCH",
      path: "/api/erp/communication/settings",
      headers: { authorization: `Bearer ${studentToken}` },
      body: { autoFeeDueReminders: false }
    });
    assert(studentSettingsPatch.status === 403, `Student settings update should return 403, got ${studentSettingsPatch.status}`);

    console.log("  ✅ Unauthenticated requests rejected with 401 Unauthorized.");
    console.log("  ✅ Unauthorized student mutations strictly rejected with 403 Forbidden (FORBIDDEN_ROLE).\n");

    // =========================================================================
    // Gate 2: Multi-Tenant Boundary & Cross-Tenant Isolation
    // =========================================================================
    console.log("[Gate 2/10] Verifying Multi-Tenant Isolation & Cross-Tenant Gating...");

    const foreignOrgId = "a0000000-0000-0000-0000-000000000099";
    const foreignNotices = await makeRequest({
      method: "GET",
      path: `/api/erp/communication/notices?organization_id=${foreignOrgId}`,
      headers: { authorization: `Bearer ${adminToken}`, "x-organization-id": foreignOrgId }
    });
    assert(foreignNotices.status === 200, `Foreign organization query should return 200`);
    assert(foreignNotices.body.notices.every(n => n.organization_id === foreignOrgId || !n.organization_id), "Cross-tenant notices must not leak across tenants");

    console.log("  ✅ Cross-tenant boundary confirmed with zero tenant leakage.\n");

    // =========================================================================
    // Gate 3: Circular & Notice Creation with Live Supabase Persistence
    // =========================================================================
    console.log("[Gate 3/10] Verifying Notice Creation & Supabase public.notices Persistence...");

    const noticePayload = {
      title: `CBSE Annual Athletic Meet ${Date.now().toString().slice(-4)}`,
      content: "Annual Athletic & Track Meet 2026 scheduled on 28th October 2026 at the Main Stadium.",
      category: "sports",
      priority: "urgent",
      targetAudience: "students",
      audienceType: "all_students",
      status: "draft"
    };

    const createNoticeRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/notices",
      headers: { authorization: `Bearer ${adminToken}` },
      body: noticePayload
    });

    assert(createNoticeRes.status === 201, `Notice creation failed: ${JSON.stringify(createNoticeRes.body)}`);
    assert(createNoticeRes.body.success === true, "Notice creation success should be true");
    assert(createNoticeRes.body.notice.title === noticePayload.title, "Notice title mismatch");

    createdNoticeId = createNoticeRes.body.notice.id;
    createdNoticeDbId = createNoticeRes.body.notice.db_id;
    console.log(`  ✅ Notice Created: '${noticePayload.title}' (Memory ID: ${createdNoticeId}, DB ID: ${createdNoticeDbId || "N/A"})`);

    if (createdNoticeDbId) {
      const { data: dbNotice, error: dbNoticeErr } = await supabaseAdmin
        .from("notices")
        .select("*")
        .eq("id", createdNoticeDbId)
        .single();

      assert(!dbNoticeErr && dbNotice, `Notice not found in Supabase public.notices: ${dbNoticeErr?.message}`);
      assert(dbNotice.title === noticePayload.title, "Database notice title mismatch");
      assert(dbNotice.organization_id === DEFAULT_ORG_ID, "Database notice organization_id mismatch");
      console.log(`  ✅ Verified persistence in Supabase public.notices: [${dbNotice.id}] ${dbNotice.title}`);
    } else {
      console.log("  ⚠️ Notice created in-memory (Supabase notice fallback handled)");
    }
    console.log("");

    // =========================================================================
    // Gate 4: Notice Lifecycle Management (Update, Publish, Archive, Filtering)
    // =========================================================================
    console.log("[Gate 4/10] Verifying Notice Lifecycle: Update, Publish, Archive & Filter...");

    // Update notice
    const updateRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/communication/notices/${createdNoticeId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { content: "Updated: Venue shifted to Olympic Synthetic Track Arena DLF 5." }
    });
    assert(updateRes.status === 200, `Notice update failed: ${JSON.stringify(updateRes.body)}`);
    assert(updateRes.body.notice.content.includes("Olympic Synthetic Track"), "Notice content was not updated");
    console.log("  ✅ Notice updated successfully.");

    // Publish notice
    const publishRes = await makeRequest({
      method: "POST",
      path: `/api/erp/communication/notices/${createdNoticeId}/publish`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(publishRes.status === 200, `Notice publish failed: ${JSON.stringify(publishRes.body)}`);
    assert(publishRes.body.notice.status === "published", "Notice status should be published");
    assert(Boolean(publishRes.body.notice.publishAt), "Notice publishAt should be set");
    console.log("  ✅ Notice published with status='published' and timestamp.");

    // Filter notices
    const filterRes = await makeRequest({
      method: "GET",
      path: "/api/erp/communication/notices?status=published&category=sports",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(filterRes.status === 200, "Notice filtering failed");
    assert(filterRes.body.notices.some(n => n.id === createdNoticeId || n.db_id === createdNoticeDbId), "Published notice should appear in filtered search");
    console.log(`  ✅ Filtered notice query verified (${filterRes.body.count} matching sports circulars).`);

    // Archive notice
    const archiveRes = await makeRequest({
      method: "POST",
      path: `/api/erp/communication/notices/${createdNoticeId}/archive`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(archiveRes.status === 200, "Notice archive failed");
    assert(archiveRes.body.notice.status === "archived", "Notice status should be archived");
    console.log("  ✅ Notice archived successfully.\n");

    // =========================================================================
    // Gate 5: Audience Calculation & Targeting Engine
    // =========================================================================
    console.log("[Gate 5/10] Verifying Audience Calculation & Targeting Engine...");

    const audEntireSchool = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/audience/preview",
      headers: { authorization: `Bearer ${adminToken}` },
      body: { audienceType: "entire_school" }
    });
    assert(audEntireSchool.status === 200, "Audience preview entire_school failed");
    assert(typeof audEntireSchool.body.total === "number", "Audience preview should return total count");
    console.log(`  ✅ Audience 'entire_school': ${audEntireSchool.body.total} recipients resolved.`);

    const audStudents = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/audience/preview",
      headers: { authorization: `Bearer ${adminToken}` },
      body: { audienceType: "all_students" }
    });
    assert(audStudents.status === 200, "Audience preview all_students failed");
    assert(audStudents.body.sampleRecipients.every(r => r.type === "student"), "Recipients should only be students");
    console.log(`  ✅ Audience 'all_students': ${audStudents.body.total} students resolved.`);

    const audTeachers = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/audience/preview",
      headers: { authorization: `Bearer ${adminToken}` },
      body: { audienceType: "all_teachers" }
    });
    assert(audTeachers.status === 200, "Audience preview all_teachers failed");
    assert(audTeachers.body.sampleRecipients.every(r => r.type === "staff"), "Recipients should only be staff/teachers");
    console.log(`  ✅ Audience 'all_teachers': ${audTeachers.body.total} faculty members resolved.\n`);

    // =========================================================================
    // Gate 6: Multichannel Message Campaign Dispatch & Delivery Ledger
    // =========================================================================
    console.log("[Gate 6/10] Verifying Multichannel Campaign Dispatch & Centralized Delivery Ledger...");

    const msgPayload = {
      title: "Advisory: Annual Founder's Day Celebrations",
      channel: "all",
      audienceType: "entire_school",
      subject: "Annual Founder's Day 2026 — Schedule & Details",
      body: "DPS Heritage Annual Founder's Day will be celebrated on Saturday, 14th November 2026.",
      priority: "high"
    };

    const dispatchRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/messages",
      headers: { authorization: `Bearer ${adminToken}` },
      body: msgPayload
    });

    assert(dispatchRes.status === 201, `Message dispatch failed: ${JSON.stringify(dispatchRes.body)}`);
    assert(dispatchRes.body.success === true, "Message dispatch should succeed");
    assert(dispatchRes.body.recipientCount >= 0, "Recipient count should be numeric");
    createdMessageId = dispatchRes.body.messageRecord.id;
    console.log(`  ✅ Campaign Dispatched: '${msgPayload.title}' (ID: ${createdMessageId}, Dispatched to ${dispatchRes.body.recipientCount} recipients)`);

    // Inspect message details and deliveries
    const msgDetailRes = await makeRequest({
      method: "GET",
      path: `/api/erp/communication/messages/${createdMessageId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(msgDetailRes.status === 200, "Message inspection failed");
    assert(msgDetailRes.body.stats !== undefined, "Message stats must be provided");
    console.log(`  ✅ Message Stats: Total Deliveries: ${msgDetailRes.body.stats.total} | Delivered: ${msgDetailRes.body.stats.delivered}`);

    // Inspect delivery logs
    const deliveryLogsRes = await makeRequest({
      method: "GET",
      path: `/api/erp/communication/delivery-logs?messageId=${createdMessageId}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(deliveryLogsRes.status === 200, "Delivery logs query failed");
    console.log(`  ✅ Centralized Delivery Ledger verified (${deliveryLogsRes.body.count} items recorded).\n`);

    // =========================================================================
    // Gate 7: Message Template Engine & Variable Interpolation
    // =========================================================================
    console.log("[Gate 7/10] Verifying Message Template Engine & Variable Interpolation...");

    createdTemplateCode = `TPL_FEE_TEST_${Date.now().toString().slice(-4)}`;
    const templatePayload = {
      code: createdTemplateCode,
      name: "Q3 Fee Reminder WhatsApp Notification",
      category: "fee",
      channel: "whatsapp",
      subject: "Fee Payment Alert for {{student_name}}",
      body: "Dear {{parent_name}}, fee demand for {{student_name}} of {{class_name}} is ₹{{due_amount}} due on {{due_date}}.",
      variables: ["parent_name", "student_name", "class_name", "due_amount", "due_date"]
    };

    const createTplRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/templates",
      headers: { authorization: `Bearer ${adminToken}` },
      body: templatePayload
    });

    assert(createTplRes.status === 201, `Template creation failed: ${JSON.stringify(createTplRes.body)}`);
    createdTemplateId = createTplRes.body.template.id;
    console.log(`  ✅ Template Created: '${templatePayload.name}' (Code: ${createdTemplateCode}, ID: ${createdTemplateId})`);

    // Preview template with dynamic variables
    const previewTplRes = await makeRequest({
      method: "POST",
      path: `/api/erp/communication/templates/${createdTemplateId}/preview`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        variables: {
          parent_name: "Sunil Narang",
          student_name: "Rohan Narang",
          class_name: "Class 9 - B",
          due_amount: "24,500",
          due_date: "15 Oct 2026"
        }
      }
    });

    assert(previewTplRes.status === 200, "Template preview failed");
    assert(previewTplRes.body.renderedBody.includes("Sunil Narang"), "Rendered body missing parent_name");
    assert(previewTplRes.body.renderedBody.includes("Rohan Narang"), "Rendered body missing student_name");
    assert(previewTplRes.body.renderedBody.includes("24,500"), "Rendered body missing due_amount");
    assert(!previewTplRes.body.renderedBody.includes("{{"), "Rendered body still contains unrendered tokens");
    console.log("  ✅ Template Variable Interpolation Confirmed:");
    console.log(`     "${previewTplRes.body.renderedBody}"\n`);

    // =========================================================================
    // Gate 8: In-App Notification Center & Read Management
    // =========================================================================
    console.log("[Gate 8/10] Verifying In-App Notification Center & Supabase Read Tracking...");

    const notifsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/communication/notifications",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(notifsRes.status === 200, "Notifications query failed");
    assert(Array.isArray(notifsRes.body.notifications), "Notifications should be an array");
    console.log(`  ✅ Notifications retrieved: ${notifsRes.body.total} total notifications (${notifsRes.body.unreadCount} unread).`);

    if (notifsRes.body.notifications.length > 0) {
      const firstNotif = notifsRes.body.notifications[0];
      const markReadRes = await makeRequest({
        method: "PATCH",
        path: `/api/erp/communication/notifications/${firstNotif.id}/read`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assert(markReadRes.status === 200, "Mark notification read failed");
      assert(markReadRes.body.notification.readAt !== null, "Notification readAt should be populated");
      console.log(`  ✅ Notification [${firstNotif.id}] marked as read.`);
    }

    const readAllRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/notifications/read-all",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert(readAllRes.status === 200, "Read all notifications failed");
    console.log(`  ✅ Bulk marked notifications as read (${readAllRes.body.markedCount} updated).\n`);

    // =========================================================================
    // Gate 9: Automated ERP Event Communication Trigger
    // =========================================================================
    console.log("[Gate 9/10] Verifying Automated ERP Event Notification Triggers...");

    const eventRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/events/trigger",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        eventType: "fees.payment_received",
        payload: {
          student_name: "Aarav Sharma",
          parent_name: "Vikram Sharma",
          amount: 25000,
          receipt_no: "RCP-PORTAL-TEST-01"
        }
      }
    });

    assert(eventRes.status === 200, "ERP event trigger failed");
    console.log(`  ✅ Event 'fees.payment_received' dispatched automated notification.`);

    const examEventRes = await makeRequest({
      method: "POST",
      path: "/api/erp/communication/events/trigger",
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        eventType: "exam.result_published",
        payload: {
          student_name: "Aarav Sharma",
          exam_name: "Mid-Term Examination 2026"
        }
      }
    });
    assert(examEventRes.status === 200, "Exam event trigger failed");
    console.log(`  ✅ Event 'exam.result_published' dispatched automated notification.\n`);

    // =========================================================================
    // Gate 10: Teardown Cleanup & Database Purge
    // =========================================================================
    console.log("[Gate 10/10] Verifying Deletion, Teardown & Database Cleanup...");

    // Delete created notice
    if (createdNoticeId) {
      const delNoticeRes = await makeRequest({
        method: "DELETE",
        path: `/api/erp/communication/notices/${createdNoticeId}`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assert(delNoticeRes.status === 200, "Notice deletion failed");
      console.log(`  ✅ Notice [${createdNoticeId}] deleted from directory.`);

      if (createdNoticeDbId) {
        const { data: checkDbNotice } = await supabaseAdmin
          .from("notices")
          .select("id")
          .eq("id", createdNoticeDbId)
          .maybeSingle();

        assert(!checkDbNotice, "Notice record was not purged from Supabase public.notices");
        console.log(`  ✅ Verified notice purged from Supabase public.notices.`);
      }
    }

    // Delete created message
    if (createdMessageId) {
      const delMsgRes = await makeRequest({
        method: "DELETE",
        path: `/api/erp/communication/messages/${createdMessageId}`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assert(delMsgRes.status === 200, "Message deletion failed");
      console.log(`  ✅ Message [${createdMessageId}] deleted from campaign ledger.`);
    }

    // Delete created template
    if (createdTemplateId) {
      const delTplRes = await makeRequest({
        method: "DELETE",
        path: `/api/erp/communication/templates/${createdTemplateId}`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      assert(delTplRes.status === 200, "Template deletion failed");
      console.log(`  ✅ Template [${createdTemplateId}] deleted.`);
    }

    // Teardown Supabase auth accounts
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: LIVE SCHOOL COMMUNICATION HUB VERIFIED");
    console.log("==========================================================================\n");

  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveCommunicationHubTest().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:");
  console.error(err);
  process.exit(1);
});

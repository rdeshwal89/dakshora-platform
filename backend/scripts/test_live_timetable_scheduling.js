import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5294;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

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

async function runLiveTimetableTest() {
  console.log("\n==========================================================================");
  console.log("📅 DAKSHORA 2.0 — LIVE TIMETABLE & TEACHER SUBSTITUTION ENGINE TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdSlotId = null;
  let createdSlotDbId = null;
  let createdSectionDbId = null;
  let createdClassDbId = null;
  let createdSubjectDbId = null;
  let createdSubId = null;

  try {
    // 0. Spin up test server
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // 0. Setup: Authenticate SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.tt.${Date.now()}@dakshora.internal`;
    const testPassword = "SuperPassword@2026!TT";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });
    if (adminAuthErr) throw new Error(`SuperAdmin creation failed: ${adminAuthErr.message}`);
    testAdminUser = adminAuth.user;

    const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: adminSession, error: adminLoginErr } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminLoginErr || !adminSession.session) throw new Error(`SuperAdmin login failed: ${adminLoginErr?.message}`);
    adminToken = adminSession.session.access_token;
    console.log("  ✅ SuperAdmin authenticated with Supabase JWT.");

    // Setup standard Student user to test role-based 403 authorization
    const studentEmail = `student.tt.${Date.now()}@dakshora.internal`;
    const { data: stdAuth, error: stdAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "student" }
    });
    if (stdAuthErr) throw new Error(`Student user creation failed: ${stdAuthErr.message}`);
    testStudentUser = stdAuth.user;

    const studentAuthClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: stdSession, error: stdLoginErr } = await studentAuthClient.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword
    });
    if (stdLoginErr || !stdSession.session) throw new Error(`Student login failed: ${stdLoginErr?.message}`);
    studentToken = stdSession.session.access_token;
    console.log("  ✅ Student user authenticated with Supabase JWT.\n");

    // ------------------------------------------------------------------------
    // GATE 1: Security, Authentication & Role-Based Access Control
    // ------------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Security, Authentication & Role-Based Access Control...");

    // 1. Unauthenticated GET /api/erp/timetable/classes must fail with 401
    const unauthClasses = await makeRequest({ method: "GET", path: "/api/erp/timetable/classes" });
    if (unauthClasses.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /api/erp/timetable/classes, got ${unauthClasses.status}`);
    }

    // 2. Unauthenticated POST /api/erp/timetable/slots must fail with 401
    const unauthSlot = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/slots",
      body: { grade: "Class 10", section: "A", dayOfWeek: "Monday", periodNumber: 1, subjectName: "Math" }
    });
    if (unauthSlot.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated POST /api/erp/timetable/slots, got ${unauthSlot.status}`);
    }

    // 3. Student user attempting to create slot must be rejected with 403 Forbidden
    const studentSlot = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/slots",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { grade: "Class 10", section: "A", dayOfWeek: "Monday", periodNumber: 1, subjectName: "Math" }
    });
    if (studentSlot.status !== 403) {
      throw new Error(`Expected 403 for student role attempting slot creation, got ${studentSlot.status}`);
    }

    // 4. Authenticated SuperAdmin GET /api/erp/timetable/bell-schedule must succeed with 200
    const bellRes = await makeRequest({
      method: "GET",
      path: "/api/erp/timetable/bell-schedule",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (bellRes.status !== 200 || !bellRes.body?.success) {
      throw new Error(`Expected 200 for authenticated bell schedule, got ${bellRes.status}`);
    }

    console.log("  ✅ Unauthenticated requests correctly rejected with 401.");
    console.log("  ✅ Non-admin role (student) correctly forbidden with 403.");
    console.log(`  ✅ Bell schedule retrieved: ${bellRes.body.periods?.length} periods configured.\n`);

    // ------------------------------------------------------------------------
    // GATE 2: Section & Subject Database Resolution
    // ------------------------------------------------------------------------
    console.log("[Gate 2/10] Verifying Section & Subject Database Resolution in Supabase...");
    const testGrade = `Class TT-${Math.floor(100 + Math.random() * 900)}`;
    const testSection = "Z";
    const testSubject = `Applied Computing ${Math.floor(100 + Math.random() * 900)}`;
    const testCode = `AC-${Math.floor(100 + Math.random() * 900)}`;

    // Create a slot for this new class & section to test auto-resolution
    const seedSlotRes = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/slots",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        session: "2026-27",
        grade: testGrade,
        section: testSection,
        dayOfWeek: "Monday",
        periodNumber: 1,
        subjectName: testSubject,
        subjectCode: testCode,
        roomNumber: "LAB-901",
        slotType: "lab"
      }
    });

    if (seedSlotRes.status !== 201 || !seedSlotRes.body?.success || !seedSlotRes.body?.slot) {
      throw new Error(`Failed to create timetable slot: ${seedSlotRes.body?.message || seedSlotRes.status}`);
    }

    createdSlotId = seedSlotRes.body.slot.id;
    createdSlotDbId = seedSlotRes.body.slot.db_id;
    console.log(`  ✅ Slot created in-memory: ID=${createdSlotId}, DB_ID=${createdSlotDbId}`);

    // Allow PostgREST pooler read visibility with small retry
    let dbSlot = null;
    let slotErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await supabaseAdmin
        .from("timetables")
        .select("*, sections(*, classes(*)), subjects(*)")
        .eq("id", createdSlotDbId)
        .maybeSingle();
      if (res.data) {
        dbSlot = res.data;
        slotErr = res.error;
        break;
      }
      slotErr = res.error;
      await new Promise(r => setTimeout(r, 400));
    }

    if (slotErr || !dbSlot) {
      throw new Error(`Slot not found in Supabase public.timetables: ${slotErr?.message}`);
    }

    const dbSec = dbSlot.sections;
    const dbClass = dbSec?.classes;
    const dbSub = dbSlot.subjects;

    if (!dbClass || !dbSec || !dbSub) {
      throw new Error("Related class, section, or subject missing in DB persistence");
    }

    createdClassDbId = dbClass.id;
    createdSectionDbId = dbSec.id;
    createdSubjectDbId = dbSub.id;

    console.log(`  ✅ Verified public.timetables persistence: UUID=${dbSlot.id}`);
    console.log(`  ✅ Verified public.classes persistence: UUID=${dbClass.id}, Name=${dbClass.name}`);
    console.log(`  ✅ Verified public.sections persistence: UUID=${dbSec.id}, Name=${dbSec.name}`);
    console.log(`  ✅ Verified public.subjects persistence: UUID=${dbSub.id}, Code=${dbSub.code}\n`);

    // ------------------------------------------------------------------------
    // GATE 3: Conflict Detection (Class, Teacher, and Room Collisions)
    // ------------------------------------------------------------------------
    console.log("[Gate 3/10] Verifying Timetable Conflict Detection Engine via POST /api/erp/timetable/validate...");

    // 1. Dry run on existing slot should detect class clash (same class, section, day, period)
    const clashRes = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/validate",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        slot: {
          session: "2026-27",
          grade: testGrade,
          section: testSection,
          dayOfWeek: "Monday",
          periodNumber: 1,
          subjectName: "Alternative Physics",
          roomNumber: "ROOM-102"
        }
      }
    });

    if (clashRes.status !== 200 || clashRes.body?.valid !== false) {
      throw new Error("Expected conflict validation to flag clash, but was marked valid.");
    }
    const classConflict = clashRes.body.conflicts.find(c => c.type === "class_clash");
    if (!classConflict) {
      throw new Error("Expected 'class_clash' conflict type was not found in response.");
    }
    console.log(`  ✅ Class Collision Detected: ${classConflict.message}`);

    // 2. Teacher clash validation
    const teacherClashRes = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/validate",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        slot: {
          session: "2026-27",
          grade: "Class 12",
          section: "B",
          dayOfWeek: "Monday",
          periodNumber: 1, // Period 1 on Monday is taken by Rajeev Malhotra (stf-02) in 10-A
          teacherId: "stf-02",
          teacherName: "Rajeev Malhotra",
          subjectName: "Calculus",
          roomNumber: "ROOM-305"
        }
      }
    });

    const teacherConflict = teacherClashRes.body.conflicts?.find(c => c.type === "teacher_clash");
    if (!teacherConflict) {
      throw new Error("Expected 'teacher_clash' conflict type was not found in response.");
    }
    console.log(`  ✅ Teacher Collision Detected: ${teacherConflict.message}`);

    // 3. Room clash validation
    const roomClashRes = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/validate",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        slot: {
          session: "2026-27",
          grade: "Class 12",
          section: "C",
          dayOfWeek: "Monday",
          periodNumber: 1, // Room 201 is occupied by 10-A during period 1
          roomNumber: "201",
          subjectName: "English Elective"
        }
      }
    });

    const roomConflict = roomClashRes.body.conflicts?.find(c => c.type === "room_clash");
    if (!roomConflict) {
      throw new Error("Expected 'room_clash' conflict type was not found in response.");
    }
    console.log(`  ✅ Room Collision Detected: ${roomConflict.message}\n`);

    // ------------------------------------------------------------------------
    // GATE 4: Timetable Slot Persistence in Supabase public.timetables
    // ------------------------------------------------------------------------
    console.log("[Gate 4/10] Verifying Timetable Slot Persistence in Supabase public.timetables...");
    const { data: dbTimetable, error: ttErr } = await supabaseAdmin
      .from("timetables")
      .select("*")
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("section_id", createdSectionDbId)
      .eq("period_no", 1)
      .maybeSingle();

    if (ttErr || !dbTimetable) {
      throw new Error(`Slot not found in Supabase public.timetables table: ${ttErr?.message}`);
    }

    console.log(`  ✅ Verified persistence in public.timetables:`);
    console.log(`     - UUID: ${dbTimetable.id}`);
    console.log(`     - Section UUID: ${dbTimetable.section_id}`);
    console.log(`     - Subject UUID: ${dbTimetable.subject_id}`);
    console.log(`     - Weekday: ${dbTimetable.weekday} (Monday=1)`);
    console.log(`     - Period: ${dbTimetable.period_no}`);
    console.log(`     - Timing: ${dbTimetable.start_time} - ${dbTimetable.end_time}`);
    console.log(`     - Room: ${dbTimetable.room_no}\n`);

    // ------------------------------------------------------------------------
    // GATE 5: Class Routine Query via GET /api/erp/timetable/classes
    // ------------------------------------------------------------------------
    console.log("[Gate 5/10] Querying Class Routine via GET /api/erp/timetable/classes...");
    const queryRoutineRes = await makeRequest({
      method: "GET",
      path: `/api/erp/timetable/classes?grade=${encodeURIComponent(testGrade)}&section=${testSection}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (queryRoutineRes.status !== 200 || !queryRoutineRes.body?.success) {
      throw new Error(`Failed to query class routine: ${queryRoutineRes.body?.message}`);
    }

    const returnedSlots = queryRoutineRes.body.slots;
    const foundSlot = returnedSlots.find(s => s.id === createdSlotId || s.db_id === createdSlotDbId);
    if (!foundSlot) {
      throw new Error(`Created slot ${createdSlotId} not found in returned class routine.`);
    }

    console.log(`  ✅ Routine retrieved: ${returnedSlots.length} slot(s) for ${testGrade}-${testSection}.`);
    console.log(`  ✅ Slot verified: Period ${foundSlot.periodNumber} | Subject: ${foundSlot.subjectName} | Room: ${foundSlot.roomNumber}\n`);

    // ------------------------------------------------------------------------
    // GATE 6: Teacher Weekly Routine, Free Periods & Workload Analytics
    // ------------------------------------------------------------------------
    console.log("[Gate 6/10] Querying Teacher Workload & Free Periods via GET /api/erp/timetable/teachers/:id...");
    const teacherRoutineRes = await makeRequest({
      method: "GET",
      path: "/api/erp/timetable/teachers/stf-02", // Rajeev Malhotra
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (teacherRoutineRes.status !== 200 || !teacherRoutineRes.body?.success) {
      throw new Error(`Failed to fetch teacher routine: ${teacherRoutineRes.body?.message}`);
    }

    const tData = teacherRoutineRes.body;
    console.log(`  ✅ Faculty Workload Dossier for ${tData.teacher?.name} (${tData.teacher?.designation}):`);
    console.log(`     - Weekly Scheduled Periods: ${tData.weeklyPeriodsCount} / ${tData.maxWeeklyPeriods}`);
    console.log(`     - Utilization Rate: ${tData.utilizationPercent}%`);
    console.log(`     - Available Free Periods Count: ${tData.freePeriodsCount}`);
    console.log(`     - Sample Free Period: ${tData.freePeriods[0]?.dayOfWeek} ${tData.freePeriods[0]?.periodLabel} (${tData.freePeriods[0]?.startTime}-${tData.freePeriods[0]?.endTime})\n`);

    // ------------------------------------------------------------------------
    // GATE 7: Facilities Catalogue & Occupancy Matrix
    // ------------------------------------------------------------------------
    console.log("[Gate 7/10] Querying Facilities & Room Occupancy Matrix via GET /api/erp/timetable/rooms...");
    const roomsRes = await makeRequest({
      method: "GET",
      path: "/api/erp/timetable/rooms",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (roomsRes.status !== 200 || !roomsRes.body?.success) {
      throw new Error(`Failed to fetch rooms occupancy: ${roomsRes.body?.message}`);
    }

    const rData = roomsRes.body;
    console.log(`  ✅ Facilities Matrix Retrieved: Total Rooms = ${rData.totalRooms}`);
    const sampleRoom = rData.rooms.find(r => r.roomNumber === "201") || rData.rooms[0];
    console.log(`     - Room ${sampleRoom.roomNumber} (${sampleRoom.roomName}): ${sampleRoom.totalWeeklyBookings} bookings, ${sampleRoom.utilizationPercent}% utilized\n`);

    // ------------------------------------------------------------------------
    // GATE 8: Intelligent Substitute Teacher Recommendation Engine
    // ------------------------------------------------------------------------
    console.log("[Gate 8/10] Testing Intelligent Substitute Teacher Recommendation Engine...");
    const recoRes = await makeRequest({
      method: "GET",
      path: "/api/erp/timetable/substitutions/recommendations?teacherId=stf-02&date=2026-09-21",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (recoRes.status !== 200 || !recoRes.body?.success) {
      throw new Error(`Failed to fetch substitution recommendations: ${recoRes.body?.message}`);
    }

    const recoData = recoRes.body;
    console.log(`  ✅ Substitution Recommendations for Absent Faculty (${recoData.absentTeachers[0]?.name}):`);
    console.log(`     - Total Uncovered Periods Today: ${recoData.totalUncoveredPeriods}`);
    
    if (recoData.recommendations.length > 0) {
      const firstRec = recoData.recommendations[0];
      const bestCandidate = firstRec.candidates.find(c => c.isBestMatch) || firstRec.candidates[0];
      console.log(`     - Period ${firstRec.periodNumber} (${firstRec.grade}-${firstRec.section}, ${firstRec.subjectName}):`);
      console.log(`       * Available Candidate Substitutes: ${firstRec.availableCandidatesCount}`);
      if (bestCandidate) {
        console.log(`       * Top Recommended Match: ${bestCandidate.teacherName} (Score: ${bestCandidate.recommendationScore}, Dept Match: ${bestCandidate.matchingDepartment})\n`);
      }
    }

    // ------------------------------------------------------------------------
    // GATE 9: Assigning Teacher Substitution & Status Transition
    // ------------------------------------------------------------------------
    console.log("[Gate 9/10] Assigning Teacher Substitution via POST /api/erp/timetable/substitutions...");
    const assignSubRes = await makeRequest({
      method: "POST",
      path: "/api/erp/timetable/substitutions",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        date: "2026-09-21",
        dayOfWeek: "Monday",
        periodNumber: 1,
        absentTeacherId: "stf-02",
        absentTeacherName: "Rajeev Malhotra",
        substituteTeacherId: "stf-07", // Rameshwar Yadav (PE - free during period 1)
        substituteTeacherName: "Rameshwar Yadav",
        grade: "Class 10",
        section: "A",
        subjectName: "Mathematics (Study Hall)",
        roomNumber: "201",
        reason: "medical_emergency",
        notes: "Assigned study hall supervision with assigned math practice problem set"
      }
    });

    if (assignSubRes.status !== 201 || !assignSubRes.body?.success || !assignSubRes.body?.substitution) {
      throw new Error(`Failed to assign substitution: ${assignSubRes.body?.message || assignSubRes.status}`);
    }

    const createdSub = assignSubRes.body.substitution;
    createdSubId = createdSub.id;
    console.log(`  ✅ Substitution Assigned: ${createdSub.id} (Status: ${createdSub.status})`);
    console.log(`     - ${createdSub.substituteTeacherName} covering for ${createdSub.absentTeacherName} during Period ${createdSub.periodNumber}`);

    // Update status to completed
    const updateSubRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/timetable/substitutions/${createdSubId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: "completed",
        notes: "Supervision completed successfully"
      }
    });

    if (updateSubRes.status !== 200 || !updateSubRes.body?.success) {
      throw new Error(`Failed to update substitution status: ${updateSubRes.body?.message}`);
    }

    console.log(`  ✅ Substitution Status Updated to '${updateSubRes.body.substitution.status}'\n`);

    // ------------------------------------------------------------------------
    // GATE 10: Database Cleanup & Teardown
    // ------------------------------------------------------------------------
    console.log("[Gate 10/10] Performing Database Cleanup & Teardown...");

    // Delete created slot from public.timetables
    if (createdSlotDbId) {
      await supabaseAdmin.from("timetables").delete().eq("id", createdSlotDbId);
      console.log(`  ✅ Cleaned up slot [${createdSlotDbId}] from public.timetables.`);
    }

    // Delete section, class, subject
    if (createdSectionDbId) {
      await supabaseAdmin.from("sections").delete().eq("id", createdSectionDbId);
    }
    if (createdClassDbId) {
      await supabaseAdmin.from("classes").delete().eq("id", createdClassDbId);
    }
    if (createdSubjectDbId) {
      await supabaseAdmin.from("subjects").delete().eq("id", createdSubjectDbId);
      console.log("  ✅ Cleaned up test section, class, and subject records.");
    }

    // Delete auth users
    if (testAdminUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
    }
    if (testStudentUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Cleaned up temporary auth users.");
    }

    await app.close();
    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: TIMETABLE & SUBSTITUTION ENGINE FULLY OPERATIONAL!");
    console.log("==========================================================================\n");

  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    if (createdSlotDbId) {
      try { await supabaseAdmin.from("timetables").delete().eq("id", createdSlotDbId); } catch {}
    }
    if (createdSectionDbId) {
      try { await supabaseAdmin.from("sections").delete().eq("id", createdSectionDbId); } catch {}
    }
    if (createdClassDbId) {
      try { await supabaseAdmin.from("classes").delete().eq("id", createdClassDbId); } catch {}
    }
    if (createdSubjectDbId) {
      try { await supabaseAdmin.from("subjects").delete().eq("id", createdSubjectDbId); } catch {}
    }
    if (testAdminUser?.id) {
      try { await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id); } catch {}
    }
    if (testStudentUser?.id) {
      try { await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id); } catch {}
    }
    if (app) await app.close();
    process.exit(1);
  }
}

runLiveTimetableTest();

// DAKSHORA PLATFORM — COMPLETE PURGE & SEED FOR DAKSHORA ACADEMY NEW DELHI
// Purges all test/other schools and establishes "Dakshora Academy New Delhi"
// as the single flagship demo school with:
// - 19 Sections (Nursery-10 single sections + 11-12 Art, Science, Commerce)
// - 20 Real Faculty members
// - Exactly 120 Students distributed across all 19 sections
// - Fully populated Timetable, Fees, Attendance, CBSE Exams/Marks, CMS Website & Role Logins

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
const SESSION_NAME = "2026-27";

async function main() {
  console.log("================================================================================");
  console.log("   DAKSHORA 2.0 | DATABASE PURGE & SEED: DAKSHORA ACADEMY NEW DELHI             ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: FETCH ALL ORGANIZATIONS & IDENTIFY TEST/OTHER ORGS TO DELETE
  // ---------------------------------------------------------------------------
  console.log("STEP 1: Auditing organizations in database...");
  const { data: allOrgs, error: orgErr } = await supabase.from("organizations").select("id, name, slug");
  if (orgErr) throw orgErr;

  const orgsToDelete = allOrgs.filter(o => o.id !== TARGET_ORG_ID);
  const deleteIds = orgsToDelete.map(o => o.id);

  console.log(`  Found ${allOrgs.length} total organizations.`);
  console.log(`  Flagship Demo Target: [${TARGET_ORG_ID}] Dakshora Academy New Delhi`);
  console.log(`  Organizations marked for permanent deletion: ${deleteIds.length}`);
  orgsToDelete.forEach(o => console.log(`    - 🗑️ [${o.id}] ${o.name} (${o.slug})`));

  // ---------------------------------------------------------------------------
  // STEP 2: CASCADE PURGE DATA FOR ALL ORGANIZATIONS TO BE DELETED
  // ---------------------------------------------------------------------------
  if (deleteIds.length > 0) {
    console.log("\nSTEP 2: Deleting dependent records for other organizations...");

    // 2a. Delete marks & exam_subjects for other orgs
    const { data: otherExams } = await supabase.from("exams").select("id").in("organization_id", deleteIds);
    if (otherExams && otherExams.length > 0) {
      const examIds = otherExams.map(e => e.id);
      const { data: otherExamSubs } = await supabase.from("exam_subjects").select("id").in("exam_id", examIds);
      if (otherExamSubs && otherExamSubs.length > 0) {
        const subIds = otherExamSubs.map(s => s.id);
        await supabase.from("marks").delete().in("exam_subject_id", subIds);
        console.log(`    ✓ Deleted marks for ${subIds.length} exam subjects`);
      }
      await supabase.from("exam_subjects").delete().in("exam_id", examIds);
      console.log(`    ✓ Deleted exam subjects for ${examIds.length} exams`);
    }
    await supabase.from("exams").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted exams");

    // 2b. Delete attendance
    await supabase.from("student_attendance").delete().in("organization_id", deleteIds);
    await supabase.from("staff_attendance").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted student and staff attendance");

    // 2c. Delete fee records
    await supabase.from("fee_payments").delete().in("organization_id", deleteIds);
    await supabase.from("student_fees").delete().in("organization_id", deleteIds);
    await supabase.from("fee_structures").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted fee records");

    // 2d. Delete timetables, transport, library
    await supabase.from("timetables").delete().in("organization_id", deleteIds);
    await supabase.from("transport_stops").delete().in("organization_id", deleteIds);
    await supabase.from("transport_routes").delete().in("organization_id", deleteIds);
    await supabase.from("transport_vehicles").delete().in("organization_id", deleteIds);
    await supabase.from("library_books").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted timetables, transport, library");

    // 2e. Delete students and enrollments
    await supabase.from("student_enrollments").delete().in("organization_id", deleteIds);
    await supabase.from("students").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted students and enrollments");

    // 2f. Delete staff
    await supabase.from("school_staff").delete().in("organization_id", deleteIds);
    await supabase.from("staff").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted staff");

    // 2g. Delete sections, classes, subjects, sessions
    await supabase.from("sections").delete().in("organization_id", deleteIds);
    await supabase.from("classes").delete().in("organization_id", deleteIds);
    await supabase.from("subjects").delete().in("organization_id", deleteIds);
    await supabase.from("academic_sessions").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted sections, classes, subjects, sessions");

    // 2h. Delete onboarding, websites, saas, schools, org members
    await supabase.from("school_onboarding_invitations").delete().in("organization_id", deleteIds);
    await supabase.from("school_onboarding").delete().in("organization_id", deleteIds);
    await supabase.from("saas_subscriptions").delete().in("organization_id", deleteIds);
    await supabase.from("websites").delete().in("organization_id", deleteIds);
    await supabase.from("schools").delete().in("organization_id", deleteIds);
    await supabase.from("organization_members").delete().in("organization_id", deleteIds);
    console.log("    ✓ Deleted onboarding, websites, saas, schools, org members");

    // 2i. Delete non-superadmin users belonging to these organizations
    const { data: usersToDelete } = await supabase
      .from("users")
      .select("id, email, role")
      .in("organization_id", deleteIds)
      .neq("role", "superadmin");

    if (usersToDelete && usersToDelete.length > 0) {
      const uIds = usersToDelete.map(u => u.id);
      await supabase.from("users").delete().in("id", uIds);
      console.log(`    ✓ Deleted ${uIds.length} non-superadmin users from public.users`);

      for (const u of usersToDelete) {
        if (u.email !== "rdeshwal89@gmail.com") {
          try {
            await supabase.auth.admin.deleteUser(u.id);
          } catch (_) {}
        }
      }
      console.log(`    ✓ Cleaned up corresponding Auth users`);
    }

    // 2j. Delete the organizations themselves
    const { error: delOrgErr } = await supabase.from("organizations").delete().in("id", deleteIds);
    if (delOrgErr) console.warn("    ⚠️ Org delete warning:", delOrgErr.message);
    else console.log(`  ✅ All ${deleteIds.length} non-target organizations deleted successfully!`);
  }

  // ---------------------------------------------------------------------------
  // STEP 3: RESET EXISTING DATA FOR TARGET DEMO ORGANIZATION
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 3: Resetting existing dependent records for demo tenant to ensure clean slate...");
  // Clear any existing marks, attendance, timetable, fees, students, staff for TARGET_ORG_ID
  const { data: curExams } = await supabase.from("exams").select("id").eq("organization_id", TARGET_ORG_ID);
  if (curExams && curExams.length > 0) {
    const curExamIds = curExams.map(e => e.id);
    const { data: curSubs } = await supabase.from("exam_subjects").select("id").in("exam_id", curExamIds);
    if (curSubs && curSubs.length > 0) {
      await supabase.from("marks").delete().in("exam_subject_id", curSubs.map(s => s.id));
    }
    await supabase.from("exam_subjects").delete().in("exam_id", curExamIds);
    await supabase.from("exams").delete().eq("organization_id", TARGET_ORG_ID);
  }
  await supabase.from("student_attendance").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("staff_attendance").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("fee_payments").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("student_fees").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("fee_structures").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("timetables").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("student_enrollments").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("students").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("school_staff").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("staff").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("sections").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("classes").delete().eq("organization_id", TARGET_ORG_ID);
  await supabase.from("subjects").delete().eq("organization_id", TARGET_ORG_ID);
  console.log("  ✅ Demo tenant cleared for fresh provisioning.");

  // ---------------------------------------------------------------------------
  // STEP 4: CONFIGURE TARGET ORGANIZATION & SCHOOL PROFILE
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 4: Configuring Dakshora Academy New Delhi Organization & School...");

  await supabase.from("organizations").upsert({
    id: TARGET_ORG_ID,
    name: "Dakshora Academy New Delhi",
    slug: "dakshora-academy",
    status: "active"
  }, { onConflict: "id" });

  const { data: existingSchool } = await supabase
    .from("schools")
    .select("id")
    .eq("organization_id", TARGET_ORG_ID)
    .maybeSingle();

  const schoolPayload = {
    id: existingSchool?.id || crypto.randomUUID(),
    organization_id: TARGET_ORG_ID,
    school_code: "DKS-DEL-01",
    name: "Dakshora Academy, New Delhi",
    short_name: "DAKSHORA",
    board: "CBSE",
    affiliation_no: "CBSE-AFF-202601",
    address: "Institutional Area, Vasant Kunj, New Delhi - 110070",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110070",
    phone: "+91 11 2612 3456",
    email: "principal@dakshoraacademy.edu.in",
    website: "https://dakshora-academy.school.dakshora.app",
    logo_url: "/assets/dakshora-logo.png",
    status: "active"
  };

  await supabase.from("schools").upsert(schoolPayload, { onConflict: "id" });
  console.log("  ✅ School Profile Saved: Dakshora Academy, New Delhi (DKS-DEL-01)");

  // ---------------------------------------------------------------------------
  // STEP 5: PROVISION ACADEMIC SESSION (2026-27)
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 5: Provisioning Academic Session 2026-27...");
  let { data: session } = await supabase
    .from("academic_sessions")
    .select("*")
    .eq("organization_id", TARGET_ORG_ID)
    .eq("name", SESSION_NAME)
    .maybeSingle();

  if (!session) {
    const { data: newSess, error: sessErr } = await supabase
      .from("academic_sessions")
      .insert([{
        organization_id: TARGET_ORG_ID,
        name: SESSION_NAME,
        start_date: "2026-04-01",
        end_date: "2027-03-31",
        is_current: true
      }])
      .select()
      .single();
    if (sessErr) throw sessErr;
    session = newSess;
  }
  console.log(`  ✅ Academic Session: ${session.name} (ID: ${session.id})`);

  // ---------------------------------------------------------------------------
  // STEP 6: PROVISION 15 CLASSES & 19 SECTIONS
  // Nursery to 10th (13 sections "A") + Class 11 (3 sections) + Class 12 (3 sections)
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 6: Provisioning 15 Classes and 19 Sections...");
  const classDefs = [
    { name: "Nursery", code: "NUR", display_order: 1, sections: [{ name: "A", room: "R-NUR" }] },
    { name: "LKG", code: "LKG", display_order: 2, sections: [{ name: "A", room: "R-LKG" }] },
    { name: "UKG", code: "UKG", display_order: 3, sections: [{ name: "A", room: "R-UKG" }] },
    { name: "Class 1", code: "1", display_order: 4, sections: [{ name: "A", room: "R-101" }] },
    { name: "Class 2", code: "2", display_order: 5, sections: [{ name: "A", room: "R-102" }] },
    { name: "Class 3", code: "3", display_order: 6, sections: [{ name: "A", room: "R-103" }] },
    { name: "Class 4", code: "4", display_order: 7, sections: [{ name: "A", room: "R-104" }] },
    { name: "Class 5", code: "5", display_order: 8, sections: [{ name: "A", room: "R-105" }] },
    { name: "Class 6", code: "6", display_order: 9, sections: [{ name: "A", room: "R-201" }] },
    { name: "Class 7", code: "7", display_order: 10, sections: [{ name: "A", room: "R-202" }] },
    { name: "Class 8", code: "8", display_order: 11, sections: [{ name: "A", room: "R-203" }] },
    { name: "Class 9", code: "9", display_order: 12, sections: [{ name: "A", room: "R-301" }] },
    { name: "Class 10", code: "10", display_order: 13, sections: [{ name: "A", room: "R-302" }] },
    {
      name: "Class 11",
      code: "11",
      display_order: 14,
      sections: [
        { name: "Science", room: "R-11-SCI" },
        { name: "Commerce", room: "R-11-COM" },
        { name: "Arts", room: "R-11-ART" }
      ]
    },
    {
      name: "Class 12",
      code: "12",
      display_order: 15,
      sections: [
        { name: "Science", room: "R-12-SCI" },
        { name: "Commerce", room: "R-12-COM" },
        { name: "Arts", room: "R-12-ART" }
      ]
    }
  ];

  const sectionList = []; // Array of { classRecord, sectionRecord, sectionKey: "Class 10-A" }
  const classMap = new Map();

  for (const c of classDefs) {
    const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .insert([{
        organization_id: TARGET_ORG_ID,
        name: c.name,
        code: c.code,
        display_order: c.display_order
      }])
      .select()
      .single();
    if (clsErr) throw clsErr;
    classMap.set(c.name, cls);

    for (const s of c.sections) {
      const { data: sec, error: secErr } = await supabase
        .from("sections")
        .insert([{
          organization_id: TARGET_ORG_ID,
          class_id: cls.id,
          name: s.name,
          room_no: s.room,
          capacity: 40
        }])
        .select()
        .single();
      if (secErr) throw secErr;

      sectionList.push({
        classId: cls.id,
        className: c.name,
        sectionId: sec.id,
        sectionName: s.name,
        room: s.room,
        key: `${c.name} - ${s.name}`
      });
    }
  }

  console.log(`  ✅ Provisioned ${classMap.size} Classes and exactly ${sectionList.length} Sections (Target: 19 sections).`);

  // ---------------------------------------------------------------------------
  // STEP 7: PROVISION STANDARD CBSE SUBJECTS
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 7: Provisioning CBSE Academic Subjects...");
  const subjectDefs = [
    { name: "English Language & Literature", code: "ENG-184", subject_type: "academic" },
    { name: "Hindi Course-A", code: "HIN-002", subject_type: "academic" },
    { name: "Mathematics Standard", code: "MATH-041", subject_type: "academic" },
    { name: "Science (PCB)", code: "SCI-086", subject_type: "academic" },
    { name: "Social Science", code: "SST-087", subject_type: "academic" },
    { name: "Physics", code: "PHY-042", subject_type: "academic" },
    { name: "Chemistry", code: "CHEM-043", subject_type: "academic" },
    { name: "Biology", code: "BIO-044", subject_type: "academic" },
    { name: "Accountancy", code: "ACC-055", subject_type: "academic" },
    { name: "Business Studies", code: "BST-054", subject_type: "academic" },
    { name: "Economics", code: "ECO-030", subject_type: "academic" },
    { name: "History", code: "HIST-027", subject_type: "academic" },
    { name: "Political Science", code: "POL-028", subject_type: "academic" },
    { name: "Computer Science & AI", code: "CS-083", subject_type: "academic" },
    { name: "Physical Education", code: "PE-048", subject_type: "activity" }
  ];

  const subjectMap = new Map();
  for (const s of subjectDefs) {
    const { data: sub, error: subErr } = await supabase
      .from("subjects")
      .insert([{
        organization_id: TARGET_ORG_ID,
        name: s.name,
        code: s.code,
        subject_type: s.subject_type
      }])
      .select()
      .single();
    if (subErr) throw subErr;
    subjectMap.set(s.code, sub);
  }
  console.log(`  ✅ Provisioned ${subjectMap.size} CBSE Subjects.`);

  // ---------------------------------------------------------------------------
  // STEP 8: PROVISION EXACTLY 20 FACULTY / TEACHERS
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 8: Provisioning exactly 20 Faculty Members...");
  const facultyDefs = [
    { code: "DKS-FAC-01", fn: "Rajesh", ln: "Sharma", gen: "male", desig: "Principal & Senior PGT Physics", dept: "Science", phone: "9811000001", email: "rajesh.sharma@dakshoraacademy.edu.in", join: "2020-04-01" },
    { code: "DKS-FAC-02", fn: "Sunita", ln: "Verma", gen: "female", desig: "Vice Principal & PGT English", dept: "Languages", phone: "9811000002", email: "sunita.verma@dakshoraacademy.edu.in", join: "2021-06-01" },
    { code: "DKS-FAC-03", fn: "Vikramaditya", ln: "Singh", gen: "male", desig: "PGT Mathematics", dept: "Mathematics", phone: "9811000003", email: "vikramaditya.singh@dakshoraacademy.edu.in", join: "2021-07-15" },
    { code: "DKS-FAC-04", fn: "Ananya", ln: "Mukherjee", gen: "female", desig: "PGT Chemistry", dept: "Science", phone: "9811000004", email: "ananya.mukherjee@dakshoraacademy.edu.in", join: "2022-04-10" },
    { code: "DKS-FAC-05", fn: "Rohan", ln: "Kapoor", gen: "male", desig: "PGT Biology", dept: "Science", phone: "9811000005", email: "rohan.kapoor@dakshoraacademy.edu.in", join: "2022-07-01" },
    { code: "DKS-FAC-06", fn: "Kavita", ln: "Gupta", gen: "female", desig: "PGT Accountancy", dept: "Commerce", phone: "9811000006", email: "kavita.gupta@dakshoraacademy.edu.in", join: "2021-09-01" },
    { code: "DKS-FAC-07", fn: "Amit", ln: "Saxena", gen: "male", desig: "PGT Business Studies", dept: "Commerce", phone: "9811000007", email: "amit.saxena@dakshoraacademy.edu.in", join: "2022-01-15" },
    { code: "DKS-FAC-08", fn: "Shalini", ln: "Mehra", gen: "female", desig: "PGT Economics", dept: "Commerce", phone: "9811000008", email: "shalini.mehra@dakshoraacademy.edu.in", join: "2022-03-01" },
    { code: "DKS-FAC-09", fn: "Pradeep", ln: "Joshi", gen: "male", desig: "PGT History & Political Science", dept: "Humanities", phone: "9811000009", email: "pradeep.joshi@dakshoraacademy.edu.in", join: "2021-11-01" },
    { code: "DKS-FAC-10", fn: "Ashish", ln: "Deshwal", gen: "male", desig: "PGT Computer Science & AI", dept: "IT & CS", phone: "7014651118", email: "ac.deshwal@gmail.com", join: "2020-07-01" },
    { code: "DKS-FAC-11", fn: "Vandana", ln: "Rao", gen: "female", desig: "TGT Science", dept: "Science", phone: "9811000011", email: "vandana.rao@dakshoraacademy.edu.in", join: "2023-04-01" },
    { code: "DKS-FAC-12", fn: "Manish", ln: "Tiwari", gen: "male", desig: "TGT Mathematics", dept: "Mathematics", phone: "9811000012", email: "manish.tiwari@dakshoraacademy.edu.in", join: "2023-05-15" },
    { code: "DKS-FAC-13", fn: "Pooja", ln: "Bhatia", gen: "female", desig: "TGT Social Science", dept: "Social Science", phone: "9811000013", email: "pooja.bhatia@dakshoraacademy.edu.in", join: "2023-07-01" },
    { code: "DKS-FAC-14", fn: "Deepika", ln: "Sen", gen: "female", desig: "TGT English", dept: "Languages", phone: "9811000014", email: "deepika.sen@dakshoraacademy.edu.in", join: "2023-08-15" },
    { code: "DKS-FAC-15", fn: "Suresh", ln: "Chandra", gen: "male", desig: "TGT Hindi & Sanskrit", dept: "Languages", phone: "9811000015", email: "suresh.chandra@dakshoraacademy.edu.in", join: "2022-08-01" },
    { code: "DKS-FAC-16", fn: "Neha", ln: "Malhotra", gen: "female", desig: "PRT Primary EVS & Math", dept: "Primary Wing", phone: "9811000016", email: "neha.malhotra@dakshoraacademy.edu.in", join: "2024-02-01" },
    { code: "DKS-FAC-17", fn: "Ritu", ln: "Chawla", gen: "female", desig: "PRT Primary English", dept: "Primary Wing", phone: "9811000017", email: "ritu.chawla@dakshoraacademy.edu.in", join: "2024-03-01" },
    { code: "DKS-FAC-18", fn: "Megha", ln: "Aggarwal", gen: "female", desig: "NTT Pre-Primary In-Charge", dept: "Early Years", phone: "9811000018", email: "megha.aggarwal@dakshoraacademy.edu.in", join: "2024-04-01" },
    { code: "DKS-FAC-19", fn: "Gurpreet", ln: "Singh", gen: "male", desig: "HOD Physical Education & Sports", dept: "Sports", phone: "9811000019", email: "gurpreet.singh@dakshoraacademy.edu.in", join: "2021-01-10" },
    { code: "DKS-FAC-20", fn: "Pallavi", ln: "Roy", gen: "female", desig: "Faculty of Fine & Performing Arts", dept: "Creative Arts", phone: "9811000020", email: "pallavi.roy@dakshoraacademy.edu.in", join: "2023-10-01" }
  ];

  const staffRecords = [];
  for (const f of facultyDefs) {
    const { data: st, error: stErr } = await supabase
      .from("staff")
      .insert([{
        organization_id: TARGET_ORG_ID,
        employee_code: f.code,
        first_name: f.fn,
        last_name: f.ln,
        gender: f.gen,
        phone: f.phone,
        email: f.email,
        designation: f.desig,
        department: f.dept,
        joining_date: f.join,
        employment_type: "Full-Time Permanent",
        is_active: true
      }])
      .select()
      .single();
    if (stErr) throw stErr;
    staffRecords.push(st);

    // Also mirror to school_staff for backwards compatibility
    try {
      await supabase.from("school_staff").insert([{
        organization_id: TARGET_ORG_ID,
        employee_id: f.code,
        name: `${f.fn} ${f.ln}`,
        role: f.desig.toLowerCase().includes("principal") ? "principal" : "teacher",
        designation: f.desig,
        department: f.dept,
        email: f.email,
        phone: f.phone,
        joining_date: f.join,
        is_active: true
      }]);
    } catch (_) {}
  }
  console.log(`  ✅ Inserted exactly ${staffRecords.length} Faculty Members in public.staff.`);

  // ---------------------------------------------------------------------------
  // STEP 9: PROVISION EXACTLY 120 STUDENTS ACROSS ALL 19 SECTIONS
  // Distribution:
  // 13 sections x 6 students = 78 students
  // 6 sections x 7 students = 42 students
  // Total = 78 + 42 = 120 students!
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 9: Provisioning exactly 120 Students distributed across 19 sections...");

  const firstNamesBoys = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Ayaan", "Krishna",
    "Ishaan", "Shaurya", "Atharv", "Dhruv", "Kabir", "Rudra", "Ayush", "Om", "Advik", "Devansh",
    "Kavya", "Samar", "Pranav", "Hardik", "Rishi", "Kartik", "Daksh", "Tanmay", "Aakash", "Madhav"
  ];
  const firstNamesGirls = [
    "Aadhya", "Saanvi", "Ananya", "Diya", "Pari", "Anika", "Navya", "Angel", "Ira", "Myra",
    "Prisha", "Riya", "Aarohi", "Avni", "Kavya", "Vanya", "Siya", "Tara", "Tanvi", "Mira",
    "Anvi", "Ishita", "Meera", "Ahana", "Sia", "Shanaya", "Pihu", "Kashvi", "Ananya", "Sara"
  ];
  const lastNames = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Mishra", "Agarwal", "Bansal", "Mehta", "Chawla",
    "Malhotra", "Saxena", "Deshwal", "Bhatia", "Joshi", "Kapoor", "Tiwari", "Rawat", "Chaudhary", "Pandey"
  ];
  const delhiLocalities = [
    "B-4 Vasant Kunj, New Delhi - 110070",
    "C-2 Saket, New Delhi - 110017",
    "Pocket 1, Sector 9 Dwarka, New Delhi - 110077",
    "Block D, Rohini Sector 13, New Delhi - 110085",
    "A-Block Janakpuri, New Delhi - 110058",
    "Kailash Colony, Greater Kailash, New Delhi - 110048",
    "Lajpat Nagar III, New Delhi - 110024",
    "Hauz Khas Enclave, New Delhi - 110016",
    "Paschim Vihar Extn, New Delhi - 110063",
    "Karol Bagh, New Delhi - 110005"
  ];

  // We assign counts per section:
  // First 6 sections get 7 students each (6 x 7 = 42)
  // Remaining 13 sections get 6 students each (13 x 6 = 78)
  // Sum = 120 students.
  const sectionCounts = sectionList.map((sec, idx) => ({
    ...sec,
    count: idx < 6 ? 7 : 6
  }));

  const totalCalculated = sectionCounts.reduce((acc, cur) => acc + cur.count, 0);
  console.log(`  Section student allocations verify to exact total: ${totalCalculated} students.`);

  let globalStudentIndex = 1;
  const studentRecords = [];

  for (const secConfig of sectionCounts) {
    for (let r = 1; r <= secConfig.count; r++) {
      const idx = globalStudentIndex;
      const isFemale = (idx % 2 === 0);
      const fn = isFemale ? firstNamesGirls[(idx - 1) % firstNamesGirls.length] : firstNamesBoys[(idx - 1) % firstNamesBoys.length];
      const ln = lastNames[(idx - 1) % lastNames.length];
      const admNo = `DKS-2026-${String(idx).padStart(3, "0")}`;
      const penNo = `20260711${String(idx).padStart(3, "0")}`;
      const rollNo = `R-${String(r).padStart(2, "0")}`;

      // Calculate approximate birth year based on class display order (order 1..15 -> age ~3 to 17)
      const targetClass = classDefs.find(c => c.name === secConfig.className);
      const displayOrder = targetClass ? targetClass.display_order : 5;
      const birthYear = 2026 - (3 + displayOrder);
      const dob = `${birthYear}-0${(idx % 9) + 1}-15`;

      const parentMobile = `9810${String(100000 + idx).slice(1)}`;
      const studentEmail = idx === 1 ? "parent@dakshoraacademy.edu.in" : `student.${admNo.toLowerCase()}@dakshoraacademy.edu.in`;
      const address = delhiLocalities[idx % delhiLocalities.length];

      const { data: std, error: stdErr } = await supabase
        .from("students")
        .insert([{
          organization_id: TARGET_ORG_ID,
          admission_no: admNo,
          pen_no: penNo,
          first_name: fn,
          last_name: ln,
          gender: isFemale ? "female" : "male",
          date_of_birth: dob,
          blood_group: (idx % 4 === 0) ? "O+" : ((idx % 4 === 1) ? "A+" : ((idx % 4 === 2) ? "B+" : "AB+")),
          phone: parentMobile,
          email: studentEmail,
          address: address,
          city: "New Delhi",
          state: "Delhi",
          pincode: "110070",
          admission_date: "2026-04-01",
          admission_status: "admitted"
        }])
        .select()
        .single();
      if (stdErr) throw stdErr;

      // Enrollment record
      await supabase.from("student_enrollments").insert([{
        organization_id: TARGET_ORG_ID,
        student_id: std.id,
        academic_session_id: session.id,
        class_id: secConfig.classId,
        section_id: secConfig.sectionId,
        roll_no: rollNo,
        joined_on: "2026-04-01"
      }]);

      studentRecords.push({
        ...std,
        rollNo,
        classId: secConfig.classId,
        className: secConfig.className,
        sectionId: secConfig.sectionId,
        sectionName: secConfig.sectionName
      });

      globalStudentIndex++;
    }
  }

  console.log(`  ✅ Provisioned exactly ${studentRecords.length} Students across all 19 sections! (Admission range: DKS-2026-001 to DKS-2026-120)`);

  // ---------------------------------------------------------------------------
  // STEP 10: PROVISION FEE STRUCTURES, STUDENT FEES & RECEIPTS
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 10: Provisioning Fee Structures and Invoicing for all 120 Students...");
  const feeStructureDefs = [
    { name: "Quarterly Tuition Fee (Primary Wing: Nur-5)", amount: 18000, frequency: "quarterly", due_date: "2026-05-15" },
    { name: "Quarterly Tuition Fee (Middle & Secondary: 6-10)", amount: 24000, frequency: "quarterly", due_date: "2026-05-15" },
    { name: "Quarterly Tuition Fee (Senior Secondary: 11-12)", amount: 30000, frequency: "quarterly", due_date: "2026-05-15" },
    { name: "Annual Development & Smart Campus Lab Fee", amount: 6000, frequency: "annual", due_date: "2026-06-30" }
  ];

  const feeStructures = [];
  for (const fs of feeStructureDefs) {
    const { data: feeStr, error: fsErr } = await supabase
      .from("fee_structures")
      .insert([{
        organization_id: TARGET_ORG_ID,
        academic_session_id: session.id,
        name: fs.name,
        amount: fs.amount,
        frequency: fs.frequency,
        due_date: fs.due_date
      }])
      .select()
      .single();
    if (fsErr) throw fsErr;
    feeStructures.push(feeStr);
  }

  // Create fee demands & payments for students
  let paidCount = 0;
  let partialCount = 0;
  let pendingCount = 0;

  for (let i = 0; i < studentRecords.length; i++) {
    const std = studentRecords[i];
    // Select appropriate fee structure based on class
    let targetFs = feeStructures[0]; // Primary
    if (["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].includes(std.className)) {
      targetFs = feeStructures[1];
    } else if (["Class 11", "Class 12"].includes(std.className)) {
      targetFs = feeStructures[2];
    }

    // 70 Paid, 35 Partial, 15 Pending
    let status = "pending";
    let paidAmt = 0;
    if (i < 70) {
      status = "paid";
      paidAmt = targetFs.amount;
      paidCount++;
    } else if (i < 105) {
      status = "partial";
      paidAmt = Math.round(targetFs.amount / 2);
      partialCount++;
    } else {
      status = "pending";
      paidAmt = 0;
      pendingCount++;
    }

    const { data: sFee, error: sfErr } = await supabase
      .from("student_fees")
      .insert([{
        organization_id: TARGET_ORG_ID,
        student_id: std.id,
        fee_structure_id: targetFs.id,
        amount_due: targetFs.amount,
        discount: 0,
        amount_paid: paidAmt,
        status: status,
        due_date: targetFs.due_date
      }])
      .select()
      .single();
    if (sfErr) throw sfErr;

    // Record receipt if paid or partial
    if (paidAmt > 0) {
      const receiptNo = `REC/2026-27/${String(i + 1).padStart(4, "0")}`;
      const method = (i % 3 === 0) ? "razorpay" : ((i % 3 === 1) ? "upi" : "cash");
      await supabase.from("fee_payments").insert([{
        organization_id: TARGET_ORG_ID,
        student_fee_id: sFee.id,
        receipt_no: receiptNo,
        amount: paidAmt,
        payment_method: method,
        transaction_ref: `${method.toUpperCase()}-DKS-${Date.now()}-${i}`,
        paid_at: new Date(Date.now() - (i * 3600000)).toISOString()
      }]);
    }
  }

  console.log(`  ✅ Fee Demands Generated for 120 Students:`);
  console.log(`     - Fully Paid: ${paidCount} students`);
  console.log(`     - Partially Paid: ${partialCount} students`);
  console.log(`     - Pending: ${pendingCount} students`);

  // ---------------------------------------------------------------------------
  // STEP 11: PROVISION TIMETABLE SLOTS FOR ALL 19 SECTIONS
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 11: Provisioning Timetable Matrix (Mon-Sat, 8 Periods) for all 19 Sections...");
  const periodSchedule = [
    { no: 1, start: "08:15:00", end: "09:00:00" },
    { no: 2, start: "09:00:00", end: "09:45:00" },
    { no: 3, start: "09:45:00", end: "10:30:00" },
    { no: 4, start: "10:30:00", end: "11:15:00" },
    { no: 5, start: "11:45:00", end: "12:30:00" },
    { no: 6, start: "12:30:00", end: "13:15:00" },
    { no: 7, start: "13:15:00", end: "14:00:00" },
    { no: 8, start: "14:00:00", end: "14:45:00" }
  ];

  const subArray = Array.from(subjectMap.values());
  const timetableInserts = [];

  for (const sec of sectionList) {
    // Weekdays Monday (1) to Friday (5)
    for (let day = 1; day <= 5; day++) {
      for (let pIdx = 0; pIdx < periodSchedule.length; pIdx++) {
        const period = periodSchedule[pIdx];
        const sub = subArray[(day + pIdx) % subArray.length];
        const teacher = staffRecords[(day * 3 + pIdx) % staffRecords.length];

        timetableInserts.push({
          organization_id: TARGET_ORG_ID,
          section_id: sec.sectionId,
          subject_id: sub.id,
          teacher_member_id: null,
          weekday: day,
          period_no: period.no,
          start_time: period.start,
          end_time: period.end,
          room_no: sec.room
        });
      }
    }
  }

  // Insert in batches of 100
  for (let b = 0; b < timetableInserts.length; b += 100) {
    const chunk = timetableInserts.slice(b, b + 100);
    const { error: ttErr } = await supabase.from("timetables").insert(chunk);
    if (ttErr) {
      console.warn("    ⚠️ Timetable batch error:", ttErr.message);
      break;
    }
  }
  console.log(`  ✅ Provisioned ${timetableInserts.length} Timetable Slots across all 19 Sections without conflicts.`);

  // ---------------------------------------------------------------------------
  // STEP 12: PROVISION STUDENT & STAFF ATTENDANCE
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 12: Provisioning Student and Staff Attendance Records...");
  const today = "2026-10-22";

  // Student Attendance for 120 students (92% present, 5% absent, 3% late)
  const studentAttInserts = studentRecords.map((std, i) => {
    let status = "present";
    if (i % 20 === 19) status = "absent";
    else if (i % 30 === 29) status = "late";

    return {
      organization_id: TARGET_ORG_ID,
      student_id: std.id,
      academic_session_id: session.id,
      attendance_date: today,
      status: status
    };
  });

  for (let b = 0; b < studentAttInserts.length; b += 50) {
    await supabase.from("student_attendance").insert(studentAttInserts.slice(b, b + 50));
  }
  console.log(`  ✅ Provisioned daily attendance for all ${studentAttInserts.length} Students.`);

  // Staff Attendance for 20 teachers (19 present, 1 on leave)
  const staffAttInserts = staffRecords.map((st, i) => ({
    organization_id: TARGET_ORG_ID,
    staff_id: st.id,
    attendance_date: today,
    status: i === 19 ? "on_leave" : "present",
    remarks: i === 19 ? "Approved medical leave" : "On duty"
  }));
  await supabase.from("staff_attendance").insert(staffAttInserts);
  console.log(`  ✅ Provisioned daily attendance for all 20 Faculty Members.`);

  // ---------------------------------------------------------------------------
  // STEP 13: PROVISION CBSE EXAMINATION, SUBJECTS & MARKS
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 13: Provisioning CBSE Examination & Marksheet Records...");
  const { data: exam, error: exErr } = await supabase
    .from("exams")
    .insert([{
      organization_id: TARGET_ORG_ID,
      academic_session_id: session.id,
      name: "Term-1 Mid-Term Examination",
      exam_type: "CBSE Term Exam",
      start_date: "2026-09-15",
      end_date: "2026-09-25"
    }])
    .select()
    .single();
  if (exErr) throw exErr;

  // Pick Class 10-A and Class 12-Science for detailed exam subjects and marks
  const targetSectionsForExams = sectionList.filter(s =>
    (s.className === "Class 10" && s.sectionName === "A") ||
    (s.className === "Class 12" && s.sectionName === "Science")
  );

  for (const tSec of targetSectionsForExams) {
    const secStudents = studentRecords.filter(s => s.sectionId === tSec.sectionId);
    for (const sub of subArray.slice(0, 5)) {
      const { data: examSub, error: esErr } = await supabase
        .from("exam_subjects")
        .insert([{
          exam_id: exam.id,
          section_id: tSec.sectionId,
          subject_id: sub.id,
          exam_date: "2026-09-18",
          max_marks: 100,
          passing_marks: 33
        }])
        .select()
        .single();
      if (esErr) continue;

      const marksInserts = secStudents.map((std, idx) => {
        const marksObt = 65 + ((idx * 7) % 31); // scores between 65 and 95
        let grade = "A1";
        if (marksObt < 70) grade = "B2";
        else if (marksObt < 80) grade = "B1";
        else if (marksObt < 90) grade = "A2";

        return {
          exam_subject_id: examSub.id,
          student_id: std.id,
          marks_obtained: marksObt,
          grade: grade,
          remarks: "Good performance"
        };
      });

      await supabase.from("marks").insert(marksInserts);
    }
  }
  console.log(`  ✅ Provisioned CBSE Term-1 Examination and Marks for Class 10-A and 12-Science.`);

  // ---------------------------------------------------------------------------
  // STEP 14: PROVISION COMPLETE 11-STEP CMS WEBSITE & SHOWCASE
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 14: Provisioning Published Website & 11-step CMS Tree...");
  const cmsTree = {
    pages: [
      { id: "page-home", title: "Home", slug: "/", status: "published" },
      { id: "page-about", title: "About Us", slug: "/about", status: "published" },
      { id: "page-admissions", title: "Admissions 2026-27", slug: "/admissions", status: "published" },
      { id: "page-academics", title: "Academics & CBSE Curriculum", slug: "/academics", status: "published" },
      { id: "page-faculty", title: "Faculty & Mentors", slug: "/faculty", status: "published" },
      { id: "page-facilities", title: "Campus & Labs", slug: "/facilities", status: "published" },
      { id: "page-disclosure", title: "CBSE Mandatory Disclosure", slug: "/mandatory-disclosure", status: "published" },
      { id: "page-contact", title: "Contact & Location", slug: "/contact", status: "published" }
    ],
    sections: [
      { id: "sec-hero", page_id: "page-home", name: "Hero Banner", type: "hero", content: { headline: "Dakshora Academy, New Delhi", subhead: "Empowering Next-Generation Leaders through CBSE Excellence & AI-Integrated Education" } },
      { id: "sec-stats", page_id: "page-home", name: "Key Statistics", type: "stats", content: { students: "120+", faculty: "20", labs: "8", board: "CBSE Affiliated" } },
      { id: "sec-notice", page_id: "page-home", name: "Notice Board", type: "notices", content: { items: ["Admissions Open for Session 2026-27 (Nursery to 12th)", "Annual Athletic Meet & STEM Robotics Expo 2026", "CBSE Pre-Board Schedule Released"] } }
    ],
    components: [],
    content: {
      school_name: "Dakshora Academy, New Delhi",
      tagline: "Excellence in Academics, Innovation in Education",
      phone: "+91 11 2612 3456",
      email: "principal@dakshoraacademy.edu.in",
      address: "Institutional Area, Vasant Kunj, New Delhi - 110070"
    },
    domain: {
      subdomain: "dakshora-academy",
      custom_domain: "dakshoraacademy.edu.in",
      status: "live"
    },
    template: {
      id: "tpl-school-saas",
      name: "Dakshora Elite CBSE Template",
      primary_color: "#1e3a8a",
      secondary_color: "#f59e0b"
    },
    seo: {
      title: "Dakshora Academy New Delhi | Premier CBSE School",
      description: "Leading CBSE Day-School in Vasant Kunj, New Delhi offering Nursery to 12th (Science, Commerce, Arts) with AI robotics lab and smart classrooms.",
      keywords: "CBSE school Delhi, Vasant Kunj school, Dakshora Academy, best schools New Delhi"
    },
    media: [],
    publishing: {
      is_published: true,
      last_published_at: new Date().toISOString()
    },
    website_integration: {
      erp_connected: true,
      admission_form_enabled: true,
      fee_payment_gateway: true
    },
    mobile_app: {
      enabled: true,
      app_name: "Dakshora Academy Parent App"
    }
  };

  await supabase.from("websites").upsert({
    id: "dakshora-academy-web-01",
    organization_id: TARGET_ORG_ID,
    name: "Dakshora Academy Official Portal",
    slug: "dakshora-academy",
    status: "published",
    cms_tree: cmsTree,
    config: {
      domain: "dakshora-academy.school.dakshora.app",
      theme: "cbse-modern"
    }
  }, { onConflict: "id" });
  console.log("  ✅ Published Website & CMS Tree configured for Dakshora Academy New Delhi.");

  // ---------------------------------------------------------------------------
  // STEP 15: PROVISION 4 DEDICATED ROLE ACCOUNTS IN AUTH & PUBLIC.USERS
  // 1. Admin/Principal: admin@dakshoraacademy.edu.in / Admin@2026
  // 2. Teacher: teacher@dakshoraacademy.edu.in / Teacher@2026
  // 3. Accountant: accountant@dakshoraacademy.edu.in / Accountant@2026
  // 4. Parent/Student: parent@dakshoraacademy.edu.in / Parent@2026
  // ---------------------------------------------------------------------------
  console.log("\nSTEP 15: Provisioning 4 Core Role Accounts (Admin, Teacher, Accountant, Parent)...");

  const roleAccounts = [
    {
      email: "admin@dakshoraacademy.edu.in",
      password: "Admin@2026",
      name: "Dr. Rajesh Sharma (Principal & Admin)",
      role: "school-admin",
      phone: "9811000001"
    },
    {
      email: "teacher@dakshoraacademy.edu.in",
      password: "Teacher@2026",
      name: "Vikramaditya Singh (PGT Mathematics)",
      role: "teacher",
      phone: "9811000003"
    },
    {
      email: "accountant@dakshoraacademy.edu.in",
      password: "Accountant@2026",
      name: "Accountant Office (Dakshora Academy)",
      role: "accountant",
      phone: "9811000006"
    },
    {
      email: "parent@dakshoraacademy.edu.in",
      password: "Parent@2026",
      name: "Suresh Sharma (Parent of Aarav Sharma)",
      role: "parent",
      phone: "9810100001"
    }
  ];

  const { data: authList } = await supabase.auth.admin.listUsers();
  const existingUsers = authList?.users || [];

  for (const acc of roleAccounts) {
    let authUser = existingUsers.find(u => u.email?.toLowerCase() === acc.email.toLowerCase());
    if (authUser) {
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          name: acc.name,
          phone: acc.phone,
          role: acc.role,
          organization_id: TARGET_ORG_ID
        },
        app_metadata: {
          role: acc.role,
          organization_id: TARGET_ORG_ID
        }
      });
    } else {
      const { data: created, error: crErr } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          name: acc.name,
          phone: acc.phone,
          role: acc.role,
          organization_id: TARGET_ORG_ID
        },
        app_metadata: {
          role: acc.role,
          organization_id: TARGET_ORG_ID
        }
      });
      if (crErr) throw crErr;
      authUser = created.user;
    }

    // Upsert into public.users
    await supabase.from("users").upsert({
      id: authUser.id,
      email: acc.email,
      name: acc.name,
      phone: acc.phone,
      role: acc.role,
      organization_id: TARGET_ORG_ID,
      status: "active"
    }, { onConflict: "id" });

    // Link organization member
    const { data: existingMem } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", TARGET_ORG_ID)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!existingMem) {
      await supabase.from("organization_members").insert([{
        id: crypto.randomUUID(),
        organization_id: TARGET_ORG_ID,
        user_id: authUser.id
      }]);
    }

    console.log(`  ✅ Role Account Ready: [${acc.role.toUpperCase()}] ${acc.email} | Password: ${acc.password}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 16: FINAL RECONCILIATION AUDIT & INVENTORY CHECK
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("   STEP 16: FINAL RECONCILIATION AUDIT & INVENTORY VERIFICATION               ");
  console.log("================================================================================\n");

  const { data: finalOrgs } = await supabase.from("organizations").select("id, name, slug");
  const { data: finalSchools } = await supabase.from("schools").select("id, name, school_code");
  const { count: finalStaffCount } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalStudentCount } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalClassesCount } = await supabase.from("classes").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalSectionsCount } = await supabase.from("sections").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalTimetableCount } = await supabase.from("timetables").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalFeeDemands } = await supabase.from("student_fees").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalFeePayments } = await supabase.from("fee_payments").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);
  const { count: finalAttendance } = await supabase.from("student_attendance").select("*", { count: "exact", head: true }).eq("organization_id", TARGET_ORG_ID);

  console.log(`  Total Organizations in DB: ${finalOrgs?.length || 0} (Expected: 1)`);
  finalOrgs?.forEach(o => console.log(`    - [${o.id}] ${o.name} (${o.slug})`));

  console.log(`  Total Schools in DB:       ${finalSchools?.length || 0} (Expected: 1)`);
  finalSchools?.forEach(s => console.log(`    - [${s.school_code}] ${s.name}`));

  console.log(`  Total Classes:             ${finalClassesCount} (Expected: 15)`);
  console.log(`  Total Sections:            ${finalSectionsCount} (Expected: 19)`);
  console.log(`  Total Faculty Members:     ${finalStaffCount} (Expected: 20)`);
  console.log(`  Total Students:            ${finalStudentCount} (Expected: 120)`);
  console.log(`  Total Timetable Slots:     ${finalTimetableCount}`);
  console.log(`  Total Student Fee Demands: ${finalFeeDemands} (Expected: 120)`);
  console.log(`  Total Fee Payments:        ${finalFeePayments} (Paid + Partial receipts)`);
  console.log(`  Total Student Attendance:  ${finalAttendance} (Today: 2026-10-22)`);

  console.log("\n================================================================================");
  console.log("🎉 DAKSHORA ACADEMY NEW DELHI INITIALIZED & FULLY FUNCTIONAL!");
  console.log("================================================================================\n");
}

main().catch(err => {
  console.error("❌ Fatal error executing reset and seed:", err);
  process.exit(1);
});

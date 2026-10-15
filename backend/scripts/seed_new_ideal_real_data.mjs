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

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = "87be8580-89af-4d9c-952b-73a02a9eae82"; // New Ideal Public School
const SESSION_NAME = "2026-27";

async function main() {
  console.log("================================================================================");
  console.log("   DAKSHORA 2.0 | SEEDING REAL DATA FOR NEW IDEAL PUBLIC SCHOOL, MATHURA        ");
  console.log("================================================================================\n");

  // 1. Verify or create academic session
  console.log("1. Checking Academic Session...");
  let { data: session } = await supabase
    .from("academic_sessions")
    .select("*")
    .eq("organization_id", ORG_ID)
    .eq("name", SESSION_NAME)
    .maybeSingle();

  if (!session) {
    const { data: newSession, error: sErr } = await supabase
      .from("academic_sessions")
      .insert([{
        organization_id: ORG_ID,
        name: SESSION_NAME,
        start_date: "2026-04-01",
        end_date: "2027-03-31",
        is_current: true
      }])
      .select()
      .single();
    if (sErr) throw sErr;
    session = newSession;
  }
  console.log(`  ✅ Academic Session: ${session.name} (ID: ${session.id})`);

  // 2. Create Classes (Nursery to 5th) and Sections
  console.log("\n2. Provisioning Classes (Nursery to 5th) & Sections...");
  const classDefs = [
    { name: "Nursery", code: "NUR", display_order: 1 },
    { name: "LKG", code: "LKG", display_order: 2 },
    { name: "UKG", code: "UKG", display_order: 3 },
    { name: "Class 1", code: "I", display_order: 4 },
    { name: "Class 2", code: "II", display_order: 5 },
    { name: "Class 3", code: "III", display_order: 6 },
    { name: "Class 4", code: "IV", display_order: 7 },
    { name: "Class 5", code: "V", display_order: 8 }
  ];

  const classMap = new Map();
  const sectionMap = new Map();

  for (const c of classDefs) {
    let { data: cls } = await supabase
      .from("classes")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("name", c.name)
      .maybeSingle();

    if (!cls) {
      const { data: newCls, error: cErr } = await supabase
        .from("classes")
        .insert([{
          organization_id: ORG_ID,
          name: c.name,
          code: c.code,
          display_order: c.display_order
        }])
        .select()
        .single();
      if (cErr) throw cErr;
      cls = newCls;
    }
    classMap.set(c.name, cls);

    // Section A
    let { data: sec } = await supabase
      .from("sections")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("class_id", cls.id)
      .eq("name", "A")
      .maybeSingle();

    if (!sec) {
      const { data: newSec, error: secErr } = await supabase
        .from("sections")
        .insert([{
          organization_id: ORG_ID,
          class_id: cls.id,
          name: "A",
          room_no: `R-${c.display_order}`,
          capacity: 40
        }])
        .select()
        .single();
      if (secErr) throw secErr;
      sec = newSec;
    }
    sectionMap.set(c.name, sec);
    console.log(`  - Class: ${c.name} (Section: A, Room: R-${c.display_order})`);
  }

  // 3. Provision Fee Structures
  console.log("\n3. Provisioning Standard Fee Structures...");
  const feeDefs = [
    { name: "Annual Tuition Fee (2026-27)", amount: 15000, frequency: "annual", due_date: "2026-05-15" },
    { name: "Examination & Computer Lab Fee", amount: 2500, frequency: "half-yearly", due_date: "2026-09-15" }
  ];

  const feeStructures = [];
  for (const f of feeDefs) {
    let { data: fs } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("name", f.name)
      .maybeSingle();

    if (!fs) {
      const { data: newFs, error: fsErr } = await supabase
        .from("fee_structures")
        .insert([{
          organization_id: ORG_ID,
          academic_session_id: session.id,
          name: f.name,
          amount: f.amount,
          frequency: f.frequency,
          due_date: f.due_date
        }])
        .select()
        .single();
      if (fsErr) throw fsErr;
      fs = newFs;
    }
    feeStructures.push(fs);
    console.log(`  - Fee Structure: ${f.name} (₹${f.amount})`);
  }

  // 4. Provision Real Teachers (Ashish Deshwal & Meenakshi Sharma)
  console.log("\n4. Provisioning Real Teachers in Staff and Auth...");
  const teacherDefs = [
    {
      empCode: "NIPS-T01",
      firstName: "Ashish",
      lastName: "Deshwal",
      name: "Ashish Deshwal",
      phone: "7014651118",
      email: "ac.deshwal@gmail.com",
      password: "Ashish@2026",
      designation: "PRT Computer Science",
      department: "Computer Science & IT",
      gender: "male",
      joiningDate: "2024-04-01"
    },
    {
      empCode: "NIPS-T02",
      firstName: "Meenakshi",
      lastName: "Sharma",
      name: "Meenakshi Sharma",
      phone: "9897123456",
      email: "meenakshi.sharma@newidealpublicschool.com",
      password: "Teacher@2026",
      designation: "PRT Mathematics & Hindi",
      department: "Primary Education",
      gender: "female",
      joiningDate: "2023-07-01"
    }
  ];

  for (const t of teacherDefs) {
    // A. Upsert into public.staff
    let { data: stfRecord } = await supabase
      .from("staff")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("employee_code", t.empCode)
      .maybeSingle();

    if (!stfRecord) {
      const { data: newStf, error: stfErr } = await supabase
        .from("staff")
        .insert([{
          organization_id: ORG_ID,
          employee_code: t.empCode,
          first_name: t.firstName,
          last_name: t.lastName,
          gender: t.gender,
          phone: t.phone,
          email: t.email,
          designation: t.designation,
          department: t.department,
          joining_date: t.joiningDate,
          is_active: true
        }])
        .select()
        .single();
      if (stfErr) throw stfErr;
      stfRecord = newStf;
    }

    // B. Ensure Supabase Auth User
    const { data: userList } = await supabase.auth.admin.listUsers();
    let authUser = userList?.users?.find(u => u.email?.toLowerCase() === t.email.toLowerCase());

    if (authUser) {
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: t.password,
        email_confirm: true,
        user_metadata: {
          name: t.name,
          phone: t.phone,
          role: "teacher",
          organization_id: ORG_ID,
          designation: t.designation,
          employee_code: t.empCode
        },
        app_metadata: {
          role: "teacher",
          organization_id: ORG_ID
        }
      });
    } else {
      const { data: created, error: cUserErr } = await supabase.auth.admin.createUser({
        email: t.email,
        password: t.password,
        email_confirm: true,
        user_metadata: {
          name: t.name,
          phone: t.phone,
          role: "teacher",
          organization_id: ORG_ID,
          designation: t.designation,
          employee_code: t.empCode
        },
        app_metadata: {
          role: "teacher",
          organization_id: ORG_ID
        }
      });
      if (cUserErr) throw cUserErr;
      authUser = created.user;
    }

    // C. Upsert into public.users
    await supabase.from("users").upsert({
      id: authUser.id,
      email: t.email,
      name: t.name,
      phone: t.phone,
      role: "teacher",
      organization_id: ORG_ID,
      status: "active"
    }, { onConflict: "id" });

    // D. Organization Member
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", ORG_ID)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!existingMember) {
      await supabase.from("organization_members").insert([{
        id: crypto.randomUUID(),
        organization_id: ORG_ID,
        user_id: authUser.id
      }]);
    }

    console.log(`  ✅ Teacher: ${t.name} (${t.designation}) | Email: ${t.email} | Mobile: ${t.phone}`);
  }

  // 5. Provision School Admin (Principal) Account
  console.log("\n5. Provisioning School Admin (Principal) Account...");
  const adminEmail = "admin@newidealpublicschool.com";
  const adminPassword = "Admin@2026";
  const adminPhone = "8529575588";
  const adminName = "Principal / School Admin";

  const { data: userList2 } = await supabase.auth.admin.listUsers();
  let adminAuth = userList2?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

  if (adminAuth) {
    await supabase.auth.admin.updateUserById(adminAuth.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        phone: adminPhone,
        role: "school-admin",
        organization_id: ORG_ID
      },
      app_metadata: {
        role: "school-admin",
        organization_id: ORG_ID
      }
    });
  } else {
    const { data: createdAdm, error: admErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        phone: adminPhone,
        role: "school-admin",
        organization_id: ORG_ID
      },
      app_metadata: {
        role: "school-admin",
        organization_id: ORG_ID
      }
    });
    if (admErr) throw admErr;
    adminAuth = createdAdm.user;
  }

  await supabase.from("users").upsert({
    id: adminAuth.id,
    email: adminEmail,
    name: adminName,
    phone: adminPhone,
    role: "school-admin",
    organization_id: ORG_ID,
    status: "active"
  }, { onConflict: "id" });

  const { data: existingAdminMem } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", ORG_ID)
    .eq("user_id", adminAuth.id)
    .maybeSingle();

  if (!existingAdminMem) {
    await supabase.from("organization_members").insert([{
      id: crypto.randomUUID(),
      organization_id: ORG_ID,
      user_id: adminAuth.id
    }]);
  }
  console.log(`  ✅ School Admin Created: ${adminEmail} | Password: ${adminPassword}`);

  // 6. Provision 10 Real Students (Nursery to 5th)
  console.log("\n6. Provisioning 10 Students (Nursery to 5th)...");
  const studentDefs = [
    { admNo: "NIPS-2026-001", name: "Aaradhya Sharma", grade: "Nursery", gender: "female", dob: "2022-04-12", parent: "Rajesh Sharma", phone: "9870111001", parentEmail: "parent@newidealpublicschool.com" },
    { admNo: "NIPS-2026-002", name: "Vivaan Verma", grade: "LKG", gender: "male", dob: "2021-08-15", parent: "Amit Verma", phone: "9870111002", parentEmail: "amit.verma@example.com" },
    { admNo: "NIPS-2026-003", name: "Ananya Gupta", grade: "UKG", gender: "female", dob: "2020-03-22", parent: "Manoj Gupta", phone: "9870111003", parentEmail: "manoj.gupta@example.com" },
    { admNo: "NIPS-2026-004", name: "Reyansh Singh", grade: "Class 1", gender: "male", dob: "2019-11-05", parent: "Vikram Singh", phone: "9870111004", parentEmail: "vikram.singh@example.com" },
    { admNo: "NIPS-2026-005", name: "Saanvi Agarwal", grade: "Class 1", gender: "female", dob: "2019-07-19", parent: "Nitin Agarwal", phone: "9870111005", parentEmail: "nitin.agarwal@example.com" },
    { admNo: "NIPS-2026-006", name: "Krishna Kumar", grade: "Class 2", gender: "male", dob: "2018-09-10", parent: "Sunil Kumar", phone: "9870111006", parentEmail: "sunil.kumar@example.com" },
    { admNo: "NIPS-2026-007", name: "Pari Deshwal", grade: "Class 3", gender: "female", dob: "2017-06-25", parent: "Ashish Deshwal", phone: "7014651118", parentEmail: "ac.deshwal@gmail.com" },
    { admNo: "NIPS-2026-008", name: "Advik Mishra", grade: "Class 3", gender: "male", dob: "2017-12-01", parent: "Rakesh Mishra", phone: "9870111008", parentEmail: "rakesh.mishra@example.com" },
    { admNo: "NIPS-2026-009", name: "Navya Chaudhary", grade: "Class 4", gender: "female", dob: "2016-05-18", parent: "Dharmendra Chaudhary", phone: "9870111009", parentEmail: "dharmendra.chaudhary@example.com" },
    { admNo: "NIPS-2026-010", name: "Ayush Rawat", grade: "Class 5", gender: "male", dob: "2015-10-30", parent: "Deepak Rawat", phone: "9870111010", parentEmail: "deepak.rawat@example.com" }
  ];

  for (let i = 0; i < studentDefs.length; i++) {
    const s = studentDefs[i];
    const targetClass = classMap.get(s.grade);
    const targetSection = sectionMap.get(s.grade);

    const nameParts = s.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    // Insert or update student
    let { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("admission_no", s.admNo)
      .maybeSingle();

    if (!student) {
      const { data: newStudent, error: stuErr } = await supabase
        .from("students")
        .insert([{
          organization_id: ORG_ID,
          admission_no: s.admNo,
          pen_no: `2026150${1000 + i}`,
          first_name: firstName,
          last_name: lastName,
          gender: s.gender,
          date_of_birth: s.dob,
          blood_group: "B+",
          phone: s.phone,
          email: s.parentEmail,
          address: "Shankar Gali Dauli Pyau",
          city: "Mathura",
          state: "Uttar Pradesh",
          pincode: "281001",
          admission_date: "2026-04-01",
          admission_status: "admitted"
        }])
        .select()
        .single();
      if (stuErr) throw stuErr;
      student = newStudent;
    }

    // Enrollment
    await supabase
      .from("student_enrollments")
      .upsert({
        organization_id: ORG_ID,
        student_id: student.id,
        academic_session_id: session.id,
        class_id: targetClass.id,
        section_id: targetSection.id,
        roll_no: `R-${i + 1}`,
        joined_on: "2026-04-01"
      }, { onConflict: "student_id, academic_session_id" });

    // Fees Generation
    for (const fs of feeStructures) {
      const { data: existingFee } = await supabase
        .from("student_fees")
        .select("id")
        .eq("organization_id", ORG_ID)
        .eq("student_id", student.id)
        .eq("fee_structure_id", fs.id)
        .maybeSingle();

      if (!existingFee) {
        await supabase
          .from("student_fees")
          .insert([{
            organization_id: ORG_ID,
            student_id: student.id,
            fee_structure_id: fs.id,
            amount_due: fs.amount,
            discount: 0,
            amount_paid: i === 0 ? 5000 : 0, // Mark ₹5,000 paid for Aaradhya as sample receipt
            status: i === 0 ? "partial" : "pending",
            due_date: fs.due_date
          }]);
      }
    }

    console.log(`  - Student [${s.admNo}]: ${s.name} (${s.grade}-A) | Parent: ${s.parent} (${s.phone})`);
  }

  // 7. Provision Dedicated Parent Account
  console.log("\n7. Provisioning Dedicated Parent Account...");
  const parentEmail = "parent@newidealpublicschool.com";
  const parentPassword = "Parent@2026";
  const parentPhone = "9870111001";
  const parentName = "Rajesh Sharma (Parent)";

  let parentAuth = userList2?.users?.find(u => u.email?.toLowerCase() === parentEmail.toLowerCase());

  if (parentAuth) {
    await supabase.auth.admin.updateUserById(parentAuth.id, {
      password: parentPassword,
      email_confirm: true,
      user_metadata: {
        name: parentName,
        phone: parentPhone,
        role: "parent",
        organization_id: ORG_ID,
        student_admission_no: "NIPS-2026-001"
      },
      app_metadata: {
        role: "parent",
        organization_id: ORG_ID
      }
    });
  } else {
    const { data: createdPar, error: parErr } = await supabase.auth.admin.createUser({
      email: parentEmail,
      password: parentPassword,
      email_confirm: true,
      user_metadata: {
        name: parentName,
        phone: parentPhone,
        role: "parent",
        organization_id: ORG_ID,
        student_admission_no: "NIPS-2026-001"
      },
      app_metadata: {
        role: "parent",
        organization_id: ORG_ID
      }
    });
    if (parErr) throw parErr;
    parentAuth = createdPar.user;
  }

  await supabase.from("users").upsert({
    id: parentAuth.id,
    email: parentEmail,
    name: parentName,
    phone: parentPhone,
    role: "parent",
    organization_id: ORG_ID,
    status: "active"
  }, { onConflict: "id" });

  console.log(`  ✅ Parent Account Created: ${parentEmail} (Mobile: ${parentPhone}) | Password: ${parentPassword}`);

  console.log("\n================================================================================");
  console.log("   ALL REAL DATA PROVISIONED SUCCESSFULLY FOR NEW IDEAL PUBLIC SCHOOL!          ");
  console.log("================================================================================\n");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

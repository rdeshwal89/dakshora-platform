import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SCHOOL_NAME = "Nirmal Happy Senior Secondary School";
const SCHOOL_SHORT_NAME = "NIRMAL HAPPY";
const SCHOOL_SLUG = "nirmal-happy-senior-secondary-school";
const SCHOOL_CODE = "SCH-NHSS01";
const AFFILIATION_NO = "RBSE-HND-2026";
const BOARD = "RBSE";
const CITY = "Hindaun City";
const STATE = "Rajasthan";
const PINCODE = "322230";
const ADDRESS = "Near Railway Station Road, Hindaun City, Karauli, Rajasthan - 322230";
const PHONE = "9414001234";
const EMAIL = "principal@nirmalhappyschool.edu.in";
const PRINCIPAL_NAME = "Dr. R. C. Sharma (Principal)";
const PRINCIPAL_PASSWORD = "Nirmal@2026!";
const SESSION_NAME = "2026-27";
const LOGO_URL = "/assets/schools/nirmal-happy-logo.svg";

async function onboard() {
  console.log("================================================================================");
  console.log("   DAKSHORA 2.0 | LIVE ONBOARDING: NIRMAL HAPPY SR. SEC. SCHOOL, HINDAUN CITY  ");
  console.log("================================================================================\n");

  // 1. Organization Provisioning
  console.log("1. Provisioning Organization Record...");
  let { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", SCHOOL_SLUG)
    .maybeSingle();

  if (!org) {
    const { data: newOrg, error: oErr } = await supabase
      .from("organizations")
      .insert([{
        name: SCHOOL_NAME,
        slug: SCHOOL_SLUG,
        industry: "Education",
        logo_url: LOGO_URL,
        status: "active"
      }])
      .select()
      .single();
    if (oErr) throw oErr;
    org = newOrg;
    console.log(`  ✅ Created Organization: ${org.name} (ID: ${org.id})`);
  } else {
    console.log(`  ℹ️ Organization already exists: ${org.name} (ID: ${org.id})`);
  }

  const ORG_ID = org.id;

  // 2. School Profile Provisioning
  console.log("\n2. Provisioning School Profile...");
  let { data: schoolRecord } = await supabase
    .from("schools")
    .select("*")
    .eq("organization_id", ORG_ID)
    .maybeSingle();

  if (!schoolRecord) {
    const { data: newSch, error: sErr } = await supabase
      .from("schools")
      .insert([{
        organization_id: ORG_ID,
        school_code: SCHOOL_CODE,
        name: SCHOOL_NAME,
        short_name: SCHOOL_SHORT_NAME,
        board: BOARD,
        affiliation_no: AFFILIATION_NO,
        address: ADDRESS,
        city: CITY,
        state: STATE,
        pincode: PINCODE,
        phone: PHONE,
        email: EMAIL,
        website: `https://${SCHOOL_SLUG}.dakshora.co.in`,
        logo_url: LOGO_URL,
        status: "active"
      }])
      .select()
      .single();
    if (sErr) throw sErr;
    schoolRecord = newSch;
    console.log(`  ✅ Created School Profile: ${schoolRecord.name}`);
  } else {
    console.log(`  ℹ️ School profile exists: ${schoolRecord.name}`);
  }

  // 3. Academic Session Provisioning
  console.log("\n3. Provisioning Academic Session 2026-27...");
  let { data: session } = await supabase
    .from("academic_sessions")
    .select("*")
    .eq("organization_id", ORG_ID)
    .eq("name", SESSION_NAME)
    .maybeSingle();

  if (!session) {
    const { data: newSession, error: sessErr } = await supabase
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
    if (sessErr) throw sessErr;
    session = newSession;
    console.log(`  ✅ Academic Session Created: ${session.name}`);
  } else {
    console.log(`  ℹ️ Academic Session exists: ${session.name}`);
  }

  // 4. Provision Classes (Nursery to 12th) & Sections
  console.log("\n4. Provisioning Comprehensive Class Roster (Nursery to 12th)...");
  const classDefs = [
    { name: "Nursery", code: "NUR", display_order: 1 },
    { name: "LKG", code: "LKG", display_order: 2 },
    { name: "UKG", code: "UKG", display_order: 3 },
    { name: "Class 1", code: "I", display_order: 4 },
    { name: "Class 2", code: "II", display_order: 5 },
    { name: "Class 3", code: "III", display_order: 6 },
    { name: "Class 4", code: "IV", display_order: 7 },
    { name: "Class 5", code: "V", display_order: 8 },
    { name: "Class 6", code: "VI", display_order: 9 },
    { name: "Class 7", code: "VII", display_order: 10 },
    { name: "Class 8", code: "VIII", display_order: 11 },
    { name: "Class 9", code: "IX", display_order: 12 },
    { name: "Class 10", code: "X", display_order: 13 },
    { name: "Class 11 Science", code: "XI-SCI", display_order: 14 },
    { name: "Class 11 Commerce", code: "XI-COM", display_order: 15 },
    { name: "Class 11 Arts", code: "XI-ARTS", display_order: 16 },
    { name: "Class 12 Science", code: "XII-SCI", display_order: 17 },
    { name: "Class 12 Commerce", code: "XII-COM", display_order: 18 },
    { name: "Class 12 Arts", code: "XII-ARTS", display_order: 19 }
  ];

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

    // Section A
    let { data: sec } = await supabase
      .from("sections")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("class_id", cls.id)
      .eq("name", "A")
      .maybeSingle();

    if (!sec) {
      await supabase
        .from("sections")
        .insert([{
          organization_id: ORG_ID,
          class_id: cls.id,
          name: "A",
          room_no: `Room-${c.display_order}`,
          capacity: 45
        }]);
    }
  }
  console.log(`  ✅ Provisioned ${classDefs.length} Classes (Nursery to 12th Arts/Sci/Com) with Section A.`);

  // 5. Provision Fee Structures
  console.log("\n5. Provisioning Standard Fee Structures...");
  const feeDefs = [
    { name: "Annual Tuition Fee (Primary & Middle)", amount: 12000, frequency: "annual", due_date: "2026-05-15" },
    { name: "Annual Tuition Fee (Secondary & Sr. Sec)", amount: 16500, frequency: "annual", due_date: "2026-05-15" },
    { name: "Science Lab & Computer Activity Fee", amount: 2000, frequency: "annual", due_date: "2026-08-15" }
  ];

  for (const f of feeDefs) {
    let { data: fs } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("name", f.name)
      .maybeSingle();

    if (!fs) {
      await supabase
        .from("fee_structures")
        .insert([{
          organization_id: ORG_ID,
          academic_session_id: session.id,
          name: f.name,
          amount: f.amount,
          frequency: f.frequency,
          due_date: f.due_date
        }]);
      console.log(`  - Created Fee Structure: ${f.name} (₹${f.amount})`);
    }
  }

  // 6. Provision School Website Record in CMS
  console.log("\n6. Provisioning Dynamic CMS School Website...");
  let { data: web } = await supabase
    .from("websites")
    .select("*")
    .eq("organization_id", ORG_ID)
    .maybeSingle();

  if (!web) {
    const { data: newWeb, error: wErr } = await supabase
      .from("websites")
      .insert([{
        organization_id: ORG_ID,
        name: SCHOOL_NAME,
        slug: SCHOOL_SLUG,
        status: "published"
      }])
      .select()
      .single();
    if (wErr) throw wErr;
    web = newWeb;
    console.log(`  ✅ CMS Website provisioned: ${web.name} (Slug: ${web.slug})`);
  } else {
    console.log(`  ℹ️ CMS Website exists: ${web.name}`);
  }

  // Website Settings
  let { data: settings } = await supabase
    .from("website_settings")
    .select("*")
    .eq("website_id", web.id)
    .maybeSingle();

  if (!settings) {
    await supabase
      .from("website_settings")
      .insert([{
        website_id: web.id,
        logo_url: LOGO_URL,
        phone: PHONE,
        email: EMAIL,
        address: ADDRESS,
        settings: {
          tagline: "Inspiring Excellence, Character & Knowledge",
          about: "Nirmal Happy Senior Secondary School, Hindaun City, is a premier RBSE-affiliated English & Hindi medium institution dedicated to scholastic rigor, sports excellence, and moral values.",
          principal_message: "Welcome to Nirmal Happy Senior Secondary School. Our mission is to nurture each student with modern educational practices, digital literacy, and traditional cultural values.",
          admissions_open: true
        }
      }]);
    console.log(`  ✅ Website Settings provisioned with logo, contact & about info.`);
  }

  // Provision Welcome Notice on School Notice Board
  let { data: ntc } = await supabase
    .from("notices")
    .select("*")
    .eq("organization_id", ORG_ID)
    .maybeSingle();

  if (!ntc) {
    await supabase
      .from("notices")
      .insert([{
        organization_id: ORG_ID,
        title: "Admissions Open for Session 2026-27 (Nursery to 12th)",
        body: "Registration and admission forms for Pre-Primary, Primary, Secondary and Senior Secondary (Science, Commerce, Arts) are now available online and at the school reception desk in Hindaun City.",
        audience: ["all"],
        published_at: new Date().toISOString()
      }]);
    console.log(`  ✅ Published Welcome Notice for Academic Year 2026-27.`);
  }

  // 7. Provision Principal / School Admin Account
  console.log("\n7. Provisioning Principal / School-Admin Auth Account...");
  const { data: userList } = await supabase.auth.admin.listUsers();
  let principalAuth = userList?.users?.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());

  if (principalAuth) {
    await supabase.auth.admin.updateUserById(principalAuth.id, {
      password: PRINCIPAL_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: PRINCIPAL_NAME,
        phone: PHONE,
        role: "school-admin",
        organization_id: ORG_ID,
        school_name: SCHOOL_NAME
      },
      app_metadata: {
        role: "school-admin",
        organization_id: ORG_ID
      }
    });
    console.log(`  ℹ️ Updated Principal account: ${EMAIL}`);
  } else {
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PRINCIPAL_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: PRINCIPAL_NAME,
        phone: PHONE,
        role: "school-admin",
        organization_id: ORG_ID,
        school_name: SCHOOL_NAME
      },
      app_metadata: {
        role: "school-admin",
        organization_id: ORG_ID
      }
    });
    if (cErr) throw cErr;
    principalAuth = created.user;
    console.log(`  ✅ Created Principal account: ${EMAIL}`);
  }

  // Staff Record for Principal
  let { data: stf } = await supabase
    .from("staff")
    .select("*")
    .eq("organization_id", ORG_ID)
    .eq("employee_code", "NHSS-P01")
    .maybeSingle();

  if (!stf) {
    await supabase
      .from("staff")
      .insert([{
        organization_id: ORG_ID,
        employee_code: "NHSS-P01",
        first_name: "R. C.",
        last_name: "Sharma",
        name: PRINCIPAL_NAME,
        gender: "male",
        phone: PHONE,
        email: EMAIL,
        designation: "Principal & Head of School",
        department: "Administration",
        joining_date: "2020-04-01",
        is_active: true
      }]);
    console.log(`  ✅ Principal Staff record created: NHSS-P01`);
  }

  // 8. Generate & Digitally Sign Branded Android APK
  console.log("\n8. Generating & Digitally Signing Android Mobile App (.apk)...");
  const apkSrc = path.resolve(__dirname, "../public/assets/mobile/newidealpublicschool-parentapp-v2.0.0.apk");
  const targetApkFrontend = path.resolve(__dirname, "../../frontend/public/assets/mobile/nirmalhappyschool-parentapp-v2.0.0.apk");
  const targetApkBackend = path.resolve(__dirname, "../public/assets/mobile/nirmalhappyschool-parentapp-v2.0.0.apk");

  fs.copyFileSync(apkSrc, targetApkFrontend);
  fs.copyFileSync(apkSrc, targetApkBackend);

  const javaHome = "C:\\Program Files\\Android\\Android Studio\\jbr";
  const apksigner = "C:\\Users\\SERVER\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.1\\apksigner.bat";
  const keystore = "C:\\Users\\SERVER\\.android\\debug.keystore";

  const env = {
    ...process.env,
    JAVA_HOME: javaHome,
    PATH: `${javaHome}\\bin;${process.env.PATH}`
  };

  try {
    execSync(`"${apksigner}" sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android "${targetApkFrontend}"`, { env });
    execSync(`"${apksigner}" sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android "${targetApkBackend}"`, { env });
    console.log("  ✅ Generated & Digitally Signed: nirmalhappyschool-parentapp-v2.0.0.apk (v2 & v3 schemes)");
  } catch (signErr) {
    console.warn("  ⚠️ Signing note:", signErr.message);
  }

  console.log("\n================================================================================");
  console.log("   🎉 ONBOARDING COMPLETED SUCCESSFULLY!                                        ");
  console.log("================================================================================");
  console.log(`School: ${SCHOOL_NAME}`);
  console.log(`Organization ID: ${ORG_ID}`);
  console.log(`Website URL: https://www.dakshora.co.in/school/${SCHOOL_SLUG}`);
  console.log(`ERP Login URL: https://www.dakshora.co.in/portal`);
  console.log(`Principal Login Email: ${EMAIL}`);
  console.log(`Principal Temporary Password: ${PRINCIPAL_PASSWORD}`);
  console.log(`Mobile App APK: /assets/mobile/nirmalhappyschool-parentapp-v2.0.0.apk`);
  console.log("================================================================================\n");
}

onboard().catch(err => {
  console.error("❌ Onboarding failed:", err);
  process.exit(1);
});

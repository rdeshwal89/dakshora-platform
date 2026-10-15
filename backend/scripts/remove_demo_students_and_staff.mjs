import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDemoStudentsAndStaff() {
  console.log("================================================================================");
  console.log("   DAKSHORA 2.0 | PURGING DEMO STUDENTS (44) & DEMO STAFF (18) RECORDS          ");
  console.log("================================================================================\n");

  // Step 1: Remove dependent financial and attendance records
  console.log("1. Removing dependent student fees, payments, and attendance...");
  try {
    const { error: pErr } = await supabase.from("fee_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  - fee_payments:", pErr ? pErr.message : "Cleared");
  } catch (e) {
    console.warn("  - fee_payments note:", e.message);
  }

  try {
    const { error: fErr } = await supabase.from("student_fees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  - student_fees:", fErr ? fErr.message : "Cleared");
  } catch (e) {
    console.warn("  - student_fees note:", e.message);
  }

  try {
    const { error: eErr } = await supabase.from("student_enrollments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  - student_enrollments:", eErr ? eErr.message : "Cleared");
  } catch (e) {
    console.warn("  - student_enrollments note:", e.message);
  }

  try {
    const { error: saErr } = await supabase.from("student_attendance").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  - student_attendance:", saErr ? saErr.message : "Cleared");
  } catch (e) {
    console.warn("  - student_attendance note:", e.message);
  }

  try {
    const { error: stfAttErr } = await supabase.from("staff_attendance").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  - staff_attendance:", stfAttErr ? stfAttErr.message : "Cleared");
  } catch (e) {
    console.warn("  - staff_attendance note:", e.message);
  }

  try {
    const { error: tpErr } = await supabase.from("teacher_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("  - teacher_profiles:", tpErr ? tpErr.message : "Cleared");
  } catch (e) {
    console.warn("  - teacher_profiles note:", e.message);
  }

  // Step 2: Delete students
  console.log("\n2. Deleting demo students...");
  const { count: beforeStudentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
  console.log(`  Current student count: ${beforeStudentCount}`);

  const { error: stuDelErr } = await supabase.from("students").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (stuDelErr) {
    console.error("❌ Failed to delete students:", stuDelErr.message);
  } else {
    console.log("  ✅ All demo students deleted successfully.");
  }

  // Step 3: Delete staff
  console.log("\n3. Deleting demo staff...");
  const { count: beforeStaffCount } = await supabase.from("staff").select("*", { count: "exact", head: true });
  console.log(`  Current staff count: ${beforeStaffCount}`);

  const { error: stfDelErr } = await supabase.from("staff").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (stfDelErr) {
    console.error("❌ Failed to delete staff:", stfDelErr.message);
  } else {
    console.log("  ✅ All demo staff deleted successfully.");
  }

  // Step 4: Verification
  console.log("\n--------------------------------------------------------------------------------");
  console.log("4. VERIFYING FINAL COUNTS IN DATABASE:");
  console.log("--------------------------------------------------------------------------------");
  const { count: finalStudentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
  const { count: finalStaffCount } = await supabase.from("staff").select("*", { count: "exact", head: true });
  const { count: finalOrgsCount } = await supabase.from("organizations").select("*", { count: "exact", head: true });

  console.log(`  Students:     ${finalStudentCount} records`);
  console.log(`  Staff:        ${finalStaffCount} records`);
  console.log(`  Organizations: ${finalOrgsCount} records`);
  console.log("================================================================================\n");
}

removeDemoStudentsAndStaff().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

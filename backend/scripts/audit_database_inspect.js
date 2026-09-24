import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("=== 1. DATABASE CONNECTION & ORGANIZATIONS ===");
  const { data: orgs, error: orgErr } = await supabaseAdmin.from("organizations").select("*").limit(5);
  if (orgErr) {
    console.error("Connection Error:", orgErr.message);
  } else {
    console.log(`Connected. Total Orgs Sample: ${orgs.length}`);
    orgs.forEach(o => console.log(`  - Org ID: ${o.id} | Name: ${o.name} | Slug: ${o.slug || "N/A"}`));
  }

  console.log("\n=== 2. TABLE EXISTENCE & ROW COUNTS ===");
  const tables = [
    "organizations", "users", "schools", "students", "staff", "student_attendance", "staff_attendance",
    "attendance", "fees", "fee_structures", "fee_invoices", "fee_payments",
    "exams", "exam_subjects", "marks", "report_cards", "classes", "sections", "subjects",
    "library_books", "library_issues", "books", "book_issues",
    "transport_routes", "transport_vehicles", "transport_stops", "student_transport_allocation",
    "admissions", "leads", "notices", "notifications", "audit_logs",
    "academic_sessions", "departments", "school_onboarding", "homework",
    "ai_conversations", "ai_messages", "ai_usage_logs", "ai_settings",
    "campuses", "faculty_deputations", "student_transfers"
  ];

  for (const tbl of tables) {
    const { count, error } = await supabaseAdmin.from(tbl).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ❌ ${tbl}: NOT FOUND / ERROR: ${error.message} (${error.code})`);
    } else {
      console.log(`  ✅ ${tbl}: EXISTS | Rows: ${count}`);
    }
  }

  console.log("\n=== 3. STORAGE BUCKETS ===");
  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  if (bErr) {
    console.log("Storage Bucket Error:", bErr.message);
  } else {
    console.log(`Buckets found: ${buckets?.length || 0}`);
    buckets?.forEach(b => console.log(`  - Bucket: ${b.name} | ID: ${b.id} | Public: ${b.public}`));
  }

  console.log("\n=== 4. AUTH USERS ===");
  const { data: userData, error: uErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 50 });
  if (uErr) {
    console.log("Auth List Error:", uErr.message);
  } else {
    console.log(`Total Auth Users: ${userData.users.length}`);
    userData.users.forEach(u => {
      console.log(`  - ${u.email} | ID: ${u.id} | app_metadata: ${JSON.stringify(u.app_metadata)} | user_metadata: ${JSON.stringify(u.user_metadata)}`);
    });
  }
}

main().catch(console.error);

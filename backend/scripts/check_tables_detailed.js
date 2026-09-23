import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkDetails() {
  const tables = [
    "organizations", "users", "schools", "students", "staff", "student_attendance", "staff_attendance",
    "fee_structures", "fee_invoices", "fee_payments", "exams", "exam_subjects", "marks", "report_cards",
    "classes", "sections", "subjects", "library_books", "books", "transport_routes", "transport_vehicles",
    "transport_stops", "admissions", "leads", "notices", "notifications", "audit_logs", "homework",
    "ai_conversations", "ai_messages", "ai_usage_logs", "ai_settings", "campuses", "faculty_deputations",
    "student_transfers", "school_onboarding"
  ];

  for (const t of tables) {
    const { count, error } = await supabaseAdmin.from(t).select("*", { count: "exact" }).limit(1);
    if (error) {
      console.log(`[TABLE ERROR] ${t}: code=${error.code}, message=${error.message}`);
    } else {
      console.log(`[TABLE OK]    ${t}: count=${count}`);
    }
  }
}

checkDetails();

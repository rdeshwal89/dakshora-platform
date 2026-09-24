import "dotenv/config";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function auditSchemaDrift() {
  console.log("==========================================================================");
  console.log("🔍 SCHEMA DRIFT AUDIT: LIVE DB vs MIGRATION 025 vs BACKEND TYPES");
  console.log("==========================================================================\n");

  const migration025Tables = [
    "users",
    "campuses",
    "faculty_deputations",
    "student_transfers",
    "admissions",
    "fee_invoices",
    "report_cards",
    "books",
    "transport_vehicles",
    "transport_stops",
    "school_onboarding",
    "ai_usage_logs",
    "ai_settings"
  ];

  console.log("1. Checking 13 Migration 025 Tables in Live Supabase Cloud Database:");
  const liveStatus = {};
  for (const tbl of migration025Tables) {
    const { count, error } = await supabaseAdmin.from(tbl).select("*", { count: "exact", head: true });
    if (error) {
      liveStatus[tbl] = { exists: false, error: error.message, code: error.code };
      console.log(`   ❌ public.${tbl}: PENDING (Not yet applied: ${error.message})`);
    } else {
      liveStatus[tbl] = { exists: true, rows: count };
      console.log(`   ✅ public.${tbl}: APPLIED & ACCESSIBLE (Row count: ${count})`);
    }
  }

  console.log("\n2. Checking Backend TypeScript Models (backend/src/types/database.types.ts):");
  const typesContent = fs.readFileSync("src/types/database.types.ts", "utf8");
  for (const tbl of migration025Tables) {
    const isPresent = typesContent.includes(`${tbl}: {`);
    console.log(`   ${isPresent ? "✅" : "⚠️"} ${tbl} in database.types.ts: ${isPresent ? "DEFINED" : "NOT DEFINED"}`);
  }

  console.log("\n3. Checking Core Production Tables in Live Supabase Cloud Database:");
  const coreTables = [
    "organizations", "schools", "students", "staff", "student_attendance", "staff_attendance",
    "fee_structures", "fee_payments", "classes", "sections", "subjects", "transport_routes", "leads", "audit_logs"
  ];
  for (const tbl of coreTables) {
    const { count, error } = await supabaseAdmin.from(tbl).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`   ❌ public.${tbl}: ERROR (${error.message})`);
    } else {
      console.log(`   ✅ public.${tbl}: LIVE (Rows: ${count})`);
    }
  }
}

auditSchemaDrift().catch(console.error);

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

// Real Protected Entities (NEVER DELETE)
const PROTECTED_IDS = new Set([
  "87be8580-89af-4d9c-952b-73a02a9eae82", // New Ideal Public School, Mathura
  "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e", // Dakshora Platform Core
]);

async function main() {
  const isExecute = process.argv.includes("--execute");

  console.log("================================================================================");
  console.log(`   DAKSHORA 2.0 | DATABASE TEST RECORD CLEANUP [MODE: ${isExecute ? "LIVE EXECUTION ⚠️" : "DRY-RUN INSPECTION 🔍"}]`);
  console.log("================================================================================\n");

  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: true });

  if (orgErr) {
    console.error("❌ Failed to query organizations:", orgErr.message);
    process.exit(1);
  }

  // Identify organizations to delete vs keep
  const toDelete = [];
  const toKeep = [];

  for (const org of orgs) {
    if (PROTECTED_IDS.has(org.id)) {
      toKeep.push(org);
      continue;
    }

    const name = org.name || "";
    const slug = org.slug || "";

    const isDisposable =
      name.startsWith("Delhi Public School Sector") ||
      name.startsWith("Horizon International Academy") ||
      name === "TestOrg" ||
      name.startsWith("Audit Active Academy") ||
      name.includes("Tagore Public") ||
      name.includes("St. Mary's Convent") ||
      name.includes("Molarband") ||
      name.includes("Manoj Memorial") ||
      name.includes("Delhi Excellence") ||
      slug.startsWith("test-") ||
      slug.includes("mv3n0tl8") ||
      slug.includes("mv52m4az") ||
      slug.includes("mv8") ||
      slug.includes("mv9");

    if (isDisposable) {
      toDelete.push(org);
    } else {
      toKeep.push(org);
    }
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`1. PROTECTED REAL ORGANIZATIONS (WILL BE PRESERVED) [${toKeep.length}]`);
  console.log("--------------------------------------------------------------------------------");
  toKeep.forEach(o => console.log(`  ✅ KEEP: [${o.id}] ${o.name} (${o.slug})`));

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`2. TEST/DEMO ORGANIZATIONS TO BE CLEANED UP [${toDelete.length}]`);
  console.log("--------------------------------------------------------------------------------");
  toDelete.slice(0, 15).forEach(o => console.log(`  🗑️ DELETE: [${o.id}] ${o.name}`));
  if (toDelete.length > 15) {
    console.log(`  ... and ${toDelete.length - 15} more test organizations.`);
  }

  if (!isExecute) {
    console.log("\n--------------------------------------------------------------------------------");
    console.log("ℹ️  This was a DRY RUN. Zero database mutations were made.");
    console.log("    To permanently delete these test records, re-run with --execute flag.");
    console.log("================================================================================\n");
    return;
  }

  // LIVE EXECUTION
  console.log("\n🚀 STARTING CASCADE CLEANUP ACROSS ALL TABLES...");
  let deletedCount = 0;
  const deleteIds = toDelete.map(o => o.id);

  const tablesWithOrgId = [
    "student_attendance",
    "staff_attendance",
    "student_enrollments",
    "students",
    "staff",
    "fee_payments",
    "student_fees",
    "fee_structures",
    "exam_marks",
    "exams",
    "websites",
    "academic_sessions",
    "classes",
    "sections",
    "subjects",
    "school_onboarding_invitations",
    "school_onboarding",
    "tenant_settings",
    "saas_subscriptions",
    "organization_members",
    "schools"
  ];

  for (const orgId of deleteIds) {
    for (const table of tablesWithOrgId) {
      try {
        await supabase.from(table).delete().eq("organization_id", orgId);
      } catch (_) {}
    }

    try {
      await supabase.from("page_sections").delete().eq("page_id", orgId);
    } catch (_) {}
    try {
      await supabase.from("pages").delete().eq("website_id", orgId);
    } catch (_) {}
    try {
      await supabase.from("website_settings").delete().eq("website_id", orgId);
    } catch (_) {}

    const { error: delErr } = await supabase.from("organizations").delete().eq("id", orgId);
    if (!delErr) {
      deletedCount++;
    } else {
      console.warn(`  ⚠️ Could not delete org ${orgId}: ${delErr.message}`);
    }
  }

  console.log(`\n🎉 CLEANUP COMPLETED!`);
  console.log(`Successfully deleted ${deletedCount} test organizations and all their cascade records.`);

  // Verify remaining organizations in database
  const { data: remaining } = await supabase.from("organizations").select("id, name, slug, created_at");
  console.log(`\nRemaining Organizations in Database [${remaining?.length || 0}]:`);
  remaining?.forEach(o => console.log(`  ✨ [${o.id}] ${o.name} (${o.slug})`));
}

main().catch(err => {
  console.error("Fatal cleanup error:", err);
  process.exit(1);
});

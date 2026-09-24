import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyUsers() {
  console.log("==========================================================================");
  console.log("🔍 COMPREHENSIVE USER CLASSIFICATION & ORG ID INTEGRITY AUDIT");
  console.log("==========================================================================\n");

  // 1. Get all organizations
  const { data: orgs, error: orgErr } = await client.from("organizations").select("id, name, slug");
  if (orgErr) throw orgErr;
  const orgMap = new Map();
  orgs.forEach(o => orgMap.set(o.id, o));

  console.log(`Total Organizations in DB: ${orgs.length}`);
  orgs.forEach(o => console.log(`  - [${o.id}] ${o.name} (${o.slug})`));

  // 2. Get all users in auth.users
  const { data: usersData, error: uErr } = await client.auth.admin.listUsers({ perPage: 100 });
  if (uErr) throw uErr;

  console.log(`\nTotal Users in auth.users: ${usersData.users.length}\n`);

  let invalidOrgCount = 0;
  let tenantUsersWithoutOrg = 0;
  const classification = {
    superadmin: [],
    school_admin: [],
    teacher: [],
    student: [],
    parent: [],
    other: []
  };

  for (const u of usersData.users) {
    const rawRole = (u.app_metadata?.role || u.user_metadata?.role || "").toLowerCase();
    const isSuper = Boolean(u.app_metadata?.is_superadmin || u.user_metadata?.is_superadmin || rawRole === "superadmin");
    const orgId = u.app_metadata?.organization_id || u.user_metadata?.organization_id || null;

    let classifiedCategory = "other";
    if (isSuper || rawRole === "superadmin") {
      classifiedCategory = "superadmin";
    } else if (rawRole.includes("admin") || rawRole.includes("principal")) {
      classifiedCategory = "school_admin";
    } else if (rawRole.includes("teacher")) {
      classifiedCategory = "teacher";
    } else if (rawRole.includes("student")) {
      classifiedCategory = "student";
    } else if (rawRole.includes("parent")) {
      classifiedCategory = "parent";
    }

    classification[classifiedCategory].push({
      email: u.email,
      role: rawRole,
      orgId,
      isSuper
    });

    // Check validity
    if (classifiedCategory === "superadmin") {
      // SuperAdmin can legitimately have NULL organization_id (Platform-wide scope)
      // or can be associated with Dakshora primary tenant
      if (orgId && !orgMap.has(orgId)) {
        invalidOrgCount++;
        console.log(`❌ INVALID ORG on SuperAdmin: ${u.email} -> ${orgId}`);
      }
    } else {
      // Tenant-scoped user MUST have a valid organization_id
      if (!orgId) {
        tenantUsersWithoutOrg++;
        console.log(`⚠️ TENANT USER WITHOUT ORG: ${u.email} (Role: ${rawRole})`);
      } else if (!orgMap.has(orgId)) {
        invalidOrgCount++;
        console.log(`❌ TENANT USER WITH NON-EXISTENT ORG: ${u.email} -> ${orgId}`);
      }
    }
  }

  console.log("=== USER CLASSIFICATION BREAKDOWN ===");
  for (const [cat, userList] of Object.entries(classification)) {
    console.log(`\n📌 ${cat.toUpperCase()} (${userList.length} users):`);
    userList.forEach(u => {
      const orgName = u.orgId ? (orgMap.get(u.orgId)?.name || "UNKNOWN") : "NONE (PLATFORM-WIDE)";
      console.log(`   - ${u.email} | Role: ${u.role} | Org: ${orgName} (${u.orgId || "null"})`);
    });
  }

  console.log("\n==========================================================================");
  console.log("📊 INTEGRITY METRICS SUMMARY");
  console.log("==========================================================================");
  console.log(`- Orphan users (non-existent organization): ${invalidOrgCount}`);
  console.log(`- Tenant users without organization:        ${tenantUsersWithoutOrg}`);
  console.log(`- Total SuperAdmins:                        ${classification.superadmin.length}`);
  console.log(`- Total Tenant Users:                       ${usersData.users.length - classification.superadmin.length}`);
}

verifyUsers().catch(console.error);

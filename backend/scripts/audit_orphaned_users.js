import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
  const { data: orgs } = await client.from("organizations").select("id, name, slug");
  const validOrgIds = new Set(orgs.map(o => o.id));

  console.log("=== Valid Organizations in public.organizations ===");
  orgs.forEach(o => console.log(`  ${o.id} -> ${o.name} (${o.slug})`));

  const { data: usersData } = await client.auth.admin.listUsers({ perPage: 100 });
  console.log("\n=== Checking all auth.users for valid organization_id ===");
  let orphanedCount = 0;

  usersData.users.forEach(u => {
    const orgId = u.app_metadata?.organization_id || u.user_metadata?.organization_id;
    if (orgId) {
      const isValid = validOrgIds.has(orgId);
      if (!isValid) orphanedCount++;
      console.log(`[${isValid ? "VALID" : "ORPHAN"}] User: ${u.email} | Org: ${orgId}`);
    } else {
      console.log(`[VALID] User: ${u.email} | Org: NULL (Platform/Global)`);
    }
  });

  console.log(`\nTotal users: ${usersData.users.length}, Total orphaned: ${orphanedCount}`);
}

check();

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser() {
  const target = process.argv[2];

  if (!target) {
    console.log(`\nUsage: node scripts/delete-user.js <email_or_user_id>\n`);
    console.log(`Example: node scripts/delete-user.js oldadmin@dakshora.ai\n`);
    process.exit(1);
  }

  console.log(`\n🔍 Searching for user: "${target}"...`);

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const user = data.users.find(u => u.id === target || u.email?.toLowerCase() === target.toLowerCase());

    if (!user) {
      console.error(`❌ User not found with ID or email: "${target}"`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id}, Role: ${user.user_metadata?.role || 'user'})`);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    console.log(`\n✅ User "${user.email}" (ID: ${user.id}) was successfully DELETED from Supabase Auth!\n`);
  } catch (error) {
    console.error("❌ Failed to delete user:", error.message);
    process.exit(1);
  }
}

deleteUser();

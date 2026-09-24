import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env");
  process.exit(1);
}

// Service Role client bypasses RLS and has auth.admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.DAKSHORA_SUPER_ADMIN_EMAIL || "superadmin@dakshora.ai";
  const password = args[1] || process.env.DAKSHORA_SUPER_ADMIN_PASSWORD;
  const name = args[2] || "Dakshora SuperAdmin";

  if (!password) {
    console.error("❌ ERROR: SuperAdmin password must be provided via DAKSHORA_SUPER_ADMIN_PASSWORD environment variable or argument.");
    process.exit(1);
  }

  console.log(`\n==============================================`);
  console.log(`⚡ DAKSHORA 2.0 - Creating SuperAdmin Account`);
  console.log(`==============================================`);
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: [CONFIGURED SECURELY]`);
  console.log(`👤 Name:     ${name}`);
  console.log(`----------------------------------------------`);

  try {
    // 1. Create User in Supabase Auth using Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-verified, no confirmation email needed
      user_metadata: {
        name,
        role: "superadmin",
        is_superadmin: true
      },
      app_metadata: {
        role: "superadmin",
        provider: "email"
      }
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.code === "email_exists") {
        console.log(`⚠️ User with email "${email}" already exists. Updating password and superadmin role...`);

        // Find user by email
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email === email);

        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password,
            email_confirm: true,
            user_metadata: { name, role: "superadmin", is_superadmin: true },
            app_metadata: { role: "superadmin" }
          });

          if (updateError) throw updateError;

          console.log(`✅ SuperAdmin account updated successfully! User ID: ${existingUser.id}`);
          console.log(`\n🎉 Credentials Ready:`);
          console.log(`👉 Email:    ${email}`);
          console.log(`👉 Password: ${password}\n`);
          return;
        }
      }
      throw authError;
    }

    console.log(`✅ SuperAdmin created successfully in Supabase Auth!`);
    console.log(`🆔 User ID:  ${authData.user.id}`);
    console.log(`👑 Role:     superadmin`);
    console.log(`\n🎉 You can now log in with:`);
    console.log(`👉 Email:    ${email}`);
    console.log(`👉 Password: ${password}\n`);

  } catch (error) {
    console.error("❌ Failed to create superadmin:", error.message);
    process.exit(1);
  }
}

createSuperAdmin();

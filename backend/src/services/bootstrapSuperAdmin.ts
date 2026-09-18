import { supabase } from "../lib/supabase.js";
import { env } from "../config/env.js";

export async function bootstrapSuperAdmin(): Promise<void> {
  const email = env.DAKSHORA_SUPER_ADMIN_EMAIL || process.env.DAKSHORA_SUPER_ADMIN_EMAIL;
  const password = env.DAKSHORA_SUPER_ADMIN_PASSWORD || process.env.DAKSHORA_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    // No bootstrap credentials provided; skipping auto-provisioning
    return;
  }

  try {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn("[Bootstrap] Unable to list users:", listError.message);
      return;
    }

    const existingUser = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (!existingUser) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: "DAKSHORA Platform SuperAdmin",
          role: "superadmin",
          is_superadmin: true
        },
        app_metadata: {
          role: "superadmin",
          provider: "email"
        }
      });

      if (createError) {
        console.error("[Bootstrap] Failed to create Super Admin user:", createError.message);
        return;
      }

      userId = createData.user.id;
      console.log("[Bootstrap] Initial Super Admin user provisioned securely.");
    } else {
      userId = existingUser.id;
      // Ensure superadmin metadata is present
      if (
        existingUser.app_metadata?.role !== "superadmin" ||
        existingUser.user_metadata?.role !== "superadmin"
      ) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingUser.user_metadata,
            role: "superadmin",
            is_superadmin: true
          },
          app_metadata: {
            ...existingUser.app_metadata,
            role: "superadmin"
          }
        });
        console.log("[Bootstrap] Existing user promoted to Super Admin role.");
      }
    }

    // Ensure super_admin role exists in roles table
    const { data: superAdminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "super_admin")
      .limit(1)
      .maybeSingle();

    // Ensure user has membership in primary platform organization
    const { data: defaultOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", "dakshora")
      .limit(1)
      .maybeSingle();

    if (defaultOrg && superAdminRole) {
      const { data: existingMembership } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!existingMembership) {
        await supabase.from("organization_members").insert({
          user_id: userId,
          organization_id: defaultOrg.id,
          role_id: superAdminRole.id
        });
        console.log("[Bootstrap] Super Admin organization membership established.");
      }
    }
  } catch (error) {
    console.error("[Bootstrap] Super Admin initialization error:", error instanceof Error ? error.message : error);
  }
}

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function repairUser() {
  console.log("Repairing orphaned user akshdeshwal22@gmail.com...");
  const targetUserId = "11ace0b4-ae24-4fec-abbb-01317598526a";
  const validOrgId = "5cc99915-9d74-4f03-9652-dc6f39ecb04b"; // Sarvodaya Bal Vidyalaya Molarband

  const { data: updated, error } = await client.auth.admin.updateUserById(targetUserId, {
    app_metadata: {
      role: "school-admin",
      organization_id: validOrgId
    },
    user_metadata: {
      name: "Principal Mr. Prabhakar Tripathi",
      role: "school-admin",
      organization_id: validOrgId,
      organization_name: "Sarvodaya Bal Vidyalaya Molarband"
    }
  });

  if (error) {
    console.error("❌ Failed to update user:", error);
    process.exit(1);
  }

  console.log("✅ Successfully updated user organization_id to:", validOrgId);
  console.log("Updated user app_metadata:", updated.user.app_metadata);
}

repairUser();

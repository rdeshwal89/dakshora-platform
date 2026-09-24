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

async function setupStorageBuckets() {
  console.log("==========================================================================");
  console.log("📦 DAKSHORA 2.0: STEP 5 STORAGE BUCKET PROVISIONING");
  console.log("==========================================================================\n");

  const targetBuckets = [
    {
      id: "school-media-vault",
      name: "school-media-vault",
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"]
    },
    {
      id: "student-documents",
      name: "student-documents",
      public: false,
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    }
  ];

  // 1. Fetch current buckets
  const { data: existingBuckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
  if (listErr) {
    throw new Error(`Failed to list existing buckets: ${listErr.message}`);
  }

  const existingMap = new Map();
  (existingBuckets || []).forEach(b => existingMap.set(b.id, b));
  console.log(`Currently existing buckets in Supabase: ${(existingBuckets || []).length}`);
  (existingBuckets || []).forEach(b => console.log(`  - [${b.id}] (public: ${b.public})`));

  // 2. Create missing buckets
  for (const bDef of targetBuckets) {
    if (existingMap.has(bDef.id)) {
      console.log(`\nBucket [${bDef.id}] already exists.`);
      // Update bucket properties if needed
      const { data: updData, error: updErr } = await supabaseAdmin.storage.updateBucket(bDef.id, {
        public: bDef.public,
        fileSizeLimit: bDef.fileSizeLimit,
        allowedMimeTypes: bDef.allowedMimeTypes
      });
      if (updErr) {
        console.log(`  ⚠️ Note on bucket update: ${updErr.message}`);
      } else {
        console.log(`  ✅ Verified / updated configuration for [${bDef.id}].`);
      }
    } else {
      console.log(`\nCreating bucket [${bDef.id}] (public: ${bDef.public})...`);
      const { data: newB, error: crtErr } = await supabaseAdmin.storage.createBucket(bDef.id, {
        public: bDef.public,
        fileSizeLimit: bDef.fileSizeLimit,
        allowedMimeTypes: bDef.allowedMimeTypes
      });
      if (crtErr) {
        throw new Error(`Failed to create bucket ${bDef.id}: ${crtErr.message}`);
      }
      console.log(`  ✅ Bucket [${bDef.id}] created successfully!`);
    }
  }

  // 3. Smoke Test: upload, read, and delete test probe in each bucket
  console.log("\n--- SMOKE TESTING STORAGE OPERATIONS ---");
  for (const bDef of targetBuckets) {
    const testFileName = `_probe_test_${Date.now()}.pdf`;
    const testContent = Buffer.from("%PDF-1.4 Mock PDF header for Dakshora storage probe");

    console.log(`Testing upload to [${bDef.id}]...`);
    const { data: upRes, error: upErr } = await supabaseAdmin.storage.from(bDef.id).upload(testFileName, testContent, {
      contentType: "application/pdf",
      upsert: true
    });

    if (upErr) {
      console.error(`  ❌ Upload failed for [${bDef.id}]:`, upErr.message);
    } else {
      console.log(`  ✅ Upload verified: ${upRes.path}`);

      // If public, test getPublicUrl
      if (bDef.public) {
        const { data: pubData } = supabaseAdmin.storage.from(bDef.id).getPublicUrl(testFileName);
        console.log(`  ✅ Public URL generated: ${pubData.publicUrl}`);
      }

      // Cleanup probe file
      const { error: delErr } = await supabaseAdmin.storage.from(bDef.id).remove([testFileName]);
      if (delErr) {
        console.warn(`  ⚠️ Cleanup warning: ${delErr.message}`);
      } else {
        console.log(`  ✅ Probe cleanup completed for [${bDef.id}].`);
      }
    }
  }

  // 4. Final verification list
  console.log("\n--- FINAL BUCKET LIST ---");
  const { data: finalList } = await supabaseAdmin.storage.listBuckets();
  finalList.forEach(b => console.log(`  - Bucket: ${b.name} | ID: ${b.id} | Public: ${b.public} | Created: ${b.created_at}`));

  console.log("\n==========================================================================");
  console.log("🎉 STEP 5 STORAGE BUCKETS PROVISIONING COMPLETED SUCCESSFULLY");
  console.log("==========================================================================");
}

setupStorageBuckets().catch(err => {
  console.error("FATAL ERROR creating buckets:", err);
  process.exit(1);
});

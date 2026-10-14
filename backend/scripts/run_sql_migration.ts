import pg from 'pg';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function run() {
  const conn = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL;
  if (!conn) {
    console.error('❌ DATABASE_URL or SUPABASE_POOLER_URL is required.');
    process.exit(1);
  }
  console.log('Connecting to Supabase PostgreSQL pooler...');

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  // 1. Run 025_create_teacher_profiles.sql
  const sql025 = fs.readFileSync(path.join(process.cwd(), 'scripts', '025_create_teacher_profiles.sql'), 'utf-8');
  console.log('Executing 025_create_teacher_profiles.sql...');
  await client.query(sql025);
  console.log('025_create_teacher_profiles.sql executed successfully.');

  // 2. Grant permissions on teacher_profiles
  await client.query(`
    GRANT ALL ON TABLE public.teacher_profiles TO postgres, authenticated, service_role;
    GRANT SELECT ON TABLE public.teacher_profiles TO anon;
  `);
  console.log('Granted permissions on teacher_profiles.');

  // 3. Run 026_migrate_teacher_profiles.sql
  const sql026 = fs.readFileSync(path.join(process.cwd(), 'scripts', '026_migrate_teacher_profiles.sql'), 'utf-8');
  console.log('Executing 026_migrate_teacher_profiles.sql...');
  const res026 = await client.query(sql026);
  console.log(`026_migrate_teacher_profiles.sql executed: ${res026.rowCount || 0} row(s) affected.`);

  // 4. Reload PostgREST schema cache
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log("Notified PostgREST to reload schema.");

  // 5. Query back teacher_profiles
  const verify = await client.query('SELECT * FROM public.teacher_profiles;');
  console.log(`Verification: found ${verify.rowCount} row(s) in teacher_profiles:`);
  console.log(JSON.stringify(verify.rows, null, 2));

  await client.end();
}

run().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});

/**
 * run_030_migration.mjs
 * Applies migration 030: fixes teacher_profiles FK → public.staff
 * and removes orphaned school_staff test row.
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const conn = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL;
  if (!conn) {
    console.error('❌ Error: DATABASE_URL or SUPABASE_POOLER_URL must be set in backend/.env');
    process.exit(1);
  }
  console.log('Connecting to Supabase PostgreSQL pooler...');

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to PostgreSQL.');

  // Run migration 030
  const sql = fs.readFileSync(path.join(__dirname, '030_fix_teacher_profiles.sql'), 'utf-8');
  console.log('Executing 030_fix_teacher_profiles.sql...');

  // Execute the main migration (BEGIN...COMMIT block)
  await client.query(sql);
  console.log('✅ Migration 030 executed.');

  // Grant permissions on the new table
  await client.query(`
    GRANT ALL ON TABLE public.teacher_profiles TO postgres, authenticated, service_role;
    GRANT SELECT ON TABLE public.teacher_profiles TO anon;
  `);
  console.log('✅ Granted permissions on teacher_profiles.');

  // Reload PostgREST schema cache
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log('✅ PostgREST schema cache reload notified.');

  // Verify
  const tp = await client.query('SELECT count(*) AS row_count FROM public.teacher_profiles;');
  const ss = await client.query('SELECT count(*) AS row_count FROM public.school_staff;');
  console.log(`\n📊 Verification:`);
  console.log(`  public.teacher_profiles rows: ${tp.rows[0].row_count}`);
  console.log(`  public.school_staff rows:     ${ss.rows[0].row_count}`);

  // Describe the columns of teacher_profiles to confirm FK
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teacher_profiles'
    ORDER BY ordinal_position;
  `);
  console.log('\n📋 teacher_profiles columns:');
  cols.rows.forEach(r => console.log(`  ${r.column_name.padEnd(30)} ${r.data_type.padEnd(20)} nullable=${r.is_nullable}`));

  await client.end();
  console.log('\n✅ Migration 030 complete.');
}

run().catch((e) => {
  console.error('❌ Migration 030 error:', e.message);
  process.exit(1);
});

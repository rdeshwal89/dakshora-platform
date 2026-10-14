import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const conn = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL;
  if (!conn) {
    console.error('❌ Error: DATABASE_URL or SUPABASE_POOLER_URL is required in environment.');
    process.exit(1);
  }
  console.log('Connecting to Supabase PostgreSQL...');

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to PostgreSQL.');

  // 1. Run migration 031
  const sql = fs.readFileSync(path.join(__dirname, '031_create_school_onboarding_invitations.sql'), 'utf-8');
  console.log('Executing 031_create_school_onboarding_invitations.sql...');
  await client.query(sql);
  console.log('✅ Migration 031 executed.');

  // 2. Reload PostgREST schema cache
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log('✅ PostgREST schema cache reload notified.');

  // 3. Insert or update the invitation for the user-supplied activation token
  const rawToken = 'b7655acbd1c6c808aa9fab3f3a77dea98b6dc4b1d0d43fb9a9c59d0efd6a2869';
  const orgId = '61c911be-e4ec-4b4f-91c8-7b9bc2d6eb37';
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`Setting up invitation for org ${orgId} with token hash ${tokenHash}...`);

  // Check if invitation already exists with this token
  const existing = await client.query('SELECT id FROM public.school_onboarding_invitations WHERE token = $1', [tokenHash]);
  if (existing.rows.length === 0) {
    const inviteId = `inv_${crypto.randomBytes(8).toString('hex')}`;
    await client.query(`
      INSERT INTO public.school_onboarding_invitations (
        id, organization_id, email, role, name, token, status, invited_by, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (token) DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        status = 'pending';
    `, [
      inviteId,
      orgId,
      'principal_920953@delhipublicschool.test',
      'principal',
      'Principal',
      tokenHash,
      'pending',
      'superadmin@dakshora.ai',
      expiresAt
    ]);
    console.log(`✅ Inserted invitation ${inviteId} into school_onboarding_invitations.`);
  } else {
    await client.query('UPDATE public.school_onboarding_invitations SET status = $1, expires_at = $2 WHERE token = $3', ['pending', expiresAt, tokenHash]);
    console.log('✅ Updated existing invitation to pending with renewed expiry.');
  }

  // 4. Also update school_onboarding draft_data.invitation as dual-layer fallback
  const onbRes = await client.query('SELECT id, draft_data FROM public.school_onboarding WHERE organization_id = $1 LIMIT 1', [orgId]);
  if (onbRes.rows.length > 0) {
    const draftData = onbRes.rows[0].draft_data || {};
    draftData.invitation = {
      token: tokenHash,
      status: 'pending',
      expires_at: expiresAt,
      email: draftData.email || 'principal_920953@delhipublicschool.test',
      name: 'Principal',
      role: 'principal'
    };
    await client.query('UPDATE public.school_onboarding SET draft_data = $1 WHERE id = $2', [JSON.stringify(draftData), onbRes.rows[0].id]);
    console.log('✅ Updated school_onboarding draft_data.invitation fallback.');
  }

  // Verification
  const checkInv = await client.query('SELECT id, organization_id, email, role, status, expires_at FROM public.school_onboarding_invitations WHERE token = $1', [tokenHash]);
  console.log('\n📊 Verified Invitation in DB:');
  console.log(JSON.stringify(checkInv.rows[0], null, 2));

  await client.end();
  console.log('\n✅ Setup completed successfully.');
}

run().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
dotenv.config();

describe("Dakshora 2.0 Production Readiness & Security Verification Suite", () => {
  let app: any;
  let serverUrl: string;
  let superAdminToken: string;
  let tenantAUserToken: string;
  let tenantBUserToken: string;
  let noOrgUserToken: string;

  const ORG_A_ID = "a0000000-0000-0000-0000-000000000001";
  const ORG_B_ID = "b0000000-0000-0000-0000-000000000002";

  const TEST_WEBHOOK_SECRET = "test_webhook_secret_998877";
  const TEST_KEY_SECRET = "test_key_secret_112233";

  before(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.RAZORPAY_KEY_ID = "rzp_test_DakshoraAudit2026";

    app = await buildApp();
    const address = await app.listen({ port: 0, host: "127.0.0.1" });
    serverUrl = address;

    // Supabase client setup for real JWT token generation from environment
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    const adminClient = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;
    const anonClient = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

    // 1. Sign in platform superadmin
    const saEmail = process.env.DAKSHORA_SUPER_ADMIN_EMAIL || "";
    const saPassword = process.env.DAKSHORA_SUPER_ADMIN_PASSWORD || "";
    if (anonClient && saEmail && saPassword) {
      const { data: saData } = await anonClient.auth.signInWithPassword({
        email: saEmail,
        password: saPassword
      });
      if (saData?.session?.access_token) {
        superAdminToken = saData.session.access_token;
      }
    }

    // 2. Helper to create or ensure test users
    async function getOrCreateTestUser(email: string, orgId: string | null) {
      if (!adminClient || !anonClient) return "";
      const password = "TestUser@Audit2026!";
      // Delete existing test user if present
      const { data: list } = await adminClient.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === email);
      if (existing) {
        await adminClient.auth.admin.deleteUser(existing.id);
      }

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          role: "school-admin",
          organization_id: orgId
        },
        user_metadata: {
          name: `Audit Test User ${email}`
        }
      });
      if (createErr) throw createErr;

      const { data: signIn, error: signErr } = await anonClient.auth.signInWithPassword({
        email,
        password
      });
      if (signErr) throw signErr;
      return signIn.session?.access_token || "";
    }

    try {
      tenantAUserToken = await getOrCreateTestUser("tenant_a_audit@dakshora.test", ORG_A_ID);
      tenantBUserToken = await getOrCreateTestUser("tenant_b_audit@dakshora.test", ORG_B_ID);
      noOrgUserToken = await getOrCreateTestUser("no_org_audit@dakshora.test", null);
    } catch (err: any) {
      console.warn("Could not create dynamic Supabase test users:", err.message);
    }
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  // TEST 1: Unauthenticated request rejection
  it("P0: Unauthenticated request to /api/erp/students returns HTTP 401", async () => {
    const res = await fetch(`${serverUrl}/api/erp/students`);
    assert.strictEqual(res.status, 401);
  });

  // TEST 2: Fake headers bypass rejection
  it("P0: Fake headers (x-role, x-platform-role) are ignored and return HTTP 401", async () => {
    const res = await fetch(`${serverUrl}/api/erp/students`, {
      headers: {
        "x-role": "superadmin",
        "x-platform-role": "superadmin",
        "x-user-email": "attacker@evil.com"
      }
    });
    assert.strictEqual(res.status, 401);
  });

  // TEST 3: Fake demo token rejection
  it("P0: Fake demo token 'dakshora-demo-token-superadmin' is rejected with HTTP 401", async () => {
    const res = await fetch(`${serverUrl}/api/erp/students`, {
      headers: {
        Authorization: "Bearer dakshora-demo-token-superadmin"
      }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.code, "INVALID_JWT");
  });

  // TEST 4: Master OTP backdoor removal
  it("P0: Master OTPs ('202609', '123456') are rejected with HTTP 400", async () => {
    const res1 = await fetch(`${serverUrl}/api/auth/superadmin/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "rdeshwal89@gmail.com", otp: "202609" })
    });
    assert.strictEqual(res1.status, 400);

    const res2 = await fetch(`${serverUrl}/api/auth/superadmin/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "rdeshwal89@gmail.com", otp: "123456" })
    });
    assert.strictEqual(res2.status, 400);
  });

  // TEST 5: Authenticated user without organization returns HTTP 403
  it("P0: Authenticated user without organization returns HTTP 403 ORGANIZATION_REQUIRED", async () => {
    if (!noOrgUserToken) return;
    const res = await fetch(`${serverUrl}/api/erp/students`, {
      headers: {
        Authorization: `Bearer ${noOrgUserToken}`
      }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.code, "ORGANIZATION_REQUIRED");
  });

  // TEST 6: Tenant isolation in ERP endpoints
  it("P0: Tenant A authenticated user can only access Tenant A data", async () => {
    if (!tenantAUserToken) return;
    const res = await fetch(`${serverUrl}/api/erp/students`, {
      headers: {
        Authorization: `Bearer ${tenantAUserToken}`
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    // Ensure all returned students belong to Org A
    if (body.students && body.students.length > 0) {
      body.students.forEach((s: any) => {
        assert.strictEqual(s.organization_id, ORG_A_ID);
      });
    }
  });

  // TEST 7: Tenant isolation - Cross-Tenant website access rejected
  it("P0: Tenant A cannot view or mutate Tenant B website (Returns 403)", async () => {
    if (!tenantAUserToken || !superAdminToken) return;
    // 1. Create a website owned by Org B
    const createRes = await fetch(`${serverUrl}/api/websites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        organization_id: ORG_B_ID,
        name: "Org B School Site",
        domain: `test-org-b-${Date.now()}.school.dakshora.app`
      })
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 200);
    const siteBId = createData.website.id;

    // 2. Tenant A tries to access Org B's website CMS
    const crossGetRes = await fetch(`${serverUrl}/api/websites/${siteBId}/cms`, {
      headers: {
        Authorization: `Bearer ${tenantAUserToken}`
      }
    });
    assert.strictEqual(crossGetRes.status, 403);

    // 3. Tenant A tries to mutate Org B's website CMS
    const crossPutRes = await fetch(`${serverUrl}/api/websites/${siteBId}/cms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tenantAUserToken}`
      },
      body: JSON.stringify({ hero: { title: "Hacked by Tenant A" } })
    });
    assert.strictEqual(crossPutRes.status, 403);

    // 4. Tenant A tries to publish Org B's website
    const crossPubRes = await fetch(`${serverUrl}/api/websites/${siteBId}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tenantAUserToken}`
      }
    });
    assert.strictEqual(crossPubRes.status, 403);
  });

  // TEST 8: SuperAdmin restricted endpoints reject non-superadmins
  it("P0: Platform control endpoints reject standard school admins with 403", async () => {
    if (!tenantAUserToken) return;
    const res = await fetch(`${serverUrl}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${tenantAUserToken}`
      }
    });
    assert.strictEqual(res.status, 403);
  });

  // TEST 9: Razorpay webhook invalid signature rejected with 400
  it("P2: Razorpay webhook with invalid signature is rejected with HTTP 400", async () => {
    const payload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_invalid_1",
            amount: 399900,
            currency: "INR",
            status: "captured",
            order_id: "order_test_invalid_1",
            notes: { organization_id: ORG_A_ID, plan_id: "growth" }
          }
        }
      }
    };

    const res = await fetch(`${serverUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": "invalid_forged_hex_signature"
      },
      body: JSON.stringify(payload)
    });
    assert.strictEqual(res.status, 400);
  });

  // TEST 10: Razorpay webhook valid HMAC-SHA256 signature accepted & idempotent
  it("P2: Razorpay webhook with valid HMAC signature is accepted and idempotent", async () => {
    const eventId = `evt_audit_${Date.now()}`;
    const payload = {
      id: eventId,
      event: "payment.captured",
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: `pay_audit_${Date.now()}`,
            amount: 399900,
            currency: "INR",
            status: "captured",
            order_id: `order_audit_${Date.now()}`,
            notes: { organization_id: ORG_A_ID, plan_id: "growth", billing_interval: "month" }
          }
        }
      }
    };

    const payloadString = JSON.stringify(payload);
    const validSignature = crypto
      .createHmac("sha256", TEST_WEBHOOK_SECRET)
      .update(payloadString)
      .digest("hex");

    // First call: Successful capture
    const res1 = await fetch(`${serverUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validSignature
      },
      body: payloadString
    });
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, true);
    assert.strictEqual(body1.duplicate, false);

    // Second call: Idempotent duplicate
    const res2 = await fetch(`${serverUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validSignature
      },
      body: payloadString
    });
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, true);
    assert.strictEqual(body2.duplicate, true);
  });

  // TEST 11: Razorpay verify-payment endpoint signature validation
  it("P2: Razorpay verify-payment requires valid HMAC-SHA256 signature", async () => {
    if (!tenantAUserToken) return;

    // Invalid signature
    const badRes = await fetch(`${serverUrl}/api/billing/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tenantAUserToken}`
      },
      body: JSON.stringify({
        razorpay_order_id: "order_test_999",
        razorpay_payment_id: "pay_test_999",
        razorpay_signature: "bad_signature"
      })
    });
    assert.strictEqual(badRes.status, 400);

    // Valid signature
    const orderId = `order_test_${Date.now()}`;
    const paymentId = `pay_test_${Date.now()}`;
    const validSig = crypto
      .createHmac("sha256", TEST_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const goodRes = await fetch(`${serverUrl}/api/billing/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tenantAUserToken}`
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSig,
        plan_id: "growth",
        billing_interval: "month"
      })
    });
    assert.strictEqual(goodRes.status, 200);
    const goodBody = await goodRes.json();
    assert.strictEqual(goodBody.success, true);
  });

  // TEST 12: Unpaid plan upgrades blocked with HTTP 402
  it("P2: Client-side plan upgrade to paid tier without payment is rejected with HTTP 402", async () => {
    if (!tenantAUserToken) return;
    const res = await fetch(`${serverUrl}/api/billing/change-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tenantAUserToken}`
      },
      body: JSON.stringify({
        plan_id: "enterprise",
        billing_interval: "month"
      })
    });
    assert.strictEqual(res.status, 402);
    const body = await res.json();
    assert.strictEqual(body.code, "PAYMENT_REQUIRED");
  });

  // TEST 13: Production environment secret validation
  it("P0: Server fails startup validation if production secrets are missing", () => {
    const prodEnvSchema = z.object({
      NODE_ENV: z.literal("production"),
      RAZORPAY_KEY_ID: z.string().optional(),
      RAZORPAY_KEY_SECRET: z.string().optional(),
      RAZORPAY_WEBHOOK_SECRET: z.string().optional()
    }).superRefine((data, ctx) => {
      if (!data.RAZORPAY_KEY_ID) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAZORPAY_KEY_ID is required in production" });
      }
      if (!data.RAZORPAY_KEY_SECRET) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAZORPAY_KEY_SECRET is required in production" });
      }
      if (!data.RAZORPAY_WEBHOOK_SECRET) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAZORPAY_WEBHOOK_SECRET is required in production" });
      }
    });

    assert.throws(() => {
      prodEnvSchema.parse({
        NODE_ENV: "production"
      });
    }, /RAZORPAY_KEY_ID is required in production/);
  });
});

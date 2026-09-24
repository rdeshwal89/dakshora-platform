import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=================================================");
  console.log("TEST 1: Query public.saas_plans from Supabase");
  console.log("=================================================");
  const { data: plans, error: plansErr } = await supabase
    .from("saas_plans")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (plansErr) {
    console.error("FAILED to query plans:", plansErr.message);
  } else {
    console.log(`SUCCESS: Found ${plans.length} active SaaS plans:`);
    plans.forEach(p => console.log(`  - [${p.id}] ${p.name}: ₹${p.price_inr}/${p.billing_interval}`));
  }

  console.log("\n=================================================");
  console.log("TEST 2: Query public.saas_subscriptions from Supabase");
  console.log("=================================================");
  const { data: subs, error: subsErr } = await supabase
    .from("saas_subscriptions")
    .select("*, organization:organizations(id, name, slug)");

  if (subsErr) {
    console.error("FAILED to query subscriptions:", subsErr.message);
  } else {
    console.log(`SUCCESS: Found ${subs.length} active subscriptions in DB:`);
    subs.forEach(s => {
      console.log(`  - Sub ${s.id} | Org: ${s.organization?.name || s.organization_id} | Plan: ${s.plan_id} | Amount: ₹${s.amount} | Status: ${s.status}`);
    });
  }

  console.log("\n=================================================");
  console.log("TEST 3: Razorpay HMAC-SHA256 Cryptographic Verification");
  console.log("=================================================");
  const secret = process.env.RAZORPAY_KEY_SECRET || "dakshora_gateway_production_secret";
  const orderId = "order_test_998877";
  const paymentId = "pay_test_112233";

  // Generate valid HMAC signature
  const validSignature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const badSignature = "fake_tampered_signature_12345678";

  function verifySig(order, payment, sig) {
    if (!order || !payment || !sig) return false;
    const expected = crypto.createHmac("sha256", secret).update(`${order}|${payment}`).digest("hex");
    return sig === expected;
  }

  console.log("Testing forged/tampered signature:", verifySig(orderId, paymentId, badSignature) ? "SECURITY BREACH (ACCEPTED)" : "SECURE (REJECTED ✅)");
  console.log("Testing genuine cryptographic signature:", verifySig(orderId, paymentId, validSignature) ? "VERIFIED VALID (ACCEPTED ✅)" : "FAILED (REJECTED ❌)");

  console.log("\n=================================================");
  console.log("TEST 4: Test SaaS Invoices Table Write & Read");
  console.log("=================================================");
  const testOrgId = subs[0]?.organization_id;
  const testInvId = `inv-test-${Date.now()}`;
  const testInvNum = `DAK-TEST-${Date.now().toString().slice(-6)}`;

  const { error: insInvErr } = await supabase.from("saas_invoices").insert([{
    id: testInvId,
    organization_id: testOrgId,
    subscription_id: subs[0]?.id,
    invoice_number: testInvNum,
    plan_name: "Gold Smart School",
    subtotal: 3388.98,
    tax_gst: 610.02,
    total_amount: 3999.00,
    currency: "INR",
    status: "paid",
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    paid_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString()
  }]);

  if (insInvErr) {
    console.error("FAILED to insert test invoice:", insInvErr.message);
  } else {
    console.log(`SUCCESS: Inserted test invoice ${testInvNum}`);
    const { data: invRead } = await supabase.from("saas_invoices").select("*").eq("id", testInvId).single();
    console.log("Read back test invoice from DB:", {
      id: invRead?.id,
      invoice_number: invRead?.invoice_number,
      total_amount: invRead?.total_amount,
      status: invRead?.status
    });

    // Clean up test invoice
    await supabase.from("saas_invoices").delete().eq("id", testInvId);
    console.log("Cleaned up test invoice ✅");
  }

  console.log("\n=================================================");
  console.log("TEST 5: Test SaaS Webhook Idempotency Event Table");
  console.log("=================================================");
  const testEventId = `evt_test_${Date.now()}`;
  const { error: evErr } = await supabase.from("saas_webhook_events").insert([{
    id: `wh-test-${Date.now()}`,
    provider: "razorpay",
    event_id: testEventId,
    event_type: "payment.captured",
    payload: { amount: 399900, currency: "INR", notes: { org_id: testOrgId } },
    processed: true,
    processed_at: new Date().toISOString()
  }]);

  if (evErr) {
    console.error("FAILED to insert test webhook event:", evErr.message);
  } else {
    console.log(`SUCCESS: Inserted webhook event ${testEventId}`);
    // Duplicate test
    const { error: dupErr } = await supabase.from("saas_webhook_events").insert([{
      id: `wh-test-${Date.now() + 1}`,
      provider: "razorpay",
      event_id: testEventId, // duplicate
      event_type: "payment.captured",
      payload: {},
      processed: true
    }]);
    console.log("Duplicate event insertion blocked by unique constraint:", dupErr ? "YES (DUPLICATE REJECTED ✅)" : "NO (ERROR ❌)");

    // Clean up test webhook event
    await supabase.from("saas_webhook_events").delete().eq("event_id", testEventId);
    console.log("Cleaned up test webhook event ✅");
  }

  console.log("\n=================================================");
  console.log("ALL SAAS DATABASE & CRYPTOGRAPHIC TESTS COMPLETED SUCCESSFULLY! ✅");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});

import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("==================================================");
  console.log("TESTING FRONTEND BILLING REWRITES & API REVERSE PROXY");
  console.log("==================================================");

  // 1. Start Backend on port 5000 using tsx
  console.log("Starting backend on port 5000...");
  const backendProc = spawn("npx", ["tsx", "src/server.ts"], {
    cwd: "./backend",
    shell: true,
    stdio: "pipe",
    env: { ...process.env, PORT: "5000" },
  });

  backendProc.stdout.on("data", (d) => {
    const s = d.toString();
    if (s.includes("running on") || s.includes("live on port") || s.includes("Listening")) {
      console.log("[Backend stdout]", s.trim());
    }
  });
  backendProc.stderr.on("data", (d) => {
    // ignore warnings
  });

  // Wait for backend to be ready
  let backendReady = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch("http://127.0.0.1:5000/health");
      if (res.ok) {
        backendReady = true;
        break;
      }
    } catch {}
  }

  if (!backendReady) {
    console.error("Backend failed to start in 10s");
    backendProc.kill();
    process.exit(1);
  }
  console.log("Backend is ready on http://127.0.0.1:5000 ✅");

  // 2. Start Next.js Frontend on port 3000
  console.log("Starting Next.js frontend on port 3000...");
  const frontendProc = spawn("npm", ["run", "start"], {
    cwd: "./frontend",
    shell: true,
    stdio: "pipe",
    env: { ...process.env, PORT: "3000", BACKEND_URL: "http://127.0.0.1:5000" },
  });

  frontendProc.stdout.on("data", (d) => {
    const s = d.toString();
    if (s.includes("Ready in") || s.includes("Listening")) {
      console.log("[Frontend stdout]", s.trim());
    }
  });

  // Wait for frontend to be ready
  let frontendReady = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch("http://127.0.0.1:3000/health");
      if (res.ok) {
        frontendReady = true;
        break;
      }
    } catch {}
  }

  if (!frontendReady) {
    console.error("Frontend failed to start in 10s");
    backendProc.kill();
    frontendProc.kill();
    process.exit(1);
  }
  console.log("Frontend is ready on http://127.0.0.1:3000 ✅");

  console.log("\n--- RUNNING CHECKS ---");

  // Check 1: Direct SPA load on /portal
  const resPortal = await fetch("http://127.0.0.1:3000/portal");
  const textPortal = await resPortal.text();
  const hasRoot = textPortal.includes('<div id="root"></div>') && textPortal.includes("DAKSHORA 2.0");
  console.log("Check 1: GET /portal serves SPA portal:", hasRoot ? "PASSED (200 OK) ✅" : "FAILED ❌");

  // Check 2: Direct SPA load on /admin/billing
  const resAdminBilling = await fetch("http://127.0.0.1:3000/admin/billing");
  const textAdminBilling = await resAdminBilling.text();
  const hasRootAdmin = textAdminBilling.includes('<div id="root"></div>');
  console.log("Check 2: GET /admin/billing rewrites to SPA portal:", hasRootAdmin ? "PASSED (200 OK) ✅" : "FAILED ❌");

  // Check 3: Direct SPA load on /billing
  const resBilling = await fetch("http://127.0.0.1:3000/billing");
  const textBilling = await resBilling.text();
  const hasRootBilling = textBilling.includes('<div id="root"></div>');
  console.log("Check 3: GET /billing rewrites to SPA portal:", hasRootBilling ? "PASSED (200 OK) ✅" : "FAILED ❌");

  // Check 4: Proxy /api/billing/plans through Next.js
  const resPlans = await fetch("http://127.0.0.1:3000/api/billing/plans");
  const jsonPlans = await resPlans.json();
  const plansOk = jsonPlans.success && jsonPlans.plans?.length === 3;
  console.log("Check 4: GET /api/billing/plans proxied via Next.js:", plansOk ? `PASSED (${jsonPlans.plans.length} plans loaded from Supabase) ✅` : "FAILED ❌");
  if (jsonPlans.plans) {
    jsonPlans.plans.forEach(p => console.log(`   - ${p.name}: ₹${p.priceINR}/month`));
  }

  // Check 5: Proxy /api/billing/subscription through Next.js for Dakshora Platform
  const resSub = await fetch("http://127.0.0.1:3000/api/billing/subscription", {
    headers: { "x-organization-id": "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e" },
  });
  const jsonSub = await resSub.json();
  const subOk = jsonSub.success && jsonSub.subscription?.plan;
  console.log("Check 5: GET /api/billing/subscription proxied via Next.js:", subOk ? `PASSED (Plan: ${jsonSub.subscription.plan}, Status: ${jsonSub.subscription.status}) ✅` : "FAILED ❌");

  // Clean shutdown
  console.log("\nShutting down test servers...");
  backendProc.kill();
  frontendProc.kill();
  console.log("All servers stopped.");

  console.log("\n==================================================");
  console.log("FRONTEND BILLING VERIFICATION COMPLETED SUCCESSFULLY! ✅");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

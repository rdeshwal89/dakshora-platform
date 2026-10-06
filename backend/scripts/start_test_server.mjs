/**
 * start_test_server.mjs
 * 
 * Standalone test server launcher for multi-process restart verification.
 */

import { buildApp } from "../src/app.js";

const port = Number(process.env.TEST_PORT || 5295);

async function start() {
  const app = await buildApp();
  await app.listen({ port, host: "127.0.0.1" });
  console.log(`[TEST_SERVER_READY] Dakshora API running on http://127.0.0.1:${port}`);
}

start().catch(err => {
  console.error("[TEST_SERVER_FAIL]", err);
  process.exit(1);
});

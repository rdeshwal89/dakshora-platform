import "dotenv/config";
import http from "node:http";
import { buildApp } from "../src/app.js";
import { createClient } from "@supabase/supabase-js";

const PORT = 5293;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEFAULT_ORG_ID = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

// Service-role Supabase client (used ONLY for admin operations, never signInWithPassword)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqHeaders["content-type"] = "application/json";
      reqBody = JSON.stringify(body);
      reqHeaders["content-length"] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runLiveTransportFleetTest() {
  console.log("\n==========================================================================");
  console.log("🚌 DAKSHORA 2.0 — LIVE STUDENT TRANSPORT & FLEET MANAGEMENT ENGINE TEST");
  console.log("==========================================================================\n");

  let app;
  let testAdminUser = null;
  let testStudentUser = null;
  let adminToken = null;
  let studentToken = null;

  let createdRouteId = null;
  let createdRouteDbId = null;
  let createdVehicleId = null;
  let createdVehicleDbId = null;
  let testStudentDbId = null;
  const testStudentId = "std-101";

  try {
    // 0. Spin up test server
    app = await buildApp();
    await app.listen({ port: PORT, host: "127.0.0.1" });
    console.log(`[Test Server] Gateway listening on ${BASE_URL}\n`);

    // 0. Setup: Authenticate SuperAdmin user
    console.log("[Setup] Authenticating test SuperAdmin user...");
    const adminEmail = `superadmin.transport.${Date.now()}@dakshora.internal`;
    const testPassword = "TransportSuperPassword@2026!";

    const { data: adminAuth, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "superadmin" }
    });
    if (adminAuthErr) throw new Error(`SuperAdmin creation failed: ${adminAuthErr.message}`);
    testAdminUser = adminAuth.user;

    const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: adminSession, error: adminLoginErr } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    });
    if (adminLoginErr || !adminSession.session) throw new Error(`SuperAdmin login failed: ${adminLoginErr?.message}`);
    adminToken = adminSession.session.access_token;
    console.log("  ✅ SuperAdmin authenticated with Supabase JWT.");

    // Setup standard Student user to test role-based 403 authorization
    const studentEmail = `student.transport.${Date.now()}@dakshora.internal`;
    const { data: stdAuth, error: stdAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: testPassword,
      email_confirm: true,
      app_metadata: { role: "student" }
    });
    if (stdAuthErr) throw new Error(`Student user creation failed: ${stdAuthErr.message}`);
    testStudentUser = stdAuth.user;

    const studentAuthClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: stdSession, error: stdLoginErr } = await studentAuthClient.auth.signInWithPassword({
      email: studentEmail,
      password: testPassword
    });
    if (stdLoginErr || !stdSession.session) throw new Error(`Student login failed: ${stdLoginErr?.message}`);
    studentToken = stdSession.session.access_token;
    console.log("  ✅ Student user authenticated with Supabase JWT.\n");

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // ------------------------------------------------------------------------
    // GATE 1: Security, Authentication & Role-Based Access Control
    // ------------------------------------------------------------------------
    console.log("[Gate 1/10] Verifying Security, Authentication & Role-Based Access Control...");

    // 1. Unauthenticated GET /api/erp/transport/routes must fail with 401
    const unauthGetRoutes = await makeRequest({
      method: "GET",
      path: "/api/erp/transport/routes"
    });
    assert(unauthGetRoutes.status === 401, `Expected 401 for unauthenticated GET routes, got ${unauthGetRoutes.status}`);

    // 2. Unauthenticated GET /api/erp/transport/overview must fail with 401
    const unauthOverview = await makeRequest({
      method: "GET",
      path: "/api/erp/transport/overview"
    });
    assert(unauthOverview.status === 401, `Expected 401 for unauthenticated GET overview, got ${unauthOverview.status}`);

    // 3. Unauthenticated POST /api/erp/transport/routes must fail with 401
    const unauthRoute = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/routes",
      body: { routeName: "Unauthorized Express", routeNumber: "BUS-99" }
    });
    assert(unauthRoute.status === 401, `Expected 401 for unauthenticated route creation, got ${unauthRoute.status}`);

    // 4. Unauthenticated POST /api/erp/transport/vehicles must fail with 401
    const unauthVehicle = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/vehicles",
      body: { registrationNumber: "DL 01 ZZ 9999" }
    });
    assert(unauthVehicle.status === 401, `Expected 401 for unauthenticated vehicle onboarding, got ${unauthVehicle.status}`);

    // 5. Unauthenticated POST /api/erp/transport/students/allocate must fail with 401
    const unauthAlloc = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/students/allocate",
      body: { studentId: "std-101", routeId: "tr-01" }
    });
    assert(unauthAlloc.status === 401, `Expected 401 for unauthenticated student allocation, got ${unauthAlloc.status}`);

    // 6. Student token POST /api/erp/transport/routes must fail with 403 Forbidden
    const forbiddenRoute = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/routes",
      headers: studentHeaders,
      body: { routeName: "Student Rogue Route", routeNumber: "BUS-X" }
    });
    assert(forbiddenRoute.status === 403, `Expected 403 for student role route creation, got ${forbiddenRoute.status}`);

    // 7. Student token POST /api/erp/transport/vehicles must fail with 403 Forbidden
    const forbiddenVeh = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/vehicles",
      headers: studentHeaders,
      body: { registrationNumber: "DL 01 XX 0001" }
    });
    assert(forbiddenVeh.status === 403, `Expected 403 for student role vehicle creation, got ${forbiddenVeh.status}`);

    // 8. Student token POST /api/erp/transport/students/allocate must fail with 403 Forbidden
    const forbiddenAlloc = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/students/allocate",
      headers: studentHeaders,
      body: { studentId: "std-101", routeId: "tr-01" }
    });
    assert(forbiddenAlloc.status === 403, `Expected 403 for student role student allocation, got ${forbiddenAlloc.status}`);

    console.log("  ✅ Security Gate Passed: 401 unauthenticated & 403 forbidden role checks strictly enforced.\n");

    // ------------------------------------------------------------------------
    // GATE 2: Route Creation & Supabase public.transport_routes Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 2/10] Verifying Route Creation & Supabase public.transport_routes Persistence...");

    const uniqueRouteNum = `BUS-${Date.now().toString().slice(-4)}`;
    const routePayload = {
      routeName: "North Capital Express",
      routeNumber: uniqueRouteNum,
      vehicleNumber: "DL 01 AB 8844",
      driverName: "Ram Singh Tanwar",
      driverPhone: "+91 98112 34567",
      capacity: 35,
      fee: 3200,
      stops: [
        { stopName: "North Depot Terminal", time: "06:45 AM", sequence: 1 },
        { stopName: "Sector 14 Central Plaza", time: "07:10 AM", sequence: 2 },
        { stopName: "Civil Lines Intersection", time: "07:30 AM", sequence: 3 },
        { stopName: "Heritage Campus Gate 1", time: "07:50 AM", sequence: 4 }
      ]
    };

    const createRouteRes = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/routes",
      headers: adminHeaders,
      body: routePayload
    });

    assert(createRouteRes.status === 201, `Expected 201 for route creation, got ${createRouteRes.status}: ${JSON.stringify(createRouteRes.body)}`);
    assert(createRouteRes.body.success === true, "Route creation response indicated failure");
    assert(createRouteRes.body.route?.id, "Created route missing ID");

    createdRouteId = createRouteRes.body.route.id;
    createdRouteDbId = createRouteRes.body.route.db_id;
    console.log(`  ✅ Route Created: '${routePayload.routeName}' [${uniqueRouteNum}] (Memory ID: ${createdRouteId}, DB ID: ${createdRouteDbId || "N/A"})`);

    // Verify persistence in Supabase PostgreSQL public.transport_routes
    if (createdRouteDbId) {
      const { data: dbRoute, error: dbRouteErr } = await supabaseAdmin
        .from("transport_routes")
        .select("*")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("id", createdRouteDbId)
        .single();

      assert(!dbRouteErr && dbRoute, `Supabase transport_routes query failed: ${dbRouteErr?.message}`);
      assert(dbRoute.name === routePayload.routeName, `DB route name mismatch: expected ${routePayload.routeName}, got ${dbRoute.name}`);
      assert(dbRoute.route_no === uniqueRouteNum, `DB route_no mismatch: expected ${uniqueRouteNum}, got ${dbRoute.route_no}`);
      assert(parseFloat(dbRoute.fee) === 3200, `DB fee mismatch: expected 3200, got ${dbRoute.fee}`);
      console.log(`  ✅ Verified persistence in Supabase public.transport_routes: [${dbRoute.id}] ${dbRoute.name} (${dbRoute.route_no})`);
    } else {
      console.log("  ⚠️ Supabase route DB ID not returned, verified in-memory creation.");
    }
    console.log();

    // ------------------------------------------------------------------------
    // GATE 3: Fleet Vehicle Onboarding & Supabase public.vehicles Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 3/10] Verifying Fleet Vehicle Onboarding & Supabase public.vehicles Persistence...");

    const uniqueRegNo = `DL 01 TR ${Date.now().toString().slice(-4)}`;
    const vehiclePayload = {
      registrationNumber: uniqueRegNo,
      vehicleType: "ac_bus",
      capacity: 35,
      driverName: "Ram Singh Tanwar",
      driverPhone: "+91 98112 34567",
      assignedRouteId: createdRouteId,
      isActive: true
    };

    const createVehRes = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/vehicles",
      headers: adminHeaders,
      body: vehiclePayload
    });

    assert(createVehRes.status === 201, `Expected 201 for vehicle onboarding, got ${createVehRes.status}: ${JSON.stringify(createVehRes.body)}`);
    assert(createVehRes.body.success === true, "Vehicle onboarding indicated failure");
    assert(createVehRes.body.vehicle?.id, "Onboarded vehicle missing ID");

    createdVehicleId = createVehRes.body.vehicle.id;
    createdVehicleDbId = createVehRes.body.vehicle.db_id;
    console.log(`  ✅ Fleet Vehicle Onboarded: [${uniqueRegNo}] Type: ${vehiclePayload.vehicleType} (Memory ID: ${createdVehicleId}, DB ID: ${createdVehicleDbId || "N/A"})`);

    // Duplicate Registration check (409 Conflict)
    const duplicateVehRes = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/vehicles",
      headers: adminHeaders,
      body: vehiclePayload
    });
    assert(duplicateVehRes.status === 409, `Expected 409 Conflict on duplicate vehicle reg number, got ${duplicateVehRes.status}`);
    console.log("  ✅ Duplicate registration conflict prevention verified (409 Conflict returned).");

    // Verify persistence in Supabase PostgreSQL public.vehicles
    if (createdVehicleDbId) {
      const { data: dbVeh, error: dbVehErr } = await supabaseAdmin
        .from("vehicles")
        .select("*")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("id", createdVehicleDbId)
        .single();

      assert(!dbVehErr && dbVeh, `Supabase vehicles query failed: ${dbVehErr?.message}`);
      assert(dbVeh.registration_no === uniqueRegNo, `DB registration_no mismatch: expected ${uniqueRegNo}, got ${dbVeh.registration_no}`);
      assert(dbVeh.capacity === 35, `DB capacity mismatch: expected 35, got ${dbVeh.capacity}`);
      assert(dbVeh.is_active === true, `DB is_active mismatch: expected true, got ${dbVeh.is_active}`);
      console.log(`  ✅ Verified persistence in Supabase public.vehicles: [${dbVeh.id}] ${dbVeh.registration_no}`);
    }
    console.log();

    // ------------------------------------------------------------------------
    // GATE 4: Route & Fleet Inspection via GET /routes/:id and GET /vehicles
    // ------------------------------------------------------------------------
    console.log("[Gate 4/10] Verifying Route & Fleet Inspection Endpoints...");

    // 1. Get single route detail
    const routeDetailRes = await makeRequest({
      method: "GET",
      path: `/api/erp/transport/routes/${createdRouteId}`,
      headers: adminHeaders
    });
    assert(routeDetailRes.status === 200, `Expected 200 for GET route detail, got ${routeDetailRes.status}`);
    assert(routeDetailRes.body.success === true, "Route detail indicated failure");
    assert(routeDetailRes.body.route?.routeNumber === uniqueRouteNum, "Route detail number mismatch");
    assert(Array.isArray(routeDetailRes.body.passengers), "Route detail missing passengers array");
    console.log(`  ✅ Inspected Route Details: '${routeDetailRes.body.route.routeName}' with ${routeDetailRes.body.route.stops?.length || 0} stops.`);

    // 2. Query vehicles fleet list
    const vehiclesListRes = await makeRequest({
      method: "GET",
      path: "/api/erp/transport/vehicles",
      headers: adminHeaders
    });
    assert(vehiclesListRes.status === 200, `Expected 200 for GET vehicles, got ${vehiclesListRes.status}`);
    assert(vehiclesListRes.body.success === true, "Vehicles list indicated failure");
    const foundVeh = vehiclesListRes.body.vehicles?.find(v => v.registrationNumber === uniqueRegNo || v.id === createdVehicleId);
    assert(foundVeh, `Newly created vehicle ${uniqueRegNo} not found in vehicles fleet list`);
    console.log(`  ✅ Verified Vehicle Fleet List: ${vehiclesListRes.body.totalVehicles} total vehicles active.`);

    // 3. Search filter by query
    const searchRes = await makeRequest({
      method: "GET",
      path: `/api/erp/transport/routes?q=${uniqueRouteNum}`,
      headers: adminHeaders
    });
    assert(searchRes.status === 200 && searchRes.body.totalRoutes >= 1, "Route search filter failed");
    console.log(`  ✅ Route search filter confirmed for '${uniqueRouteNum}'.\n`);

    // ------------------------------------------------------------------------
    // GATE 5: Student Transport Allocation & Supabase public.student_transport Persistence
    // ------------------------------------------------------------------------
    console.log("[Gate 5/10] Verifying Student Transport Allocation & Supabase public.student_transport Persistence...");

    const allocPayload = {
      studentId: testStudentId,
      routeId: createdRouteId,
      vehicleId: createdVehicleId,
      pickupPoint: "Sector 14 Central Plaza",
      dropPoint: "Sector 14 Central Plaza",
      fee: 3200
    };

    const allocRes = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/students/allocate",
      headers: adminHeaders,
      body: allocPayload
    });

    assert(allocRes.status === 201, `Expected 201 for transport allocation, got ${allocRes.status}: ${JSON.stringify(allocRes.body)}`);
    assert(allocRes.body.success === true, "Student transport allocation failed");
    assert(allocRes.body.allocation?.pickupPoint === allocPayload.pickupPoint, "Allocation pickup point mismatch");

    console.log(`  ✅ Allocated Student [${testStudentId}] to Route [${uniqueRouteNum}] at stop '${allocPayload.pickupPoint}'`);

    // Check allocations list endpoint
    const stdAllocListRes = await makeRequest({
      method: "GET",
      path: `/api/erp/transport/students?routeId=${createdRouteId}`,
      headers: adminHeaders
    });
    assert(stdAllocListRes.status === 200, `Expected 200 for transport students list, got ${stdAllocListRes.status}`);
    const stdRecord = stdAllocListRes.body.students?.find(s => s.studentId === testStudentId);
    assert(stdRecord, `Student ${testStudentId} not found in route allocation list`);
    testStudentDbId = stdRecord.studentDbId;

    // Verify in Supabase PostgreSQL public.student_transport table
    if (testStudentDbId) {
      const { data: dbAlloc, error: dbAllocErr } = await supabaseAdmin
        .from("student_transport")
        .select("*")
        .eq("student_id", testStudentDbId)
        .maybeSingle();

      assert(!dbAllocErr, `Supabase student_transport query error: ${dbAllocErr?.message}`);
      if (dbAlloc) {
        assert(dbAlloc.pickup_point === allocPayload.pickupPoint, `DB pickup_point mismatch: expected ${allocPayload.pickupPoint}, got ${dbAlloc.pickup_point}`);
        console.log(`  ✅ Verified persistence in Supabase public.student_transport: [Student: ${dbAlloc.student_id}, Route: ${dbAlloc.route_id}, Stop: ${dbAlloc.pickup_point}]`);
      }
    }
    console.log();

    // ------------------------------------------------------------------------
    // GATE 6: Digital Bus Pass Generation via GET /students/:studentId/pass
    // ------------------------------------------------------------------------
    console.log("[Gate 6/10] Verifying Digital Bus Pass Generation...");

    const passRes = await makeRequest({
      method: "GET",
      path: `/api/erp/transport/students/${testStudentId}/pass`,
      headers: adminHeaders
    });

    assert(passRes.status === 200, `Expected 200 for digital bus pass, got ${passRes.status}: ${JSON.stringify(passRes.body)}`);
    assert(passRes.body.success === true, "Bus pass generation failed");
    const pass = passRes.body.pass;
    assert(pass?.passNumber, "Bus pass missing passNumber");
    assert(pass.student?.name, "Bus pass missing student name");
    assert(pass.transport?.routeNumber, "Bus pass missing transport routeNumber");
    assert(pass.transport?.pickupPoint === allocPayload.pickupPoint, "Bus pass pickupPoint mismatch");
    assert(pass.verificationQr?.includes("dakshora.co.in/verify/pass/"), "Bus pass verificationQr URL malformed");
    assert(pass.emergencyContact, "Bus pass missing emergency contact");

    console.log(`  ✅ Digital Bus Pass Generated: [Pass No: ${pass.passNumber}]`);
    console.log(`     Student: ${pass.student.name} (${pass.student.grade} - ${pass.student.section})`);
    console.log(`     Route: ${pass.transport.routeNumber} — Vehicle: ${pass.transport.vehicleNumber}`);
    console.log(`     Stop: ${pass.transport.pickupPoint}`);
    console.log(`     QR Token: ${pass.verificationQr}\n`);

    // ------------------------------------------------------------------------
    // GATE 7: Fleet Capacity Management & Overload Prevention Safeguards
    // ------------------------------------------------------------------------
    console.log("[Gate 7/10] Verifying Fleet Capacity Management & Overload Prevention Safeguards...");

    // Update the route's capacity to 1 to simulate a full bus
    const patchRouteRes = await makeRequest({
      method: "PATCH",
      path: `/api/erp/transport/routes/${createdRouteId}`,
      headers: adminHeaders,
      body: { capacity: 1 }
    });
    assert(patchRouteRes.status === 200, `Expected 200 for route capacity update, got ${patchRouteRes.status}`);

    // Attempt to allocate a second student (std-102) when capacity is reached (1/1)
    const overloadAllocRes = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/students/allocate",
      headers: adminHeaders,
      body: {
        studentId: "std-102",
        routeId: createdRouteId,
        pickupPoint: "Sector 14 Central Plaza"
      }
    });
    assert(overloadAllocRes.status === 201, `Expected 201 for administrative override allocation, got ${overloadAllocRes.status}`);
    assert(overloadAllocRes.body.warnings && overloadAllocRes.body.warnings.length > 0, "Expected capacity overload warning to be returned");
    console.log(`  ✅ Overload Protection Warning Triggered: "${overloadAllocRes.body.warnings[0]}"`);

    // Verify route inspection now shows 2 passengers
    const inspectFullRoute = await makeRequest({
      method: "GET",
      path: `/api/erp/transport/routes/${createdRouteId}`,
      headers: adminHeaders
    });
    assert(inspectFullRoute.body.totalPassengers === 2, `Expected 2 passengers on route, got ${inspectFullRoute.body.totalPassengers}`);
    console.log(`  ✅ Fleet Capacity Safeguards & Administrative Override validated successfully.\n`);

    // Clean up second student allocation
    await makeRequest({
      method: "DELETE",
      path: "/api/erp/transport/students/std-102",
      headers: adminHeaders
    });

    // ------------------------------------------------------------------------
    // GATE 8: Live GPS Fleet Tracking & Telematics Telemetry
    // ------------------------------------------------------------------------
    console.log("[Gate 8/10] Verifying Live GPS Fleet Tracking & Telematics Ingestion...");

    const gpsPingPayload = {
      routeId: createdRouteId,
      vehicleNumber: uniqueRegNo,
      latitude: 28.4682,
      longitude: 77.0321,
      speedKmH: 46.5,
      status: "on_route",
      statusText: "Approaching Sector 14 Central Plaza"
    };

    const pingRes = await makeRequest({
      method: "POST",
      path: "/api/erp/transport/tracking/ping",
      headers: adminHeaders,
      body: gpsPingPayload
    });

    assert(pingRes.status === 200, `Expected 200 for GPS telemetry ping, got ${pingRes.status}: ${JSON.stringify(pingRes.body)}`);
    assert(pingRes.body.success === true, "Telemetry ping ingestion failed");
    assert(pingRes.body.liveGps?.speedKmH === 46.5, "Live GPS speed mismatch");
    assert(pingRes.body.currentStatus === "on_route", "Current status mismatch");
    console.log(`  ✅ Telemetry Ping Ingested: Lat ${pingRes.body.liveGps.latitude}, Lon ${pingRes.body.liveGps.longitude}, Speed ${pingRes.body.liveGps.speedKmH} km/h`);

    // Verify live tracking overview endpoint
    const trackingRes = await makeRequest({
      method: "GET",
      path: "/api/erp/transport/tracking",
      headers: adminHeaders
    });
    assert(trackingRes.status === 200, `Expected 200 for fleet tracking list, got ${trackingRes.status}`);
    const trackedBus = trackingRes.body.fleet?.find(f => f.routeId === createdRouteId);
    assert(trackedBus, "Newly pinged route missing from live tracking list");
    assert(trackedBus.status === "on_route", "Live tracking bus status mismatch");
    assert(trackedBus.speedKmH === 46.5, "Live tracking bus speed mismatch");
    console.log(`  ✅ Live Fleet Tracking Overview Verified: ${trackingRes.body.totalBusesTracking} active vehicles tracked on live map.\n`);

    // ------------------------------------------------------------------------
    // GATE 9: Centralized Transport Dashboard Overview KPIs
    // ------------------------------------------------------------------------
    console.log("[Gate 9/10] Verifying Centralized Transport Dashboard Overview KPIs...");

    const overviewRes = await makeRequest({
      method: "GET",
      path: "/api/erp/transport/overview",
      headers: adminHeaders
    });

    assert(overviewRes.status === 200, `Expected 200 for transport overview, got ${overviewRes.status}`);
    assert(overviewRes.body.success === true, "Transport overview failed");
    const ov = overviewRes.body;
    assert(ov.totalRoutes >= 1, "Total routes KPI invalid");
    assert(ov.totalVehicles >= 1, "Total vehicles KPI invalid");
    assert(ov.totalStudentsAllocated >= 1, "Total allocated students KPI invalid");
    assert(ov.monthlyRevenue >= 3200, "Monthly transport revenue KPI invalid");
    assert(typeof ov.utilizationPercent === "number", "Utilization percent missing");
    assert(Array.isArray(ov.routesSummary), "routesSummary array missing");

    console.log(`  ✅ Transport Overview KPIs:`);
    console.log(`     Total Routes: ${ov.totalRoutes}`);
    console.log(`     Total Fleet Vehicles: ${ov.totalVehicles} (${ov.activeVehicles} active)`);
    console.log(`     Allocated Students: ${ov.totalStudentsAllocated}`);
    console.log(`     Fleet Capacity: ${ov.totalCapacity} seats (${ov.utilizationPercent}% utilization)`);
    console.log(`     Active On-Road Fleet: ${ov.activeFleetOnRoad}`);
    console.log(`     Projected Monthly Transport Revenue: ₹${ov.monthlyRevenue.toLocaleString("en-IN")}\n`);

    // ------------------------------------------------------------------------
    // GATE 10: De-allocation, Teardown & Database Cleanup
    // ------------------------------------------------------------------------
    console.log("[Gate 10/10] Verifying De-allocation, Teardown & Database Cleanup...");

    // 1. De-allocate student
    const deallocRes = await makeRequest({
      method: "DELETE",
      path: `/api/erp/transport/students/${testStudentId}`,
      headers: adminHeaders
    });
    assert(deallocRes.status === 200, `Expected 200 for student deallocation, got ${deallocRes.status}`);
    console.log(`  ✅ Student [${testStudentId}] de-allocated from transport fleet.`);

    // 2. Decommission vehicle
    const delVehRes = await makeRequest({
      method: "DELETE",
      path: `/api/erp/transport/vehicles/${createdVehicleId}`,
      headers: adminHeaders
    });
    assert(delVehRes.status === 200, `Expected 200 for vehicle deletion, got ${delVehRes.status}`);
    console.log(`  ✅ Vehicle [${createdVehicleId}] decommissioned from fleet.`);

    // 3. Delete route
    const delRouteRes = await makeRequest({
      method: "DELETE",
      path: `/api/erp/transport/routes/${createdRouteId}`,
      headers: adminHeaders
    });
    assert(delRouteRes.status === 200, `Expected 200 for route deletion, got ${delRouteRes.status}`);
    console.log(`  ✅ Route [${createdRouteId}] removed from routes directory.`);

    // 4. Confirm deletion in Supabase PostgreSQL
    if (createdRouteDbId) {
      const { data: checkRoute } = await supabaseAdmin
        .from("transport_routes")
        .select("id")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("id", createdRouteDbId)
        .maybeSingle();
      assert(!checkRoute, "Route was not cleaned up from Supabase transport_routes table");
      console.log("  ✅ Verified route purged from Supabase public.transport_routes.");
    }

    if (createdVehicleDbId) {
      const { data: checkVeh } = await supabaseAdmin
        .from("vehicles")
        .select("id")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("id", createdVehicleDbId)
        .maybeSingle();
      assert(!checkVeh, "Vehicle was not cleaned up from Supabase vehicles table");
      console.log("  ✅ Verified vehicle purged from Supabase public.vehicles.");
    }

    // 5. Clean up test users from Supabase Auth
    if (testAdminUser) {
      await supabaseAdmin.auth.admin.deleteUser(testAdminUser.id);
      console.log("  ✅ Test SuperAdmin auth account cleaned up.");
    }
    if (testStudentUser) {
      await supabaseAdmin.auth.admin.deleteUser(testStudentUser.id);
      console.log("  ✅ Test Student auth account cleaned up.");
    }

    console.log("\n==========================================================================");
    console.log("🎉 ALL 10 GATES PASSED: LIVE STUDENT TRANSPORT & FLEET MANAGEMENT VERIFIED");
    console.log("==========================================================================\n");

  } catch (err) {
    console.error("\n❌ TRANSPORT FLEET TEST FAILED WITH EXCEPTION:");
    console.error(err.message || err);
    if (err.stack) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
      console.log("[Test Server] Server closed cleanly.");
    }
  }
}

runLiveTransportFleetTest();

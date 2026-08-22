/**
 * test-leave-http.js — End-to-end HTTP test against the live Express server.
 *
 * Assumes server is running on http://localhost:5000.
 * Creates test users in MongoDB, generates JWTs, makes real HTTP calls,
 * asserts status codes and response bodies, then cleans up.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Employee = require("./models/Employee");
const Leave = require("./models/Leave");

const BASE = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

let totalChecks = 0;
let passedChecks = 0;

function check(label, actual, expected) {
  totalChecks++;
  if (actual !== expected) {
    console.error(`  FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    passedChecks++;
    console.log(`  PASS: ${label}`);
  }
}

function makeToken(id, role) {
  return jwt.sign({ id, role }, JWT_SECRET);
}

async function httpReq(method, path, token, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

async function run() {
  console.log(`Connecting to MongoDB …`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected.\n");

  // ── Setup: create test employee + admin in DB ──────────────────────
  const empDoc = await Employee.create({
    customId: "__http_test_emp__",
    fullName: "HTTP Test Employee",
    email: "__http_test_emp@test.com",
    password: "hashed_not_real",
    role: "employee",
  });

  const adminDoc = await Employee.create({
    customId: "__http_test_admin__",
    fullName: "HTTP Test Admin",
    email: "__http_test_admin@test.com",
    password: "hashed_not_real",
    role: "admin",
  });

  const empToken = makeToken(empDoc._id.toString(), "employee");
  const adminToken = makeToken(adminDoc._id.toString(), "admin");

  console.log(`Employee ID: ${empDoc._id}`);
  console.log(`Admin ID:    ${adminDoc._id}`);
  console.log(`Employee JWT: ${empToken.slice(0, 30)}…`);
  console.log(`Admin JWT:    ${adminToken.slice(0, 30)}…\n`);

  // =====================================================================
  // TEST 1: GET /leave with NO token → 401
  // =====================================================================
  console.log("── TEST 1: GET /leave without auth → 401 ──");
  const r1 = await httpReq("GET", "/leave", null);
  console.log(`  Status: ${r1.status}  Body: ${JSON.stringify(r1.body)}`);
  check("No-auth returns 401", r1.status, 401);
  console.log("");

  // =====================================================================
  // TEST 2: POST /leave with employee token → 201, correct allocationDays
  // =====================================================================
  console.log("── TEST 2: POST /leave (employee, valid body) → 201 ──");
  const r2 = await httpReq("POST", "/leave", empToken, {
    type: "paid",
    startDate: "2026-01-10",
    endDate: "2026-01-12",
    remarks: "Family trip",
  });
  console.log(`  Status: ${r2.status}  Body: ${JSON.stringify(r2.body, null, 2)}`);
  check("POST returns 201", r2.status, 201);
  check("allocationDays is 3 (Jan 10–12 inclusive)", r2.body.allocationDays, 3);
  check("status is pending", r2.body.status, "pending");
  check("type is paid", r2.body.type, "paid");
  check("employeeId matches", r2.body.employeeId, empDoc._id.toString());
  const leaveId = r2.body._id;
  console.log("");

  // =====================================================================
  // TEST 3: GET /leave with employee token → 200, only own leaves
  // =====================================================================
  console.log("── TEST 3: GET /leave (employee) → 200, own leaves only ──");

  // Create a leave for the admin so there's another employee's data in DB
  await Leave.create({
    employeeId: adminDoc._id,
    type: "sick",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-05-02"),
    allocationDays: 2,
    status: "pending",
  });

  const r3 = await httpReq("GET", "/leave", empToken);
  console.log(`  Status: ${r3.status}  Count: ${r3.body.length}`);
  check("GET returns 200", r3.status, 200);
  check("Response is an array", Array.isArray(r3.body), true);
  const allBelongToEmp = r3.body.every(
    (l) => (l.employeeId?._id || l.employeeId) === empDoc._id.toString()
  );
  check("All returned leaves belong to the employee", allBelongToEmp, true);
  const hasAdminLeave = r3.body.some(
    (l) => (l.employeeId?._id || l.employeeId) === adminDoc._id.toString()
  );
  check("No admin leaves leaked to employee", hasAdminLeave, false);
  console.log("");

  // =====================================================================
  // TEST 4: PUT /:id/approve with employee (non-admin) token → 403
  // =====================================================================
  console.log("── TEST 4: PUT /approve with employee token → 403 ──");
  const r4 = await httpReq("PUT", `/leave/${leaveId}/approve`, empToken, {
    adminComment: "I'm not an admin",
  });
  console.log(`  Status: ${r4.status}  Body: ${JSON.stringify(r4.body)}`);
  check("Non-admin approve returns 403", r4.status, 403);
  console.log("");

  // =====================================================================
  // TEST 5: PUT /:id/approve with admin token → 200
  // =====================================================================
  console.log("── TEST 5: PUT /approve with admin token → 200 ──");
  const r5 = await httpReq("PUT", `/leave/${leaveId}/approve`, adminToken, {
    adminComment: "Approved, enjoy your trip",
  });
  console.log(`  Status: ${r5.status}  Body: ${JSON.stringify(r5.body, null, 2)}`);
  check("Admin approve returns 200", r5.status, 200);
  check("Status changed to approved", r5.body.status, "approved");
  check("adminComment stored", r5.body.adminComment, "Approved, enjoy your trip");
  console.log("");

  // =====================================================================
  // TEST 6: PUT /:id/approve again → 400 (already approved)
  // =====================================================================
  console.log("── TEST 6: PUT /approve same leave again → 400 ──");
  const r6 = await httpReq("PUT", `/leave/${leaveId}/approve`, adminToken);
  console.log(`  Status: ${r6.status}  Body: ${JSON.stringify(r6.body)}`);
  check("Double-approve returns 400", r6.status, 400);
  check("Error message mentions already approved", r6.body.message.includes("already approved"), true);
  console.log("");

  // =====================================================================
  // TEST 7: PUT /:id/reject with employee (non-admin) token → 403
  // =====================================================================
  console.log("── TEST 7: PUT /reject with employee token → 403 ──");
  
  // Create a new pending leave for reject tests
  const rejectLeaveDoc = await Leave.create({
    employeeId: empDoc._id,
    type: "sick",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-02"),
    allocationDays: 2,
    status: "pending",
  });
  const rejectLeaveId = rejectLeaveDoc._id.toString();

  const r7 = await httpReq("PUT", `/leave/${rejectLeaveId}/reject`, empToken, {
    adminComment: "I'm not an admin",
  });
  console.log(`  Status: ${r7.status}  Body: ${JSON.stringify(r7.body)}`);
  check("Non-admin reject returns 403", r7.status, 403);
  console.log("");

  // =====================================================================
  // TEST 8: PUT /:id/reject with admin token → 200
  // =====================================================================
  console.log("── TEST 8: PUT /reject with admin token → 200 ──");
  const r8 = await httpReq("PUT", `/leave/${rejectLeaveId}/reject`, adminToken, {
    adminComment: "Rejected, too busy",
  });
  console.log(`  Status: ${r8.status}  Body: ${JSON.stringify(r8.body, null, 2)}`);
  check("Admin reject returns 200", r8.status, 200);
  check("Status changed to rejected", r8.body.status, "rejected");
  check("adminComment stored", r8.body.adminComment, "Rejected, too busy");
  console.log("");

  // =====================================================================
  // TEST 9: PUT /:id/reject again → 400 (already rejected)
  // =====================================================================
  console.log("── TEST 9: PUT /reject same leave again → 400 ──");
  const r9 = await httpReq("PUT", `/leave/${rejectLeaveId}/reject`, adminToken);
  console.log(`  Status: ${r9.status}  Body: ${JSON.stringify(r9.body)}`);
  check("Double-reject returns 400", r9.status, 400);
  check("Error message mentions already rejected", r9.body.message.includes("already rejected"), true);
  console.log("");

  // =====================================================================
  // TEST 10: GET /leave with admin token → 200, all leaves populated
  // =====================================================================
  console.log("── TEST 10: GET /leave (admin) → 200, all leaves + populated ──");
  const r10 = await httpReq("GET", "/leave", adminToken);
  console.log(`  Status: ${r10.status}  Count: ${r10.body.length}`);
  check("Admin GET returns 200", r10.status, 200);
  
  const hasEmpLeave = r10.body.some(l => l.employeeId._id === empDoc._id.toString());
  const hasAdminLeave2 = r10.body.some(l => l.employeeId._id === adminDoc._id.toString());
  
  check("Admin sees leaves from Employee", hasEmpLeave, true);
  check("Admin sees leaves from Admin (themselves)", hasAdminLeave2, true);
  
  // Check population
  const sampleLeave = r10.body[0];
  check("employeeId is populated as object", typeof sampleLeave.employeeId, "object");
  check("employeeId contains name", !!sampleLeave.employeeId.name, true);
  console.log("");

  // =====================================================================
  // TEST 11: POST /leave with dates spanning a public holiday -> allocationDays correctly excludes it
  // =====================================================================
  console.log("── TEST 11: POST /leave spanning a holiday ──");
  const r11 = await httpReq("POST", "/leave", empToken, {
    type: "paid",
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    remarks: "Holiday overlap test"
  });
  console.log(`  Status: ${r11.status}  Body: ${JSON.stringify(r11.body)}`);
  check("Holiday POST returns 201", r11.status, 201);
  check("allocationDays is 2 (3 inclusive days minus 1 holiday)", r11.body.allocationDays, 2);
  console.log("");

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log("════════════════════════════════════════");
  console.log(`${passedChecks}/${totalChecks} checks passed.`);
  if (passedChecks === totalChecks) {
    console.log("\n✅ All assertions passed!");
  } else {
    console.log(`\n❌ ${totalChecks - passedChecks} assertion(s) failed.`);
  }

  // ── Cleanup ────────────────────────────────────────────────────────
  await Leave.deleteMany({ employeeId: { $in: [empDoc._id, adminDoc._id] } });
  await Employee.findByIdAndDelete(empDoc._id);
  await Employee.findByIdAndDelete(adminDoc._id);
  console.log("Test data cleaned up.");

  await mongoose.disconnect();
  process.exit(passedChecks === totalChecks ? 0 : 1);
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  mongoose.disconnect();
  process.exit(1);
});

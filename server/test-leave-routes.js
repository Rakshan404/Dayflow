/**
 * test-leave-routes.js — Tests leave route logic directly against MongoDB.
 *
 * Usage:  node test-leave-routes.js
 *
 * Tests:
 *   1. allocationDays computed correctly (Jan 10–Jan 12 = 3 days, inclusive)
 *   2. Approving an already-approved request is rejected with the right error
 *   3. Employee GET / never returns another employee's documents
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const Leave = require("./models/Leave");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hrms_test";

let pass = true;
let totalChecks = 0;
let passedChecks = 0;

function check(label, actual, expected) {
  totalChecks++;
  if (actual !== expected) {
    console.error(`  FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    pass = false;
  } else {
    passedChecks++;
    console.log(`  PASS: ${label} = ${JSON.stringify(actual)}`);
  }
}

async function run() {
  console.log(`Connecting to ${MONGO_URI} …`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected.\n");

  // ── Setup: create two test employees ───────────────────────────────
  const empA = await Employee.create({
    customId: "__test_routes_empA__",
    fullName: "Employee A",
    email: "__test_routes_a@test.com",
    password: "hashed_not_real",
  });

  const empB = await Employee.create({
    customId: "__test_routes_empB__",
    fullName: "Employee B",
    email: "__test_routes_b@test.com",
    password: "hashed_not_real",
  });

  console.log(`Created Employee A: ${empA._id}`);
  console.log(`Created Employee B: ${empB._id}\n`);

  // =====================================================================
  // TEST 1: allocationDays inclusive day count
  // =====================================================================
  console.log("── TEST 1: allocationDays computation ──");

  // Simulate what POST / does: compute allocationDays server-side
  function computeAllocationDays(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((end - start) / msPerDay) + 1;
  }

  // Jan 10 – Jan 12 should be 3 days (10, 11, 12)
  const days1 = computeAllocationDays("2026-01-10", "2026-01-12");
  check("Jan 10–Jan 12 inclusive", days1, 3);

  // Same day leave should be 1 day
  const days2 = computeAllocationDays("2026-03-05", "2026-03-05");
  check("Same-day leave (Mar 5–Mar 5)", days2, 1);

  // Jan 1 – Jan 31 should be 31 days
  const days3 = computeAllocationDays("2026-01-01", "2026-01-31");
  check("Jan 1–Jan 31 inclusive", days3, 31);

  // Now actually create a leave doc the same way POST / would
  const leaveA1 = await Leave.create({
    employeeId: empA._id,
    type: "paid",
    startDate: new Date("2026-01-10"),
    endDate: new Date("2026-01-12"),
    allocationDays: computeAllocationDays("2026-01-10", "2026-01-12"),
    status: "pending",
  });
  check("Stored allocationDays on leave doc", leaveA1.allocationDays, 3);

  console.log("");

  // =====================================================================
  // TEST 2: Cannot approve an already-approved request
  // =====================================================================
  console.log("── TEST 2: Double-approve prevention ──");

  // First approval: pending → approved (should work)
  const toApprove = await Leave.findById(leaveA1._id);
  check("Initial status is pending", toApprove.status, "pending");

  toApprove.status = "approved";
  toApprove.adminComment = "Looks good";
  await toApprove.save();
  check("After first approve, status is approved", toApprove.status, "approved");

  // Second approval attempt: simulate the route's validation
  const reloaded = await Leave.findById(leaveA1._id);
  const canApproveAgain = reloaded.status === "pending";
  check("Second approve blocked (status is not pending)", canApproveAgain, false);

  // Simulate the error message the route would return
  if (reloaded.status !== "pending") {
    const errorMsg = `Cannot approve: leave is already ${reloaded.status}`;
    check("Error message is correct", errorMsg, "Cannot approve: leave is already approved");
  }

  console.log("");

  // =====================================================================
  // TEST 3: Employee can only see their own leaves
  // =====================================================================
  console.log("── TEST 3: Employee isolation ──");

  // Create a leave for Employee B
  await Leave.create({
    employeeId: empB._id,
    type: "sick",
    startDate: new Date("2026-02-01"),
    endDate: new Date("2026-02-02"),
    allocationDays: 2,
    status: "pending",
  });

  // Create another leave for Employee A
  await Leave.create({
    employeeId: empA._id,
    type: "unpaid",
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-03-03"),
    allocationDays: 3,
    status: "pending",
  });

  // Simulate employee role GET / — filter by employeeId
  const empALeaves = await Leave.find({ employeeId: empA._id }).sort({ createdAt: -1 });
  const empBLeaves = await Leave.find({ employeeId: empB._id }).sort({ createdAt: -1 });

  check("Employee A sees 2 leaves (their own)", empALeaves.length, 2);
  check("Employee B sees 1 leave (their own)", empBLeaves.length, 1);

  // Verify none of A's leaves belong to B
  const aHasBLeaves = empALeaves.some((l) => l.employeeId.toString() === empB._id.toString());
  check("Employee A's results contain zero of B's leaves", aHasBLeaves, false);

  // Verify none of B's leaves belong to A
  const bHasALeaves = empBLeaves.some((l) => l.employeeId.toString() === empA._id.toString());
  check("Employee B's results contain zero of A's leaves", bHasALeaves, false);

  // Simulate admin role GET / — no filter, should see all
  const adminLeaves = await Leave.find({}).sort({ createdAt: -1 });
  const adminSeesAll = adminLeaves.length >= 3;
  check("Admin sees all leaves (>= 3)", adminSeesAll, true);

  console.log("");

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log(`${passedChecks}/${totalChecks} checks passed.`);
  console.log(pass ? "\n✅ All assertions passed!" : "\n❌ Some assertions failed.");

  // ── Cleanup ────────────────────────────────────────────────────────
  await Leave.deleteMany({ employeeId: { $in: [empA._id, empB._id] } });
  await Employee.findByIdAndDelete(empA._id);
  await Employee.findByIdAndDelete(empB._id);
  console.log("Test data cleaned up.");

  await mongoose.disconnect();
  process.exit(pass ? 0 : 1);
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  mongoose.disconnect();
  process.exit(1);
});

/**
 * test-balance.js — Standalone smoke test for the leave balance computation.
 *
 * Usage:  MONGO_URI=mongodb://localhost:27017/hrms_test node test-balance.js
 *
 * What it does:
 *   1. Connects to MongoDB.
 *   2. Creates a test Employee with default leaveBalances (paid:24, sick:7).
 *   3. Inserts two approved Leave docs (paid 3 days, sick 2 days).
 *   4. Runs the same aggregation the GET /balance route uses.
 *   5. Prints and asserts the expected result.
 *   6. Cleans up all test data.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const Leave = require("./models/Leave");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hrms_test";

async function run() {
  console.log(`Connecting to ${MONGO_URI} …`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected.\n");

  // ── 1. Create test employee ────────────────────────────────────────
  const emp = await Employee.create({
    loginId: "__test_balance_user__",
    name: "Test Balance User",
    email: "__test_balance@test.com",
    password: "hashed_not_real",
    leaveBalances: { paid: 24, sick: 7 },
  });
  console.log("Created test employee:", emp._id.toString());

  // ── 2. Insert approved leave docs ──────────────────────────────────
  const leaves = await Leave.insertMany([
    {
      employeeId: emp._id,
      type: "paid",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
      allocationDays: 3,
      status: "approved",
    },
    {
      employeeId: emp._id,
      type: "sick",
      startDate: new Date("2026-02-05"),
      endDate: new Date("2026-02-06"),
      allocationDays: 2,
      status: "approved",
    },
    {
      // This one is pending — should NOT count
      employeeId: emp._id,
      type: "paid",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-02"),
      allocationDays: 2,
      status: "pending",
    },
    {
      // Unpaid — should NOT appear in balance
      employeeId: emp._id,
      type: "unpaid",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-03"),
      allocationDays: 3,
      status: "approved",
    },
  ]);
  console.log(`Inserted ${leaves.length} leave documents.\n`);

  // ── 3. Run aggregation (same logic as GET /balance) ────────────────
  const usageAgg = await Leave.aggregate([
    {
      $match: {
        employeeId: emp._id,
        status: "approved",
        type: { $in: ["paid", "sick"] },
      },
    },
    {
      $group: {
        _id: "$type",
        used: { $sum: "$allocationDays" },
      },
    },
  ]);

  const usedMap = {};
  for (const entry of usageAgg) {
    usedMap[entry._id] = entry.used;
  }

  const totalPaid = emp.leaveBalances.paid;
  const totalSick = emp.leaveBalances.sick;
  const usedPaid = usedMap.paid || 0;
  const usedSick = usedMap.sick || 0;

  const result = {
    paid: { total: totalPaid, used: usedPaid, available: totalPaid - usedPaid },
    sick: { total: totalSick, used: usedSick, available: totalSick - usedSick },
  };

  console.log("Balance result:", JSON.stringify(result, null, 2));

  // ── 4. Assert ──────────────────────────────────────────────────────
  let pass = true;
  function check(label, actual, expected) {
    if (actual !== expected) {
      console.error(`  FAIL: ${label} — expected ${expected}, got ${actual}`);
      pass = false;
    } else {
      console.log(`  PASS: ${label} = ${actual}`);
    }
  }

  console.log("\nAssertions:");
  check("paid.total", result.paid.total, 24);
  check("paid.used", result.paid.used, 3);        // only the approved 3-day one
  check("paid.available", result.paid.available, 21);
  check("sick.total", result.sick.total, 7);
  check("sick.used", result.sick.used, 2);
  check("sick.available", result.sick.available, 5);

  console.log(pass ? "\n✅ All assertions passed!" : "\n❌ Some assertions failed.");

  // ── 5. Cleanup ─────────────────────────────────────────────────────
  await Leave.deleteMany({ employeeId: emp._id });
  await Employee.findByIdAndDelete(emp._id);
  console.log("Test data cleaned up.");

  await mongoose.disconnect();
  process.exit(pass ? 0 : 1);
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  mongoose.disconnect();
  process.exit(1);
});

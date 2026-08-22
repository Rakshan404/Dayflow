const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Employee = require("./models/Employee");

const BASE_URL = "http://localhost:5000/api";
const SECRET = process.env.JWT_SECRET;

async function httpReq(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      method,
      headers: {},
    };
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    if (body) {
      opts.headers["Content-Type"] = "application/json";
    }

    const req = http.request(`${BASE_URL}${path}`, opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`  PASS: ${name}`);
    return true;
  } else {
    console.log(`  FAIL: ${name}. Expected ${expected}, got ${actual}`);
    return false;
  }
}

async function run() {
  console.log("Connecting to MongoDB …");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  // Setup test users
  const empDoc = await Employee.create({
    loginId: "test_alloc_emp",
    name: "Alloc Employee",
    email: "alloc_emp@test.com",
    password: "x",
    role: "employee",
    leaveBalances: { paid: 24, sick: 7 },
  });

  const adminDoc = await Employee.create({
    loginId: "test_alloc_admin",
    name: "Alloc Admin",
    email: "alloc_adm@test.com",
    password: "x",
    role: "admin",
  });

  const empId = empDoc._id.toString();
  const empToken = jwt.sign({ id: empId, role: "employee" }, SECRET);
  const adminToken = jwt.sign({ id: adminDoc._id.toString(), role: "admin" }, SECRET);

  console.log(`Employee ID: ${empId}`);
  console.log(`Employee JWT: ${empToken.substring(0, 30)}…`);
  console.log(`Admin JWT:    ${adminToken.substring(0, 30)}…\n`);

  let passed = 0;
  let total = 0;
  const assert = (name, a, e) => { total++; if (check(name, a, e)) passed++; };

  // 1. No auth -> 401
  console.log("── TEST 1: PUT /employees/:id/leave-balance without auth → 401 ──");
  const r1 = await httpReq("PUT", `/employees/${empId}/leave-balance`, null, { paid: 30, sick: 10 });
  console.log(`  Status: ${r1.status}  Body: ${JSON.stringify(r1.body)}`);
  assert("No-auth returns 401", r1.status, 401);
  console.log("");

  // 2. Employee token -> 403
  console.log("── TEST 2: PUT /employees/:id/leave-balance with employee token → 403 ──");
  const r2 = await httpReq("PUT", `/employees/${empId}/leave-balance`, empToken, { paid: 30, sick: 10 });
  console.log(`  Status: ${r2.status}  Body: ${JSON.stringify(r2.body)}`);
  assert("Non-admin returns 403", r2.status, 403);
  console.log("");

  // 3. Admin token valid -> 200
  console.log("── TEST 3: PUT /employees/:id/leave-balance with admin token (valid) → 200 ──");
  const r3 = await httpReq("PUT", `/employees/${empId}/leave-balance`, adminToken, { paid: 30, sick: 10 });
  console.log(`  Status: ${r3.status}  Body: ${JSON.stringify(r3.body)}`);
  assert("Admin valid update returns 200", r3.status, 200);
  assert("Response body has new paid balance", r3.body.leaveBalances.paid, 30);
  assert("Response body has new sick balance", r3.body.leaveBalances.sick, 10);
  
  // Verify persistence in DB directly
  const empRefetched = await Employee.findById(empId);
  assert("DB persistence paid = 30", empRefetched.leaveBalances.paid, 30);
  assert("DB persistence sick = 10", empRefetched.leaveBalances.sick, 10);
  console.log("");

  // 4. Admin token negative number -> 400
  console.log("── TEST 4: PUT /employees/:id/leave-balance with negative number → 400 ──");
  const r4 = await httpReq("PUT", `/employees/${empId}/leave-balance`, adminToken, { paid: -5, sick: 10 });
  console.log(`  Status: ${r4.status}  Body: ${JSON.stringify(r4.body)}`);
  assert("Negative number returns 400", r4.status, 400);
  console.log("");

  // 5. Admin token non-numeric value -> 400
  console.log("── TEST 5: PUT /employees/:id/leave-balance with non-numeric value → 400 ──");
  const r5 = await httpReq("PUT", `/employees/${empId}/leave-balance`, adminToken, { paid: "thirty", sick: 10 });
  console.log(`  Status: ${r5.status}  Body: ${JSON.stringify(r5.body)}`);
  assert("Non-numeric returns 400", r5.status, 400);
  console.log("");

  console.log("════════════════════════════════════════");
  console.log(`${passed}/${total} checks passed.`);
  if (passed === total) console.log("\n✅ All assertions passed!");
  else console.log("\n❌ Some assertions failed!");

  await Employee.deleteMany({ loginId: { $in: ["test_alloc_emp", "test_alloc_admin"] } });
  console.log("Test data cleaned up.");
  process.exit(passed === total ? 0 : 1);
}

run();

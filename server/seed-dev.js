require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const Leave = require("./models/Leave");

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);
  const emp = await Employee.create({
    customId: "dev_user",
    fullName: "Dev Employee",
    email: "dev@test.com",
    password: "hashed_not_real",
    role: "employee",
    leaveBalances: { paid: 24, sick: 7 },
  });
  await Leave.create({
    employeeId: emp._id,
    type: "paid",
    startDate: new Date("2026-08-01"),
    endDate: new Date("2026-08-03"),
    allocationDays: 3,
    status: "approved",
  });
  console.log("ID:", emp._id.toString());
  process.exit(0);
}
seed();

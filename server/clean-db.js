require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const Leave = require("./models/Leave");
const Attendance = require("./models/Attendance");
const Salary = require("./models/Salary");

const MONGO_URI = process.env.MONGO_URI;

const targetNames = [
  "Test Balance User", 
  "HTTP Test Employee", 
  "HTTP Test Admin", 
  "Alloc Employee", 
  "Alloc Admin", 
  "Dev Employee", 
  "UI Employee", 
  "UI Admin"
];
const targetIds = ["dev_user"];

async function clean() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const employees = await Employee.MongooseModel.find({});
  console.log(`Found ${employees.length} total employees.`);

  for (const emp of employees) {
    const isTarget = targetNames.includes(emp.name) || targetNames.includes(emp.fullName) || targetIds.includes(emp.customId) || targetIds.includes(emp.loginId);
    
    if (isTarget) {
      console.log(`Deleting employee: ${emp.name || emp.fullName} (${emp._id})`);
      await Leave.deleteMany({ employeeId: emp._id });
      await Attendance.deleteMany({ employeeId: emp._id });
      await Salary.deleteMany({ employeeId: emp._id });
      await Employee.MongooseModel.findByIdAndDelete(emp._id);
    }
  }

  console.log("Database cleanup complete.");
  process.exit(0);
}

clean();

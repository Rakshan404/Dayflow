require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const Salary = require("./models/Salary");

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // Get all employees
  const employees = await Employee.MongooseModel.find({});
  console.log(`Found ${employees.length} employees.`);

  // Create salary for each employee
  for (const emp of employees) {
    const existing = await Salary.findOne({ employeeId: emp._id });
    if (!existing) {
      const base = 5000 + Math.floor(Math.random() * 5000);
      await Salary.create({
        employeeId: emp._id,
        monthlyWage: base,
        compensationType: "percentage",
        basicPercent: 50,
        hraPercent: 20,
        standardAllowance: 200,
        travelAllowance: 100,
        foodAllowance: 150,
        pfContribution: 12,
        professionalTax: 50,
      });
      console.log(`Created salary for ${emp.name || emp.fullName}`);
    } else {
      console.log(`Salary already exists for ${emp.name || emp.fullName}`);
    }
  }

  console.log("Done seeding salaries.");
  process.exit(0);
}
seed();

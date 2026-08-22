const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
    monthlyWage: { type: Number, default: 0 },
    workingDaysPerWeek: { type: Number, default: 5 },
    breakTime: { type: Number, default: 60 },
    // Components (Percentages of Monthly Wage except PF which is % of Basic, and PT which is flat)
    basicPercent: { type: Number, default: 50 },
    hraPercent: { type: Number, default: 50 }, // 50% of Basic
    standardAllowancePercent: { type: Number, default: 16.67 },
    performanceBonusPercent: { type: Number, default: 8.33 },
    ltaPercent: { type: Number, default: 8.33 },
    pfEmployeePercent: { type: Number, default: 12 }, // 12% of Basic
    pfEmployerPercent: { type: Number, default: 12 }, // 12% of Basic
    professionalTax: { type: Number, default: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", salarySchema);

const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
    monthlyWage: Number,
    compensationType: { type: String, enum: ["fixed", "percentage"], default: "percentage" },
    basicPercent: Number,
    hraPercent: Number,
    standardAllowance: Number,
    travelAllowance: Number,
    foodAllowance: Number,
    pfContribution: Number,
    professionalTax: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", salarySchema);

const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    loginId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    phone: String,
    department: String,
    designation: String,
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    dateOfJoining: Date,
    profilePicture: String,
    address: String,
    about: String,
    skills: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);

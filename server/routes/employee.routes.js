const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const Employee = require("../models/Employee");

const Attendance = require("../models/Attendance");

// Owner: Person A
// TODO: Built this out of necessity for the Dashboard wireframe match.
// Person A should take ownership of this moving forward!
router.get("/", verifyToken, async (req, res) => {
  try {
    const employees = await Employee.MongooseModel.find({}).select("-password");
    
    // Get today's attendance to compute status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const attendanceMap = {};
    attendances.forEach(att => {
      attendanceMap[att.employeeId.toString()] = att.status;
    });

    const result = employees.map(emp => {
      const empObj = emp.toObject();
      empObj.status = attendanceMap[emp._id.toString()] || "absent";
      return empObj;
    });

    res.json(result);
  } catch (err) {
    console.error("List employees error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("Get employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === "Admin" || req.user.role === "admin";
    const isSelf = req.user.id === req.params.id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Unauthorized to edit this profile" });
    }

    // Don't allow non-admins to change their role, email (unless we have a verification flow), etc.
    // We'll just filter out the fields they can update, or allow all for simplicity in MVP.
    const updates = { ...req.body };
    if (!isAdmin) {
      delete updates.role;
      delete updates.leaveBalances;
      delete updates.customId;
    }

    const updated = await Employee.MongooseModel.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "Employee not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/employees/:id/leave-balance — admin overwrite of an employee's leave totals
router.put("/:id/leave-balance", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { paid, sick } = req.body;

    if (typeof paid !== "number" || typeof sick !== "number") {
      return res.status(400).json({ message: "paid and sick must be numbers" });
    }
    if (paid < 0 || sick < 0) {
      return res.status(400).json({ message: "paid and sick must be non-negative" });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.leaveBalances = { paid, sick };
    await employee.save();

    res.json({ leaveBalances: employee.leaveBalances });
  } catch (err) {
    console.error("Error updating leave balance:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

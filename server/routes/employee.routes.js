const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const Employee = require("../models/Employee");

// Owner: Person A
router.get("/", (req, res) => {
  res.status(501).json({ message: "list employees not implemented yet" });
});

router.get("/:id", (req, res) => {
  res.status(501).json({ message: "get employee not implemented yet" });
});

router.put("/:id", (req, res) => {
  res.status(501).json({ message: "update employee not implemented yet" });
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

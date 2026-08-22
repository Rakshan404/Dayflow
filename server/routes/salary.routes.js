const express = require("express");
const router = express.Router();
const Salary = require("../models/Salary");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Owner: Person D (you)

// Anyone logged in can request this route, but they can only see their OWN
// salary unless they are an admin. This check MUST be on the server —
// a frontend-only check can be bypassed by calling the API directly.
router.get("/:employeeId", verifyToken, async (req, res) => {
  const isAdmin = req.user.role === "Admin" || req.user.role === "admin";
  const isSelf = req.user.id === req.params.employeeId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to view this employee's salary.",
    });
  }

  try {
    const salary = await Salary.findOne({ employeeId: req.params.employeeId });
    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found." });
    }
    return res.status(200).json({ success: true, salary });
  } catch (err) {
    console.error("Get salary error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// Only admins can edit salary structure — no self-editing.
router.put("/:employeeId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const updated = await Salary.findOneAndUpdate(
      { employeeId: req.params.employeeId },
      req.body,
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, salary: updated });
  } catch (err) {
    console.error("Update salary error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");

// Owner: Person C

// GET /api/leave/balance — returns logged-in user's leave balances (live-computed)
router.get("/balance", verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const totalPaid = employee.leaveBalances?.paid ?? 24;
    const totalSick = employee.leaveBalances?.sick ?? 7;

    // Sum approved allocationDays grouped by type (paid, sick only)
    const usageAgg = await Leave.aggregate([
      {
        $match: {
          employeeId: employee._id,
          status: "approved",
          type: { $in: ["paid", "sick"] },
        },
      },
      {
        $group: {
          _id: "$type",
          used: { $sum: "$allocationDays" },
        },
      },
    ]);

    const usedMap = {};
    for (const entry of usageAgg) {
      usedMap[entry._id] = entry.used;
    }

    const usedPaid = usedMap.paid || 0;
    const usedSick = usedMap.sick || 0;

    res.json({
      paid: { total: totalPaid, used: usedPaid, available: totalPaid - usedPaid },
      sick: { total: totalSick, used: usedSick, available: totalSick - usedSick },
    });
  } catch (err) {
    console.error("Error fetching leave balance:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/leave — list leave documents
// Admin: all leaves (populated with employee name/department). Employee: own leaves only.
router.get("/", verifyToken, async (req, res) => {
  try {
    // Admin sees all leaves, employee sees only their own
    const filter = req.user.role?.toLowerCase() === "admin" ? {} : { employeeId: req.user.id };
    const leaves = await Leave.find(filter)
      .populate("employeeId", "name department")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    console.error("Error listing leaves:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/leave — apply for leave
router.post("/", verifyToken, async (req, res) => {
  try {
    const { type, startDate, endDate, remarks } = req.body;

    // Validate type
    const validTypes = ["paid", "sick", "unpaid"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ message: "type must be one of: paid, sick, unpaid" });
    }

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "startDate and endDate must be valid dates" });
    }

    if (end < start) {
      return res.status(400).json({ message: "endDate must not be before startDate" });
    }

    // Compute allocationDays as inclusive day count, excluding public holidays
    const { PUBLIC_HOLIDAYS_2026 } = require("../utils/holidays");
    
    // Normalize to UTC midnight to safely iterate days without local timezone shifts
    const utcStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const utcEnd = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    
    let days = 0;
    let currentUtc = utcStart;
    const msPerDay = 24 * 60 * 60 * 1000;
    
    while (currentUtc <= utcEnd) {
      const d = new Date(currentUtc);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      if (!PUBLIC_HOLIDAYS_2026.includes(dateStr)) {
        days++;
      }
      currentUtc += msPerDay;
    }
    
    const allocationDays = days;

    const leave = await Leave.create({
      employeeId: req.user.id,
      type,
      startDate: start,
      endDate: end,
      allocationDays,
      remarks: remarks || undefined,
      status: "pending",
    });

    res.status(201).json(leave);
  } catch (err) {
    console.error("Error creating leave:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/leave/:id/approve — admin approves a pending leave request
router.put("/:id/approve", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: `Cannot approve: leave is already ${leave.status}`,
      });
    }

    leave.status = "approved";
    if (req.body.adminComment) {
      leave.adminComment = req.body.adminComment;
    }
    await leave.save();

    res.json(leave);
  } catch (err) {
    console.error("Error approving leave:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/leave/:id/reject — admin rejects a pending leave request
router.put("/:id/reject", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid leave ID" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: `Cannot reject: leave is already ${leave.status}`,
      });
    }

    leave.status = "rejected";
    if (req.body.adminComment) {
      leave.adminComment = req.body.adminComment;
    }
    await leave.save();

    res.json(leave);
  } catch (err) {
    console.error("Error rejecting leave:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

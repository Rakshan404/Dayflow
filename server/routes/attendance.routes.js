const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

router.get("/all", verifyToken, async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate("employeeId", "name fullName email");

    const formatted = attendances.map(a => ({
      _id: a._id,
      employeeName: a.employeeId?.name || a.employeeId?.fullName || "Unknown",
      status: a.status,
      checkIn: a.checkIn || "-",
      checkOut: a.checkOut || "-",
      workHours: a.workHours || 0,
      extraHours: a.extraHours || 0
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Error in /all:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Owner: Person B
router.get("/:employeeId", verifyToken, async (req, res) => {
  try {
    const attendance = await Attendance.find({ employeeId: req.params.employeeId }).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/checkin", verifyToken, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let att = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!att) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      att = new Attendance({
        employeeId: req.user.id,
        date: now,
        checkIn: timeStr,
        status: "present"
      });
      await att.save();
    }
    res.json(att);
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let att = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!att) {
      return res.status(400).json({ message: "You haven't checked in today." });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    att.checkOut = timeStr;

    // Calculate work hours if checkIn exists
    if (att.checkIn) {
      const [inH, inM] = att.checkIn.split(":").map(Number);
      const workH = now.getHours() - inH + (now.getMinutes() - inM) / 60;
      att.workHours = parseFloat(workH.toFixed(1));
      att.extraHours = Math.max(0, att.workHours - 8);
    }
    
    await att.save();
    res.json(att);
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

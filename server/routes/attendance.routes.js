const express = require("express");
const router = express.Router();

// Owner: Person B
router.get("/:employeeId", (req, res) => {
  res.status(501).json({ message: "get attendance not implemented yet" });
});

router.post("/checkin", (req, res) => {
  res.status(501).json({ message: "check-in not implemented yet" });
});

router.post("/checkout", (req, res) => {
  res.status(501).json({ message: "check-out not implemented yet" });
});

module.exports = router;

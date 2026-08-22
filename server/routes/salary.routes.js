const express = require("express");
const router = express.Router();

// Owner: Person D (you)
router.get("/:employeeId", (req, res) => {
  res.status(501).json({ message: "get salary not implemented yet" });
});

router.put("/:employeeId", (req, res) => {
  res.status(501).json({ message: "update salary not implemented yet" });
});

module.exports = router;

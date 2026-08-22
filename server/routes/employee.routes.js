const express = require("express");
const router = express.Router();

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

module.exports = router;

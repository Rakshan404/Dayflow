const express = require("express");
const router = express.Router();

// Owner: Person C
router.get("/", (req, res) => {
  res.status(501).json({ message: "list leaves not implemented yet" });
});

router.post("/", (req, res) => {
  res.status(501).json({ message: "apply leave not implemented yet" });
});

router.put("/:id/approve", (req, res) => {
  res.status(501).json({ message: "approve leave not implemented yet" });
});

router.put("/:id/reject", (req, res) => {
  res.status(501).json({ message: "reject leave not implemented yet" });
});

module.exports = router;

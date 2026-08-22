const express = require("express");
const router = express.Router();

// Owner: Person A
// POST /api/auth/signup
router.post("/signup", (req, res) => {
  res.status(501).json({ message: "signup not implemented yet" });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  res.status(501).json({ message: "login not implemented yet" });
});

module.exports = router;

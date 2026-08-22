const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();


/**
 * Custom ID Format Algorithm:
 * Formula: [Company Prefix][Name Prefix][Joining Year][4-Digit Serial]
 * Example: "Odoo India", "John Doe", 2026 -> OIJODO20260001
 * 
 * 1. Extract first 2 uppercase letters of companyName:
 *    - If multi-word (e.g. "Odoo India"): first char of word 1 + first char of word 2 ("OI")
 *    - If single-word (e.g. "Odoo"): first 2 chars ("OD")
 *    - Fallback padded with "X" if shorter than 2
 * 2. Extract first 2 letters of firstName + first 2 letters of lastName (uppercase).
 *    - If single name: firstName(0..2) + "XX" -> e.g. "JOXX"
 * 3. Append current 4-digit year (e.g. 2026)
 * 4. Query total employee count in current year, add 1, and pad to 4 digits (0001)
 */
async function generateCustomEmployeeId(companyName, fullName, joiningYear) {
  // 1. Company Prefix (2 chars)
  const cleanCompany = (companyName || "Odoo India").trim();
  const companyWords = cleanCompany.split(/\s+/).filter(Boolean);
  let companyPrefix = "";

  if (companyWords.length >= 2) {
    const w1 = companyWords[0].replace(/[^a-zA-Z]/g, "");
    const w2 = companyWords[1].replace(/[^a-zA-Z]/g, "");
    companyPrefix = ((w1[0] || "X") + (w2[0] || "X")).toUpperCase();
  } else {
    const letters = cleanCompany.replace(/[^a-zA-Z]/g, "").toUpperCase();
    companyPrefix = (letters + "XX").slice(0, 2);
  }

  // 2. Name Prefix (4 chars: 2 from first name + 2 from last name)
  const cleanName = (fullName || "Employee").trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  let namePrefix = "";

  if (nameParts.length >= 2) {
    const firstLetters = nameParts[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
    const lastLetters = nameParts[nameParts.length - 1].replace(/[^a-zA-Z]/g, "").toUpperCase();
    const p1 = (firstLetters + "XX").slice(0, 2);
    const p2 = (lastLetters + "XX").slice(0, 2);
    namePrefix = p1 + p2;
  } else {
    const letters = cleanName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const p1 = (letters + "XX").slice(0, 2);
    namePrefix = p1 + "XX";
  }

  // 3. Year (4 digits)
  const year = joiningYear || new Date().getFullYear();

  // 4. Base prefix to search for serial number
  const basePrefix = `${companyPrefix}${namePrefix}${year}`;

  // Query database for employees joined in that year to determine serial sequence
  const yearCount = await Employee.countDocuments({
    joiningYear: year,
  });

  let serialNumber = yearCount + 1;
  let customId = `${basePrefix}${String(serialNumber).padStart(4, "0")}`;

  // Guarantee absolute uniqueness in case of race condition or prior duplicates
  let existing = await Employee.findOne({ customId });
  while (existing) {
    serialNumber += 1;
    customId = `${basePrefix}${String(serialNumber).padStart(4, "0")}`;
    existing = await Employee.findOne({ customId });
  }

  return customId;
}

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new employee/user with auto-generated Custom ID
 * @access  Public / Admin
 */
router.post("/signup", async (req, res) => {
  try {
    const {
      companyName = "Odoo India",

      fullName,
      name,
      email,
      phone = "",
      password,
      confirmPassword,
      role = "Employee",
      joiningYear,
      department = "General",
      designation = "Associate",
    } = req.body;


    const actualName = (fullName || name || "").trim();

    // 1. Validation
    if (!actualName) {
      return res.status(400).json({
        success: false,
        message: "Full Name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // 2. Check if user with this email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmployee = await Employee.findOne({ email: normalizedEmail });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists. Please sign in instead.",
      });
    }

    // 3. Generate custom employee ID
    const year = Number(joiningYear) || new Date().getFullYear();
    const customId = await generateCustomEmployeeId(
      companyName,
      actualName,
      year
    );

    // 4. Hash password with bcrypt (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create employee
    const newEmployee = new Employee({
      customId,
      loginId: customId,
      companyName: companyName.trim() || "Odoo India",
      fullName: actualName,
      name: actualName,
      email: normalizedEmail,
      phone: (phone || "").trim(),
      password: hashedPassword,
      role: role || "Employee",
      joiningYear: year,
      department,
      designation,
    });

    const savedEmployee = await newEmployee.save();

    // 6. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || "supersecretkey123";
    const token = jwt.sign(
      {
        id: savedEmployee._id,
        role: savedEmployee.role,
        customId: savedEmployee.customId,
        email: savedEmployee.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully!",
      token,
      user: {
        id: savedEmployee._id,
        customId: savedEmployee.customId,
        loginId: savedEmployee.loginId,
        fullName: savedEmployee.fullName,
        name: savedEmployee.name,
        email: savedEmployee.email,
        phone: savedEmployee.phone,
        role: savedEmployee.role,
        companyName: savedEmployee.companyName,
        joiningYear: savedEmployee.joiningYear,
        department: savedEmployee.department,
        designation: savedEmployee.designation,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Registration failed. Please try again.",
    });
  }
});


/**
 * @route   POST /api/auth/login
 * @desc    Authenticate employee via Dual Identification (Custom ID / Login ID OR Email) + Password
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const {
      identifier,

      loginIdOrEmail,
      loginId,
      email,
      password,
    } = req.body;


    const loginIdentifier = (
      identifier ||
      loginIdOrEmail ||
      loginId ||
      email ||
      ""
    ).trim();

    // 1. Validation
    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Please enter your Login ID or registered Email address.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    // 2. Dual Identification Lookup:
    // Look up by email (case-insensitive), customId (case-insensitive), or loginId (case-insensitive)
    const normalizedIdentifier = loginIdentifier.toLowerCase();
    const employee = await Employee.findOne({
      $or: [
        { email: normalizedIdentifier },
        { customId: { $regex: new RegExp(`^${loginIdentifier}$`, "i") } },
        { loginId: { $regex: new RegExp(`^${loginIdentifier}$`, "i") } },
      ],
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. No account found with provided Login ID or Email.",
      });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Incorrect password.",
      });
    }

    // 4. Issue JWT Token
    const jwtSecret = process.env.JWT_SECRET || "supersecretkey123";
    const token = jwt.sign(
      {
        id: employee._id,
        role: employee.role,
        customId: employee.customId,
        email: employee.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Signed in successfully!",
      token,
      user: {
        id: employee._id,
        customId: employee.customId,
        loginId: employee.loginId || employee.customId,
        fullName: employee.fullName || employee.name,
        name: employee.name || employee.fullName,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        companyName: employee.companyName,
        joiningYear: employee.joiningYear,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login. Please try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated employee profile
 * @access  Private (JWT Required)
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id).select("-password");
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: employee,
    });
  } catch (err) {
    console.error("Get /me error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving profile.",
    });
  }
});

module.exports = router;


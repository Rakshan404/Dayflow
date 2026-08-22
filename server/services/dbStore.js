const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "employees.json");

const bcrypt = require("bcryptjs");

// ─── Seeded Admin Accounts ────────────────────────────────────────────────────
// Pre-computed bcrypt hashes (salt=10) — avoids slow hashSync on every startup.
//   ADMIN20260001  →  Admin@123
//   ADMIN20260002  →  TeamAdmin@1
//   ADMIN20260003  →  TeamAdmin@2
//   ADMIN20260004  →  TeamAdmin@3
// ─────────────────────────────────────────────────────────────────────────────
const SEED_ADMINS = [
  {
    _id: "admin_master_0001",
    customId: "ADMIN20260001",
    loginId: "ADMIN20260001",
    companyName: "Dayflow HRMS",
    companyLogo: "",
    fullName: "System Administrator",
    name: "System Administrator",
    email: "admin@dayflow.com",
    phone: "+91 98765 00000",
    password: "$2a$10$rLq2olALB.RuqWJxjhnVbO53vYtTf1N1LfG0Q1kXcaigIMk8te.FC",
    role: "Admin",
    joiningYear: 2026,
    department: "Administration",
    designation: "HR Administrator",
    createdAt: "2026-08-22T08:16:11.657Z",
    updatedAt: "2026-08-22T08:16:11.657Z",
  },
  {
    _id: "admin_team_0002",
    customId: "ADMIN20260002",
    loginId: "ADMIN20260002",
    companyName: "Dayflow HRMS",
    companyLogo: "",
    fullName: "Team Admin 2",
    name: "Team Admin 2",
    email: "admin2@dayflow.com",
    phone: "",
    password: "$2a$10$5S7CxAupOwysBMKultaTleQVDSAp8omWOMy.y9l60Nnm1X5xu8bDy",
    role: "Admin",
    joiningYear: 2026,
    department: "Administration",
    designation: "HR Administrator",
    createdAt: "2026-08-22T09:00:00.000Z",
    updatedAt: "2026-08-22T09:00:00.000Z",
  },
  {
    _id: "admin_team_0003",
    customId: "ADMIN20260003",
    loginId: "ADMIN20260003",
    companyName: "Dayflow HRMS",
    companyLogo: "",
    fullName: "Team Admin 3",
    name: "Team Admin 3",
    email: "admin3@dayflow.com",
    phone: "",
    password: "$2a$10$Fa7jdBRPH21XPce74HxDkOpKLk4ShQnNa6KOx0o.sXSxEJlYJFLXe",
    role: "Admin",
    joiningYear: 2026,
    department: "Administration",
    designation: "HR Administrator",
    createdAt: "2026-08-22T09:00:00.000Z",
    updatedAt: "2026-08-22T09:00:00.000Z",
  },
  {
    _id: "admin_team_0004",
    customId: "ADMIN20260004",
    loginId: "ADMIN20260004",
    companyName: "Dayflow HRMS",
    companyLogo: "",
    fullName: "Team Admin 4",
    name: "Team Admin 4",
    email: "admin4@dayflow.com",
    phone: "",
    password: "$2a$10$cO469DnTtS3zS4tx7rX5keA1788Wu/m4Df4caApRPJ8/0gCtF.9Xy",
    role: "Admin",
    joiningYear: 2026,
    department: "Administration",
    designation: "HR Administrator",
    createdAt: "2026-08-22T09:00:00.000Z",
    updatedAt: "2026-08-22T09:00:00.000Z",
  },
];

// Ensure data directory exists and all seeded admins are present
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let list = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      list = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
    } catch {
      list = [];
    }
  }

  // Inject any missing seeded admin (identified by customId)
  let changed = false;
  for (const admin of SEED_ADMINS) {
    const exists = list.some((e) => e.customId === admin.customId);
    if (!exists) {
      list.unshift(admin);
      changed = true;
    }
  }

  if (changed || !fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
  }
}


function readEmployees() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeEmployees(employees) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2), "utf8");
}

class LocalEmployeeInstance {
  constructor(data) {
    this._id = data._id || crypto.randomBytes(12).toString("hex");
    this.customId = data.customId;
    this.loginId = data.loginId || data.customId;
    this.companyName = data.companyName || "Odoo India";
    this.companyLogo = data.companyLogo || "";
    this.fullName = data.fullName || data.name;
    this.name = data.name || data.fullName;
    this.email = (data.email || "").toLowerCase().trim();
    this.phone = data.phone || "";
    this.password = data.password;
    this.role = data.role || "Employee";
    this.joiningYear = data.joiningYear || new Date().getFullYear();
    this.department = data.department || "General";
    this.designation = data.designation || "Associate";
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async save() {
    const list = readEmployees();
    // Check if updating existing or inserting new
    const idx = list.findIndex(
      (e) => e._id === this._id || (e.email && e.email === this.email)
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...this, updatedAt: new Date().toISOString() };
    } else {
      list.push(this);
    }
    writeEmployees(list);
    return this;
  }
}

const LocalEmployeeStore = {
  async countDocuments(filter = {}) {
    const list = readEmployees();
    if (filter.joiningYear) {
      return list.filter((e) => Number(e.joiningYear) === Number(filter.joiningYear)).length;
    }
    return list.length;
  },

  async findOne(query = {}) {
    const list = readEmployees();

    if (query.$or && Array.isArray(query.$or)) {
      for (const item of list) {
        for (const cond of query.$or) {
          if (cond.email && item.email && item.email.toLowerCase() === cond.email.toLowerCase()) {
            return new LocalEmployeeInstance(item);
          }
          if (cond.customId) {
            const regex = cond.customId.$regex || cond.customId;
            if (typeof regex === "object" && regex.test) {
              if (regex.test(item.customId)) return new LocalEmployeeInstance(item);
            } else if (item.customId && item.customId.toLowerCase() === String(cond.customId).toLowerCase()) {
              return new LocalEmployeeInstance(item);
            }
          }
          if (cond.loginId) {
            const regex = cond.loginId.$regex || cond.loginId;
            if (typeof regex === "object" && regex.test) {
              if (regex.test(item.loginId)) return new LocalEmployeeInstance(item);
            } else if (item.loginId && item.loginId.toLowerCase() === String(cond.loginId).toLowerCase()) {
              return new LocalEmployeeInstance(item);
            }
          }
        }
      }
      return null;
    }

    if (query.email) {
      const target = (query.email || "").toLowerCase().trim();
      const found = list.find((e) => e.email && e.email.toLowerCase() === target);
      return found ? new LocalEmployeeInstance(found) : null;
    }

    if (query.customId) {
      const target = (query.customId || "").toLowerCase().trim();
      const found = list.find((e) => e.customId && e.customId.toLowerCase() === target);
      return found ? new LocalEmployeeInstance(found) : null;
    }

    if (query._id) {
      const found = list.find((e) => e._id === query._id);
      return found ? new LocalEmployeeInstance(found) : null;
    }

    return list.length > 0 ? new LocalEmployeeInstance(list[0]) : null;
  },

  findById(id) {
    const list = readEmployees();
    const found = list.find((e) => e._id === id);
    const inst = found ? new LocalEmployeeInstance(found) : null;
    return {
      select: (fields) => {
        if (!inst) return Promise.resolve(null);
        if (fields.includes("-password")) {
          const clone = { ...inst };
          delete clone.password;
          return Promise.resolve(clone);
        }
        return Promise.resolve(inst);
      },
      then: (resolve) => resolve(inst),
    };
  },
};

module.exports = {
  LocalEmployeeInstance,
  LocalEmployeeStore,
};

const mongoose = require("mongoose");
const { LocalEmployeeInstance, LocalEmployeeStore } = require("../services/dbStore");

const employeeSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    loginId: {
      type: String,
      index: true,
    },
    companyName: {
      type: String,
      default: "Odoo India",
      trim: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Employee", "Admin", "HR", "employee", "admin", "hr"],
      default: "Employee",
    },
    joiningYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    department: {
      type: String,
      default: "General",
    },
    designation: {
      type: String,
      default: "Associate",
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    leaveBalances: {
      paid: { type: Number, default: 24 },
      sick: { type: Number, default: 7 },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure loginId matches customId and name matches fullName
employeeSchema.pre("save", function (next) {
  if (this.customId && !this.loginId) {
    this.loginId = this.customId;
  }
  if (this.fullName && !this.name) {
    this.name = this.fullName;
  }
  next();
});

const MongooseEmployee = mongoose.model("Employee", employeeSchema);

// Hybrid Employee constructor: uses real MongoDB if connected, or persistent JSON store otherwise
function Employee(data) {
  if (mongoose.connection.readyState === 1) {
    return new MongooseEmployee(data);
  }
  return new LocalEmployeeInstance(data);
}

// Static methods delegator
Employee.countDocuments = function (query) {
  if (mongoose.connection.readyState === 1) {
    return MongooseEmployee.countDocuments(query);
  }
  return LocalEmployeeStore.countDocuments(query);
};

Employee.findOne = function (query) {
  if (mongoose.connection.readyState === 1) {
    return MongooseEmployee.findOne(query);
  }
  return LocalEmployeeStore.findOne(query);
};

Employee.findById = function (id) {
  if (mongoose.connection.readyState === 1) {
    return MongooseEmployee.findById(id);
  }
  return LocalEmployeeStore.findById(id);
};

Employee.create = function (data) {
  if (mongoose.connection.readyState === 1) {
    return MongooseEmployee.create(data);
  }
  return LocalEmployeeStore.create(data);
};

Employee.findByIdAndDelete = function (id) {
  if (mongoose.connection.readyState === 1) {
    return MongooseEmployee.findByIdAndDelete(id);
  }
  return LocalEmployeeStore.findByIdAndDelete(id);
};

Employee.deleteMany = function (query) {
  if (mongoose.connection.readyState === 1) {
    return MongooseEmployee.deleteMany(query);
  }
  return LocalEmployeeStore.deleteMany(query);
};

Employee.schema = employeeSchema;
Employee.MongooseModel = MongooseEmployee;

module.exports = Employee;



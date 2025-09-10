const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String, required: true
     },
    email: { 
      type: String, required: true, unique: true 
    },
    phone: { 
      type: String 
    },
    employeeId: {
      type: String, required: true, unique: true
    },
    jobTitle: { 
      type: String 
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    department: {
      departmentName: { type: String },
      departmentCode: { type: String },
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    supervisor: {
      fullName: { type: String },
      email: { type: String },
      jobTitle: { type: String },
    },

    isActive: { type: Boolean, default: true },
    hireDate: { type: Date },
    profileImage: { type: String },
  },
  { timestamps: true }
);

// ===== Middleware to auto-populate references =====
function autoPopulateReferences(next) {
  this.populate({
    path: "departmentId",
    select: "departmentName departmentCode",
    model: "Department",
  }).populate({
    path: "supervisorId",
    select: "fullName email jobTitle",
    model: "Employee",
  });
  next();
}

// Apply middleware on find, findOne, findById queries
employeeSchema.pre("find", autoPopulateReferences);
employeeSchema.pre("findOne", autoPopulateReferences);
employeeSchema.pre("findById", autoPopulateReferences);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = { Employee };

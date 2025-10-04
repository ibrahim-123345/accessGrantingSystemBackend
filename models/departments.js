const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
    },
    departmentCode: {
      type: String,
      required: true,
      unique: true,
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model("Department", departmentSchema);

module.exports = { Department };

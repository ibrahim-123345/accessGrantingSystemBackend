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
      ref: "Employee",
      default: "68d180e064cc87cbdba25b42", 
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

// Middleware to autopopulate headOfDepartment
function autopopulateHead(next) {
  this.populate({
    path: "headOfDepartment",
    select: "fullName email phone employeeId jobTitle departmentId department isActive hireDate createdAt updatedAt"
  });
  next();
}

// Apply autopopulate to all relevant queries
departmentSchema.pre("find", autopopulateHead);
departmentSchema.pre("findOne", autopopulateHead);
departmentSchema.pre("findOneAndUpdate", autopopulateHead);
departmentSchema.pre("findById", autopopulateHead);

const Department = mongoose.model("Department", departmentSchema);

module.exports = { Department };

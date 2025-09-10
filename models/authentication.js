const mongoose = require('mongoose');
const { Employee } = require('./employee'); // make sure this path matches your project

const authenticationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },
  email: {
    type: String,
    required: false,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["employee", "supervisor", "department_head", "HR", "IT", "admin"],
    default: "employee"
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });


// 🔹 Auto-fill employeeId based on email before saving (optional)
authenticationSchema.pre("save", async function (next) {
  if (!this.isModified("email")) return next();

  try {
    const employee = await Employee.findOne({ email: this.email });
    if (employee) {
      this.employeeId = employee._id;
      // optionally sync role with employee role if you want
      if (employee.role) {
        this.role = employee.role;
      }
    }
    // Allow saving even if employee doesn't exist
    next();
  } catch (err) {
    next(err);
  }
});

const Authentication = mongoose.model("Authentication", authenticationSchema);

module.exports = { Authentication };

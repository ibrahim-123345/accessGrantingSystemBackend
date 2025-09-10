const mongoose = require("mongoose");
const { Employee } = require("./employee");
const { SystemsPlatform } = require("./systemsPlatform");

const accessRequestSchema = new mongoose.Schema({

  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  employee: {
    fullName: { type: String, default: null },
    email: { type: String, default: null },
    employeeId: { type: String, default: null },
    departmentName: { type: String, default: null },
    jobTitle: { type: String, default: null }
  },

  systemId: { type: mongoose.Schema.Types.ObjectId, ref: "SystemsPlatform", required: true },
  system: {
    systemName: { type: String, default: null },
    systemType: { type: String, default: null },
    securityLevel: { type: String, enum: ["low","medium","high","critical"], default: null }
  },


  justification: { type: String, default: null },
  businessPurpose: { type: String, default: null },
  urgencyLevel: { type: String, enum: ["low","normal","high","critical"], default: "normal" },
  durationType: { type: String, enum: ["permanent","temporary"], default: "temporary" },
  requestedStartDate: { type: Date, default: null },
  requestedEndDate: { type: Date, default: null },


  supervisorApprovals: [
    {
      approverId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      role: { type: String, enum: ["supervisor","department_head","HR","IT"], default: null },
      decision: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
      comments: { type: String, default: null },
      decidedAt: { type: Date, default: null },
      default: { type: Boolean, default: false },
    }
  ],

  grantedPermissionsByIT: [
    {
      typeName: { type: String, default: null },
      canRead: { type: Boolean, default: false },
      canUpdate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      decision: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
      comments: { type: String, default: null },
      approvedAt: { type: Date, default: null },
      accessGrantedDate: { type: Date, default: null },
      accessExpiryDate: { type: Date, default: null },
      isAccessActive: { type: Boolean, default: false },
      default: { type: Boolean, default: false }
    }
  ],



  status: { 
    type: String, 
    enum: [
      "pending","supervisor_approved","it_approved",
      "approved","rejected","active","expired","revoked"
    ], 
    default: "pending" 
  },

  isExpired: { type: Boolean, default: false },

}, { timestamps: true });


// =============================
// Auto-populate references
// =============================
function autoPopulate(next) {
  this.populate([
    { path: "employeeId", select: "fullName email employeeId jobTitle department.departmentName" },
    { path: "systemId", select: "systemName systemType securityLevel" },
    //{ path: "approvals.approverId", select: "fullName email jobTitle" },
    { path: "grantedPermissionsByIT.approvedBy", select: "fullName email jobTitle" }
  ]);
  next();
}

accessRequestSchema.pre("find", autoPopulate);
accessRequestSchema.pre("findOne", autoPopulate);
accessRequestSchema.pre("findById", autoPopulate);


// =============================
// Auto-fill employee 
// =============================
accessRequestSchema.pre("save", async function(next) {
  try {
    if (this.isModified("employeeId")) {
      const emp = await Employee.findById(this.employeeId).select("fullName email employeeId jobTitle department");
      if (emp) {
        this.employee = {
          fullName: emp.fullName,
          email: emp.email,
          employeeId: emp.employeeId,
          jobTitle: emp.jobTitle,
          departmentName: emp.department?.departmentName || null
        };
      }
    }

    if (this.isModified("systemId")) {
      const sys = await SystemsPlatform.findById(this.systemId).select("systemName systemType securityLevel");
      if (sys) {
        this.system = {
          systemName: sys.systemName,
          systemType: sys.systemType,
          securityLevel: sys.securityLevel
        };
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});


// =============================
// Check expiry for temporary access
// =============================
accessRequestSchema.methods.checkExpiry = function() {
  if (this.durationType === "temporary" && this.requestedEndDate) {
    const now = new Date();
    const diff = this.requestedEndDate - now;

    if (diff <= 0) {
      this.status = "expired";
      this.isExpired = true;
      return { expired: true, remainingDays: 0 };
    } else {
      const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return { expired: false, remainingDays: daysRemaining };
    }
  }
  return { expired: false, remainingDays: null };
};


// =============================
// Scheduled Expiry Updater
// =============================
accessRequestSchema.statics.updateExpiries = async function() {
  const requests = await this.find({ durationType: "temporary", isExpired: false });
  for (const req of requests) {
    const { expired } = req.checkExpiry();
    if (expired) {
      await req.save();
    }
  }
};

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);
module.exports = { AccessRequest };

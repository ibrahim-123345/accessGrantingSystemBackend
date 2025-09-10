const mongoose = require("mongoose");

const systemsPlatformSchema = new mongoose.Schema({
  systemName: { type: String, required: true },
  systemType: { type: String, required: true },
  description: { type: String },
  systemUrl: { type: String },

  ownerDepartmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Department", 
    required: true 
  },

  technicalContact: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },

  securityLevel: { 
    type: String, 
    enum: ["low", "medium", "high", "critical"], 
    default: "medium" 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-populate department details
systemsPlatformSchema.pre(/^find/, function(next) {
  this.populate({
    path: "ownerDepartmentId",
    select: "departmentName departmentCode" // only fetch these two fields
  });
  next();
});

const SystemsPlatform = mongoose.model("SystemsPlatform", systemsPlatformSchema);

module.exports = { SystemsPlatform };

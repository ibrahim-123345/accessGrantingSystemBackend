
const mongoose = require('mongoose');



const accessTypeSchema = new mongoose.Schema({
  typeName: { 
    type: String, required: true, unique: true 
  },
  description: { 
    type: String 
  },
  requiresJustification: { 
    type: Boolean, default: false 
  },
  defaultDurationDays: { 
    type: Number, default: 30 
  },
  riskLevel: { 
    type: String, enum: ["low", "medium", "high"], default: "low" 
  },
  canRead: { 
    type: Boolean, default: true 
  },
  canInsert: { 
    type: Boolean, default: false 
  },
  canUpdate: { 
    type: Boolean, default: false 
  },
  canDelete: { 
    type: Boolean, default: false 
  },
  isActive: { 
    type: Boolean, default: true 
  }
}, { timestamps: true });
const AccessType = mongoose.model("AccessType", accessTypeSchema);

module.exports = { AccessType };

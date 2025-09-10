const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  recipient: {
    fullName: { type: String },
    email: { type: String }
  },

  // Notification Details
  type: { 
    type: String, 
    enum: ["request_submitted", "approval_needed", "access_granted", "expiry_warning", "access_expired", "access_revoked"], 
    required: true 
  },
  priority: {
    type: String, enum: ["low", "medium", "high", "urgent"], default: "medium"
  },
  title: {
    type: String, required: true
  },
  message: { 
    type: String, required: true
  },

  relatedSystem: { 
    type: mongoose.Schema.Types.ObjectId, ref: "SystemsPlatform",
    default: null
  },

  // Delivery Information
  channels: [{
    type: String, enum: ["email", "sms", "inApp", "push"]
  }],

  // Status
  isRead: {
    type: Boolean, default: false
  },
  readAt: { 
    type: Date, default: null
  },


}, { timestamps: true }); 

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };

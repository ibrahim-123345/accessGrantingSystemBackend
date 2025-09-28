
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: false
  },
  recipient: {
    fullName: { type: String, required: false },
    email: { type: String, required: false }
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee",
    required: false
  },
  sender: {
    fullName: { type: String,},
    email: { type: String, }
  },
  relatedAccessRequest: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AccessRequest",
    required: false,
  
  },
  type: { 
    type: String, 
    enum: [
      "pending","supervisor_need_to_approve","supervisor_approved","it_approved",
      "approved","rejected","active","expired","revoked"
    ],
    required: true
  },
  priority: {
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium"
  },
  title: { 
    type: String,
    required: true
  },
  message: { 
    type: String, 
    required: true
  },
  relatedSystem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SystemsPlatform",
    default: null
  },
  channels: {
    type: [{ type: String, enum: ["email", "sms", "inApp", "push"] }],
    validate: [arr => arr.length > 0, "At least one channel is required"],
    required: true
  },
  isRead: {
    type: Boolean, 
    default: false
  },
  readAt: { 
    type: Date, 
    default: null
  }
}, { timestamps: true }); 

// Populate multiple paths automatically
notificationSchema.pre(/^find/, function(next) {
  this.populate([
    { path: "senderId", select: "fullName email" },
    { path: "recipientId", select: "fullName email" },
    { path: "relatedAccessRequest" },
    { path: "relatedSystem" }
  ]);
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };

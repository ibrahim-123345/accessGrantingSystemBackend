const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  recipient: {
    fullName: { type: String },
    email: { type: String }
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, ref: "Employee",
    default: null},

  sender: {
    fullName: { type: String },
    email: { type: String }
  },

  // Notification Details
  type: { 
    type: String, 
  enum: [
      "pending","supervisor_need_to_approve","supervisor_approved","it_approved",
      "approved","rejected","active","expired","revoked"
    ],     required: true 
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


notificationSchema.pre(/^find/, function(next) {
  this.populate({
    path: "senderId recipientId",
    select: "fullName email" 
  });
  next();
});


const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };

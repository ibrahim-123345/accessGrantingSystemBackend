const { Notification } = require("../models/notification");
const { Employee } = require("../models/employee");
const { SystemsPlatform } = require("../models/systemsPlatform");

// =============================
// Helper: Standardized Response
// =============================
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// =============================
// Get All Notifications
// =============================
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, true, "Notifications fetched successfully", notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Get Notification by ID
// =============================
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) return sendResponse(res, 404, false, "Notification not found");

    return sendResponse(res, 200, true, "Notification fetched successfully", notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Create Notification
// =============================
const createNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, priority, channels, relatedSystem } = req.body;

    if (!recipientId || !type || !title || !message) {
      return sendResponse(res, 400, false, "recipientId, type, title, and message are required");
    }

    // Verify recipient exists
    const recipient = await Employee.findById(recipientId).select("fullName email");
    if (!recipient) return sendResponse(res, 400, false, "Invalid recipientId: employee not found");

    // Verify system if provided
    if (relatedSystem) {
      const systemExists = await SystemsPlatform.findById(relatedSystem);
      if (!systemExists) return sendResponse(res, 400, false, "Invalid relatedSystem: system not found");
    }

    const newNotification = new Notification({
      recipientId,
      recipient: {
        fullName: recipient.fullName,
        email: recipient.email
      },
      type,
      title,
      message,
      priority: priority || "medium",
      channels: channels && channels.length > 0 ? channels : ["inApp"],
      relatedSystem: relatedSystem || null
    });

    const savedNotification = await newNotification.save();
    return sendResponse(res, 201, true, "Notification created successfully", savedNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Mark Notification as Read
// =============================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!updatedNotification) return sendResponse(res, 404, false, "Notification not found");

    return sendResponse(res, 200, true, "Notification marked as read", updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Delete Notification
// =============================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) return sendResponse(res, 404, false, "Notification not found");

    return sendResponse(res, 200, true, "Notification deleted successfully");
  } catch (error) {
    console.error("Error deleting notification:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Exports
// =============================
module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  markAsRead,
  deleteNotification
};

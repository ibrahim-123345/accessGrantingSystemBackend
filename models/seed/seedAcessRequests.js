const mongoose = require("mongoose");
const { AccessRequest } = require("../accessRequest");
const { Employee } = require("../employee");
const { SystemsPlatform } = require("../systemsPlatform");
const { Notification } = require("../notification");
const { Authentication } = require("../authentication"); // to fetch admins

const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const seedAccessRequests = async (req, res) => {
  try {
    // Fetch employees and platforms
    const employees = await Employee.find({ email: { $in: [
      "ismail@evmak.com",
      "sakina@evmak.com",
      "ludovic@evmak.com",
      "said@evmak.com",
      "sharon@evmak.com"
    ] } });

    if (employees.length === 0) {
      return sendResponse(res, 400, false, "Please seed employees first");
    }

    const platforms = await SystemsPlatform.find();
    if (platforms.length === 0) {
      return sendResponse(res, 400, false, "Please seed systems platforms first");
    }

    const createdRequests = [];

    // Fetch all active admins
    const admins = await Authentication.find({ isActive: true }).populate("employeeId");
    const adminList = admins.filter(a => a.primaryRole?.role === "admin" || 
                                         (a.extraRoles?.some(r => r.role === "admin")));

    for (const emp of employees) {
      // Pick a random platform for this employee
      const platform = platforms[Math.floor(Math.random() * platforms.length)];

      // Skip if request already exists
      const exists = await AccessRequest.findOne({ employeeId: emp._id, systemId: platform._id });
      if (exists) continue;

      const newRequest = new AccessRequest({
        employeeId: emp._id,
        systemId: platform._id,
        justification: `Access needed for ${platform.systemName} daily tasks`,
        businessPurpose: "Operational use",
        urgencyLevel: "normal",
        durationType: "temporary",
        requestedStartDate: new Date(),
        requestedEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month
        supervisorApprovals: [],
        grantedPermissionsByIT: [],
        status: "pending"
      });

      await newRequest.save();
      createdRequests.push(newRequest);

      // ==========================
      // Notify all admins
      // ==========================
      const adminNotifications = adminList.map(admin => ({
        recipientId: admin.employeeId._id,
        recipient: {
          fullName: admin.employeeId.fullName,
          email: admin.employeeId.email
        },
        senderId: emp._id,
        sender: {
          fullName: emp.fullName,
          email: emp.email
        },
        relatedAccessRequest: newRequest._id,
        type: "new_access_request",
        priority: "high",
        title: "New Access Request",
        message: `Employee ${emp.fullName} has submitted a new access request for ${platform.systemName}.`,
        relatedSystem: platform._id,
        channels: ["email", "inApp"]
      }));

      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    }

    return sendResponse(res, 201, true, "Access requests seeded successfully", createdRequests);

  } catch (error) {
    console.error("Error seeding access requests:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedAccessRequests };

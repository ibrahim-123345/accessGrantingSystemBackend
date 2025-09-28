const { AccessRequest } = require("../models/accessRequest");
const { Employee } = require("../models/employee");
const { SystemsPlatform } = require("../models/systemsPlatform");
const { Notification } = require("../models/notification");
const{AccessType}=require("../models/accessTypes");
const{Authentication}=require("../models/authentication");

const mongoose = require("mongoose");

























// =============================
// Helper: Standardized Response
// =============================
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// =============================
// Get All Access Requests
// =============================
const getAllAccessRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find();
    return sendResponse(res, 200, true, "Access requests fetched successfully", requests);
  } catch (error) {
    console.error("Error fetching access requests:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Get Access Request by ID
// =============================
const getAccessRequestLimit = async (req, res) => {
  try {
    const requests = await AccessRequest.find().limit(40).sort({ createdAt: -1 });
    return sendResponse(res, 200, true, "Access requests fetched successfully", requests);
  } catch (error) {
    console.error("Error fetching access requests:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};


// =============================
// Get Access Request by ID
// =============================
const getAccessRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccessRequest.findById(id);
    if (!request) return sendResponse(res, 404, false, "Access request not found");
    return sendResponse(res, 200, true, "Access request fetched successfully", request);
  } catch (error) {
    console.error("Error fetching access request:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};




// =============================
// Get Access Requests by Employee ID
// =============================
const getAccessRequestsByEmployeeId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, 400, false, "Employee ID is required");
    }

    const requests = await AccessRequest.find({ employeeId:userId });
    console.log("Fetched requests:", requests);

    if (!requests || requests.length === 0) {
      return sendResponse(res, 404, false, "No access requests found for this employee");
    }

    return sendResponse(
      res,
      200,
      true,
      "Access requests fetched successfully",
      requests
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Internal server error");
  }
};







// =============================
// Create Access Request
// =============================
const createAccessRequest = async (req, res) => {
  try {
    const {
      employeeId,
      systemId,
      justification,
      businessPurpose,
      urgencyLevel,
      durationType,
      requestedStartDate,
      requestedEndDate
    } = req.body;

    // Basic validation
    if (!employeeId || !systemId) {
      return sendResponse(res, 400, false, "EmployeeId and systemId are required");
    }

    const emp = await Employee.findById(employeeId).populate("supervisorId");
    if (!emp) return sendResponse(res, 400, false, "Invalid employeeId: employee does not exist");

    const sys = await SystemsPlatform.findById(systemId);
    if (!sys) return sendResponse(res, 400, false, "Invalid systemId: system does not exist");

    // Build supervisor details
    let supervisorDetails = null;
    if (emp.supervisorId) {
      supervisorDetails = {
        _id: emp.supervisorId._id,
        fullName: emp.supervisorId.fullName,
        email: emp.supervisorId.email,
        jobTitle: emp.supervisorId.jobTitle,
        department: emp.supervisorId.department,
        departmentId: emp.supervisorId.departmentId
      };
    } else {
      supervisorDetails = {
        _id: emp._id,
        fullName: emp.fullName,
        email: emp.email,
        jobTitle: emp.jobTitle,
        department: emp.department,
        departmentId: emp.departmentId
      };
    }

    // 1. Create AccessRequest first
    const newRequest = new AccessRequest({
      employeeId,
      systemId,
      justification: justification || null,
      businessPurpose: businessPurpose || null,
      urgencyLevel: urgencyLevel || "normal",
      durationType: durationType || "temporary",
      requestedStartDate: requestedStartDate || null,
      requestedEndDate: requestedEndDate || null,
      supervisor: supervisorDetails,
      supervisorApprovals: [],
      grantedPermissionsByIT: []
    });

    const savedRequest = await newRequest.save();

    // 2. Create Notification referencing AccessRequest._id
    if (emp.supervisorId) {
      const newNotification = new Notification({
        recipientId: emp.supervisorId._id,
        recipient: {
          fullName: emp.supervisorId.fullName,
          email: emp.supervisorId.email
        },
        senderId: employeeId,
        sender: {
          fullName: emp.fullName,
          email: emp.email
        },
        relatedAccessRequest: savedRequest._id, // ✅ reference saved request
        type: "supervisor_need_to_approve",
        priority: "high",
        title: "Access Request Approval Needed",
        message: `New access request submitted by ${emp.fullName}. Please review and approve.`,
        relatedSystem: systemId,
        channels: ["email", "inApp"]
      });

      await newNotification.save();
    }

    return sendResponse(
      res,
      201,
      true,
      "Access request created successfully, please wait for supervisor approval",
      savedRequest
    );
  } catch (error) {
    console.error("Error creating access request:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Update Access Request
// =============================
const updateAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Optional validation: update employeeId
    if (updates.employeeId) {
      const emp = await Employee.findById(updates.employeeId);
      if (!emp) return sendResponse(res, 400, false, "Invalid employeeId: employee does not exist");
      updates.employee = {
        fullName: emp.fullName,
        email: emp.email,
        employeeId: emp.employeeId,
        jobTitle: emp.jobTitle,
        departmentName: emp.department?.departmentName || null
      };
    }

    // Optional validation: update systemId
    if (updates.systemId) {
      const sys = await SystemsPlatform.findById(updates.systemId);
      if (!sys) return sendResponse(res, 400, false, "Invalid systemId: system does not exist");
      updates.system = {
        systemName: sys.systemName,
        systemType: sys.systemType,
        securityLevel: sys.securityLevel
      };
    }

    const updatedRequest = await AccessRequest.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedRequest) return sendResponse(res, 404, false, "Access request not found");

    return sendResponse(res, 200, true, "Access request updated successfully", updatedRequest);
  } catch (error) {
    console.error("Error updating access request:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Delete Access Request
// =============================
const deleteAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AccessRequest.findByIdAndDelete(id);
    if (!deleted) return sendResponse(res, 404, false, "Access request not found");
    return sendResponse(res, 200, true, "Access request deleted successfully");
  } catch (error) {
    console.error("Error deleting access request:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};


// =============================
// Supervisor Approval
// =============================
const supervisorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, role, decision, comments } = req.body;
    console.log("id is : ",id)

    if (!approverId || !role || !decision) {
      return sendResponse(res, 400, false, "approverId, role, and decision are required.");
    }

    // Try to update existing approval
    let request = await AccessRequest.findOneAndUpdate(
      {
        _id: id,
        "supervisorApprovals.approverId": approverId,
        "supervisorApprovals.role": role
      },
      {
        $set: {
          "supervisorApprovals.$.decision": decision,
          "supervisorApprovals.$.comments": comments || null,
          "supervisorApprovals.$.decidedAt": new Date()
        }
      },
      { new: true }
    );




    // If not found, push a new approval entry
    if (!request) {
      request = await AccessRequest.findByIdAndUpdate(
        id,
        {
          $push: {
            supervisorApprovals: {
              approverId,
              role,
              decision,
              comments: comments || null,
              decidedAt: new Date(),
              default: false
            }
          }
        },
        { new: true }
      );
      if (!request) {
        return sendResponse(res, 404, false, "Access request not found.");
      }
    }



    // Update request status
    const allApproved =
      request.supervisorApprovals.length > 0 &&
      request.supervisorApprovals.every(a => a.decision === "approved");
    const anyRejected = request.supervisorApprovals.some(a => a.decision === "rejected");

    if (anyRejected) request.status = "rejected";
    else if (allApproved) request.status = "supervisor_approved";
    else request.status = "pending";

    await request.save();

    const converted = decision.toLowerCase();

    // Fetch approver info for sender
    const approver= await Authentication.findOne({employeeId:approverId}).populate("employeeId");

    // =============================
    // Notification for employee
    // =============================

    console.log("approver",approver)
    const employeeNotification = new Notification({
      recipientId: request.employeeId?._id,
      recipient: {
        fullName: request.employeeId?.fullName,
        email: request.employeeId?.email
      },
      senderId: approverId,
      sender: {
        fullName: approver.employeeId.fullName,
        email: approver.employeeId.email
      },
      relatedAccessRequest: id,
      type: decision,
      priority: "medium",
      title: "Access Request Update",
      message: `Your access request has been ${converted} by your supervisor, be patient while admin process it`,
      relatedSystem: request.systemId,
      channels: ["email", "inApp"]
    });
    await employeeNotification.save();

    // =============================
    // Notifications for all admins
    // =============================
    const admins = await Authentication.find({ role: "admin", isActive: true }).populate("employeeId");
    console.log(admins)
    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        recipientId: admin.employeeId._id,
        recipient: {
          fullName: admin.employeeId.fullName,
          email: admin.employeeId.email
        },
        senderId: approverId,
        sender: {
          fullName: approver.employeeId.fullName,
          email: approver.employeeId.email
        },
        relatedAccessRequest:id,
        type: decision,
        priority: "high",
        title: "Supervisor Decision Logged",
        message: `Supervisor has ${converted} an access request for employee ${request.employee.fullName}.`,
        relatedSystem: request.systemId,
        channels: ["inApp"]
      }));
      await Notification.insertMany(adminNotifications);
    }

    return sendResponse(res, 200, true, "Supervisor approval updated successfully.", request);
  } catch (error) {
    console.error("Error in supervisorApproval:", error);
    return sendResponse(res, 500, false, "Internal server error.");
  }
};

// =============================
// IT approval
// =============================
const itApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, approvedBy, comments, grantedPermissions } = req.body;

    console.log("IT Approval Data:", req.body);

    if (!approvedBy) {
      return sendResponse(res, 400, false, "approvedBy is required.");
    }

    const approver = await Employee.findById(approvedBy);
    if (!approver) {
      return sendResponse(res, 400, false, "Invalid approvedBy: employee does not exist.");
    }

    let request = await AccessRequest.findById(id);
    if (!request) {
      return sendResponse(res, 404, false, "Access request not found.");
    }

    // ========================
    // CASE 1: REJECT
    // ========================
    if (action === "reject") {
      request.status = "rejected";
      request.grantedPermissionsByIT = [];
      await request.save();

      // HTML-formatted rejection message
      const rejectionMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #c62828;">❌ Your access request has been rejected</h2>
          <p style="font-size: 16px;">The IT team has reviewed your access request for <strong>${request.system?.systemName || 'the system'}</strong>.</p>
          <div style="margin: 16px 0; padding: 12px; border: 1px solid #ccc; border-radius: 6px; background: #ffe6e6;">
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${comments || 'No specific reason provided.'}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Rejected</p>
            <p style="margin: 4px 0;"><strong>Requested by:</strong> ${request.employee?.fullName || 'Unknown'}</p>
          </div>
          <p style="font-size: 14px; color: #555;">If you believe this was a mistake, please contact your IT department.</p>
        </div>
      `;

      const newNotification = new Notification({
        recipientId: request.employeeId,
        senderId: approvedBy,
        type: request.status,
        priority: "high",
        title: "IT Access Request Rejected",
        message: rejectionMessage,
        relatedSystem: request.systemId,
        channels: ["email", "inApp"],
      });
      await newNotification.save();

      return sendResponse(res, 200, true, "IT rejection processed successfully.", request);
    }

    // ========================
    // CASE 2: APPROVE
    // ========================
    if (action === "approve") {
      if (!grantedPermissions || grantedPermissions.length === 0) {
        request.status = "rejected";
        await request.save();

        const newNotification = new Notification({
          recipientId: request.employeeId,
          senderId: approvedBy,
          type: request.status,
          priority: "high",
          title: "IT Access Request Rejected",
          message: "Your access request was rejected because no permissions were provided.",
          relatedSystem: request.systemId,
          channels: ["email", "inApp"],
        });
        await newNotification.save();

        return sendResponse(res, 400, false, "Approval failed: no grantedPermissions provided.", request);
      }

      // Collect access details for notification
      const accessDetails = [];

      for (const gp of grantedPermissions) {
        const {
          permission: permition,
          accessGrantedDate,
          accessExpiryDate,
          isAccessActive,
        } = gp;

        const accessType = await AccessType.findById(permition);
        if (!accessType) {
          request.status = "rejected";
          await request.save();
          return sendResponse(
            res,
            400,
            false,
            `Approval failed: Invalid permition ${permition}. Request marked as rejected.`,
            request
          );
        }

        // Update existing or push new grantedPermissionsByIT entry
        let updated = await AccessRequest.findOneAndUpdate(
          {
            _id: id,
            "grantedPermissionsByIT.approvedBy": approvedBy,
            "grantedPermissionsByIT.permition": permition,
          },
          {
            $set: {
              "grantedPermissionsByIT.$.comments": comments || null,
              "grantedPermissionsByIT.$.accessGrantedDate": accessGrantedDate || new Date(),
              "grantedPermissionsByIT.$.accessExpiryDate": accessExpiryDate || null,
              "grantedPermissionsByIT.$.isAccessActive":
                typeof isAccessActive === "boolean" ? isAccessActive : true,
            },
          },
          { new: true }
        );

        if (!updated) {
          updated = await AccessRequest.findByIdAndUpdate(
            id,
            {
              $push: {
                grantedPermissionsByIT: {
                  approvedBy,
                  permition,
                  comments: comments || null,
                  accessGrantedDate: accessGrantedDate || new Date(),
                  accessExpiryDate: accessExpiryDate || null,
                  isAccessActive:
                    typeof isAccessActive === "boolean" ? isAccessActive : true,
                },
              },
            },
            { new: true }
          );
          if (!updated) {
            request.status = "rejected";
            await request.save();
            return sendResponse(res, 404, false, "Access request not found. Marked as rejected.", request);
          }
        }

        request = updated;

        // Build access detail for notification
        const canDo = [];
        const cannotDo = [];
        if (accessType.canRead) canDo.push("read"); else cannotDo.push("read");
        if (accessType.canInsert) canDo.push("insert"); else cannotDo.push("insert");
        if (accessType.canUpdate) canDo.push("update"); else cannotDo.push("update");
        if (accessType.canDelete) canDo.push("delete"); else cannotDo.push("delete");

        accessDetails.push({
          typeName: accessType.typeName,
          canDo,
          cannotDo,
          expiry: accessExpiryDate || "N/A",
        });
      }

      // ✅ Update status to "approved" after IT approves
      request.status = "approved";
      await request.save();

      // Build HTML-formatted approval message
      const approvalMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #2e7d32;">✅ Your access request has been approved</h2>
          <p style="font-size: 16px;">You have been granted access to <strong>${accessDetails.length}</strong> resource(s) in <strong>${request.system?.systemName || 'the system'}</strong>:</p>
          ${accessDetails.map((d, i) => `
            <div style="margin: 12px 0; padding: 12px; border: 1px solid #ccc; border-radius: 6px; background: #e8f5e9;">
              <p style="margin: 4px 0;"><strong>${i + 1}. ${d.typeName}</strong></p>
              <p style="margin: 4px 0;">✔ Can: ${d.canDo.join(", ")}</p>
              <p style="margin: 4px 0;">✖ Cannot: ${d.cannotDo.join(", ")}</p>
              <p style="margin: 4px 0;">⏳ Expires: ${d.expiry === "N/A" ? "No expiry" : new Date(d.expiry).toDateString()}</p>
            </div>
          `).join('')}
          <p style="font-size: 14px; color: #555;">Please use your access responsibly. Contact IT if there are any issues.</p>
        </div>
      `;

      const newNotification = new Notification({
        recipientId: request.employeeId,
        senderId: approvedBy,
        type: request.status,
        priority: "medium",
        title: "IT Access Request Approved",
        message: approvalMessage,
        relatedSystem: request.systemId,
        channels: ["email", "inApp"],
      });
      await newNotification.save();

      return sendResponse(res, 200, true, "IT approval processed successfully.", request);
    }

    return sendResponse(res, 400, false, "Invalid action type.");
  } catch (error) {
    console.error("Error in itApproval:", error);
    return sendResponse(res, 500, false, "Internal server error.");
  }
};



const getStatiticsByAdmin = async (req, res) => {
  try {
    const totalRequests = await AccessRequest.countDocuments();
    const pendingRequests = await AccessRequest.countDocuments({ status: "pending" });
    const approvedRequests = await AccessRequest.countDocuments({ status: { $in: ["supervisor_approved", "it_approved"] } });
    const rejectedRequests = await AccessRequest.countDocuments({ status: "rejected" });

    return sendResponse(res, 200, true, "Statistics fetched successfully", {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
}





const getStatitics = async (req, res) => {
  try {
    const { role, employeeId } = req.params;

    let filter = {employeeId};
 

    const totalRequests = await AccessRequest.countDocuments(filter);
    const pendingRequests = await AccessRequest.countDocuments({ ...filter, status: "pending" });
    const approvedRequests = await AccessRequest.countDocuments({ ...filter, status: { $in: ["supervisor_approved", "it_approved"] } });
    const rejectedRequests = await AccessRequest.countDocuments({ ...filter, status: "rejected" });

    return sendResponse(res, 200, true, "Statistics fetched successfully", {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};






const getPopularSystemsPlatforms = async (req, res) => {
  try {
    const results = await AccessRequest.aggregate([
      {
        $group: {
          _id: "$systemId", 
          systemName: { $first: "$system.systemName" },
          systemType: { $first: "$system.systemType" },
          securityLevel: { $first: "$system.securityLevel" },
          totalRequests: { $sum: 1 },
        },
      },
      { $sort: { totalRequests: -1 } }, 
      { $limit: 5 }, 
    ]);

    res.status(200).json({
      success: true,
      message: "Popular Systems Platforms by Access Requests",
      data: results,
    });
  } catch (error) {
    console.error("Error fetching popular systems platforms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular systems platforms",
      error: error.message,
    });
  }
};


// ==============================
// Supervisor Team with Access Request Expiry Info (including supervisor)
// ==============================
const getSupervisorTeamWithRequests = async (req, res) => {
  try {
    const { id:supervisorId } = req.params;

    if (!supervisorId) {
      return res.status(400).json({ success: false, message: "SupervisorId is required" });
    }

    // 1️⃣ Get all active employees under this supervisor
    const teamMembers = await Employee.find({ 
      $or: [
        { supervisorId },           // supervised employees
        { _id: supervisorId }       // include supervisor himself
      ],
      isActive: true
    });
    const teamSize = teamMembers.length;

    // 2️⃣ For each member, fetch their access requests
    const teamData = await Promise.all(
      teamMembers.map(async (emp) => {
        const requests = await AccessRequest.find({ employeeId: emp._id });

        // Map requests with expiry info
        const mappedRequests = requests.map(req => {
          let remainingTime;

          if (["approved", "active"].includes(req.status)) {
            if (req.durationType === "temporary" && req.requestedEndDate) {
              const now = new Date();
              const diff = req.requestedEndDate - now;
              remainingTime = diff > 0
                ? `${Math.ceil(diff / (1000 * 60 * 60 * 24))} days remaining`
                : "Expired";
            } else {
              remainingTime = "Permanent access";
            }
          } else {
            remainingTime = "Not yet approved";
          }

          return {
            _id: req._id,
            system: req.system,
            justification: req.justification,
            businessPurpose: req.businessPurpose,
            urgencyLevel: req.urgencyLevel,
            durationType: req.durationType,
            requestedStartDate: req.requestedStartDate,
            requestedEndDate: req.requestedEndDate,
            status: req.status,
            isExpired: req.isExpired,
            remainingTime,
            supervisorApprovals: req.supervisorApprovals,
            grantedPermissionsByIT: req.grantedPermissionsByIT
          };
        });

        return {
          _id: emp._id,
          fullName: emp.fullName,
          email: emp.email,
          jobTitle: emp.jobTitle,
          department: emp.department,
          accessRequests: mappedRequests
        };
      })
    );

    // 3️⃣ Summary stats for the team
    const summaryStats = {
      totalRequests: 0,
      pending: 0,
      supervisor_approved: 0,
      it_approved: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      expired: 0,
      revoked: 0
    };

    teamData.forEach(emp => {
      emp.accessRequests.forEach(req => {
        summaryStats.totalRequests += 1;
        if (req.status in summaryStats) summaryStats[req.status] += 1;
      });
    });

    return res.json({
      success: true,
      message: "Supervisor team (including supervisor) with expiry info fetched successfully",
      data: {
        teamSize,
        summaryStats,
        members: teamData
      }
    });

  } catch (err) {
    console.error("Error fetching supervisor team:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


// =============================
// Exports
// =============================
module.exports = {
  getAllAccessRequests,
  getAccessRequestById,
  createAccessRequest,
  updateAccessRequest,
  deleteAccessRequest,
  supervisorApproval,
  itApproval,
  getStatitics,
  getStatiticsByAdmin,
  getAccessRequestLimit,
  getPopularSystemsPlatforms,
  getAccessRequestsByEmployeeId,
getSupervisorTeamWithRequests};
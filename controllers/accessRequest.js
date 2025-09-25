const { AccessRequest } = require("../models/accessRequest");
const { Employee } = require("../models/employee");
const { SystemsPlatform } = require("../models/systemsPlatform");
const { Notification } = require("../models/notification");
const{AccessType}=require("../models/accessTypes");























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
    console.log("Error fetching access requests by employeeId:", error);
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

    // Build supervisor details (without renaming anything else)
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

    const newRequest = new AccessRequest({
      employeeId,
      systemId,
      justification: justification || null,
      businessPurpose: businessPurpose || null,
      urgencyLevel: urgencyLevel || "normal",
      durationType: durationType || "temporary",
      requestedStartDate: requestedStartDate || null,
      requestedEndDate: requestedEndDate || null,
      supervisor: supervisorDetails, // ✅ added without touching other fields
      supervisorApprovals: [],
      grantedPermissionsByIT: []
    });

    const savedRequest = await newRequest.save();

    // Notification only if real supervisor exists
    if (emp.supervisorId) {
      const newNotification = new Notification({
        recipientId: emp.supervisorId._id,
        senderId: employeeId,
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

    if (!approverId || !role || !decision) {
      return sendResponse(res, 400, false, "approverId, role, and decision are required.");
    }

    // Try to update the specific approval entry atomically
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

    const allApproved = request.supervisorApprovals.length > 0 && request.supervisorApprovals.every(a => a.decision === "approved");
    const anyRejected = request.supervisorApprovals.some(a => a.decision === "rejected");

    if (anyRejected) {
      request.status = "rejected";
    } else if (allApproved) {
      request.status = "supervisor_approved";
    } else {
      request.status = "pending";
    }
    await request.save();

    const converted = decision.toString().toLowerCase();

    const newNotification = new Notification({
      recipientId: request.employeeId,
      senderId: approverId,
      type: decision, 
      priority: "medium",
      title: "Access Request Update",
      message: `Your access request has been ${converted} by your supervisor.`,
      relatedSystem: request.systemId,
      channels: ["email", "inApp"]
    });
    await newNotification.save();

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
  getAccessRequestsByEmployeeId
};
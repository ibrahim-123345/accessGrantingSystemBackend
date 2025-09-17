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

    const emp = await Employee.findById(employeeId);
    if (!emp) return sendResponse(res, 400, false, "Invalid employeeId: employee does not exist");

    const sys = await SystemsPlatform.findById(systemId);
    if (!sys) return sendResponse(res, 400, false, "Invalid systemId: system does not exist");

    const newRequest = new AccessRequest({
      employeeId,
      systemId,
      justification: justification || null,
      businessPurpose: businessPurpose || null,
      urgencyLevel: urgencyLevel || "normal",
      durationType: durationType || "temporary",
      requestedStartDate: requestedStartDate || null,
      requestedEndDate: requestedEndDate || null,
      supervisorApprovals: [],
      grantedPermissionsByIT: []
    });

    const savedRequest = await newRequest.save();

    // Create a notification for the supervisor if exists
    if (emp.supervisorId) {
      const newNotification = new Notification({
        recipientId: emp.supervisorId,
        senderId: employeeId,
        type: "approval_needed",
        priority: "high",
        title: "Access Request Approval Needed",
        message: `New access request submitted by ${emp.fullName}. Please review and approve.`,
        relatedSystem: systemId,
        channels: ["email", "inApp"]
      });
      await newNotification.save();
    }

    return sendResponse(res, 201, true, "Access request created successfully, please wait for supervisor approval", savedRequest);
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
    const {
      approvedBy, // Employee ObjectId
      permition,  // AccessType ObjectId
      comments,
      accessGrantedDate,
      accessExpiryDate,
      isAccessActive
    } = req.body;

    if (!approvedBy || !permition) {
      return sendResponse(res, 400, false, "approvedBy and permition are required.");
    }

    const approver = await Employee.findById(approvedBy);
    if (!approver) return sendResponse(res, 400, false, "Invalid approvedBy: employee does not exist.");

    const accessType = await AccessType.findById(permition);
    if (!accessType) return sendResponse(res, 400, false, "Invalid permition: access type does not exist.");

    // Try to update existing grantedPermissionsByIT entry
    let request = await AccessRequest.findOneAndUpdate(
      {
        _id: id,
        "grantedPermissionsByIT.approvedBy": approvedBy
      },
      {
        $set: {
          "grantedPermissionsByIT.$.permition": permition,
          "grantedPermissionsByIT.$.comments": comments || null,
          "grantedPermissionsByIT.$.accessGrantedDate": accessGrantedDate || new Date(),
          "grantedPermissionsByIT.$.accessExpiryDate": accessExpiryDate || null,
          "grantedPermissionsByIT.$.isAccessActive": typeof isAccessActive === "boolean" ? isAccessActive : true
        }
      },
      { new: true }
    );

    // If not found, push a new entry
    if (!request) {
      request = await AccessRequest.findByIdAndUpdate(
        id,
        {
          $push: {
            grantedPermissionsByIT: {
              approvedBy,
              permition,
              comments: comments || null,
              accessGrantedDate: accessGrantedDate || new Date(),
              accessExpiryDate: accessExpiryDate || null,
              isAccessActive: typeof isAccessActive === "boolean" ? isAccessActive : true
            }
          }
        },
        { new: true }
      );
      if (!request) {
        return sendResponse(res, 404, false, "Access request not found.");
      }
    }

    request.status = "it_approved";
    await request.save();

    // Notify the employee
    const newNotification = new Notification({
      recipientId: request.employeeId,
      senderId: approvedBy,
      type: request.status, 
      priority: "medium",
      title: "IT Access Request Update",
      message: `Your access request has been processed by IT.`,
      relatedSystem: request.systemId,
      channels: ["email", "inApp"]
    });
    await newNotification.save();

    return sendResponse(res, 200, true, "IT approval processed successfully.", request);
  } catch (error) {
    console.error("Error in itApproval:", error);
    return sendResponse(res, 500, false, "Internal server error.");
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
  itApproval
};
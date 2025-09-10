const { AccessRequest } = require("../models/accessRequest");
const { Employee } = require("../models/employee");
const { SystemsPlatform } = require("../models/systemsPlatform");

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
    if ( !employeeId || !systemId) {
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
      requestedEndDate: requestedEndDate || null
    });


    const savedRequest = await newRequest.save();
    return sendResponse(res, 201, true, "Access request created successfully please wait for supervisor approval", savedRequest);
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
// Exports
// =============================
module.exports = {
  getAllAccessRequests,
  getAccessRequestById,
  createAccessRequest,
  updateAccessRequest,
  deleteAccessRequest
};

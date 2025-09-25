const { SystemsPlatform } = require("../models/systemsPlatform");
const { Department } = require("../models/departments");
const{AccessRequest}=require('../models/accessRequest')
const{AccessType}=require('../models/accessTypes')
const { Employee } = require("../models/employee");



// =============================
// Helper: Standardized Response
// =============================
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};


// =============================
// Create a New Systems Platform
// =============================
const createSystemsPlatform = async (req, res) => {
  try {
    const {
      systemName,
      systemType,
      description,
      systemUrl,
      ownerDepartmentId,
      securityLevel,
      isActive,
      technicalContact
    } = req.body;

    // Basic validation
    if (!systemName || !systemType || !systemUrl || !ownerDepartmentId) {
      return sendResponse(res, 400, false, "Missing required fields");
    }

    const department = await Department.findById(ownerDepartmentId);
    if (!department) {
      return sendResponse(res, 404, false, "Owner department does not exist");
    }

    const existingSystem = await SystemsPlatform.findOne({
      $or: [{ systemName }, { systemUrl }],
    });

    if (existingSystem) {
      return sendResponse(res, 409, false, "System platform with same name or URL already exists");
    }

    // Create new system platform
    const newSystemsPlatform = new SystemsPlatform({
      systemName,
      systemType,
      description,
      systemUrl,
      ownerDepartmentId,
      securityLevel,
      isActive: isActive ?? true,
      technicalContact
    });

    const savedSystemsPlatform = await newSystemsPlatform.save();

    return sendResponse(res, 201, true, "Systems platform created successfully", savedSystemsPlatform);
  } catch (error) {
    console.error("Error creating systems platform:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Get All Systems Platforms
// =============================
const getAllSystemsPlatforms = async (req, res) => {
  try {
    const systemsPlatforms = await SystemsPlatform.find().lean();
    return sendResponse(res, 200, true, "Systems platforms fetched", systemsPlatforms);
  } catch (error) {
    console.error("Error fetching systems platforms:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Get Systems Platform by ID
// =============================
const getSystemsPlatformById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return sendResponse(res, 400, false, "Missing system platform ID");

    const systemsPlatform = await SystemsPlatform.findById(id).lean();
    if (!systemsPlatform) {
      return sendResponse(res, 404, false, "Systems platform not found");
    }

    return sendResponse(res, 200, true, "Systems platform fetched", systemsPlatform);
  } catch (error) {
    console.error("Error fetching systems platform:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Update Systems Platform
// =============================
const updateSystemsPlatform = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return sendResponse(res, 400, false, "Missing system platform ID");

    const updateFields = req.body;
    const updatedSystemsPlatform = await SystemsPlatform.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedSystemsPlatform) {
      return sendResponse(res, 404, false, "Systems platform not found");
    }

    return sendResponse(res, 200, true, "Systems platform updated", updatedSystemsPlatform);
  } catch (error) {
    console.error("Error updating systems platform:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Delete Systems Platform
// =============================
const deleteSystemsPlatform = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return sendResponse(res, 400, false, "Missing system platform ID");

    const deleted = await SystemsPlatform.findByIdAndDelete(id);
    if (!deleted) {
      return sendResponse(res, 404, false, "Systems platform not found");
    }

    return sendResponse(res, 200, true, "Systems platform deleted");
  } catch (error) {
    console.error("Error deleting systems platform:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};





// =============================
// Get System Platform with Full Details & Supervisor Summary
// =============================
const getSystemDetails = async (req, res) => {
  try {
    const { systemId } = req.params;
    if (!systemId) return sendResponse(res, 400, false, "Missing systemId");

    // Fetch system platform
    const system = await SystemsPlatform.findById(systemId).lean();
    if (!system) return sendResponse(res, 404, false, "System platform not found");

    // Populate department info
    const department = await Department.findById(system.ownerDepartmentId).lean();
    const departmentObj = department
      ? {
          id: department._id,
          departmentName: department.departmentName,
          departmentCode: department.departmentCode,
          description: department.description,
          isActive: department.isActive,
        }
      : null;

    // Fetch approved access requests for this system
    const approvedRequests = await AccessRequest.find({
      systemId: system._id,
      status: "approved",
    }).lean();

    let activeAccessCount = 0;
    let expiredAccessCount = 0;
    let temporaryCount = 0;
    let permanentCount = 0;
    let totalRemainingDays = 0;
    let temporaryRequestsCount = 0;

    // Preload all AccessTypes to avoid multiple queries
    const accessTypeIds = approvedRequests.flatMap(req =>
      req.grantedPermissionsByIT.map(p => p.permition)
    );
    const accessTypes = await AccessType.find({ _id: { $in: accessTypeIds } }).lean();
    const accessTypeMap = {};
    accessTypes.forEach(type => {
      accessTypeMap[type._id.toString()] = type;
    });

    // Preload potential supervisors (all employees with role supervisor/department_head)
    const supervisors = await Employee.find({ "role": { $in: ["supervisor", "department_head"] } })
      .select("fullName email jobTitle department").lean();

    // Map employees with approved access
    const peopleWithAccess = approvedRequests.map(req => {
      const permissions = req.grantedPermissionsByIT.map(permission => {
        const typeInfo = permission.permition ? accessTypeMap[permission.permition.toString()] : null;

        // Calculate remaining days
        let remainingDays = null;
        if (permission.accessExpiryDate) {
          const now = new Date();
          remainingDays = Math.max(Math.ceil((new Date(permission.accessExpiryDate) - now) / (1000 * 60 * 60 * 24)), 0);
        }

        return {
          approvedBy: permission.approvedBy,
          permission: typeInfo,
          comments: permission.comments,
          accessGrantedDate: permission.accessGrantedDate,
          accessExpiryDate: permission.accessExpiryDate,
          isAccessActive: permission.isAccessActive,
          remainingDays,
        };
      });

      // Update stats
      const isAnyActive = permissions.some(p => p.isAccessActive);
      if (isAnyActive) activeAccessCount++;
      if (!isAnyActive) expiredAccessCount++;

      if (req.durationType === "temporary") {
        temporaryCount++;
        const remainingDaysSum = permissions.reduce((sum, p) => sum + (p.remainingDays || 0), 0);
        totalRemainingDays += remainingDaysSum / (permissions.length || 1);
        temporaryRequestsCount++;
      } else if (req.durationType === "permanent") {
        permanentCount++;
      }

      // Supervisor approvals summary
      let supervisorApprovalsSummary = [];
      if (req.supervisorApprovals && req.supervisorApprovals.length > 0) {
        supervisorApprovalsSummary = req.supervisorApprovals.map(a => ({
          approverId: a.approverId,
          role: a.role,
          decision: a.decision,
          comments: a.comments,
          decidedAt: a.decidedAt,
        }));
      } else {
        // If no supervisor approvals, list potential supervisors from employee's department
        const empDept = req.employee?.departmentName;
        const deptSupervisors = supervisors.filter(s => s.department.departmentName === empDept);
        supervisorApprovalsSummary = deptSupervisors.map(s => ({
          approverId: s._id,
          fullName: s.fullName,
          email: s.email,
          jobTitle: s.jobTitle,
          role: s.role,
          decision: "pending",
        }));
      }

      return {
        id: req.employeeId?._id || null,
        fullName: req.employee?.fullName || null,
        email: req.employee?.email || null,
        employeeId: req.employee?.employeeId || null,
        departmentName: req.employee?.departmentName || null,
        jobTitle: req.employee?.jobTitle || null,
        durationType: req.durationType,
        requestedStartDate: req.requestedStartDate,
        requestedEndDate: req.requestedEndDate,
        grantedPermissions: permissions,
        supervisorApprovals: supervisorApprovalsSummary,
      };
    });

    const averageRemainingDays =
      temporaryRequestsCount > 0 ? totalRemainingDays / temporaryRequestsCount : null;

    // Department-level statistics
    const departmentStats = {
      totalApprovedAccess: peopleWithAccess.length,
      activeAccessCount,
      expiredAccessCount,
      temporaryCount,
      permanentCount,
      averageRemainingDaysForTemporaryAccess: averageRemainingDays,
    };

    // Construct final response
    const responseData = {
      id: system._id,
      systemName: system.systemName,
      systemType: system.systemType,
      description: system.description,
      systemUrl: system.systemUrl,
      securityLevel: system.securityLevel,
      isActive: system.isActive,
      technicalContact: system.technicalContact,
      createdAt: system.createdAt,
      updatedAt: system.updatedAt,
      department: departmentObj,
      departmentStats,
      peopleWithAccess,
    };

    return sendResponse(res, 200, true, "System platform details fetched successfully", responseData);

  } catch (error) {
    console.error("Error fetching system platform details:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};










module.exports = {
  createSystemsPlatform,
  getAllSystemsPlatforms,
  getSystemsPlatformById,
  updateSystemsPlatform,
  deleteSystemsPlatform,
  getSystemDetails
};

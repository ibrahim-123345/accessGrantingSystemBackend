const { SystemsPlatform } = require("../models/systemsPlatform");
const { Department } = require("../models/departments");

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

    // 🔍 Check if owner department exists
    const department = await Department.findById(ownerDepartmentId);
    if (!department) {
      return sendResponse(res, 404, false, "Owner department does not exist");
    }

    // 🔍 Check for duplicate systemName or systemUrl
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

module.exports = {
  createSystemsPlatform,
  getAllSystemsPlatforms,
  getSystemsPlatformById,
  updateSystemsPlatform,
  deleteSystemsPlatform,
};

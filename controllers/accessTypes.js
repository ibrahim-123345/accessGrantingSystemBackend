const { AccessType } = require("../models/accessTypes");

// Helper: standardized API response
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

/**
 * Create a new Access Type
 * Supports boolean action flags: canRead, canInsert, canUpdate, canDelete
 */
const createAccessType = async (req, res) => {
  try {
    const {
      typeName,
      description,
      requiresJustification,
      defaultDurationDays,
      riskLevel,
      canRead,
      canInsert,
      canUpdate,
      canDelete,
    } = req.body;

    // Validate required fields
    if (!typeName) {
      return sendResponse(res, 400, false, "Access type name is required");
    }

    // Check for duplicates
    const existingAccessType = await AccessType.findOne({ typeName });
    if (existingAccessType) {
      return sendResponse(res, 409, false, "Access type name already exists");
    }

    const newAccessType = new AccessType({
      typeName,
      description,
      requiresJustification: requiresJustification ?? false,
      defaultDurationDays: defaultDurationDays ?? 30,
      riskLevel: riskLevel ?? "low",
      canRead: canRead ?? true,
      canInsert: canInsert ?? false,
      canUpdate: canUpdate ?? false,
      canDelete: canDelete ?? false,
    });

    const savedAccessType = await newAccessType.save();
    return sendResponse(res, 201, true, "Access type created successfully", savedAccessType);
  } catch (error) {
    console.error("Error creating access type:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

/**
 * Fetch all Access Types
 */
const getAllAccessTypes = async (req, res) => {
  try {
    const accessTypes = await AccessType.find();
    return sendResponse(res, 200, true, "Access types fetched successfully", accessTypes);
  } catch (error) {
    console.error("Error fetching access types:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

/**
 * Fetch a single Access Type by ID
 */
const getAccessTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const accessType = await AccessType.findById(id);
    if (!accessType) {
      return sendResponse(res, 404, false, "Access type not found");
    }
    return sendResponse(res, 200, true, "Access type fetched successfully", accessType);
  } catch (error) {
    console.error("Error fetching access type:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

/**
 * Update an existing Access Type
 * Supports partial updates including boolean action flags
 */
const updateAccessType = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      typeName,
      description,
      requiresJustification,
      defaultDurationDays,
      riskLevel,
      isActive,
      canRead,
      canInsert,
      canUpdate,
      canDelete,
    } = req.body;

    const accessType = await AccessType.findById(id);
    if (!accessType) {
      return sendResponse(res, 404, false, "Access type not found");
    }

    // Check for duplicate typeName if updated
    if (typeName && typeName !== accessType.typeName) {
      const existingAccessType = await AccessType.findOne({ typeName });
      if (existingAccessType) {
        return sendResponse(res, 409, false, "Access type name already exists");
      }
    }

    // Update fields if provided
    if (typeName) accessType.typeName = typeName;
    if (description) accessType.description = description;
    if (requiresJustification !== undefined) accessType.requiresJustification = requiresJustification;
    if (defaultDurationDays !== undefined) accessType.defaultDurationDays = defaultDurationDays;
    if (riskLevel) accessType.riskLevel = riskLevel;
    if (isActive !== undefined) accessType.isActive = isActive;

    // Update boolean action flags
    if (canRead !== undefined) accessType.canRead = canRead;
    if (canInsert !== undefined) accessType.canInsert = canInsert;
    if (canUpdate !== undefined) accessType.canUpdate = canUpdate;
    if (canDelete !== undefined) accessType.canDelete = canDelete;

    const updatedAccessType = await accessType.save();
    return sendResponse(res, 200, true, "Access type updated successfully", updatedAccessType);
  } catch (error) {
    console.error("Error updating access type:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

/**
 * Delete an Access Type permanently
 */
const deleteAccessType = async (req, res) => {
  try {
    const { id } = req.params;
    const accessType = await AccessType.findById(id);
    if (!accessType) {
      return sendResponse(res, 404, false, "Access type not found");
    }

    await AccessType.findByIdAndDelete(id);
    return sendResponse(res, 200, true, "Access type deleted successfully");
  } catch (error) {
    console.error("Error deleting access type:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = {
  createAccessType,
  getAllAccessTypes,
  getAccessTypeById,
  updateAccessType,
  deleteAccessType,
};

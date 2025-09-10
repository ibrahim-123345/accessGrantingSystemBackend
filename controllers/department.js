const { Department } = require("../models/departments");

// Helper for consistent API responses
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentCode, description } = req.body;

    // Basic validation
    if (!departmentName || !departmentCode) {
      return sendResponse(res, 400, false, "Department name and code are required");
    }

    // Check for existing department with the same code
    const existingDepartment = await Department.findOne({ departmentCode });
    if (existingDepartment) {
      return sendResponse(res, 400, false, "Department code already exists");
    }

    const newDepartment = new Department({
      departmentName,
      departmentCode,
      description,
    });

    const savedDepartment = await newDepartment.save();
    return sendResponse(res, 201, true, "Department created successfully", savedDepartment);
  } catch (error) {
    console.error("Error creating department:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    return sendResponse(res, 200, true, "Departments fetched successfully", departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return sendResponse(res, 404, false, "Department not found");
    }
    return sendResponse(res, 200, true, "Department fetched successfully", department);
  } catch (error) {
    console.error("Error fetching department:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName, departmentCode, description, isActive } = req.body;

    // Check if department exists
    const department = await Department.findById(id);
    if (!department) {
      return sendResponse(res, 404, false, "Department not found");
    }

    // Check for duplicate departmentCode if updating it
    if (departmentCode && departmentCode !== department.departmentCode) {
      const existingDepartment = await Department.findOne({ departmentCode });
      if (existingDepartment) {
        return sendResponse(res, 400, false, "Department code already exists");
      }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      {
        departmentName,
        departmentCode,
        description,
        isActive,
      },
      { new: true, runValidators: true }
    );

    return sendResponse(res, 200, true, "Department updated successfully", updatedDepartment);
  } catch (error) {
    console.error("Error updating department:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return sendResponse(res, 404, false, "Department not found");
    }

    await Department.findByIdAndDelete(id);
    return sendResponse(res, 200, true, "Department deleted successfully");
  } catch (error) {
    console.error("Error deleting department:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};

const { Department } = require("../models/departments");

// Helper for consistent API responses
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentCode, description, headEmail } = req.body;

    if (!departmentName || !departmentCode) {
      return sendResponse(res, 400, false, "Department name and code are required");
    }

    const existingDepartment = await Department.findOne({ departmentCode });
    if (existingDepartment) {
      return sendResponse(res, 400, false, "Department code already exists");
    }

    let headOfDepartment = undefined;

    // If headEmail is provided, find the employee
    if (headEmail) {
      const employee = await Employee.findOne({ email: headEmail });
      if (employee) headOfDepartment = employee._id;
      else
        return sendResponse(res, 404, false, "Employee with provided email not found");
    }

    const newDepartment = new Department({
      departmentName,
      departmentCode,
      description,
      headOfDepartment, // optional
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
    const { departmentName, departmentCode, description, isActive, headEmail } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      return sendResponse(res, 404, false, "Department not found");
    }

    if (departmentCode && departmentCode !== department.departmentCode) {
      const existingDepartment = await Department.findOne({ departmentCode });
      if (existingDepartment) {
        return sendResponse(res, 400, false, "Department code already exists");
      }
    }

    let headOfDepartment = department.headOfDepartment; // keep current if not updated

    // If headEmail is provided, find employee
    if (headEmail) {
      const employee = await Employee.findOne({ email: headEmail });
      if (employee) headOfDepartment = employee._id;
      else
        return sendResponse(res, 404, false, "Employee with provided email not found");
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      {
        departmentName,
        departmentCode,
        description,
        isActive,
        headOfDepartment,
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

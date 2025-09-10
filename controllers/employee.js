// =============================
// Import Models
// =============================
const { Department } = require("../models/departments");
const { Employee } = require("../models/employee");

// =============================
// Helper: Standardized Response
// =============================
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// =============================
// Controller Functions
// =============================

// Get All Employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find(); // autopopulate from schema middleware
    return sendResponse(res, 200, true, "Employees fetched successfully", employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Get Employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id); // autopopulate from schema middleware
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }
    return sendResponse(res, 200, true, "Employee fetched successfully", employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Create New Employee
const createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      employeeId,
      jobTitle,
      departmentId,
      supervisorId,
      isActive,
      hireDate,
    } = req.body;

    // Basic validation
    if (!fullName || !email || !employeeId || !departmentId) {
      return sendResponse(res, 400, false, "Missing required fields");
    }

    // Check if department exists
    const departmentExists = await Department.findById(departmentId);
    if (!departmentExists) {
      return sendResponse(res, 400, false, "Invalid departmentId: department does not exist");
    }

    // Check for existing email or employeeId
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { employeeId }],
    });
    if (existingEmployee) {
      return sendResponse(res, 409, false, "Email or Employee ID already exists");
    }

    // Prepare new employee object
    const newEmployeeData = {
      fullName,
      email,
      phone,
      employeeId,
      jobTitle,
      departmentId,
      department: {
        departmentName: departmentExists.departmentName,
        departmentCode: departmentExists.departmentCode,
      },
      isActive: isActive ?? true,
      hireDate,
    };

    // Only include supervisor if supervisorId is provided
    if (supervisorId) {
      const supervisor = await Employee.findById(supervisorId);
      if (!supervisor) {
        return sendResponse(res, 400, false, "Invalid supervisorId: supervisor does not exist");
      }
      newEmployeeData.supervisorId = supervisorId;
      newEmployeeData.supervisor = {
        fullName: supervisor.fullName,
        email: supervisor.email,
        jobTitle: supervisor.jobTitle,
      };
    }

    const newEmployee = new Employee(newEmployeeData);
    const savedEmployee = await newEmployee.save();

    return sendResponse(res, 201, true, "Employee created successfully", savedEmployee);
  } catch (error) {
    console.error("Error creating employee:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating email or employeeId to an existing one
    if (updates.email || updates.employeeId) {
      const existingEmployee = await Employee.findOne({
        $or: [{ email: updates.email }, { employeeId: updates.employeeId }],
        _id: { $ne: id },
      });
      if (existingEmployee) {
        return sendResponse(res, 409, false, "Email or Employee ID already exists");
      }
    }

    // If departmentId is being updated, validate it
    if (updates.departmentId) {
      const departmentExists = await Department.findById(updates.departmentId);
      if (!departmentExists) {
        return sendResponse(res, 400, false, "Invalid departmentId: department does not exist");
      }
      updates.department = {
        departmentName: departmentExists.departmentName,
        departmentCode: departmentExists.departmentCode,
      };
    }

    // If supervisorId is being updated
    if (updates.supervisorId) {
      const supervisor = await Employee.findById(updates.supervisorId);
      if (!supervisor) {
        return sendResponse(res, 400, false, "Invalid supervisorId: supervisor does not exist");
      }
      updates.supervisor = {
        fullName: supervisor.fullName,
        email: supervisor.email,
        jobTitle: supervisor.jobTitle,
      };
    } else if (updates.supervisorId === null || updates.supervisorId === "") {
      // Remove supervisor completely if null/empty passed
      updates.supervisorId = undefined;
      updates.supervisor = undefined;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedEmployee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    return sendResponse(res, 200, true, "Employee updated successfully", updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return sendResponse(res, 404, false, "Employee not found");
    }
    return sendResponse(res, 200, true, "Employee deleted successfully");
  } catch (error) {
    console.error("Error deleting employee:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Exports
// =============================
module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

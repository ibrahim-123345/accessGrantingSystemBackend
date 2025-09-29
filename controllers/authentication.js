const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const {Authentication}=require("../models/authentication");
const { Employee } = require("../models/employee");
const { Department } = require('../models/departments');
// =============================
const { Notification } = require('../models/notification');
const { SystemsPlatform} = require('../models/systemsPlatform');
const { AccessRequest } = require('../models/accessRequest');
const { AccessType} = require('../models/accessTypes');




// Helper: Standardized Response
// =============================
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// =============================
// User Login
// =============================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, false, "Email and password are required");
    }

    const user = await Authentication.findOne({ email });
    if (!user) {
      return sendResponse(res, 401, false, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, false, "Invalid email or password");
    }

    const employee = await Employee.findById(user.employeeId);
    console.log("Associated employee record:", user._id, employee);


    const {
      _id: userId,
      role,
      email: userEmail
    } = user.toObject();

    const payload = {
      user: {
        userId,
        role,
        email: userEmail
      }
    };

    if (employee) {
      const {
        _id:empId,
        employeeId: employeeId,
        fullName,
        phone,
        jobTitle,
        department,
        departmentId,
        isActive,
        hireDate,
        createdAt,
        updatedAt,
        __v
      } = employee.toObject();

      payload.employee = {
        employeeId,
        empId,
        fullName,
        phone,
        jobTitle,
        isActive,
        hireDate,
        createdAt,
        updatedAt,
        __v,
        department: {
          departmentName: department?.departmentName,
          departmentCode: department?.departmentCode
        },
        departmentId: {
          _id: departmentId?._id,
          departmentName: departmentId?.departmentName,
          departmentCode: departmentId?.departmentCode
        }
      };
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const { password: pwd, ...userData } = user.toObject();
    return sendResponse(res, 200, true, "Login successful", { token });
  } catch (error) {
    console.error("Login error:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};




// =============================
// Create User
// =============================
const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return sendResponse(res, 400, false, "Missing required fields");
    }

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return sendResponse(res, 400, false, "No employee with this email exists in the company");
    }

    const existingUser = await Authentication.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 409, false, "User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Authentication({
      employeeId: employee._id , // Reference to employee
      email,
      password: hashedPassword,
      role
    });

    const savedUser = await newUser.save();
    return sendResponse(res, 201, true, "User created successfully", savedUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};


const deSeeding = async (req, res) => {
  try {
     await Authentication.deleteMany({});
     await Department.deleteMany({})
     await Employee.deleteMany({})
     await Notification.deleteMany({})
     await AccessRequest.deleteMany({})
     await AccessType.deleteMany({})
     await SystemsPlatform.deleteMany({})



  
    return sendResponse(res, 200, true, "congratulations on your first trip to jail coz you have wiped down intire company database");
  } catch (error) {
    console.error("Error deleting db:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};





module.exports = { login, createUser ,deSeeding};
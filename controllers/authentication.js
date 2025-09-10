const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const {Authentication}=require("../models/authentication");
const { Employee } = require("../models/employee");
// =============================
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





const createUser=async(req,res)=>{
  try {
    const {email, password, role} = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return sendResponse(res, 400, false, "Missing required fields");
    }


    // Check for duplicate email
    const existingUser = await Authentication.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 409, false, "Email or Employee ID already in use");
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new Authentication({
      email,
      password: hashedPassword,
      role
    });

    console.log("New user data:", newUser);

    const savedUser = await newUser.save();
    return sendResponse(res, 201, true, "User created successfully", newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { login, createUser };
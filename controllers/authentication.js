const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Authentication:User} = require("../models/authentication");
const { Employee } = require("../models/employee");
const { Role } = require("../models/role");
const { Department } = require("../models/departments");


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

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, 401, false, "Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendResponse(res, 401, false, "Invalid email or password");

    const employee = user.employeeId ? await Employee.findById(user.employeeId) : null;

    const effective = await user.getEffectivePermissions();

    const payload = {
      user: {
        userId: user._id,
        email: user.email,
        roles: effective.roles,
        permissions: effective.permissions
      }
    };

    if (employee) {
      payload.employee = {
        employeeId: employee._id,
        fullName: employee.fullName,
        phone: employee.phone,
        jobTitle: employee.jobTitle,
        isActive: employee.isActive,
        department: employee.department
      };
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
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
    const { email, password, primaryRoleId, extraRoleIds } = req.body;

    if (!email || !password || !primaryRoleId) {
      return sendResponse(res, 400, false, "Missing required fields");
    }

    const employee = await Employee.findOne({ email });
    if (!employee) return sendResponse(res, 400, false, "No employee with this email exists");

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendResponse(res, 409, false, "User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      employeeId: employee._id,
      primaryRole: primaryRoleId,
      extraRoles: extraRoleIds || []
    });

    const savedUser = await newUser.save();
    return sendResponse(res, 201, true, "User created successfully", savedUser);

  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Update User info (name, department, password)
// =============================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, department, password } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (department) updates.department = department;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const updated = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return sendResponse(res, 404, false, "User not found");

    return sendResponse(res, 200, true, "User updated successfully", updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Update / Revoke Roles
// =============================
const updateUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { primaryRoleId, extraRoleIds } = req.body;

    const updates = {};
    if (primaryRoleId) updates.primaryRole = primaryRoleId;
    if (extraRoleIds) updates.extraRoles = extraRoleIds;

    const updated = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return sendResponse(res, 404, false, "User not found");

    return sendResponse(res, 200, true, "User roles updated successfully", updated);
  } catch (error) {
    console.error("Error updating roles:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Delete User
// =============================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return sendResponse(res, 404, false, "User not found");

    return sendResponse(res, 200, true, "User deleted successfully", deleted);
  } catch (error) {
    console.error("Error deleting user:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Delete All Data (Seeding / Reset)
// =============================
const deSeeding = async (req, res) => {
  try {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Notification.deleteMany({});
    await AccessRequest.deleteMany({});
    await AccessType.deleteMany({});
    await SystemsPlatform.deleteMany({});

    return sendResponse(res, 200, true, "All company data wiped successfully");
  } catch (error) {
    console.error("Error deleting DB:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = {
  login,
  createUser,
  updateUser,
  updateUserRoles,
  deleteUser,
  deSeeding
};

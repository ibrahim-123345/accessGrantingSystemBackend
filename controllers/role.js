const { Role } = require("../models/role");
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const createRole = async (req, res) => {
  try {
    const { role, permissions } = req.body;
    if (!role) return sendResponse(res, 400, false, "Role name required");

    const existing = await Role.findOne({ role });
    if (existing) return sendResponse(res, 409, false, "Role already exists");

    const newRole = new Role({ role, permissions });
    await newRole.save();
    return sendResponse(res, 201, true, "Role created", newRole);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    return sendResponse(res, 200, true, "Roles fetched", roles);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, role } = req.body;

    const updated = await Role.findByIdAndUpdate(id, { permissions, role }, { new: true });
    if (!updated) return sendResponse(res, 404, false, "Role not found");

    return sendResponse(res, 200, true, "Role updated", updated);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Role.findByIdAndDelete(id);
    if (!deleted) return sendResponse(res, 404, false, "Role not found");

    return sendResponse(res, 200, true, "Role deleted", deleted);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

module.exports = { createRole, getRoles, updateRole, deleteRole };

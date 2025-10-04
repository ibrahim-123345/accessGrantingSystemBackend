const { Role } = require("../role");

const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const seedRoles = async (req, res) => {
  try {
    const roles = [
      {
        role: "admin",
        description: "Administrator with full access",
        permissions: { canRead: true, canInsert: true, canUpdate: true, canDelete: true },
        accessLevel: 5
      },
      {
        role: "manager",
        description: "Manager with moderate access",
        permissions: { canRead: true, canInsert: true, canUpdate: true, canDelete: false },
        accessLevel: 4
      },
      {
        role: "junior",
        description: "Junior employee with limited access",
        permissions: { canRead: true, canInsert: true, canUpdate: false, canDelete: false },
        accessLevel: 2
      },
      {
        role: "intern",
        description: "Intern with minimal access",
        permissions: { canRead: true, canInsert: false, canUpdate: false, canDelete: false },
        accessLevel: 1
      },
      {
        role: "employee",
        description: "Regular employee access",
        permissions: { canRead: true, canInsert: true, canUpdate: false, canDelete: false },
        accessLevel: 3
      }
    ];

    // Insert roles into DB, ignoring duplicates
    const savedRoles = [];
    for (const r of roles) {
      const exists = await Role.findOne({ role: r.role });
      if (!exists) {
        const roleDoc = new Role(r);
        await roleDoc.save();
        savedRoles.push(roleDoc);
      }
    }

    return sendResponse(res, 201, true, "Roles seeded successfully", savedRoles);
  } catch (error) {
    console.error("Error seeding roles:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Optional: get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    return sendResponse(res, 200, true, "Roles fetched successfully", roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedRoles, getRoles };

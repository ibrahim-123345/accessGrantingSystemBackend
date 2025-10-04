const { AccessType } = require("../accessTypes");

// Helper: Standardized response
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// Seed initial access types
const seedAccessTypes = async (req, res) => {
  try {
    const accessTypes = [
      {
        typeName: "ReadOnly",
        description: "Can only read records",
        requiresJustification: false,
        defaultDurationDays: 30,
        riskLevel: "low",
        canRead: true,
        canInsert: false,
        canUpdate: false,
        canDelete: false
      },
      {
        typeName: "Editor",
        description: "Can read and update records",
        requiresJustification: false,
        defaultDurationDays: 30,
        riskLevel: "medium",
        canRead: true,
        canInsert: true,
        canUpdate: true,
        canDelete: false
      },
      {
        typeName: "AdminAccess",
        description: "Full access to read, insert, update, delete",
        requiresJustification: true,
        defaultDurationDays: 60,
        riskLevel: "high",
        canRead: true,
        canInsert: true,
        canUpdate: true,
        canDelete: true
      }
    ];

    const savedTypes = [];
    for (const t of accessTypes) {
      const exists = await AccessType.findOne({ typeName: t.typeName });
      if (!exists) {
        const typeDoc = new AccessType(t);
        await typeDoc.save();
        savedTypes.push(typeDoc);
      }
    }

    return sendResponse(res, 201, true, "Access types seeded successfully", savedTypes);
  } catch (error) {
    console.error("Error seeding access types:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// Optional: get all access types
const getAccessTypes = async (req, res) => {
  try {
    const types = await AccessType.find({});
    return sendResponse(res, 200, true, "Access types fetched successfully", types);
  } catch (error) {
    console.error("Error fetching access types:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedAccessTypes, getAccessTypes };

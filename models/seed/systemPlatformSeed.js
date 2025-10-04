const mongoose = require("mongoose");
const { SystemsPlatform } = require("../systemsPlatform");
const { Department } = require("../departments"); 

const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const seedSystemsPlatforms = async (req, res) => {
  try {
    // Fetch all departments to assign ownerDepartmentId
    const departments = await Department.find();
    if (departments.length === 0) {
      return sendResponse(res, 400, false, "Please seed departments first");
    }

    const platforms = [
      {
        systemName: "Email System",
        systemType: "internal",
        description: "Company internal email system",
        systemUrl: "https://mail.evmak.com",
        ownerDepartmentId: departments[0]._id,
        technicalContact: {
          name: "Tech Support",
          email: "techsupport@evmak.com",
          phone: "+255700000001"
        },
        securityLevel: "medium"
      },
      {
        systemName: "HR Portal",
        systemType: "internal",
        description: "Human resources management platform",
        systemUrl: "https://hr.evmak.com",
        ownerDepartmentId: departments[1]?._id || departments[0]._id,
        technicalContact: {
          name: "HR IT",
          email: "hrit@evmak.com",
          phone: "+255700000002"
        },
        securityLevel: "high"
      },
      {
        systemName: "CRM System",
        systemType: "cloud",
        description: "Customer relationship management system",
        systemUrl: "https://crm.evmak.com",
        ownerDepartmentId: departments[2]?._id || departments[0]._id,
        technicalContact: {
          name: "CRM Admin",
          email: "crmadmin@evmak.com",
          phone: "+255700000003"
        },
        securityLevel: "medium"
      },
      {
        systemName: "Finance App",
        systemType: "internal",
        description: "Financial and payroll management system",
        systemUrl: "https://finance.evmak.com",
        ownerDepartmentId: departments[1]?._id || departments[0]._id,
        technicalContact: {
          name: "Finance IT",
          email: "financeit@evmak.com",
          phone: "+255700000004"
        },
        securityLevel: "high"
      },
      {
        systemName: "Project Tracker",
        systemType: "cloud",
        description: "Project management and tracking tool",
        systemUrl: "https://projects.evmak.com",
        ownerDepartmentId: departments[0]._id,
        technicalContact: {
          name: "Project Admin",
          email: "projects@evmak.com",
          phone: "+255700000005"
        },
        securityLevel: "low"
      }
    ];

    const createdPlatforms = [];
    for (const p of platforms) {
      const exists = await SystemsPlatform.findOne({ systemName: p.systemName });
      if (exists) continue;

      const newPlatform = new SystemsPlatform(p);
      await newPlatform.save();
      createdPlatforms.push(newPlatform);
    }

    return sendResponse(res, 201, true, "Systems platforms seeded successfully", createdPlatforms);
  } catch (error) {
    console.error("Error seeding systems platforms:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedSystemsPlatforms };

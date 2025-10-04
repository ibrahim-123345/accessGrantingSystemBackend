const { Department } = require("../departments");

// Helper: Standardized response
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// Seed initial departments
const seedDepartments = async (req, res) => {
  try {
    const departments = [
      { departmentName: "Human Resources", departmentCode: "HR", description: "Handles employee matters" },
      { departmentName: "Finance", departmentCode: "FIN", description: "Manages company finances" },
      { departmentName: "IT", departmentCode: "IT", description: "Handles all technical systems" },
      { departmentName: "Operations", departmentCode: "OPS", description: "Oversees operational activities" },
      { departmentName: "Sales", departmentCode: "SAL", description: "Manages sales and clients" }
    ];

    const savedDepartments = [];
    for (const dep of departments) {
      const exists = await Department.findOne({ departmentCode: dep.departmentCode });
      if (!exists) {
        const depDoc = new Department(dep);
        await depDoc.save();
        savedDepartments.push(depDoc);
      }
    }

    return sendResponse(res, 201, true, "Departments seeded successfully", savedDepartments);
  } catch (error) {
    console.error("Error seeding departments:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    return sendResponse(res, 200, true, "Departments fetched successfully", departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedDepartments, getDepartments };

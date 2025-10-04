const mongoose = require("mongoose");
const { Employee } = require("../employee");
const { Department } = require("../departments");

// =============================
// Helper: Standardized Response
// =============================
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

// =============================
// Seed Initial Employees
// =============================
const seedEmployees = async (req, res) => {
  try {
    // Ensure departments exist
    const departments = await Department.find({});
    if (departments.length === 0) {
      return sendResponse(res, 400, false, "Please seed departments first");
    }

    const employees = [
      {
        fullName: "Ismail",
        email: "ismail@evmak.com",
        phone: "0711000001",
        employeeId: "EMP001",
        jobTitle: "HR Officer",
        departmentId: departments.find(d => d.departmentCode === "HR")?._id,
        department: { departmentName: "Human Resources", departmentCode: "HR" },
        hireDate: new Date("2022-01-15")
      },
      {
        fullName: "Sakina",
        email: "sakina@evmak.com",
        phone: "0711000002",
        employeeId: "EMP002",
        jobTitle: "Finance Analyst",
        departmentId: departments.find(d => d.departmentCode === "FIN")?._id,
        department: { departmentName: "Finance", departmentCode: "FIN" },
        hireDate: new Date("2022-02-20")
      },
      {
        fullName: "Ludovic",
        email: "ludovic@evmak.com",
        phone: "0711000003",
        employeeId: "EMP003",
        jobTitle: "IT Support",
        departmentId: departments.find(d => d.departmentCode === "IT")?._id,
        department: { departmentName: "IT", departmentCode: "IT" },
        hireDate: new Date("2021-11-10")
      },
      {
        fullName: "Said",
        email: "said@evmak.com",
        phone: "0711000004",
        employeeId: "EMP004",
        jobTitle: "Operations Assistant",
        departmentId: departments.find(d => d.departmentCode === "OPS")?._id,
        department: { departmentName: "Operations", departmentCode: "OPS" },
        hireDate: new Date("2023-03-01")
      },
      {
        fullName: "Sharon",
        email: "sharon@evmak.com",
        phone: "0711000005",
        employeeId: "EMP005",
        jobTitle: "Sales Executive",
        departmentId: departments.find(d => d.departmentCode === "SAL")?._id,
        department: { departmentName: "Sales", departmentCode: "SAL" },
        hireDate: new Date("2022-07-15")
      }
    ];

    const savedEmployees = [];
    for (const emp of employees) {
      const exists = await Employee.findOne({ email: emp.email });
      if (!exists) {
        const empDoc = new Employee(emp);
        await empDoc.save();
        savedEmployees.push(empDoc);
      }
    }

    return sendResponse(res, 201, true, "Employees seeded successfully", savedEmployees);
  } catch (error) {
    console.error("Error seeding employees:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

// =============================
// Get All Employees
// =============================
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    return sendResponse(res, 200, true, "Employees fetched successfully", employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedEmployees, getEmployees };

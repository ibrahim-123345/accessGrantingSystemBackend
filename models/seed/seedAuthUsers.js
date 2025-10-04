const bcrypt = require("bcrypt");
const { Authentication } = require("../authentication");
const { Employee } = require("../employee");

const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

const seedAuthUsers = async (req, res) => {
  try {
    const employees = await Employee.find({
      email: { $in: [
        "ismail@evmak.com",
        "sakina@evmak.com",
        "ludovic@evmak.com",
        "said@evmak.com",
        "sharon@evmak.com"
      ]}
    });

    if (employees.length === 0) {
      return sendResponse(res, 400, false, "Please seed employees first");
    }

    const createdUsers = [];

    for (const emp of employees) {
      const exists = await Authentication.findOne({ email: emp.email });
      if (exists) continue;

      const hashedPassword = await bcrypt.hash("password123", 10); // default password

      const user = new Authentication({
        fullName: emp.fullName,
        email: emp.email,
        password: hashedPassword,
        employeeId: emp._id,
        department: emp.department?.departmentName || ""
      });

      await user.save();
      createdUsers.push(user);
    }

    return sendResponse(res, 201, true, "Authentication users seeded successfully", createdUsers);

  } catch (error) {
    console.error("Error seeding authentication users:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

module.exports = { seedAuthUsers };

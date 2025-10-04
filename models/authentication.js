const mongoose = require("mongoose");
const { Role } = require("./role");
const { Employee } = require("./employee");

const authenticationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    primaryRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    extraRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    department: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


authenticationSchema.pre("save", async function (next) {
  if (!this.isModified("email")) return next();

  try {
    const employee = await Employee.findOne({ email: this.email });

    if (employee) {
      this.employeeId = employee._id;

      if (!this.department && employee.department) {
        this.department = employee.department;
      }
    }

    if (!this.primaryRole) {
      const defaultRole = await Role.findOne({ role: "intern" });
      if (defaultRole) {
        this.primaryRole = defaultRole._id;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});


authenticationSchema.pre(/^find/, function (next) {
  this.populate("employeeId", "name email department position")
      .populate("primaryRole", "role permissions")
      .populate("extraRoles", "role permissions");
  next();
});



authenticationSchema.methods.hasRole = async function (roleName) {
  await this.populate(["primaryRole", "extraRoles"]);
  const allRoles = [
    this.primaryRole?.role,
    ...(this.extraRoles?.map(r => r.role) || []),
  ];
  return allRoles.includes(roleName);
};

authenticationSchema.methods.hasPermission = async function (permissionName) {
  await this.populate(["primaryRole", "extraRoles"]);
  const allRoles = [this.primaryRole, ...(this.extraRoles || [])].filter(Boolean);

  return allRoles.some(r => r.permissions?.[permissionName]);
};

authenticationSchema.methods.getAllRoles = async function () {
  await this.populate(["primaryRole", "extraRoles"]);
  const allRoles = [
    this.primaryRole?.role,
    ...(this.extraRoles?.map(r => r.role) || []),
  ];
  return allRoles.filter(Boolean);
};

authenticationSchema.methods.getEffectivePermissions = async function () {
  await this.populate(["primaryRole", "extraRoles"]);

  const allRoles = [this.primaryRole, ...(this.extraRoles || [])].filter(Boolean);

  const mergedPermissions = {
    canRead: allRoles.some(r => r.permissions?.canRead),
    canInsert: allRoles.some(r => r.permissions?.canInsert),
    canUpdate: allRoles.some(r => r.permissions?.canUpdate),
    canDelete: allRoles.some(r => r.permissions?.canDelete),
  };

  const roles = allRoles.map(r => r.role);

  return {
    roles,
    permissions: mergedPermissions
  };
};


const Authentication= mongoose.model("Authentication", authenticationSchema);
module.exports = { Authentication };

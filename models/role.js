const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "manager", "junior", "intern", "employee"],
      required: true,
      unique: true,
      default:"intern"
    },
    description: String,
    permissions: {
      canRead: { type: Boolean, default: false },
      canInsert: { type: Boolean, default: false },
      canUpdate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
    },
    accessLevel: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);
module.exports = { Role };

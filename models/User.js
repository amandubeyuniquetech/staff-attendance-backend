import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // Unique identifier
    name: { type: String, required: true },
    avatar:{ type: String, required: true, default:""},
    mobile: { type: String, required: true, unique: true }, // Mobile number for login
    password: { type: String, required: true },
    role: { type: String, enum: ["employee", "admin"], default: "employee" }, // Role-based access
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

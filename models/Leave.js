import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  employeeId: { type: String, ref: "User", required: true },
  employeeName: { type: String, ref: "User", required: true }, 
  startDate: { type: Date, required: true },
  message:{type: String, required: true},
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  appliedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Leave", leaveSchema);

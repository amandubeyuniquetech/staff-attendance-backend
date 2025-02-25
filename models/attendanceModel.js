import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
    userId: { type: String, ref: "User" },
    name:{type: String, ref:"User"},
    selfieUrl: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
},{timestamps:true});

// ✅ Use ES module syntax
export default mongoose.model("Attendance", AttendanceSchema);

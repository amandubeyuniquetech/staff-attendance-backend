import express from "express";
import {upload} from "../config/s3Config.js";
import Attendance from "../models/attendanceModel.js";
import {verifyToken,verifyAdmin} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/mark-attendance", verifyToken, upload.single("selfie"), async (req, res) => {
    try {
        console.log("📢 Received `req.user`:", req.user);

        if (req.user.role !== "employee") {
            return res.status(403).json({ error: "Access denied. Only employees can mark attendance." });
        }

        const { latitude, longitude } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Selfie is required" });
        }

        const userId = req.user.userId || req.user._id || req.user.id;
        const name = req.user.name ;
        if (!userId) {
            return res.status(400).json({ error: "User ID is missing from authentication." });
        }

        // ✅ Check if attendance is already marked for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            userId,
            timestamp: { $gte: today, $lte: endOfDay },
        });

        if (existingAttendance) {
            return res.status(400).json({ error: "Attendance already marked for today." });
        }

        // ✅ Save new attendance record
        const attendance = new Attendance({
            userId,
            name,
            selfieUrl: req.file.location,
            latitude,
            longitude,
        });

        await attendance.save();
        res.status(201).json({ message: "✅ Attendance marked successfully!", attendance });

    } catch (error) {
        console.error("❌ Error marking attendance:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 📌 Get Attendance Data for a Specific User
router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Fetch attendance data sorted by latest timestamp
      const attendanceRecords = await Attendance.find({ userId }).sort({ timestamp: -1 });
  
      if (!attendanceRecords.length) {
        return res.status(404).json({ message: "No attendance records found." });
      }
  
      res.status(200).json(attendanceRecords);
    } catch (error) {
      console.error("Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch attendance data" });
    }
  });
  
// 🛠 Admin - Fetch attendance with filters, sorting & pagination
router.get("/admin/attendance", verifyToken, verifyAdmin, async (req, res) => {
    try {
        let { userId, date, sort = "desc", page = 1, limit = 100 } = req.query;

        const query = {};
        if (userId) query.userId = userId;

        // ✅ Correct Date Filtering
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.timestamp = { $gte: startOfDay, $lte: endOfDay };
        }

        const options = {
            sort: { timestamp: sort === "asc" ? 1 : -1 }, // Sort by timestamp
            skip: (page - 1) * limit,
            limit: parseInt(limit),
        };

        const attendanceRecords = await Attendance.find(query)
            .sort(options.sort)
            .skip(options.skip)
            .limit(options.limit);

        const totalRecords = await Attendance.countDocuments(query);

        res.json({
            success: true,
            totalRecords,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / limit),
            data: attendanceRecords,
        });
    } catch (error) {
        console.error("❌ Error fetching attendance:", error);
        res.status(500).json({ success: false, message: "Server Error", error });
    }
});


export default router; // ✅ Ensure default export

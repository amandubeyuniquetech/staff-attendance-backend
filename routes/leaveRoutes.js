import express from "express";
const router = express.Router();
import Leave from "../models/Leave.js";
import { verifyToken } from "../middleware/authMiddleware.js";

// Apply for Leave (Only Employees)
// Apply for Leave (Employees Only)
router.post("/apply", verifyToken, async (req, res) => {
    try {
      const { startDate, endDate, reason, message } = req.body;
  
      if (req.user.role !== "employee") {
        return res.status(403).json({ error: "Only employees can apply for leave." });
      }
  
      const leave = new Leave({
        employeeId: req.user.userId,
        employeeName: req.user.name,
        startDate,
        endDate,
        reason,
        message,
        status: "Pending", // Default status
      });
  
      await leave.save();
  
      // Send real-time notification to all connected admins
      req.io.emit("newLeaveRequest", {
        message: "New leave request received",
        employeeName: req.user.name,
        startDate,
        endDate,
        reason,
      });
  
      res.status(201).json({ message: "Leave applied successfully!", leave });
    } catch (error) {
      res.status(500).json({ error: "Server error. Try again later." });
    }
  });

// Get Employee's Leave Status
router.get("/status", verifyToken, async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user.userId });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ error: "Server error. Try again later." });
  }
});


// **Admin - Update Leave Status (Approve/Reject)**
// **Admin - Update Leave Status (Approve/Reject) and Modify Dates**
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
      if (req.user.role !== "admin") {
          return res.status(403).json({ error: "Only admins can update leave status." });
      }

      const { status, startDate, endDate } = req.body;

      if (!["Approved", "Rejected"].includes(status)) {
          return res.status(400).json({ error: "Invalid status. Allowed: 'Approved' or 'Rejected'." });
      }

      const leave = await Leave.findById(req.params.id);
      if (!leave) {
          return res.status(404).json({ error: "Leave request not found." });
      }

      // Allow admin to modify leave dates before approval
      if (status === "Approved") {
          if (startDate) leave.startDate = new Date(startDate);
          if (endDate) leave.endDate = new Date(endDate);
      }

      leave.status = status;
      await leave.save();

      res.status(200).json({ message: `Leave ${status} successfully!`, leave });
  } catch (error) {
      console.error("Update Leave Status Error:", error);
      res.status(500).json({ error: "Server error. Try again later." });
  }
});

  router.get("/admin/leaves", verifyToken, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied." });
      }
  
      const leaves = await Leave.find();
      res.status(200).json(leaves);
    } catch (error) {
      res.status(500).json({ error: "Server error." });
    }
  });


  // router.patch("/admin/update/:id", verifyToken, async (req, res) => {
  //   try {
  //     if (req.user.role !== "admin") {
  //       return res.status(403).json({ error: "Access denied." });
  //     }
  
  //     const { status } = req.body;
  //     const leave = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true });
  
  //     if (!leave) return res.status(404).json({ error: "Leave not found." });
  
  //     res.status(200).json({ message: "Leave status updated!", leave });
  //   } catch (error) {
  //     res.status(500).json({ error: "Server error." });
  //   }
  // });

  router.patch("/admin/update/:id", verifyToken, async (req, res) => {
    try {
      const { status, startDate, endDate } = req.body;
      const leave = await Leave.findById(req.params.id);
  
      if (!leave) return res.status(404).json({ message: "Leave not found" });
  
      leave.status = status;
  
      if (startDate) leave.startDate = startDate;
      if (endDate) leave.endDate = endDate;
  
      await leave.save();
      res.json({ message: "Leave updated successfully", leave });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });
  
  
  
  

  

export default router;

import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {upload} from "../config/avatarS3Config.js";
import { v4 as uuidv4 } from "uuid"; // Generate unique userId
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 User Registration API
router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { userId, name, mobile, password, role } = req.body;
    if (!name || !mobile || !password || !role || !userId)
      return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ mobile });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get Image URL (if uploaded)
    

    // Save User
    const newUser = new User({
      userId,
      name,
      mobile,
      password: hashedPassword,
      role,
      avatar: req.file.location, // Store image URL
    });

    await newUser.save();
    res.json({ message: "User registered successfully!", user: newUser });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Login User
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { userId: user.userId, name: user.name, mobile: user.mobile, role: user.role } });
});

router.get("/users", verifyToken,verifyAdmin, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const users = await User.find({}, "userId name role avatar");
    res.json(users);

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
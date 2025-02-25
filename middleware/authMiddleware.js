import jwt from "jsonwebtoken";
import User from "../models/User.js"

 const verifyToken = async (req, res, next) => {
  try {
      const token = req.header("Authorization")?.split(" ")[1]; // Extract token

      if (!token) {
          return res.status(401).json({ error: "Access denied. No token provided." });
      }

      // Decode JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("📢 Decoded JWT Payload:", decoded); // Debugging

      // Fetch user details from DB
      const user = await User.findOne({ userId: decoded.userId });

      if (!user) {
          return res.status(404).json({ error: "User not found." });
      }

      req.user = {
          userId: user.userId.toString(), // ✅ Ensure correct userId
          role: user.role,
          name:user.name,
      };

      console.log("✅ Attached user to req.user:", req.user); // Debugging
      next();
  } catch (error) {
      console.error("❌ Authentication error:", error);
      res.status(401).json({ error: "Invalid token." });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access only" });
  next();
};

export { verifyToken, verifyAdmin };

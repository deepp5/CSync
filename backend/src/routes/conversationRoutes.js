import express from "express";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();

router.get("/conversations", verifySupabaseToken, (req, res) => {
  console.log("✅ Verified user:", req.user);
  res.json({ message: "Access granted", user: req.user });
});

export default router;

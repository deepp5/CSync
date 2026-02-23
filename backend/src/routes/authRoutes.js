import express from "express";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { prisma } from "../utils/prismaClient.js"; // centralized prisma

const router = express.Router();

/**
 * Called immediately after login
 * Verifies token and ensures user is synced
 */
router.post("/sync", verifySupabaseToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    console.error("AUTH SYNC FAILED:", err.message);

    return res.status(500).json({
      success: false,
      error: "User sync failed",
    });
  }
});

export default router;

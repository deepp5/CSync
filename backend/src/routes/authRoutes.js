import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Called immediately after login
 */
router.post("/sync", verifySupabaseToken, async (req, res) => {
  try {
    return res.json(req.user);
  } catch (err) {
    console.error("AUTH SYNC FAILED:", err);
    return res.status(500).json({ error: "User sync failed" });
  }
});

export default router;

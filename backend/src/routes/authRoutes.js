import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Called immediately after login
 */
router.post("/sync", verifySupabaseToken, async (req, res) => {
  try {
    const user = await ensureUserExists(prisma, req.user);
    res.json(user);
  } catch (err) {
    console.error("AUTH SYNC FAILED:", err);
    res.status(500).json({ error: "User sync failed" });
  }
});

export default router;
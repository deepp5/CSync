import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();

/**
 * POST /auth/sync
 * Ensures authenticated Supabase user exists in Prisma DB
 */
router.post("/sync", verifySupabaseToken, async (req, res) => {
  try {
    if (!req.user?.id || !req.user?.email) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Invalid token payload",
      });
    }

    const { id, email, user_metadata } = req.user;

    // Upsert user (create if not exists, update if exists)
    const dbUser = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        username: user_metadata?.username || email.split("@")[0],
      },
      create: {
        id,
        email,
        username: user_metadata?.username || email.split("@")[0],
      },
    });

    return res.status(200).json({
      success: true,
      user: dbUser,
    });
  } catch (err) {
    console.error("AUTH SYNC FAILED:", err);

    return res.status(500).json({
      success: false,
      error: "User sync failed",
    });
  }
});

export default router;

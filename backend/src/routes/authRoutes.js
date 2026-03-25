import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();
const prismaClient = new PrismaClient();

/**
 * POST /auth/sync
 * Makes sure the authenticated Supabase user exists in Prisma
 */
router.post("/sync", verifySupabaseToken, async (req, res) => {
  try {
    const authUser = req.user;

    if (!authUser?.id || !authUser?.email) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - token payload is invalid",
      });
    }

    const {
      id: userId,
      email: userEmail,
      user_metadata: metadata = {},
    } = authUser;

    const usernameToStore = metadata.username || userEmail.split("@")[0];

    const syncedUser = await prismaClient.user.upsert({
      where: { id: userId },
      update: {
        email: userEmail,
        username: usernameToStore,
      },
      create: {
        id: userId,
        email: userEmail,
        username: usernameToStore,
      },
    });

    return res.status(200).json({
      success: true,
      user: syncedUser,
    });
  } catch (error) {
    console.error("AUTH SYNC ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to sync user",
    });
  }
});

export default router;

import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /conversations
 * Returns a list of conversations for the logged-in user,
 * each with the other user's info + last message.
 */
router.get("/", verifySupabaseToken, async (req, res) => {
  try {
    // Ensure user exists in Prisma DB
    const me = await ensureUserExists(prisma, req.user);
    const meId = me.id;

    // Fetch recent messages involving me (newest first)
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: meId }, { receiverId: meId }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
      },
      take: 500,
    });

    // Build map of conversations keyed by the other user's id
    const convoMap = new Map();

    for (const m of messages) {
      const otherUserId =
        m.senderId === meId ? m.receiverId : m.senderId;

      if (!convoMap.has(otherUserId)) {
        convoMap.set(otherUserId, {
          otherUserId,
          lastMessage: m.content,
          lastMessageAt: m.createdAt,
        });
      }
    }

    const otherUserIds = Array.from(convoMap.keys());

    // Fetch user profiles for conversation partners
    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Shape final response
    const conversations = Array.from(convoMap.values()).map((c) => {
      const otherUser = userMap.get(c.otherUserId);

      return {
        userId: c.otherUserId,
        name: otherUser?.name || "Unknown User",
        username: otherUser?.username || null,
        profilePicture: otherUser?.profilePicture || null,
        lastMessage: c.lastMessage,
        createdAt: c.lastMessageAt,
      };
    });

    res.json(conversations);
  } catch (err) {
    console.error("GET /conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;

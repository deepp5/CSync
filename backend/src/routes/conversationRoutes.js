import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /conversations
 * Returns list of chat partners + last message.
 */
router.get("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);

    // get all my messages newest first
    const msgs = await prisma.message.findMany({
      where: {
        OR: [{ senderId: me.id }, { receiverId: me.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // build unique partner list in newest order
    const partnerIds = [];
    const seen = new Set();

    for (const m of msgs) {
      const otherId = m.senderId === me.id ? m.receiverId : m.senderId;
      if (!seen.has(otherId)) {
        seen.add(otherId);
        partnerIds.push(otherId);
      }
    }

    // fetch users for those partners (some may not exist)
    const users = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        email: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // shape response
    const conversations = partnerIds.map((otherId) => {
      const last = msgs.find(
        (m) =>
          (m.senderId === me.id && m.receiverId === otherId) ||
          (m.senderId === otherId && m.receiverId === me.id)
      );

      const otherUser = userMap.get(otherId) || {
        id: otherId,
        name: "Unknown User",
        username: null,
        profilePicture: null,
        email: null,
      };

      return {
        otherUserId: otherId,
        otherUser,
        lastMessage: last?.content ?? "",
        lastMessageAt: last?.createdAt ?? null,
      };
    });

    res.json(conversations);
  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

export default router;

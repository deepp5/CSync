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
    // Prevent caching (helps in some dev/proxy setups)
    res.setHeader("Cache-Control", "no-store");

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
      const otherUserId = m.senderId === meId ? m.receiverId : m.senderId;

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
        // unread currently frontend-only in your app
        unread: 0,
      };
    });

    res.json(conversations);
  } catch (err) {
    console.error("GET /conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * ✅ DELETE /conversations/:otherUserId
 * Deletes ALL messages between logged-in user and otherUserId (both directions)
 * Frontend calls: DELETE http://localhost:5051/conversations/:selectedChatId
 */
router.delete("/:otherUserId", verifySupabaseToken, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");

    const me = await ensureUserExists(prisma, req.user);
    const meId = me.id;

    const otherUserId = String(req.params.otherUserId || "").trim();
    if (!otherUserId) {
      return res.status(400).json({ error: "Missing otherUserId" });
    }
    if (otherUserId === meId) {
      return res.status(400).json({ error: "Cannot delete your own chat" });
    }

    const deleted = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: meId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: meId },
        ],
      },
    });

    // Optional: realtime notify (safe even if no listener)
    const io = req.app.get("io");
    if (io) {
      io.to(otherUserId).emit("conversation_deleted", { by: meId });
    }

    return res.json({ ok: true, deleted: deleted.count });
  } catch (err) {
    console.error("DELETE /conversations error:", err);
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;

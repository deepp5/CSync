import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js"; // if you have this

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = req.user.id;

    // Optional but recommended: ensure logged-in user exists in Prisma
    if (ensureUserExists) await ensureUserExists(req.user);

    // Pull recent messages involving me
    const msgs = await prisma.message.findMany({
      where: {
        OR: [{ senderId: me }, { receiverId: me }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: true,
        receiver: true,
      },
      take: 200, // safety limit
    });

    // Keep the latest message per partner
    const map = new Map();

    for (const m of msgs) {
      const other = m.senderId === me ? m.receiver : m.sender;
      if (!other) continue;

      if (!map.has(other.id)) {
        map.set(other.id, {
          // ✅ FRONTEND EXPECTS THESE FIELDS
          userId: other.id,
          name: other.name,
          username: other.email, // frontend uses username for search; ok to reuse email
          email: other.email,

          lastMessage: m.content,
          createdAt: m.createdAt,

          unread: 0,
          online: false,
        });
      }
    }

    res.json(Array.from(map.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

export default router;

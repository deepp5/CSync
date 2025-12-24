import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", verifySupabaseToken, async (req, res) => {
  try {
    console.log("🔍 [CONVERSATIONS] req.user:", {
      id: req.user.id,
      email: req.user.email,
      username: req.user.raw_user_meta_data?.username,
    });

    const me = await ensureUserExists(prisma, req.user);

    console.log("✅ [CONVERSATIONS] ensureUserExists returned:", {
      id: me.id,
      email: me.email,
      username: me.username,
      name: me.name,
    });

    // Get latest messages involving me (newest first)
    const msgs = await prisma.message.findMany({
      where: {
        OR: [{ senderId: me.id }, { receiverId: me.id }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
      },
      take: 500, // enough to build convo list
    });

    // Build unique conversations by other user
    const convoMap = new Map();
    for (const m of msgs) {
      const otherId = m.senderId === me.id ? m.receiverId : m.senderId;
      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, {
          userId: otherId,
          lastMessage: m.content,
          updatedAt: m.createdAt,
        });
      }
    }

    const otherIds = [...convoMap.keys()];

    console.log("👥 [CONVERSATIONS] Other user IDs:", otherIds);

    // Pull user profiles for those ids
    const users = await prisma.user.findMany({
      where: { id: { in: otherIds } },
      select: { id: true, name: true, username: true, profilePicture: true },
    });

    console.log("📇 [CONVERSATIONS] Users from DB:", users);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = otherIds.map((otherId) => {
      const conv = convoMap.get(otherId);
      const u = userMap.get(otherId);

      return {
        ...conv,
        name: u?.name || null,
        username: u?.username || null,
        profilePicture: u?.profilePicture || null,
      };
    });

    console.log(
      "📤 [CONVERSATIONS] Sending result:",
      JSON.stringify(result, null, 2)
    );

    res.json(result);
  } catch (err) {
    console.error("GET /conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;

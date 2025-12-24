import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

/* =========================
   GET MESSAGES
========================= */
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);
    const { receiverId } = req.params;

    // ✅ Ensure receiver exists without forcing username (avoid collisions)
    await ensureUserExists(prisma, {
      id: receiverId,
      email: `${receiverId}@placeholder.local`,
      user_metadata: {}, // DO NOT set username here
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me.id, receiverId },
          { senderId: receiverId, receiverId: me.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("GET messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/* =========================
   SEND MESSAGE (SOURCE OF TRUTH)
========================= */
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ✅ Ensure receiver exists (no username)
    await ensureUserExists(prisma, {
      id: receiverId,
      email: `${receiverId}@placeholder.local`,
      user_metadata: {},
    });

    const message = await prisma.message.create({
      data: {
        senderId: me.id,
        receiverId,
        content,
      },
    });

    // ✅ REALTIME EMIT
    const io = req.app.get("io");
    if (io) {
      // receiver gets instant update
      io.to(receiverId).emit("new_message", message);

      // OPTIONAL: if you want sender's other tabs to also get it:
      // io.to(me.id).emit("new_message", message);
    }

    return res.json(message);
  } catch (err) {
    console.error("POST message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;

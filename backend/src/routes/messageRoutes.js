// export default router;
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/* =========================
   GET MESSAGES
========================= */
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const { receiverId } = req.params;

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
   SEND MESSAGE
========================= */
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const message = await prisma.message.create({
      data: {
        senderId: me.id,
        receiverId,
        content,
      },
    });

    res.json(message);
  } catch (err) {
    console.error("POST message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
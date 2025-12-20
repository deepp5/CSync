import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Get messages
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    await ensureUserExists(req.user);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ Send message
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await ensureUserExists(req.user);

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;

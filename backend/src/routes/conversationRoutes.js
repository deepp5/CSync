import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET conversations list
router.get("/", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      distinct: ["senderId", "receiverId"],
      include: {
        sender: true,
        receiver: true,
      },
    });

    const formatted = conversations.map((msg) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      return {
        user: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
        },
        lastMessage: msg.content,
        createdAt: msg.createdAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

export default router;

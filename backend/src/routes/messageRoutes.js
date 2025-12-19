import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Fetch all messages between logged-in user and another user
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const senderId = req.user.id; // from your local JWT payload
    const { receiverId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: senderId.toString(), receiverId },
          { senderId: receiverId, receiverId: senderId.toString() },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Send a new message
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const senderId = req.user.id.toString();
    const { receiverId, content } = req.body;

    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
    });

    res.json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

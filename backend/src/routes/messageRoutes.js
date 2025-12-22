import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Get messages
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);
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
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);
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
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ✅ Send message
// router.post("/", verifySupabaseToken, async (req, res) => {
//   try {
//     const senderId = req.user.id;
//     const { receiverId, content } = req.body;

//     if (!receiverId || !content) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     await ensureUserExists(req.user);

//     const message = await prisma.message.create({
//       data: {
//         senderId,
//         receiverId,
//         content,
//       },
//     });

//     res.json(message);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// });

export default router;

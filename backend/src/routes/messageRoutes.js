// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { verifySupabaseToken } from "../utils/authMiddleware.js";
// import { ensureUserExists } from "../utils/ensureUser.js";

// const router = express.Router();
// const prisma = new PrismaClient();

// /* =========================
//    GET MESSAGES
// ========================= */
// router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
//   try {
//     // ✅ FIX: Pass both prisma AND req.user
//     const me = await ensureUserExists(prisma, req.user);
//     const { receiverId } = req.params;

//     // Ensure receiver exists (lazy sync)
//     await prisma.user.upsert({
//       where: { id: receiverId },
//       update: {},
//       create: {
//         id: receiverId,
//         email: `${receiverId}@placeholder.local`,
//         name: "Pending User",
//       },
//     });
//     const receiver = await prisma.user.findUnique({
//       where: { id: receiverId },
//     });
//     if (!receiver) {
//       return res.status(400).json({
//         error:
//           "Receiver does not exist in DB yet. Ask them to log in once so we can create their User row.",
//       });
//     }

//     const messages = await prisma.message.findMany({
//       where: {
//         OR: [
//           { senderId: me.id, receiverId },
//           { senderId: receiverId, receiverId: me.id },
//         ],
//       },
//       orderBy: { createdAt: "asc" },
//     });

//     res.json(messages);
//   } catch (err) {
//     console.error("GET messages error:", err);
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// });

// /* =========================
//    SEND MESSAGE
// ========================= */
// router.post("/", verifySupabaseToken, async (req, res) => {
//   try {
//     // ✅ FIX: Pass both prisma AND req.user
//     const me = await ensureUserExists(prisma, req.user);
//     const { receiverId, content } = req.body;

//     if (!receiverId || !content) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     // 🔑 ENSURE RECEIVER EXISTS
//     await prisma.user.upsert({
//       where: { id: receiverId },
//       update: {},
//       create: {
//         id: receiverId,
//         email: `${receiverId}@placeholder.local`,
//         name: "Pending User",
//       },
//     });

//     const message = await prisma.message.create({
//       data: {
//         senderId: me.id,
//         receiverId,
//         content,
//       },
//     });

//     res.json(message);
//   } catch (err) {
//     console.error("POST message error:", err);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// });

// export default router;
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
    // Ensure sender exists
    const me = await ensureUserExists(prisma, req.user);
    const { receiverId } = req.params;

    // Ensure receiver exists (lazy sync)
    await ensureUserExists(prisma, {
      id: receiverId,
      email: `${receiverId}@placeholder.local`,
      user_metadata: {
        username: `user_${receiverId.slice(0, 6)}`
      }
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
   SEND MESSAGE
========================= */
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    // Ensure sender exists
    const me = await ensureUserExists(prisma, req.user);
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Ensure receiver exists (lazy sync)
    await ensureUserExists(prisma, {
      id: receiverId,
      email: `${receiverId}@placeholder.local`,
      user_metadata: {
        username: `user_${receiverId.slice(0, 6)}`
      }
    });

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
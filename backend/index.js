import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import { verifySupabaseToken } from "./src/utils/authMiddleware.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ===========================
// ROUTES
// ===========================
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);

// ===========================
// SOCKET.IO
// ===========================
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("send_message", async ({ senderId, receiverId, content }) => {
    try {
      const message = await prisma.message.create({
        data: { senderId, receiverId, content },
      });

      io.to(receiverId).emit("receive_message", message);
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ===========================
// POSTS (JWT AUTH)
// ===========================

// Get all posts (except mine)
app.get("/posts", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await prisma.post.findMany({
      where: {
        NOT: { userId },
      },
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server error" });
  }
});

// Create post
app.post("/posts", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      title,
      header,
      techStack,
      description,
      category,
      difficulty,
      deadline,
    } = req.body;

    if (
      !title ||
      !header ||
      !description ||
      !category ||
      !difficulty ||
      !deadline
    ) {
      return res.status(400).json({ err: "Missing required fields" });
    }

    const post = await prisma.post.create({
      data: {
        title,
        header,
        description,
        techStack,
        category,
        difficulty,
        deadline: new Date(deadline),
        userId,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Failed to post" });
  }
});

// Get my posts
app.get("/posts/me", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Failure" });
  }
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5051;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

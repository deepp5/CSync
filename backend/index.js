import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js"


import { verifySupabaseToken } from "./src/utils/authMiddleware.js";
import { ensureUserExists } from "./src/utils/ensureUser.js";

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

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
app.use("/settings", settingsRoutes);

// ===========================
// SOCKET.IO (AUTH + LAZY SYNC)
// ===========================
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const jwks = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

// 🔐 Verify Supabase JWT on socket connect
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Missing auth token"));
  }

  jwt.verify(
    token,
    getKey,
    {
      audience: "authenticated",
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      algorithms: ["RS256"],
    },
    (err, decoded) => {
      if (err) {
        console.error("Socket JWT error:", err.message);
        return next(new Error("Invalid token"));
      }

      socket.supabaseUser = {
        id: decoded.sub,
        email: decoded.email,
        user_metadata: decoded.user_metadata || {},
      };

      next();
    }
  );
});

io.on("connection", async (socket) => {
  try {
    // 🔥 Lazy sync Supabase → Prisma
    const prismaUser = await ensureUserExists(prisma, socket.supabaseUser);

    socket.userId = prismaUser.id;
    socket.join(prismaUser.id);

    console.log("🟢 Socket connected:", prismaUser.id);
  } catch (err) {
    console.error("Socket user sync failed:", err);
    socket.disconnect();
    return;
  }

  socket.on("send_message", async ({ receiverId, content }) => {
    if (!receiverId || !content) return;

    try {
      const message = await prisma.message.create({
        data: {
          senderId: socket.userId, // ✅ trusted
          receiverId,
          content,
        },
      });

      io.to(receiverId).emit("receive_message", message);
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.userId);
  });
});

// ===========================
// POSTS (JWT AUTH)
// ===========================
app.get("/posts", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await prisma.post.findMany({
      where: {
        NOT: { userId },
        visibility: "PUBLIC", // Only show public posts
      },
      orderBy: { createdAt: "desc" }, // Newest first
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server error" });
  }
});

app.post("/posts", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, user_metadata } = req.user;

    // ✅ 1. ENSURE USER EXISTS IN PRISMA
    await prisma.user.upsert({
      where: { id: userId },
      update: {}, // nothing to update
      create: {
        id: userId,
        email,
        name: user_metadata?.username || email.split("@")[0],
        username: user_metadata?.username || email.split("@")[0],
        skills: [],
      },
    });

    // ✅ 2. VALIDATE INPUT
    const {
      title,
      header,
      techStack,
      description,
      category,
      difficulty,
      deadline,
      visibility,
    } = req.body;

    if (
      !title ||
      !header ||
      !description ||
      !category ||
      !difficulty ||
      !deadline
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("✅ User ensured. Creating post…");

    // ✅ 3. CREATE POST
    const post = await prisma.post.create({
      data: {
        title,
        header,
        description,
        techStack,
        category,
        difficulty,
        deadline: new Date(deadline),
        visibility: visibility || "DRAFT", // Default to DRAFT
        userId,
      },
    });

    return res.status(201).json(post);

  } catch (err) {
    console.error("🔥 CREATE POST FAILED 🔥");
    console.error(err);

    return res.status(500).json({
      error: err.message,
      meta: err.meta || null,
    });
  }
});

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

// Update post
app.put("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this post" });
    }

    // Update post
    const {
      title,
      header,
      techStack,
      description,
      category,
      difficulty,
      deadline,
      visibility,
    } = req.body;

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        header,
        techStack,
        description,
        category,
        difficulty,
        deadline: deadline ? new Date(deadline) : existingPost.deadline,
        visibility: visibility || existingPost.visibility,
      },
    });

    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete post
app.delete("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    // Delete post
    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single post by ID
app.get("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5051;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

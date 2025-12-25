import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import { verifySupabaseToken } from "./src/utils/authMiddleware.js";
import { ensureUserExists } from "./src/utils/ensureUser.js";
import commentRoutes from "./src/routes/commentRoutes.js";

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

dotenv.config();

/* =========================
   APP + SERVER
========================= */
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);
app.use("/posts", commentRoutes);

/* =========================
   SOCKET.IO SETUP
========================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// allow REST routes to emit socket events
app.set("io", io);

/* =========================
   SUPABASE JWKS
========================= */
const jwks = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

/* =========================
   SOCKET AUTH (JWT)
========================= */
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
        console.error("❌ Socket JWT error:", err.message);
        return next(new Error("Invalid token"));
      }

      socket.supabaseUser = {
        id: decoded.sub,
        email: decoded.email,
        user_metadata: decoded.user_metadata || {},
        raw_user_meta_data: decoded.user_metadata || {}, // ✅ alias
      };

      next();
    }
  );
});

/* =========================
   SOCKET CONNECTION
========================= */
io.on("connection", async (socket) => {
  try {
    // Lazy sync Supabase → Prisma
    const prismaUser = await ensureUserExists(prisma, socket.supabaseUser);

    socket.userId = prismaUser.id;

    // Join personal room (used for DMs)
    socket.join(prismaUser.id);

    console.log("🟢 Socket connected:", prismaUser.id);
  } catch (err) {
    console.error("❌ Socket user sync failed:", err);
    socket.disconnect();
    return;
  }

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.userId);
  });
});

/* =========================
   POSTS (JWT AUTH)
========================= */
app.get("/posts", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await prisma.post.findMany({
      where: {
        NOT: { userId },
        visibility: "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/posts", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, user_metadata } = req.user;

    // ✅ FIXED: always use ensureUserExists
    await ensureUserExists(prisma, {
      id: userId,
      email,
      user_metadata,
    });

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

    const post = await prisma.post.create({
      data: {
        title,
        header,
        description,
        techStack,
        category,
        difficulty,
        deadline: new Date(deadline),
        visibility: visibility || "DRAFT",
        userId,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("🔥 CREATE POST FAILED 🔥", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/posts/me", verifySupabaseToken, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failure" });
  }
});

app.put("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    await prisma.post.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
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
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5051;

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

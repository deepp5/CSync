// index.js
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import authRoutes from "./src/routes/authRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import commentRoutes from "./src/routes/commentRoutes.js";

import { verifySupabaseToken } from "./src/utils/authMiddleware.js";
import { ensureUserExists } from "./src/utils/ensureUser.js";

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

/* =========================
   APP + SERVER
========================= */
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

/* =========================
   CORS (FIXED FOR PROD)
========================= */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://csync.tech",
  "https://www.csync.tech",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   HELPERS (FIX UPDATE 500)
========================= */
function parsePrismaId(raw) {
  // supports both Int IDs and String/UUID IDs
  if (typeof raw !== "string") return raw;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
}

const ALLOWED_CATEGORY = new Set([
  "WEB_DEVELOPMENT",
  "MOBILE",
  "AI_ML",
  "GAME_DEV",
  "SYSTEMS",
  "OTHER",
]);

const ALLOWED_DIFFICULTY = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

const ALLOWED_VISIBILITY = new Set(["PUBLIC", "DRAFT", "PRIVATE"]);

function buildPostUpdateData(body = {}) {
  const data = {};

  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.header === "string") data.header = body.header.trim();
  if (typeof body.description === "string") data.description = body.description;

  // techStack: accept string[] or "React, Node" string
  if (Array.isArray(body.techStack)) {
    data.techStack = body.techStack.filter(Boolean).map(String);
  } else if (typeof body.techStack === "string") {
    data.techStack = body.techStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.difficulty === "string") data.difficulty = body.difficulty;
  if (typeof body.visibility === "string") data.visibility = body.visibility;

  if (body.deadline !== undefined) {
    const d = new Date(body.deadline);
    if (Number.isNaN(d.getTime())) {
      const err = new Error("Invalid deadline date");
      err.statusCode = 400;
      throw err;
    }
    data.deadline = d;
  }

  // DO NOT allow updating these (even if frontend sends them):
  // id, userId, createdAt, updatedAt, likes, views, User, isLiked, isFollowing

  return data;
}

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.get("/", (_req, res) => {
  res.send("Backend working 🚀");
});

app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);
app.use("/posts", commentRoutes);
app.use("/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);

/* =========================
   SOCKET.IO SETUP (FIXED)
========================= */
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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
  const raw = socket.handshake.auth?.token;
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;

  if (!token) return next(new Error("Missing auth token"));

  const decoded = jwt.decode(token, { complete: true });
  const alg = decoded?.header?.alg;

  const issuer = `${process.env.SUPABASE_URL}/auth/v1`;
  const audience = "authenticated";

  // HS256 support
  if (alg === "HS256") {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) return next(new Error("Missing SUPABASE_JWT_SECRET"));

    return jwt.verify(
      token,
      secret,
      { issuer, audience, algorithms: ["HS256"] },
      (err, verified) => {
        if (err) return next(new Error("Invalid token"));

        socket.supabaseUser = {
          id: verified.sub,
          email: verified.email,
          user_metadata: verified.user_metadata || {},
        };
        next();
      }
    );
  }

  // RS256 / JWKS
  jwt.verify(
    token,
    getKey,
    { issuer, audience, algorithms: ["RS256", "ES256"] },
    (err, verified) => {
      if (err) return next(new Error("Invalid token"));

      socket.supabaseUser = {
        id: verified.sub,
        email: verified.email,
        user_metadata: verified.user_metadata || {},
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
    const prismaUser = await ensureUserExists(prisma, socket.supabaseUser);
    socket.userId = prismaUser.id;
    socket.join(prismaUser.id);

    console.log("🟢 Socket connected:", prismaUser.id);
  } catch (err) {
    console.error("❌ Socket user sync failed:", err);
    socket.disconnect();
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
      include: {
        User: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
          },
        },
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

    // always use ensureUserExists
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

    // validate enums (prevents Prisma throwing)
    if (!ALLOWED_CATEGORY.has(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (!ALLOWED_DIFFICULTY.has(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty" });
    }
    const vis = visibility || "DRAFT";
    if (!ALLOWED_VISIBILITY.has(vis)) {
      return res.status(400).json({ error: "Invalid visibility" });
    }

    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: "Invalid deadline date" });
    }

    const post = await prisma.post.create({
      data: {
        title: String(title).trim(),
        header: String(header).trim(),
        description,
        techStack: Array.isArray(techStack)
          ? techStack.filter(Boolean).map(String)
          : [],
        category,
        difficulty,
        deadline: d,
        visibility: vis,
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

/* ✅ FIXED UPDATE: whitelist fields + deadline parsing + enum validation */
app.put("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const postId = parsePrismaId(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const data = buildPostUpdateData(req.body);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    if (data.category && !ALLOWED_CATEGORY.has(data.category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (data.difficulty && !ALLOWED_DIFFICULTY.has(data.difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty" });
    }
    if (data.visibility && !ALLOWED_VISIBILITY.has(data.visibility)) {
      return res.status(400).json({ error: "Invalid visibility" });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
    });

    res.json(updated);
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("🔥 UPDATE POST FAILED 🔥", err);
    res.status(status).json({ error: err.message || "Server error" });
  }
});

/* ✅ FIXED DELETE: ownership check */
app.delete("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const postId = parsePrismaId(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("🔥 DELETE POST FAILED 🔥", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/posts/:id", verifySupabaseToken, async (req, res) => {
  try {
    const postId = parsePrismaId(req.params.id);
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
            bio: true,
            githubUrl: true,
            linkedinUrl: true,
          },
        },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    const userLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: String(postId),
          userId: userId,
        },
      },
    });

    const userFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: post.userId,
        },
      },
    });

    res.json({
      ...post,
      isLiked: !!userLike,
      isFollowing: !!userFollow,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Increment view count for a post
app.post("/posts/:id/view", verifySupabaseToken, async (req, res) => {
  try {
    const postId = parsePrismaId(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, views: true },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
      select: { views: true },
    });

    res.json({ views: updatedPost.views });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Like a post
app.post("/posts/:id/like", verifySupabaseToken, async (req, res) => {
  try {
    const postId = parsePrismaId(req.params.id);
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, likes: true },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: String(postId),
          userId: userId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: "Already liked this post" });
    }

    await prisma.$transaction([
      prisma.like.create({
        data: {
          id: `${postId}_${userId}_${Date.now()}`,
          postId: String(postId),
          userId: userId,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
      }),
    ]);

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likes: true },
    });

    res.json({ likes: updatedPost.likes, isLiked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Unlike a post
app.delete("/posts/:id/like", verifySupabaseToken, async (req, res) => {
  try {
    const postId = parsePrismaId(req.params.id);
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: String(postId),
          userId: userId,
        },
      },
    });

    if (!existingLike) {
      return res.status(400).json({ error: "Haven't liked this post" });
    }

    await prisma.$transaction([
      prisma.like.delete({
        where: {
          postId_userId: {
            postId: String(postId),
            userId: userId,
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } },
      }),
    ]);

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likes: true },
    });

    res.json({ likes: updatedPost.likes, isLiked: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
app.get("/users/:id", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Follow a user
app.post("/users/:id/follow", verifySupabaseToken, async (req, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!userToFollow) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) return res.json({ isFollowing: true });

    await prisma.follow.create({
      data: {
        id: `${followerId}_${followingId}_${Date.now()}`,
        followerId: followerId,
        followingId: followingId,
      },
    });

    res.json({ isFollowing: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Unfollow a user
app.delete("/users/:id/follow", verifySupabaseToken, async (req, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.user.id;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (!existingFollow) return res.json({ isFollowing: false });

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    res.json({ isFollowing: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5051;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

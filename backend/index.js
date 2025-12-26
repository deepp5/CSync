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

import { verifySupabaseToken } from "./src/utils/authMiddleware.js";
import { ensureUserExists } from "./src/utils/ensureUser.js";
import commentRoutes from "./src/routes/commentRoutes.js";

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

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

app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);
app.use("/posts", commentRoutes);
app.use("/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);

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
      orderBy: { createdAt: "desc" }, // Newest first
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
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
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

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if current user has liked this post
    const userLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    });

    // Check if current user is following the post author
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
    const postId = req.params.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Increment view count
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
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
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: "Already liked this post" });
    }

    // Create like and increment post likes count
    await prisma.$transaction([
      prisma.like.create({
        data: {
          id: `${postId}_${userId}_${Date.now()}`,
          postId: postId,
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
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    });

    if (!existingLike) {
      return res.status(400).json({ error: "Haven't liked this post" });
    }

    // Delete like and decrement post likes count
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          postId_userId: {
            postId: postId,
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

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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

    // Can't follow yourself
    if (followerId === followingId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      // Already following - return success (idempotent)
      return res.json({ isFollowing: true });
    }

    // Create follow
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

    // Check if follow exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (!existingFollow) {
      // Not following - return success (idempotent)
      return res.json({ isFollowing: false });
    }

    // Delete follow
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

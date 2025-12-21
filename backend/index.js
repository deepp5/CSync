import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
// SOCKET.IO (REAL-TIME CHAT)
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

//Get all posts
app.get("/posts", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = header.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ err: "Invalid token ;[" });
    }

    const userId = data.user.id;

    const posts = await prisma.post.findMany({
      where: {
        NOT: { userId: userId },
      },
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server error" });
  }
});

//Create a post
app.post("/posts", async (req, res) => {
  try {
    const head = req.headers.authorization;
    if (!head) {
      return res.status(401).json({ err: "Missing Authorization header" });
    }
    const token = head.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ err: "Invalid token ;[" });
    }

    const userId = data.user.id;

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
    console.error("POST error ;[ ", err);
    res.status(500).json({ err: "Failed to post" });
  }
});

//Edit a post
app.put("/posts/:id", async (req, res) => {
  try {
    const head = req.headers.authorization;
    if (!head) {
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }
    const token = head.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ err: "Invalid token ;[" });
    }

    const userId = data.user.id;
    const postId = req.params.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost || existingPost.userId != userId) {
      res.status(403).json({ err: "Not authorized to edit this post" });
    }

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

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        header,
        techStack,
        description,
        category,
        difficulty,
        deadline: new Date(deadline),
      },
    });
    res.json(post);
  } catch (err) {
    console.error("PUT error :[ ", err);
    res.status(500).json({ err: "Failed to edit post." });
  }
});

//Delete a post
app.delete("/posts/:id", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }

    const token = header.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Invalid token ;[" });
      return;
    }

    const userId = data.user.id;
    const postId = req.params.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost || existingPost.userId != userId) {
      res.status(403).json({ err: "Not authorized to delete this post" });
      return;
    }

    await prisma.post.delete({
      where: { id: postId },
    });
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.error("DELETE failed ;{", err);
    res.status(500).json({ err: "Failed to delete :[" });
  }
});

//Get only users posts
app.get("/posts/me", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }
    const token = header.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Invalid token ;[ " });
      return;
    }

    const userId = data.user.id;

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(posts);
  } catch (err) {
    console.error("GET my posts failed :[ ", err);
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

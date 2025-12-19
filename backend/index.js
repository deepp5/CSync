import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { verifySupabaseToken } from "./src/utils/authMiddleware.js";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";

dotenv.config();
console.log("Loaded Supabase URL:", process.env.SUPABASE_URL);

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use("/", conversationRoutes);
app.use("/messages", messageRoutes);

// ===========================
// 🚀 BASIC ROUTES
// ===========================
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// Fetch all users (for testing)
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new user (optional — if not handled by Supabase)
app.post("/users", async (req, res) => {
  try {
    const { id, name, email } = req.body;
    const newUser = await prisma.user.create({
      data: { id, name, email },
    });
    res.json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================
// 💬 CHAT SYSTEM (AUTH REQUIRED)
// ===========================

// Fetch chat history between logged-in user and another user
app.get("/messages/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const senderId = req.user.sub; // Supabase user UUID
    const { receiverId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
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

// Send message (authenticated)
app.post("/messages", verifySupabaseToken, async (req, res) => {
  try {
    const senderId = req.user.sub; // current user
    const { receiverId, content } = req.body;

    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
    });

    // Emit real-time update to the receiver
    io.to(receiverId).emit("receive_message", message);
    res.json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================
// 💭 CONVERSATIONS LIST
// ===========================

// Get all conversations for the logged-in user
app.get("/conversations", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.sub;

    // Find all distinct users this user has chatted with
    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      distinct: ["senderId", "receiverId"],
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    // Optional: Filter only unique users (one per conversation)
    const uniqueConversations = [];
    const seen = new Set();

    conversations.forEach((msg) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!seen.has(otherUser.id)) {
        seen.add(otherUser.id);
        uniqueConversations.push({
          user: otherUser,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
        });
      }
    });

    res.json(uniqueConversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================
// ⚡ SOCKET.IO REAL-TIME CHAT
// ===========================

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const client = jwksClient({
  jwksUri: `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/jwks`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Middleware: verify token before connecting
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Missing auth token"));

  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) return next(new Error("Invalid token"));
    socket.user = decoded; // attach user info
    next();
  });
});

// Socket connection logic
io.on("connection", (socket) => {
  const userId = socket.user.sub;
  console.log("🟢 User connected:", userId);

  socket.join(userId);

  socket.on("send_message", async ({ receiverId, content }) => {
    try {
      const message = await prisma.message.create({
        data: { senderId: userId, receiverId, content },
      });

      io.to(receiverId).emit("receive_message", message);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", userId);
  });
});

// ===========================
// 🧩 START SERVER
// ===========================
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

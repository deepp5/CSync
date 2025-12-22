import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js"
dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ===========================
// ROUTES
// ===========================
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

app.use("/messages", messageRoutes);
app.use("/conversations", conversationRoutes);
app.use('/api', profileRoutes);

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

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5051;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

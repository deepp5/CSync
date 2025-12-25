// src/socket.js
import jwt from "jsonwebtoken";

let ioInstance = null;

export function initSocket(io) {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Missing auth token"));
      }

      const decoded = jwt.verify(
        token,
        process.env.SUPABASE_JWT_SECRET, // 🔑 THIS is the key
        { algorithms: ["HS256"] }        // 🔑 THIS is the algorithm
      );

      socket.user = {
        id: decoded.sub,
        email: decoded.email,
        username: decoded.user_metadata?.username,
      };

      next();
    } catch (err) {
      console.error("❌ Socket JWT error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.user.id);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.user?.id);
    });
  });
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}
// src/socket.js
import jwt from "jsonwebtoken";

let ioInstance = null;

export function initSocket(io) {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error("SUPABASE_JWT_SECRET is not defined");
  }

  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
        algorithms: ["HS256"],
      });

      if (!decoded?.sub || !decoded?.email) {
        return next(new Error("Invalid token payload"));
      }

      socket.user = {
        id: decoded.sub,
        email: decoded.email,
        username: decoded.user_metadata?.username || null,
      };

      return next();
    } catch (err) {
      console.error("❌ Socket authentication failed:", err.message);
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.user.id}`);

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${socket.user?.id} (${reason})`);
    });
  });
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}

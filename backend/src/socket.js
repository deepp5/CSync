// src/socket.js
import jwt from "jsonwebtoken";

let activeIO = null;

export function initSocket(socketServer) {
  const socketSecret = process.env.SUPABASE_JWT_SECRET;

  if (!socketSecret) {
    throw new Error("Missing SUPABASE_JWT_SECRET in environment variables");
  }

  activeIO = socketServer;

  socketServer.use((clientSocket, next) => {
    try {
      const authToken = clientSocket.handshake.auth?.token;

      if (!authToken) {
        return next(new Error("Authentication token is required"));
      }

      const verifiedToken = jwt.verify(authToken, socketSecret, {
        algorithms: ["HS256"],
      });

      if (!verifiedToken?.sub || !verifiedToken?.email) {
        return next(new Error("Token payload is invalid"));
      }

      clientSocket.user = {
        id: verifiedToken.sub,
        email: verifiedToken.email,
        username: verifiedToken.user_metadata?.username || null,
      };

      return next();
    } catch (error) {
      console.error("❌ Socket auth error:", error.message);
      return next(new Error("Unauthorized"));
    }
  });

  socketServer.on("connection", (clientSocket) => {
    console.log(`✅ Client connected: ${clientSocket.user.id}`);

    clientSocket.on("disconnect", (disconnectReason) => {
      console.log(
        `❌ Client disconnected: ${clientSocket.user?.id} (${disconnectReason})`
      );
    });
  });
}

export function getIO() {
  if (!activeIO) {
    throw new Error("Socket.io instance has not been initialized");
  }

  return activeIO;
}

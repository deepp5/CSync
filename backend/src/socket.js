import jwt from "jsonwebtoken";

let ioInstance = null;

export function initSocket(io) {
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing token"));

    const decoded = jwt.decode(token); // ✅ DO NOT verify

    if (!decoded?.sub) {
      return next(new Error("Invalid token payload"));
    }

    socket.userId = decoded.sub;
    next();
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);
  });
}

export function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}
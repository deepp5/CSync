// src/routes/messageRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

// ✅ upload
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
const prisma = new PrismaClient();

/* =========================
   ✅ SUPABASE STORAGE (ADMIN)
========================= */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "message-attachments";

if (!SUPABASE_URL) console.warn("[WARN] SUPABASE_URL missing");
if (!SUPABASE_SERVICE_ROLE_KEY)
  console.warn("[WARN] SUPABASE_SERVICE_ROLE_KEY missing");

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* =========================
   ✅ MULTER (in-memory upload)
========================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Helpers
function safeExt(originalname = "") {
  const ext = path.extname(originalname).toLowerCase();
  if (!ext || ext.length > 10) return "";
  return ext.replace(/[^.a-z0-9]/g, "");
}

function makeStoragePath({ senderId, receiverId, originalname }) {
  const ext = safeExt(originalname);
  const rand = crypto.randomBytes(8).toString("hex");
  const ts = Date.now();
  return `messages/${senderId}/${receiverId}/${ts}-${rand}${ext}`;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username || null,
    name: u.name || null,
    profilePicture: u.profilePicture || null,
  };
}

/* =========================
   GET MESSAGES
   GET /messages/:receiverId
========================= */
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");

    const me = await ensureUserExists(prisma, req.user);
    const { receiverId } = req.params;

    const after = req.query.after ? new Date(req.query.after) : null;
    const createdAtFilter =
      after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {};

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me.id, receiverId },
          { senderId: receiverId, receiverId: me.id },
        ],
        ...createdAtFilter,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("GET messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/* =========================
   SEND MESSAGE (SOURCE OF TRUTH)
   POST /messages
========================= */
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Optional: enforce receiver exists so username will be known
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const message = await prisma.message.create({
      data: {
        senderId: me.id,
        receiverId,
        content,
      },
    });

    // Include sender profile in payload
    const senderProfile = await prisma.user.findUnique({
      where: { id: me.id },
      select: { id: true, username: true, name: true, profilePicture: true },
    });

    const payload = {
      ...message,
      sender: publicUser(senderProfile),
    };

    // ✅ REALTIME EMIT (receiver only to avoid duplicates on sender optimistic UI)
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId).emit("new_message", payload);
    }

    return res.json(payload);
  } catch (err) {
    console.error("POST message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/* =========================
   ✅ UPLOAD ATTACHMENT
   POST /messages/upload
========================= */
router.post(
  "/upload",
  verifySupabaseToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({
          error:
            "Supabase admin client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        });
      }

      const me = await ensureUserExists(prisma, req.user);
      const receiverId = req.body?.receiverId;

      if (!receiverId) {
        return res.status(400).json({ error: "Missing receiverId" });
      }

      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true },
      });
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Missing file" });
      }

      const storagePath = makeStoragePath({
        senderId: me.id,
        receiverId,
        originalname: file.originalname,
      });

      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (upErr) {
        console.error("Supabase upload error:", upErr);
        return res.status(500).json({ error: "Upload failed" });
      }

      const { data: pub } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const fileUrl = pub?.publicUrl || null;

      if (!fileUrl) {
        return res.status(500).json({
          error:
            "Could not create file URL. Make bucket PUBLIC or switch to signed URLs.",
        });
      }

      const content = `📎 ${file.originalname}\n${fileUrl}`;

      const message = await prisma.message.create({
        data: {
          senderId: me.id,
          receiverId,
          content,
        },
      });

      const senderProfile = await prisma.user.findUnique({
        where: { id: me.id },
        select: { id: true, username: true, name: true, profilePicture: true },
      });

      const payload = {
        ...message,
        sender: publicUser(senderProfile),
        type: "file",
        fileName: file.originalname,
        fileUrl,
      };

      const io = req.app.get("io");
      if (io) {
        io.to(receiverId).emit("new_message", payload);
      }

      return res.json({
        message: payload,
        attachment: {
          bucket: BUCKET,
          path: storagePath,
          url: fileUrl,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        },
      });
    } catch (err) {
      console.error("UPLOAD error:", err);
      return res.status(500).json({ error: "Failed to upload attachment" });
    }
  }
);

export default router;

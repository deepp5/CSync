// src/routes/messageRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

// ✅ NEW (upload)
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
const prisma = new PrismaClient();

/* =========================
   ✅ SUPABASE STORAGE (ADMIN)
   Requires:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_STORAGE_BUCKET (optional, default "message-attachments")
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
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

// Helpers
function safeExt(originalname = "") {
  const ext = path.extname(originalname).toLowerCase();
  // keep it simple & safe
  if (!ext || ext.length > 10) return "";
  return ext.replace(/[^.a-z0-9]/g, "");
}

function makeStoragePath({ senderId, receiverId, originalname }) {
  const ext = safeExt(originalname);
  const rand = crypto.randomBytes(8).toString("hex");
  const ts = Date.now();
  // folder by sender/receiver helps organization
  return `messages/${senderId}/${receiverId}/${ts}-${rand}${ext}`;
}

/* =========================
   GET MESSAGES
========================= */
router.get("/:receiverId", verifySupabaseToken, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const { receiverId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me.id, receiverId },
          { senderId: receiverId, receiverId: me.id },
        ],
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
========================= */
router.post("/", verifySupabaseToken, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const message = await prisma.message.create({
      data: {
        senderId: me.id,
        receiverId,
        content,
      },
    });

    // ✅ REALTIME EMIT
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId).emit("new_message", message);
      // io.to(me.id).emit("new_message", message);
    }

    return res.json(message);
  } catch (err) {
    console.error("POST message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/* =========================
   ✅ UPLOAD ATTACHMENT
   POST /messages/upload
   form-data:
   - receiverId: string
   - file: (binary)
   Creates a Message whose content contains the file URL + filename.
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

      // ✅ Ensure receiver exists (no username)
      await ensureUserExists(prisma, {
        id: receiverId,
        email: `${receiverId}@placeholder.local`,
        user_metadata: {},
      });

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Missing file" });
      }

      // Optional: basic mime allowlist (edit as you want)
      // const allowed = ["image/", "application/pdf", "text/"];
      // if (!allowed.some((a) => file.mimetype.startsWith(a))) {
      //   return res.status(400).json({ error: "File type not allowed" });
      // }

      const storagePath = makeStoragePath({
        senderId: me.id,
        receiverId,
        originalname: file.originalname,
      });

      // Upload to Supabase Storage
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

      // Get URL (works if bucket is PUBLIC)
      const { data: pub } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = pub?.publicUrl || null;

      // If your bucket is PRIVATE, you can use signed URL instead:
      // const { data: signed, error: signedErr } = await supabaseAdmin.storage
      //   .from(BUCKET)
      //   .createSignedUrl(storagePath, 60 * 60); // 1 hour
      // const fileUrl = signedErr ? null : signed?.signedUrl;

      const fileUrl = publicUrl;

      if (!fileUrl) {
        return res.status(500).json({
          error:
            "Could not create file URL. Make bucket PUBLIC or switch to signed URLs.",
        });
      }

      // ✅ Create message (no schema change): put attachment info into content
      const content = `📎 ${file.originalname}\n${fileUrl}`;

      const message = await prisma.message.create({
        data: {
          senderId: me.id,
          receiverId,
          content,
        },
      });

      // ✅ Realtime emit
      const io = req.app.get("io");
      if (io) {
        io.to(receiverId).emit("new_message", message);
      }

      return res.json({
        message,
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

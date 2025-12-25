// src/routes/commentRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto"; // ✅ ADD THIS
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { ensureUserExists } from "../utils/ensureUser.js";

const router = express.Router();
const prisma = new PrismaClient();

/* =========================
   GET COMMENTS for a post
   GET /posts/:postId/comments
========================= */
router.get("/:postId/comments", verifySupabaseToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Ensure current user exists (for consistent auth behavior)
    await ensureUserExists(prisma, req.user);

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        other_Comment: {
          orderBy: { createdAt: "asc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    // Shape response to match your frontend structure (author + replies)
    const shaped = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      likes: 0, // (optional placeholder)
      author: {
        id: c.User?.id,
        name: c.User?.name || "User",
        username: c.User?.username || "",
        avatar: (
          c.User?.username?.[0] ||
          c.User?.name?.[0] ||
          "U"
        ).toUpperCase(),
        profilePicture: c.User?.profilePicture || null,
      },
      replies: (c.other_Comment || []).map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        likes: 0, // (optional placeholder)
        author: {
          id: r.User?.id,
          name: r.User?.name || "User",
          username: r.User?.username || "",
          avatar: (
            r.User?.username?.[0] ||
            r.User?.name?.[0] ||
            "U"
          ).toUpperCase(),
          profilePicture: r.User?.profilePicture || null,
        },
      })),
    }));

    return res.json(shaped);
  } catch (err) {
    console.error("GET comments error:", err);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

/* =========================
   CREATE COMMENT
   POST /posts/:postId/comments
   body: { content, parentId? }
========================= */
router.post("/:postId/comments", verifySupabaseToken, async (req, res) => {
  try {
    const me = await ensureUserExists(prisma, req.user);
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: "content is required" });
    }

    // (Optional) validate parentId belongs to same post
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.postId !== postId) {
        return res
          .status(400)
          .json({ error: "Invalid parentId for this post" });
      }
    }

    const created = await prisma.comment.create({
      data: {
        id: crypto.randomUUID(), // ✅ now works
        content: String(content).trim(),
        postId,
        userId: me.id,
        parentId: parentId || null,
        updatedAt: new Date(), // ✅ REQUIRED with your current schema
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    const shaped = {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt,
      likes: 0,
      author: {
        id: created.User?.id,
        name: created.User?.name || "User",
        username: created.User?.username || "",
        avatar: (
          created.User?.username?.[0] ||
          created.User?.name?.[0] ||
          "U"
        ).toUpperCase(),
        profilePicture: created.User?.profilePicture || null,
      },
      replies: [],
      parentId: created.parentId,
    };

    return res.json(shaped);
  } catch (err) {
    console.error("POST comment error:", err);
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

/* =========================
   DELETE COMMENT (optional)
   DELETE /posts/:postId/comments/:commentId
========================= */
router.delete(
  "/:postId/comments/:commentId",
  verifySupabaseToken,
  async (req, res) => {
    try {
      const me = await ensureUserExists(prisma, req.user);
      const { postId, commentId } = req.params;

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment || comment.postId !== postId) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Only author can delete (simple rule)
      if (comment.userId !== me.id) {
        return res.status(403).json({ error: "Not allowed" });
      }

      await prisma.comment.delete({ where: { id: commentId } });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE comment error:", err);
      return res.status(500).json({ error: "Failed to delete comment" });
    }
  }
);

export default router;

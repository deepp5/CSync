import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/supabase", async (req, res) => {
  try {
    const { type, user } = req.body || {};

    // Ignore events that are not user.created
    if (type !== "user.created") {
      return res.status(200).json({ received: true });
    }

    if (!user || !user.id || !user.email) {
      return res.status(400).json({ error: "Invalid user payload" });
    }

    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || null;

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name,
      },
      create: {
        id: user.id,
        email: user.email,
        name,
      },
    });

    console.log("✅ User synced from Supabase:", user.email);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Supabase webhook error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;

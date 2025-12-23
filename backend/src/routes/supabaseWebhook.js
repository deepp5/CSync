import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/supabase", async (req, res) => {
  try {
    const event = req.body;

    // We only care about new users
    if (event.type !== "user.created") {
      return res.status(200).json({ received: true });
    }

    const user = event.user;

    if (!user?.id || !user?.email) {
      return res.status(400).json({ error: "Invalid user payload" });
    }

    // Create user in Prisma
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      },
    });

    console.log("✅ User synced from Supabase:", user.email);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Supabase webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;

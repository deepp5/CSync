import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/supabase", async (req, res) => {
  try {
    const event = req.body;

    if (event.type !== "user.created") {
      return res.status(200).json({ received: true });
    }

    const user = event.user;

    if (!user?.id || !user?.email) {
      return res.status(400).json({ error: "Invalid user payload" });
    }

    await prisma.user.createMany({
      data: [
        {
          id: user.id,
          email: user.email,
          name:
            user.user_metadata?.full_name || user.user_metadata?.name || null,
        },
      ],
      skipDuplicates: true,
    });

    console.log("✅ User synced from Supabase:", user.email);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Supabase webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;

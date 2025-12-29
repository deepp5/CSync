import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifySupabaseToken } from "../utils/authMiddleware.js";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

router.get("/", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        email: true,
        showEmail: true,
        allowMessages: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/account", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, username, email } = req.body;

    if (!displayName && !email) {
      return res.status(400).json({ error: "No fields to update:" });
    }

    const updateData = {};

    if (username !== undefined) {
      const cleanedUsername = String(username).trim();
      // allow clearing username by sending empty string
      if (cleanedUsername.length === 0) {
        updateData.username = null;
      } else {
        const isValid =
          /^[a-zA-Z0-9](?:[a-zA-Z0-9_.-]{1,18}[a-zA-Z0-9])?$/.test(
            cleanedUsername
          );
        if (!isValid) {
          return res.status(400).json({
            error:
              "Invalid username. Use 2–20 characters: letters, numbers, _.- Must start and end with a letter or number.",
          });
        }
        updateData.username = cleanedUsername;
      }
    }

    if (displayName) {
      updateData.name = displayName;
    }

    if (email && email !== req.user.email) {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, { email: email });

      if (authError) {
        console.error("Supabase email update error:", authError);
        return res.status(400).json({
          error: "Failed to update email in authentication system",
          details: authError.message,
        });
      }

      updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        name: true,
        email: true,
        profileVisibility: true,
        showEmail: true,
        allowMessages: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update account error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: "Failed to update account settings" });
  }
});

router.put("/privacy", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { showEmail, allowMessages } = req.body;

    const updateData = {};

    // if (profileVisibility !== undefined) {
    //   // Validate enum value
    //   if (!['FOLLOWERS', 'PRIVATE'].includes(profileVisibility)) {
    //     return res.status(400).json({ error: "Invalid profile visibility value" });
    //   }
    //   updateData.profileVisibility = profileVisibility;
    // }

    if (showEmail !== undefined) {
      updateData.showEmail = showEmail;
    }

    if (allowMessages !== undefined) {
      updateData.allowMessages = allowMessages;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        name: true,
        email: true,
        profileVisibility: true,
        showEmail: true,
        allowMessages: true,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update privacy error:", err);
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
});

router.put("/password", verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    if (!userEmail) {
      return res
        .status(400)
        .json({ error: "Missing user email in auth token" });
    }

    // 1) Verify the current password by attempting a sign-in
    const supabasePublic = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { error: verifyError } = await supabasePublic.auth.signInWithPassword(
      {
        email: userEmail,
        password: currentPassword,
      }
    );

    if (verifyError) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // 2) Update password via admin API (requires SERVICE_ROLE key)
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error("Supabase password update error:", updateError);
      return res.status(400).json({
        error: "Failed to update password",
        details: updateError.message,
      });
    }

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;

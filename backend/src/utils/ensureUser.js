import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// src/utils/ensureUser.js
// src/utils/ensureUser.js
export async function ensureUserExists(prisma, supabaseUser) {
  const { id, email, user_metadata } = supabaseUser;

  if (!id || !email) {
    throw new Error("Invalid Supabase user payload");
  }

  // 1️⃣ By ID
  let user = await prisma.user.findUnique({
    where: { id },
  });
  if (user) return user;

  // 2️⃣ By email (migration-safe)
  user = await prisma.user.findUnique({
    where: { email },
  });
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { id },
    });
    return { ...user, id };
  }

  // 3️⃣ Create
  const name =
    user_metadata?.full_name || user_metadata?.name || email.split("@")[0];

  return await prisma.user.create({
    data: {
      id,
      email,
      name,
    },
  });
}

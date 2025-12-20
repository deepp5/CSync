import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function ensureUserExists(user) {
  const { id, email, user_metadata } = user;

  // 1️⃣ Try by Supabase ID
  let existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (existingUser) return existingUser;

  // 2️⃣ Try by email (IMPORTANT FIX)
  existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Optional: update id if you want to fully migrate
    await prisma.user.update({
      where: { email },
      data: { id },
    });
    return existingUser;
  }

  // 3️⃣ Create new user
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

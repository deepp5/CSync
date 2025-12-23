import { PrismaClient } from "@prisma/client";

// Ensure a Supabase-auth user exists in our DB
// src/utils/ensureUser.js
// src/utils/ensureUser.js
export async function ensureUserExists(prisma, supabaseJwtPayload) {
  const id = supabaseJwtPayload?.id || supabaseJwtPayload?.sub;
  const email = supabaseJwtPayload?.email;
  const user_metadata = supabaseJwtPayload?.user_metadata || {};
  //   const prisma = new PrismaClient();

  if (!id || !email) {
    console.log("❌ Bad supabase payload:", supabaseJwtPayload);
    throw new Error("Invalid Supabase user payload");
  }

  let user = await prisma.user.findUnique({ where: { id } });
  if (user) return user;

  user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({ where: { email }, data: { id } });
    return { ...user, id };
  }

  const name =
    user_metadata?.full_name || user_metadata?.name || email.split("@")[0];

  // if your User model requires username, uncomment this:
  // const username = user_metadata?.username || email.split("@")[0];

  return prisma.user.create({
    data: {
      id,
      email,
      name,
      // username,
    },
  });
}

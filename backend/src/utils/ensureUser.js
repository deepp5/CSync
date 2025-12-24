// import { PrismaClient } from "@prisma/client";

// // Ensure a Supabase-auth user exists in our DB
// // src/utils/ensureUser.js
// export async function ensureUserExists(prisma, supabaseJwtPayload) {
//   const id = supabaseJwtPayload?.id || supabaseJwtPayload?.sub;
//   const email = supabaseJwtPayload?.email;
//   const user_metadata = supabaseJwtPayload?.user_metadata || {};

//   if (!id || !email) {
//     console.log("❌ Bad supabase payload:", supabaseJwtPayload);
//     throw new Error("Invalid Supabase user payload");
//   }

//   // Prefer username from metadata, otherwise generate a safe fallback
//   const username =
//     user_metadata?.username ||
//     email.split("@")[0] ||
//     `user_${id.slice(0, 8)}`;

//   const name =
//     user_metadata?.full_name ||
//     user_metadata?.name ||
//     username;

//   return prisma.user.upsert({
//     where: { id },
//     update: {},
//     create: {
//       id,
//       email,
//       name,
//       username,
//       skills: [],
//     },
//   });
// }

// src/utils/ensureUser.js
export async function ensureUserExists(prisma, supabaseJwtPayload) {
  const id = supabaseJwtPayload?.id || supabaseJwtPayload?.sub;
  const email = supabaseJwtPayload?.email;
  const user_metadata = supabaseJwtPayload?.user_metadata || {};

  if (!id || !email) {
    throw new Error("Invalid Supabase payload");
  }

  // Prefer username from metadata, fallback safely
  const username =
    user_metadata?.username ||
    email.split("@")[0] + "_" + id.slice(0, 5);

  const name =
    user_metadata?.full_name ||
    user_metadata?.name ||
    username;

  return prisma.user.upsert({
    where: { id },
    update: {
      email,
      name,
      username,
    },
    create: {
      id,
      email,
      name,
      username,
      skills: [],
    },
  });
}
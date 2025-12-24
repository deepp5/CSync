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
// src/utils/ensureUser.js
// src/utils/ensureUser.js
export async function ensureUserExists(prisma, supabaseUser) {
  const id = supabaseUser?.id || supabaseUser?.sub;
  if (!id) {
    console.log("❌ Bad supabase payload (missing id):", supabaseUser);
    throw new Error("Missing user id (sub)");
  }

  const email = supabaseUser?.email || null;

  // ✅ Prefer raw_user_meta_data (Supabase) then fallback to user_metadata
  const meta =
    supabaseUser?.raw_user_meta_data || supabaseUser?.user_metadata || {};

  // ✅ Pull username exactly like Supabase stores it
  const rawUsername =
    meta.username ||
    meta.user_name ||
    meta.preferred_username ||
    (email ? email.split("@")[0] : null);

  // Normalize username to DB-safe format
  const baseUsername = String(rawUsername || `user_${id.slice(0, 6)}`)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_") // allow only a-z, 0-9, _
    .replace(/_+/g, "_") // collapse multiple underscores
    .replace(/^_+|_+$/g, "") // trim underscores
    .slice(0, 24);

  const name =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    rawUsername ||
    baseUsername ||
    `User ${id.slice(0, 6)}`;

  const profilePicture = meta.avatar_url || meta.picture || null;

  // If baseUsername ends up empty for any reason
  const safeBase = baseUsername || `user_${id.slice(0, 6)}`;

  // ✅ Try a few candidates. This avoids Prisma P2002 username collisions.
  // Order: base -> base + shortId -> base + longerId
  const candidates = [
    safeBase,
    `${safeBase}_${id.slice(0, 6)}`.slice(0, 30),
    `${safeBase}_${id.slice(0, 10)}`.slice(0, 30),
  ];

  for (const username of candidates) {
    try {
      // Upsert by ID (always safe)
      const user = await prisma.user.upsert({
        where: { id },
        update: {
          email,
          name,
          username,
          profilePicture,
        },
        create: {
          id,
          email,
          name,
          username,
          profilePicture,
          skills: [],
        },
      });

      return user;
    } catch (err) {
      // If username unique constraint fails, try next candidate
      if (err?.code === "P2002" && err?.meta?.target?.includes("username")) {
        continue;
      }
      throw err;
    }
  }

  // ✅ Last resort (should basically never happen)
  const fallbackUsername = `user_${id.replace(/-/g, "").slice(0, 12)}`;
  return prisma.user.upsert({
    where: { id },
    update: {
      email,
      name,
      username: fallbackUsername,
      profilePicture,
    },
    create: {
      id,
      email,
      name,
      username: fallbackUsername,
      profilePicture,
      skills: [],
    },
  });
}

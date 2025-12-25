// src/utils/ensureUser.js
export async function ensureUserExists(prisma, supabaseUser) {
  const id = supabaseUser?.id || supabaseUser?.sub;
  if (!id) {
    console.log("❌ Bad supabase payload (missing id):", supabaseUser);
    throw new Error("Missing user id (sub)");
  }

  const email = supabaseUser?.email || null;

  // ✅ Merge both: sometimes data is in raw_user_meta_data, sometimes in user_metadata
  const meta = {
    ...(supabaseUser?.user_metadata || {}),
    ...(supabaseUser?.raw_user_meta_data || {}),
  };

  // ✅ Prefer username exactly like Supabase stores it
  const rawUsername =
    meta.username || meta.user_name || meta.preferred_username || null;

  const rawName = meta.full_name || meta.name || meta.display_name || null;

  const profilePicture = meta.avatar_url || meta.picture || null;

  // Normalize username to DB-safe format
  const normalizeUsername = (u) =>
    String(u || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24);

  const baseUsername = normalizeUsername(rawUsername);

  // ✅ We ONLY want to overwrite DB fields if we truly have Supabase values
  // (avoid replacing good data with placeholders)
  const shouldUpdateUsername = Boolean(baseUsername);
  const shouldUpdateName = Boolean(rawName);

  // Create must always include username (unique), so create a fallback
  const createUsername =
    baseUsername ||
    normalizeUsername(email ? email.split("@")[0] : "") ||
    `user_${id.replace(/-/g, "").slice(0, 10)}`;

  // Name should be human-ish
  const createName =
    rawName ||
    (baseUsername ? `@${baseUsername}` : null) ||
    (email ? email.split("@")[0] : null) ||
    `User ${id.slice(0, 6)}`;

  // Try a few username candidates if unique constraint hits
  const candidates = [
    createUsername,
    `${createUsername}_${id.replace(/-/g, "").slice(0, 4)}`.slice(0, 30),
    `${createUsername}_${id.replace(/-/g, "").slice(0, 8)}`.slice(0, 30),
  ];

  // If user exists, fetch once so we can avoid overwriting with placeholders
  const existing = await prisma.user.findUnique({ where: { id } });

  for (const candidateUsername of candidates) {
    try {
      const updateData = {
        ...(email ? { email } : {}),
        ...(profilePicture ? { profilePicture } : {}),
        ...(shouldUpdateName ? { name: rawName } : {}),
        ...(shouldUpdateUsername ? { username: candidateUsername } : {}),
      };

      // ✅ If user exists and we don't have new username/name, do NOT overwrite them
      const createData = {
        id,
        email: email || `${id}@placeholder.local`,
        name: createName,
        username: candidateUsername,
        profilePicture,
        skills: [],
      };

      // If existing user and we don't have Supabase username, keep their current username
      if (existing && !shouldUpdateUsername) {
        delete updateData.username;
      }

      // If existing user and we don't have Supabase name, keep their current name
      if (existing && !shouldUpdateName) {
        delete updateData.name;
      }

      const user = await prisma.user.upsert({
        where: { id },
        update: updateData,
        create: createData,
      });

      return user;
    } catch (err) {
      if (err?.code === "P2002" && err?.meta?.target?.includes("username")) {
        continue;
      }
      throw err;
    }
  }

  // Last resort fallback (extremely rare)
  const fallbackUsername = `user_${id.replace(/-/g, "").slice(0, 12)}`;
  return prisma.user.upsert({
    where: { id },
    update: {
      ...(email ? { email } : {}),
      ...(profilePicture ? { profilePicture } : {}),
    },
    create: {
      id,
      email: email || `${id}@placeholder.local`,
      name: createName,
      username: fallbackUsername,
      profilePicture,
      skills: [],
    },
  });
}

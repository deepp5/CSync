export async function ensureUserExists(prisma, user) {
  if (!prisma) {
    throw new Error("Prisma client is required");
  }

  if (!user || typeof user !== "object") {
    throw new Error("Invalid user object");
  }

  const { id, email, user_metadata = {}, username, name } = user;

  if (!id || !email) {
    throw new Error("User must have id and email");
  }

  const baseUsername =
    username || user_metadata.username || email.split("@")[0];

  const generatedUsername = `${baseUsername}_${id.substring(0, 5)}`;

  const resolvedName =
    name || user_metadata.full_name || user_metadata.name || baseUsername;

  return prisma.user.upsert({
    where: { id },

    // update only safe fields
    update: {
      email,
      name: resolvedName,
    },

    // set immutable fields only when creating
    create: {
      id,
      email,
      name: resolvedName,
      username: generatedUsername,
      skills: [],
    },
  });
}

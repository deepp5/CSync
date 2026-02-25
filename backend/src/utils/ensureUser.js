export async function ensureUserExists(prisma, user) {
  if (!prisma) {
    throw new Error("Prisma client is required");
  }

  if (!user || typeof user !== "object") {
    throw new Error("Invalid user object");
  }

  const { id, email, user_metadata = {} } = user;

  if (!id || !email) {
    throw new Error("User must have id and email");
  }

  const baseUsername =
    user.username || user_metadata.username || email.split("@")[0];

  const generatedUsername = `${baseUsername}_${id.slice(0, 5)}`;

  const name =
    user.name || user_metadata.full_name || user_metadata.name || baseUsername;

  return prisma.user.upsert({
    where: { id },

    // Only update safe fields
    update: {
      email,
      name,
    },

    // Only set immutable fields on first creation
    create: {
      id,
      email,
      name,
      username: generatedUsername,
      skills: [],
    },
  });
}

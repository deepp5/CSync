export async function ensureUserExists(prisma, user) {
  if (!prisma) {
    throw new Error("Prisma client is required");
  }

  if (!user || typeof user !== "object") {
    throw new Error("Invalid user object");
  }

  if (!user.id || !user.email) {
    throw new Error("User must have id and email");
  }

  const baseUsername =
    user.username || user.user_metadata?.username || user.email.split("@")[0];

  const username = `${baseUsername}_${user.id.slice(0, 5)}`;

  const name =
    user.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    baseUsername;

  const userData = {
    email: user.email,
    name,
    username,
  };

  return prisma.user.upsert({
    where: { id: user.id },
    update: userData,
    create: {
      id: user.id,
      ...userData,
      skills: [],
    },
  });
}

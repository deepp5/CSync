export async function ensureUserExists(prismaClient, currentUser) {
  if (!prismaClient) {
    throw new Error("Prisma client instance is required");
  }

  if (!currentUser || typeof currentUser !== "object") {
    throw new Error("User data is invalid");
  }

  const {
    id: userId,
    email: userEmail,
    user_metadata: metadata = {},
    username,
    name,
  } = currentUser;

  if (!userId || !userEmail) {
    throw new Error("User id and email are required");
  }

  const fallbackUsername =
    username || metadata.username || userEmail.split("@")[0];

  const finalUsername = `${fallbackUsername}_${userId.slice(0, 5)}`;

  const finalName =
    name || metadata.full_name || metadata.name || fallbackUsername;

  return prismaClient.user.upsert({
    where: { id: userId },

    update: {
      email: userEmail,
      name: finalName,
    },

    create: {
      id: userId,
      email: userEmail,
      name: finalName,
      username: finalUsername,
      skills: [],
    },
  });
}

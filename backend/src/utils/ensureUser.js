export async function ensureUserExists(prisma, user) {
  if (!user?.id || !user?.email) {
    throw new Error("Invalid user payload");
  }

  const username =
    user.username ||
    user.user_metadata?.username ||
    `${user.email.split("@")[0]}_${user.id.slice(0, 5)}`;

  const name =
    user.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    username;

  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name,
      username,
    },
    create: {
      id: user.id,
      email: user.email,
      name,
      username,
      skills: [],
    },
  });
}

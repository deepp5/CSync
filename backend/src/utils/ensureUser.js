export async function ensureUserExists(prisma, supabaseJwtPayload) {
  const id = supabaseJwtPayload?.id || supabaseJwtPayload?.sub;
  const email = supabaseJwtPayload?.email;
  const user_metadata = supabaseJwtPayload?.user_metadata || {};

  if (!id || !email) {
    throw new Error("Invalid Supabase payload");
  }

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
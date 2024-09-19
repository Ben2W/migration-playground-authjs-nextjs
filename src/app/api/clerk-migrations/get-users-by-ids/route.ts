import { getUsersByIdsHandler } from '@/clerk/get-users-by-ids-helper';
import { db } from '@/db';
import { users } from '@/db/schema';
import { inArray } from 'drizzle-orm';
export const POST = getUsersByIdsHandler(async ({ external_ids }) => {
  const foundUsers = await db
    .select({
      authjs_user_id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      password: users.password,
    })
    .from(users)
    .where(inArray(users.id, external_ids));

  return foundUsers.map((user) => ({
    external_id: user.authjs_user_id,
    first_name: user.name || undefined,
    email_address: user.email ? [user.email] : undefined,
    username: user.username || undefined,
    password_digest: user.password || undefined,
    password_hasher: user.password ? ('bcrypt' as const) : undefined,
  }));
});

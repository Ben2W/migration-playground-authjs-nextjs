import { getUsersByIdsHandler } from '@/clerk/get-users-by-ids-helper';
import { db } from '@/db';
import { users } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export const POST = getUsersByIdsHandler(async ({ external_ids }) => {
  const foundUsers = await db
    .select({
      external_id: users.id,
      first_name: users.name,
      email_address: users.email,
      username: users.username,
      password_digest: users.password,
    })
    .from(users)
    .where(inArray(users.id, external_ids));

  return foundUsers.map((user) => ({
    external_id: user.external_id,
    first_name: user.first_name || undefined,
    email_address: user.email_address ? [user.email_address] : undefined,
    username: user.username ? user.username.replace(/\./g, '-') : undefined,
    password_digest: user.password_digest || undefined,
    password_hasher: 'bcrypt' as const,
  }));
});

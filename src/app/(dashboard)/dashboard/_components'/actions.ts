'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { count } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function increaseCount() {
  console.log('increaseCount');
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new Error('User not authenticated');
  }

  const user_id = session.user.id;

  await db
    .insert(count)
    .values({ user_id, count: 1 })
    .onConflictDoUpdate({
      target: count.user_id,
      set: { count: sql`${count.count} + 1` },
    });
}

export async function getCount() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  const [userCount] = await db
    .select()
    .from(count)
    .where(eq(count.user_id, userId));

  return userCount?.count ?? 0;
}

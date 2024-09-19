'use server';

import { db } from '@/db';
import { count } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { auth as clerkAuth } from '@clerk/nextjs/server';

export async function increaseCount() {
  const session = await clerkAuth();

  const relevant_id = session.sessionClaims?.relevant_id as string;

  if (!relevant_id) {
    throw new Error('User not authenticated');
  }

  await db
    .insert(count)
    .values({ user_id: relevant_id, count: 1 })
    .onConflictDoUpdate({
      target: count.user_id,
      set: { count: sql`${count.count} + 1` },
    });
}

export async function getCount() {
  const session = await clerkAuth();

  const user_id = session.userId;
  const external_id = session.sessionClaims?.external_id as string | null;

  if (!user_id && !external_id) {
    throw new Error('User not authenticated');
  }

  const [userCount] = await db
    .select()
    .from(count)
    .where(or(eq(count.user_id, user_id), eq(count.user_id, external_id)));

  return userCount?.count ?? 0;
}

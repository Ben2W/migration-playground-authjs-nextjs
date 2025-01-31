'use server';

import { db } from '@/db';
import { count } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth as clerkAuth } from '@clerk/nextjs/server';

export async function increaseCount() {
  const { sessionClaims, userId: clerkUserId } = await clerkAuth();

  if (!sessionClaims || !clerkUserId) {
    throw new Error('User not authenticated');
  }

  const { externalId } = sessionClaims as { externalId?: string | undefined };

  const userId = externalId ?? clerkUserId;

  await db
    .insert(count)
    .values({ user_id: userId, count: 1 })
    .onConflictDoUpdate({
      target: count.user_id,
      set: { count: sql`${count.count} + 1` },
    });
}

export async function getCount() {
  const { sessionClaims, userId: clerkUserId } = await clerkAuth();

  if (!sessionClaims || !clerkUserId) {
    throw new Error('User not authenticated');
  }

  const { externalId } = sessionClaims as { externalId?: string | undefined };

  const userId = externalId ?? clerkUserId;

  const [userCount] = await db
    .select()
    .from(count)
    .where(eq(count.user_id, userId));

  return userCount?.count ?? 0;
}

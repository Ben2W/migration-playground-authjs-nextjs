'use server';

import { auth as nextAuth } from '@/auth';
import { db } from '@/db';
import { count } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth as clerkAuth } from '@clerk/nextjs/server';

// @ts-ignore
const isClerkSessionsRequired = (await isClerkSessionsRequired()) as boolean;

const getUserId = async () => {
  if (isClerkSessionsRequired) {
    const { sessionClaims, userId: clerkUserId } = await clerkAuth();

    const { externalId } = sessionClaims as { externalId?: string | undefined };
    return externalId ?? clerkUserId;
  } else {
    const session = await nextAuth();
    return session?.user?.id;
  }
};

export async function increaseCount() {
  if (usingClerk) {
    const { sessionClaims, userId: clerkUserId } = await clerkAuth();
  } else {
    const session = await nextAuth();
  }

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
  const session = await nextAuth();

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

// 'use server';

// import { db } from '@/db';
// import { count } from '@/db/schema';
// import { eq, sql } from 'drizzle-orm';
// import { auth as clerkAuth } from '@clerk/nextjs/server';

// export async function increaseCount() {
//   const { sessionClaims, userId: clerkUserId } = await clerkAuth();

//   if (!sessionClaims || !clerkUserId) {
//     throw new Error('User not authenticated');
//   }

//   const { externalId } = sessionClaims as { externalId?: string | undefined };

//   const userId = externalId ?? clerkUserId;

//   await db
//     .insert(count)
//     .values({ user_id: userId, count: 1 })
//     .onConflictDoUpdate({
//       target: count.user_id,
//       set: { count: sql`${count.count} + 1` },
//     });
// }

// export async function getCount() {
//   const { sessionClaims, userId: clerkUserId } = await clerkAuth();

//   if (!sessionClaims || !clerkUserId) {
//     throw new Error('User not authenticated');
//   }

//   const { externalId } = sessionClaims as { externalId?: string | undefined };

//   const userId = externalId ?? clerkUserId;

//   const [userCount] = await db
//     .select()
//     .from(count)
//     .where(eq(count.user_id, userId));

//   return userCount?.count ?? 0;
// }

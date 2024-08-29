'use server';

import { db } from '@/db';
import { users } from '@/db/schema';

export async function simulateActiveUsers(
  count: number,
): Promise<{ success: boolean; error?: string; count: number }> {
  let totalCount = 0;
  try {
    const HONO_API_URL = process.env.NEXT_PUBLIC_HONO_API_URL;

    if (!HONO_API_URL) {
      throw new Error('HONO_API_URL is not defined in environment variables');
    }

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

    if (!CLERK_SECRET_KEY) {
      throw new Error(
        'CLERK_SECRET_KEY is not defined in environment variables',
      );
    }

    const batchSize = 200;
    let cursor = 0;

    while (cursor < count) {
      const limit = Math.min(batchSize, count - cursor);

      // Fetch users from the database using a cursor
      const selectedUsers = await db
        .select({ email: users.email })
        .from(users)
        .orderBy(users.id)
        .limit(limit)
        .offset(cursor);

      // Call the API for each user in this batch
      const promises = selectedUsers.map(async (user) => {
        const response = await fetch(
          `${HONO_API_URL}/migrations/add-active-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${CLERK_SECRET_KEY}`,
            },
            body: JSON.stringify({ external_id: user.email }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to add active user: ${user.email}. Status: ${response.status}: ${response.statusText}`,
          );
        }
      });

      // Wait for all API calls in this batch to complete
      await Promise.all(promises);

      totalCount += selectedUsers.length;

      cursor += selectedUsers.length;
    }

    return { success: true, count: totalCount };
  } catch (error) {
    console.error('Error simulating active users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: totalCount,
    };
  }
}

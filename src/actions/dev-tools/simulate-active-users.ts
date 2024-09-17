'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { inArray, SQL, sql } from 'drizzle-orm';

export async function simulateActiveUsers({
  numToSimulate,
  percentageDataChanged,
}: {
  numToSimulate: number;
  percentageDataChanged: number;
}): Promise<{ success: boolean; error?: string; count: number }> {
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

    const batchSize = 1000;
    let cursor = 0;

    while (cursor < numToSimulate) {
      const limit = Math.min(batchSize, numToSimulate - cursor);

      // Fetch users from the database using a cursor
      const selectedUsers = await db
        .select({ id: users.id, name: users.name, password: users.password })
        .from(users)
        .orderBy(users.id)
        .limit(limit)
        .offset(cursor);

      // Modify data for a percentage of users
      const usersToModify = Math.floor(
        selectedUsers.length * percentageDataChanged,
      );
      if (usersToModify > 0) {
        const password = faker.internet.password();
        const hashedPassword = await bcrypt.hash(password, 10);

        const usersToUpdate = selectedUsers.slice(0, usersToModify);
        const updates = usersToUpdate.map((user) => ({
          external_id: user.id,
          name: faker.person.fullName(),
        }));

        const sqlChunks: SQL[] = [];
        const external_ids: string[] = [];
        sqlChunks.push(sql`(case`);
        for (const update of updates) {
          sqlChunks.push(
            sql`when ${users.id} = ${update.external_id} then ${update.name}`,
          );
          external_ids.push(update.external_id);
        }
        sqlChunks.push(sql`end)`);
        const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

        await db
          .update(users)
          .set({
            name: finalSql,
            password: hashedPassword,
          })
          .where(inArray(users.id, external_ids));
      }

      // Call the API for each user in this batch
      const response = await fetch(`${HONO_API_URL}/migrations/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          external_ids: selectedUsers.map((user) => user.id),
          as_trickle: true,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to add ${selectedUsers.length} active users. Status: ${response.status}: ${response.statusText}`,
        );
      }

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

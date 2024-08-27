'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { count } from 'drizzle-orm';

export async function getTotalUsers(): Promise<number> {
  try {
    const result = await db.select({ value: count() }).from(users);
    return result[0].value;
  } catch (error) {
    console.error('Error getting total users:', error);
    return 0;
  }
}

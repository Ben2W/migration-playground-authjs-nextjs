'use server';
import { db } from '@/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  authenticators,
} from '@/db/schema';

export async function deleteAllUsers(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await db.delete(authenticators);
    await db.delete(verificationTokens);
    await db.delete(sessions);
    await db.delete(accounts);
    await db.delete(users);

    return { success: true };
  } catch (error) {
    console.error('Error deleting all users:', error);
    return { success: false, error: 'Failed to delete all users' };
  }
}

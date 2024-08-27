'use server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { faker } from '@faker-js/faker';

export async function generateUsers(
  count: number,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const newUsers = Array.from({ length: count }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      image: faker.image.avatar(),
    }));

    await db.insert(users).values(newUsers);

    return { success: true, count: newUsers.length };
  } catch (error) {
    console.error('Error generating users:', error);
    return { success: false, error: 'Failed to generate users', count: 0 };
  }
}

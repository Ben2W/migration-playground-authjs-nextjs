'use server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export async function generateUsers(
  count: number,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const hashedPassword = await bcrypt.hash('password', 10);

    const newUsers = Array.from({ length: count }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      image: faker.image.avatar(),
      password: hashedPassword,
    }));

    await db.insert(users).values(newUsers);

    return { success: true, count: newUsers.length };
  } catch (error) {
    console.error('Error generating users:', error);
    return { success: false, error: 'Failed to generate users', count: 0 };
  }
}

export async function generateLoginUser() {
  const username = faker.internet.userName();
  const password = faker.internet.password();
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    username: username,
    password: hashedPassword,
    image: faker.image.avatar(),
  });

  return { username, password };
}

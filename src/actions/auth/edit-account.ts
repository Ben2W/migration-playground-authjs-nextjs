'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export default async function editAccount({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return {
      error: 'Unauthorized',
    };
  }

  await db
    .update(users)
    .set({ name, username })
    .where(eq(users.id, session.user.id));

  revalidatePath('/profile');
}

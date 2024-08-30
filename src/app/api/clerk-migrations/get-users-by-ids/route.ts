import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ') ||
    authHeader.split(' ')[1] !== process.env.CLERK_SECRET_KEY
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schema = z.object({
      external_ids: z.array(z.string()),
    });

    const result = schema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { external_ids } = result.data;

    const foundUsers = await db
      .select({
        external_id: users.id,
        first_name: users.name,
      })
      .from(users)
      .where(inArray(users.id, external_ids));

    return NextResponse.json(foundUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

//  /app/api/clerk-migrations/add-active-user/route.ts

import { auth } from '@/auth'; // Adjust the path according to your folder structure
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(null, { status: 204 });
  }

  const external_id = session.user.id;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_HONO_API_URL}/v1/migrations/add-active-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.CLERK_SECRET_KEY,
        },
        body: JSON.stringify({ external_id }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to add active user');
    }

    const data = await response.json();

    const token = data.token;

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error adding active user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

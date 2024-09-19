import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const userSchema = z.discriminatedUnion('mark_active', [
  z.object({
    mark_active: z.literal(true),
    external_id: z.string(),
  }),
  z.object({
    mark_active: z.literal(false),
    external_id: z.undefined(),
  }),
]);

type UserData = z.infer<typeof userSchema>;

export const addActiveUserHandler = (
  getUserData: () => Promise<UserData> | UserData,
) => {
  return async () => {
    try {
      const userData = await getUserData();
      const validatedData = userSchema.parse(userData);

      if (!validatedData.mark_active) {
        return NextResponse.json(
          { message: 'User not authorized' },
          { status: 403 },
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HONO_API_URL}/v1/migrations/add-active-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
          body: JSON.stringify({ external_id: validatedData.external_id }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Could not add active user: ${response.status} ${response.statusText}`,
        );
      }

      return NextResponse.json({ message: 'User added successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      console.error('Error adding active user:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 },
      );
    }
  };
};

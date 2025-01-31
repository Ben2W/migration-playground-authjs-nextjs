import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

type UserData = {
  external_id: string | undefined;
};

const responseSchema = z.object({
  meta: z.object({
    status_code: z.number(),
    status_text: z.string(),
  }),
  result: z.object({
    markedStale: z.boolean(),
    message: z.string(),
    signInToken: z.string().nullable(),
  }),
});

const frontendRequestSchema = z.object({
  wants_clerk_sign_in: z.boolean().default(false),
});

export const addActiveUserHandler = (
  getUserData: () => Promise<UserData> | UserData,
) => {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { wants_clerk_sign_in } = frontendRequestSchema.parse(body);

      const userData = await getUserData();

      if (!userData.external_id) {
        return NextResponse.json(
          responseSchema.parse({
            meta: {
              status_code: 200,
              status_text: 'OK',
            },
            result: {
              markedStale: false,
              message: 'No external_id provided',
              signInToken: null,
            },
          }),
          { status: 200 },
        );
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HONO_API_URL}/v1/migrations/external_user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
          body: JSON.stringify({
            external_id: userData.external_id,
            mark_stale: true,
            wants_clerk_sign_in: wants_clerk_sign_in,
          }),
        },
      );

      const rawData = await response.json();
      const parsedData = responseSchema.safeParse(rawData);

      if (parsedData.success) {
        return NextResponse.json(parsedData.data, { status: response.status });
      } else {
        return NextResponse.json(
          responseSchema.parse({
            meta: {
              status_code: 500,
              status_text: 'Internal Server Error',
            },
          }),
          { status: 500 },
        );
      }
    } catch (error) {
      console.error('Error adding active user:', error);
      return NextResponse.json(
        responseSchema.parse({
          meta: {
            status_code: 500,
            status_text: 'Internal Server Error',
          },
          result: {
            markedStale: false,
            message: 'Internal server error',
            signInToken: null,
          },
        }),
        { status: 500 },
      );
    }
  };
};

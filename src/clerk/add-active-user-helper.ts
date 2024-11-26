import { NextResponse, NextRequest } from 'next/server';

type ClientReqBody = {
  is_signed_into_clerk?: boolean;
};

type UserData = {
  external_id?: string;
  mark_stale?: boolean;
};

export const addActiveUserHandler = (
  getUserData: () => Promise<UserData> | UserData,
) => {
  return async (request: NextRequest) => {
    try {
      const userData = await getUserData();

      const validatedData = {
        external_id: userData.external_id,
        mark_stale: userData.mark_stale,
      };

      if (!validatedData.external_id || !validatedData.mark_stale) {
        return NextResponse.json(
          { message: 'No action needed' },
          { status: 200 },
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HONO_API_URL}/v1/migrations/active-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
          body: JSON.stringify({
            external_id: validatedData.external_id,
          }),
        },
      );

      const data = await response.json();
      return NextResponse.json(
        {
          markedStale: data.marked_stale,
          message: data.message,
          clerkUserId: data.clerk_user_id ?? null,
          signInToken: data.sign_in_token ?? null,
        },
        { status: response.status },
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error('Error adding active user:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 },
      );
    }
  };
};

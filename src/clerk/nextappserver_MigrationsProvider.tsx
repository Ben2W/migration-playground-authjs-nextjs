'server-only';

import { z } from 'zod';
import { MigrationPoller } from './react_poller';
export const dynamic = 'force-dynamic';

const responseSchema = z.object({
  meta: z.object({
    status_code: z.number(),
    status_text: z.string(),
  }),
  result: z.object({
    markedStale: z.boolean(),
    message: z.string(),
    externalId: z.string(),
    signInToken: z.string().nullable(),
  }),
});

export default async function MigrationsProvider({
  children,
  externalId,
  requireClerkSession = false,
}: {
  children: React.ReactNode;
  externalId: string | null | undefined;
  requireClerkSession?: boolean;
}) {
  async function onActiveUser({
    wantsClerkSignIn,
    markStale,
  }: {
    wantsClerkSignIn: boolean;
    markStale: boolean;
  }) {
    'use server';
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_HONO_API_URL}/v1/migrations/external_user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          // This runs in the server, so we cannot pass in the externalId into onActiveUser
          external_id: externalId,
          mark_stale: markStale,
          wants_clerk_sign_in: wantsClerkSignIn,
        }),
      },
    );

    const rawData = await response.json();
    const parsedData = responseSchema.parse(rawData);
    return parsedData;
  }

  return (
    <MigrationPoller
      onActiveUser={onActiveUser}
      externalIdForTokenRequests={externalId}
      blockRenderingUntilSessionIsSynced={requireClerkSession}
    >
      <>{children}</>
    </MigrationPoller>
  );
}

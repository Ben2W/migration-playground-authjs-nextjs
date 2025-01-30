import { auth } from '@/auth';
import { addActiveUserHandler } from '@/clerk/add-active-user-helper';

export const POST = addActiveUserHandler(async () => {
  const session = await auth();

  const nextAuthUserId = session?.user?.id;

  return { external_id: nextAuthUserId, mark_stale: true };
});

import { auth as nextAuth } from '@/auth';
import { addActiveUserHandler } from '@/clerk/add-active-user-helper';

export const POST = addActiveUserHandler(async () => {
  const session = await nextAuth();

  const nextAuthUserId = session?.user?.id;

  return { external_id: nextAuthUserId, mark_stale: true };
});

import { auth } from '@/auth';
import { addActiveUserHandler } from '@/clerk/add-active-user-helper';

export const POST = addActiveUserHandler(async () => {
  const session = await auth();

  return { external_id: session?.user?.id, mark_stale: true };
});

import { auth } from '@/auth';
import { addActiveUserHandler } from '@/clerk/add-active-user-helper';

export const POST = addActiveUserHandler(async () => {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { mark_active: false };
  }
  return { external_id: session.user.id, mark_active: true };
});

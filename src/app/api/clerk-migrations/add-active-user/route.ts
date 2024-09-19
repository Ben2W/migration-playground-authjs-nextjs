import { addActiveUserHandler } from '@/clerk/add-active-user-helper';

export const POST = addActiveUserHandler(async () => {
  return { mark_active: false };
});

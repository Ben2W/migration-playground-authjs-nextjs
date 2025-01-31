'use client';

import { useEffect } from 'react';

import { useMigration } from '@/clerk/migrations';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function SyncSession() {
  const { clerkSync } = useMigration();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const sync = async () => {
      // @ts-ignore
      const { hasUserDataChanged } = await clerkSync();
      if (hasUserDataChanged) {
        await user?.reload();
      }
      console.log('Synced with clerk');
      router.push('/profile');
    };
    sync();
  }, []);

  return <div>Syncing session with clerk...</div>;
}

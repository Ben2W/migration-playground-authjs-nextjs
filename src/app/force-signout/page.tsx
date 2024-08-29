'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ForceSignOut() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      await signOut({ redirect: false });
      router.push('/sign-in');
    };

    performSignOut();
  }, [router]);

  return <div>Signing out...</div>;
}

export default ForceSignOut;

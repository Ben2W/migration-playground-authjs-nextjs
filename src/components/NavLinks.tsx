'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <div className='flex space-x-2'>
      <Button
        variant={pathname === '/dashboard' ? 'default' : 'outline'}
        disabled={true}
        asChild
      >
        <Link href='/dashboard'>Dashboard</Link>
      </Button>
    </div>
  );
}

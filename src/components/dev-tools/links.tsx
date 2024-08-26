'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const DevToolsLinks = () => {
  const pathname = usePathname();
  const isDrizzleStudio = pathname === '/drizzle';

  return (
    <div className='flex w-full flex-col space-y-2'>
      <Link href='/' passHref>
        <Button
          variant='outline'
          disabled={!isDrizzleStudio}
          className='w-full'
        >
          App
        </Button>
      </Link>
      <Link href='/drizzle' passHref>
        <Button variant='outline' disabled={isDrizzleStudio} className='w-full'>
          Drizzle Studio
        </Button>
      </Link>
    </div>
  );
};

export default DevToolsLinks;

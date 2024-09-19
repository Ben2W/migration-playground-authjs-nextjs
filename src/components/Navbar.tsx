import React from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { SignOut } from './AuthButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { unstable_noStore } from 'next/cache';
import ResizableWindows from './dev-tools/resizable-window';
import { ThemeToggle } from './ThemeToggle';
import NavLinks from './NavLinks';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function Navbar({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  const session = await auth();
  const user = session.userId;

  return (
    <ResizableWindows>
      <header className='sticky top-0 z-50 border-b bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-800'>
        <div className='mx-auto flex items-center justify-between'>
          <div className='flex items-center'>
            <ThemeToggle />
            <span>AuthJs to Clerk Playground </span>
            <Link
              href='https://github.com/SpartanFA/migration-playground-authjs-nextjs'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button variant={'link'}>clone here</Button>
            </Link>
            <span> (forked from </span>
            <Link
              href='https://github.com/patelvivekdev/AuthJs-Template'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button variant={'link'}>AuthJs Template by patelvivekdev</Button>
            </Link>
            <span>)</span>
          </div>
          <NavLinks />
          <UserButton />
        </div>
      </header>
      {children}
    </ResizableWindows>
  );
}

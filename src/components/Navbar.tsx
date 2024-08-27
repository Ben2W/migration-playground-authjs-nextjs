import React from 'react';
import { auth } from '@/auth';
import Link from 'next/link';
import { Button } from './ui/button';
import { SignOut } from './AuthButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { unstable_noStore } from 'next/cache';
import ResizableWindows from './dev-tools/resizable-window';
import { ThemeToggle } from './ThemeToggle';

export default async function Navbar({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  const session = await auth();
  const user = session?.user;

  return (
    <div>
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
          {session ? (
            <div className='flex items-center space-x-4'>
              <Link
                className='text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                href='/dashboard'
              >
                Dashboard
              </Link>
              <Link
                className='text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                href='/profile'
              >
                <Avatar>
                  <AvatarImage
                    className='rounded-full border-2 border-black dark:border-white'
                    src={user?.image ? user.image : ''}
                  />
                  <AvatarFallback className='rounded-full border-2 border-black dark:border-white'>
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <SignOut />
            </div>
          ) : (
            <div className='flex items-center space-x-4'>
              <Link href='/sign-in'>
                <Button size='sm'>Sign In</Button>
              </Link>
              <Link href='/sign-up'>
                <Button size='sm'>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </header>
      <ResizableWindows>{children}</ResizableWindows>
    </div>
  );
}

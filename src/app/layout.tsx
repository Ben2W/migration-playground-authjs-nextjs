import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import { Inter, Rubik } from 'next/font/google';
import ReactQueryProvider from '@/components/ReactQueryProvider';
import { MigrationHelper } from '@/clerk/migrations';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
const rubik = Rubik({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rubik',
});

export const metadata: Metadata = {
  title: 'AuthJs Template',
  description: 'A starter authentication template for Next.js',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={cn(
          'mx-auto bg-neutral-100 dark:bg-neutral-900',
          inter.variable,
          rubik.variable,
        )}
      >
        <ClerkProvider proxyUrl={process.env.NEXT_PUBLIC_CLERK_API_URL}>
          <MigrationHelper activeUserUrl={'/api/clerk-migration-helper'}>
            <ReactQueryProvider>
              <ThemeProvider
                attribute='class'
                defaultTheme='system'
                enableSystem={true}
                disableTransitionOnChange
              >
                <Navbar>{children}</Navbar>
                <Toaster position='top-center' />
                <ShadToast />
              </ThemeProvider>
            </ReactQueryProvider>
          </MigrationHelper>
        </ClerkProvider>
      </body>
    </html>
  );
}

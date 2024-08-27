'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <></>;
  }

  if (resolvedTheme === 'dark') {
    return (
      <Button variant={'ghost'} size={'icon'} onClick={() => setTheme('light')}>
        <MoonIcon />
      </Button>
    );
  }

  return (
    <Button variant={'ghost'} size={'icon'} onClick={() => setTheme('dark')}>
      <SunIcon />
    </Button>
  );
}

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

export default function CopyableClipboard({
  textToCopy,
  isCode = false,
}: {
  textToCopy: string;
  isCode?: boolean;
}) {
  const [isCopied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <Card
      className='relative p-3'
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className='relative'>
        <div
          className={cn(
            'min-h-[1.5em] break-all pr-10',
            isCode && 'rounded bg-secondary p-2 font-mono',
          )}
        >
          {textToCopy || '\u00A0'}
        </div>
        <Button
          variant='outline'
          onClick={handleCopyUrl}
          className={cn(
            'absolute right-0 top-0 flex h-8 w-8 items-center justify-center p-0 transition-opacity duration-200',
            isHovering ? 'opacity-100' : 'opacity-0',
          )}
        >
          {isCopied ? <Check size={15} /> : <Copy size={15} />}
        </Button>
      </div>
    </Card>
  );
}

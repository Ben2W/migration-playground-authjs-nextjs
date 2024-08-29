'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { generateLoginUser } from '@/actions/dev-tools/generate-users';
import CopyableClipboard from '@/components/copy-text';
import { useQueryClient } from '@tanstack/react-query';
import useTotalUsers from './useTotalUsers';

export default function GenerateLoginUser() {
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const previousTotalUsersRef = useRef<number | undefined>(undefined);

  const { data: totalUsers } = useTotalUsers();

  useEffect(() => {
    if (typeof totalUsers === 'number') {
      if (
        typeof previousTotalUsersRef.current === 'number' &&
        totalUsers < previousTotalUsersRef.current
      ) {
        setCredentials(null);
      }
      previousTotalUsersRef.current = totalUsers;
    }
  }, [totalUsers]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateLoginUser();
      setCredentials(result);
      toast({
        title: 'Success',
        description: 'Login user generated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['totalUsers'] });
    } catch (error) {
      console.error('Error generating login user:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate login user',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='w-full space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Login User'}
        </Button>
      </div>
      <div className='space-y-4'>
        <div>
          <div className='mb-1 font-semibold'>Username:</div>
          <CopyableClipboard textToCopy={credentials?.username ?? ''} />
        </div>
        <div>
          <div className='mb-1 font-semibold'>Password:</div>
          <CopyableClipboard textToCopy={credentials?.password ?? ''} />
        </div>
      </div>
    </div>
  );
}

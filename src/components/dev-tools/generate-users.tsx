'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { generateUsers } from '@/actions/dev-tools/generate-users';
import { useQueryClient } from '@tanstack/react-query';

export default function GenerateUsers() {
  const [count, setCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    const totalBatches = Math.ceil(count / 1000);
    let generatedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batchSize = Math.min(1000, count - generatedCount);
      const result = await generateUsers(batchSize);
      queryClient.invalidateQueries({ queryKey: ['totalUsers'] });

      if (result.success) {
        generatedCount += result.count;
        setProgress(Math.round((generatedCount / count) * 100));
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        break;
      }
    }

    setIsGenerating(false);

    if (generatedCount > 0) {
      toast({
        title: 'Success',
        description: `Generated ${generatedCount} users`,
      });
    }
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setProgress(0);
    toast({
      title: 'Cancelled',
      description: 'User generation has been cancelled',
    });
  };

  return (
    <div className='w-full space-y-4'>
      <div className='flex w-full items-center space-x-2'>
        <div className='relative w-full max-w-xs'>
          <Input
            type='number'
            value={count}
            onChange={(e) =>
              setCount(
                Math.min(100000, Math.max(1, parseInt(e.target.value) || 1)),
              )
            }
            min={1}
            max={100000}
            className='w-full'
            disabled={isGenerating}
          />
          {isGenerating && (
            <div
              className='pointer-events-none absolute inset-0 bg-primary/20'
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
        <Button
          onClick={isGenerating ? handleCancel : handleGenerate}
          variant={isGenerating ? 'destructive' : 'default'}
        >
          {isGenerating ? 'Cancel' : 'Generate Users'}
        </Button>
      </div>
    </div>
  );
}

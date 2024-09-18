'use client';

import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCount, increaseCount } from './actions';

export function Counter() {
  const queryClient = useQueryClient();

  const { data: count, isLoading } = useQuery({
    queryKey: ['count'],
    queryFn: () => getCount(),
  });

  const { mutate: increment, isPending: isIncrementing } = useMutation({
    mutationFn: increaseCount,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['count'] });
      const previousCount = queryClient.getQueryData(['count']);
      queryClient.setQueryData(['count'], (old: number) => (old ?? 0) + 1);
      return { previousCount };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['count'], context?.previousCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['count'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='flex items-center space-x-4'>
      <span
        className={`text-2xl font-bold ${isIncrementing ? 'opacity-50' : 'opacity-100'}`}
      >
        {count ?? 0}
      </span>
      <Button size='sm' variant={'outline'} onClick={() => increment()}>
        +
      </Button>
    </div>
  );
}

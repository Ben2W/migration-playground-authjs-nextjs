'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { deleteAllUsers } from '@/actions/dev-tools/delete-all-users';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';

export default function DeleteAllUsers() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteAllUsers,
    onSuccess: async (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'All users have been deleted',
        });
        // Invalidate the queries
        queryClient.invalidateQueries({ queryKey: ['totalUsers'] });
        // Sign out the current user
        await signOut({ redirect: false });
      } else {
        throw new Error(result.error);
      }
    },
    onError: (error) => {
      console.error('Error deleting all users:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all users',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    mutation.mutate();
  };

  return (
    <div className='w-full'>
      <Button
        onClick={handleDelete}
        disabled={mutation.isPending}
        variant='destructive'
        className='w-full'
      >
        {mutation.isPending ? 'Deleting...' : 'Delete All Users'}
      </Button>
    </div>
  );
}

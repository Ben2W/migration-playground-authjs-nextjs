'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/SubmitButton';
import { useMutation } from '@tanstack/react-query';
import editAccount from '@/actions/auth/edit-account';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function EditProfileForm({ userData }: { userData: any }) {
  const { toast } = useToast();
  const [name, setName] = useState(userData?.name || '');
  const [username, setUsername] = useState(userData?.username || '');

  const { mutate, isPending } = useMutation({
    mutationFn: editAccount,
    onSuccess: () => {
      toast({
        title: 'Profile updated successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate({ name, username });
  };

  return (
    <>
      <form className='space-y-4' onSubmit={handleSubmit}>
        <div>
          <Label htmlFor='name'>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            id='name'
            type='text'
          />
        </div>
        <div>
          <Label htmlFor='username'>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            id='username'
            type='text'
          />
        </div>
        <div>
          <Label htmlFor='email'>Email</Label>
          <Input
            defaultValue={userData?.email ? userData?.email : ''}
            id='email'
            type='email'
            disabled
          />
        </div>
        <div>
          <SubmitButton
            size='sm'
            children={isPending ? 'Updating...' : 'Update Profile'}
          />
        </div>
      </form>
    </>
  );
}

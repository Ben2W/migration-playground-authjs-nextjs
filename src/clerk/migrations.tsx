'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useSignIn } from '@clerk/nextjs';
import { z } from 'zod';

const responseSchema = z.object({
  clerk_user_id: z.string().optional(),
  sign_in_token: z.string().optional(),
});

export const MigrationHelper = ({
  children,
  activeUserUrl,
}: {
  children: React.ReactNode;
  activeUserUrl: string;
}) => {
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn, userId, signOut } = useAuth();
  const { signIn, setActive } = useSignIn();

  const addActiveUser = useCallback(async () => {
    try {
      const response = await fetch(activeUserUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_signed_into_clerk: isSignedIn ?? false,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Invalid JSON response');
      }

      const validatedData = responseSchema.parse(data);

      if (isSignedIn) {
        if (
          !validatedData.clerk_user_id ||
          validatedData.clerk_user_id !== userId
        ) {
          await signOut();
          setError('Session mismatch. You have been signed out.');
        }
      } else if (validatedData.sign_in_token) {
        console.log('Received sign-in token:', validatedData.sign_in_token);
        try {
          const signUpAttempt = await signIn?.create({
            strategy: 'ticket',
            ticket: validatedData.sign_in_token,
          });

          if (signUpAttempt?.status === 'complete') {
            await setActive?.({ session: signUpAttempt.createdSessionId });
          }

          // Reload the window after successful sign-in
        } catch (signInError) {
          console.error('Error signing in with token:', signInError);
          setError('Failed to sign in with the provided token.');
        }
      }

      setError(null);
    } catch (error) {
      console.error('Error adding active user:', error);
      if (error instanceof Error) {
        setError(`Oh no, something went wrong: ${error.message}`);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [activeUserUrl, isSignedIn, userId, signOut, signIn]);

  useEffect(() => {
    addActiveUser(); // Initial request
    const interval = setInterval(addActiveUser, 5000); // Subsequent requests every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [addActiveUser]);

  if (error) {
    return <div>{error}</div>;
  }

  return <>{children}</>;
};

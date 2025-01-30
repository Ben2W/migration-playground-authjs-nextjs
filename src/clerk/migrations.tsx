'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useSignIn } from '@clerk/nextjs';
import { z } from 'zod';

const responseSchema = z.object({
  meta: z.object({
    status_code: z.number(),
    status_text: z.string(),
  }),
  result: z.object({
    markedStale: z.boolean(),
    message: z.string(),
    signInToken: z.string().nullable(),
  }),
});

export const MigrationHelper = ({
  children,
  activeUserUrl,
}: {
  children: React.ReactNode;
  activeUserUrl: string;
}) => {
  const [error, setError] = useState<string | null>(null);
  const isPolling = useRef(false);
  const { isSignedIn, userId, signOut } = useAuth();
  const { signIn, setActive } = useSignIn();

  const addActiveUser = useCallback(async () => {
    if (isPolling.current) return;
    isPolling.current = true;
    try {
      const response = await fetch(activeUserUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wants_clerk_sign_in: isSignedIn ? false : true,
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

      if (validatedData.meta.status_code !== 200) {
        throw new Error(validatedData.result.message);
      }

      // if (isSignedIn && validatedData.result.markedStale) {
      //   await signOut();
      //   setError('Your session has expired. Please sign in again.');
      //   return;
      // }

      if (!isSignedIn && validatedData.result.signInToken) {
        try {
          // TODO we should block the site from being used if the signIn is not defined
          if (!signIn) {
            console.error('signIn is not defined');
            return;
          }
          const signUpAttempt = await signIn?.create({
            strategy: 'ticket',
            ticket: validatedData.result.signInToken,
          });

          console.log('signUpAttempt', signUpAttempt);

          if (signUpAttempt?.status === 'complete') {
            await setActive?.({ session: signUpAttempt.createdSessionId });
          }
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
    } finally {
      isPolling.current = false;
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

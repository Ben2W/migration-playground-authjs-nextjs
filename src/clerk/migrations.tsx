'use client';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from 'react';
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

// Create context
const MigrationContext = createContext<{
  isSyncing: boolean;
  error: string | null;
  clerkSync: ({
    blockRendering,
  }?: {
    blockRendering?: boolean;
  }) => Promise<void>;
} | null>(null);

// Custom hook to use the migration context
export const useMigration = () => {
  const context = useContext(MigrationContext);
  if (!context) {
    throw new Error('useMigration must be used within a MigrationProvider');
  }
  return context;
};

export const MigrationPoller = ({
  children,
  activeUserUrl,
}: {
  children: React.ReactNode;
  activeUserUrl: string;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isPolling = useRef(false);
  const { isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();

  const clerkSync = useCallback(
    async ({ blockRendering = true } = {}) => {
      if (blockRendering) {
        setIsSyncing(true);
      }

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

        if (!isSignedIn && validatedData.result.signInToken) {
          try {
            if (!signIn) {
              console.error('signIn is not defined');
              return;
            }
            const signUpAttempt = await signIn?.create({
              strategy: 'ticket',
              ticket: validatedData.result.signInToken,
            });

            if (signUpAttempt?.status === 'complete') {
              await setActive?.({ session: signUpAttempt.createdSessionId });
            }
          } catch (signInError) {
            console.error('Error signing in with token:', signInError);
            throw new Error('Failed to sign in with the provided token.');
          }
        }
      } finally {
        if (blockRendering) {
          setIsSyncing(false);
        }
      }
    },
    [activeUserUrl, isSignedIn, signIn, setActive],
  );

  const addActiveUser = useCallback(async () => {
    if (isPolling.current) return;
    isPolling.current = true;
    try {
      await clerkSync({ blockRendering: false });
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
  }, [clerkSync]);

  useEffect(() => {
    addActiveUser();
    const interval = setInterval(addActiveUser, 5000);
    return () => clearInterval(interval);
  }, [addActiveUser]);

  const contextValue = {
    isSyncing,
    error,
    clerkSync,
  };

  return (
    <MigrationContext.Provider value={contextValue}>
      {isSyncing ? (
        <div>Syncing session with clerk...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        children
      )}
    </MigrationContext.Provider>
  );
};

'use client';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from 'react';
import {
  useAuth,
  useClerk,
  useSession,
  useSignIn,
  useUser,
} from '@clerk/nextjs';
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
    externalId: z.string().nullable(),
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
  onActiveUser,
  externalIdForTokenRequests,
  blockRenderingUntilSessionIsSynced = false,
  markStaleOnActiveUser = true,
}: {
  children: React.ReactNode;
  onActiveUser: ({
    wantsClerkSignIn,
    markStale,
  }: {
    wantsClerkSignIn: boolean;
    markStale: boolean;
  }) => Promise<z.infer<typeof responseSchema>>;
  externalIdForTokenRequests: string | null | undefined;
  blockRenderingUntilSessionIsSynced?: boolean;
  markStaleOnActiveUser?: boolean;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(children);
  const isPolling = useRef(false);
  const { isSignedIn: isSignedInToClerk, isLoaded: isClerkLoaded } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { signOut, session } = useClerk();
  const { user, isLoaded: isClerkUserLoaded } = useUser();

  const externalIdFromUserObject = user?.externalId;
  const isSessionSynced =
    externalIdFromUserObject === externalIdForTokenRequests;
  const isSignedInToExternalAuth = Boolean(externalIdForTokenRequests);
  const isClerkReady = isClerkLoaded && isClerkUserLoaded;
  const showSyncMessage = isSyncing;

  const clerkSync = useCallback(
    async ({ blockRendering = true } = {}) => {
      if (blockRendering) {
        setIsSyncing(true);
      }

      try {
        if (
          externalIdForTokenRequests === null ||
          externalIdForTokenRequests === undefined
        ) {
          if (isClerkLoaded) {
            if (isSignedInToClerk) {
              await signOut();
            }
          }
          return;
        }

        if (!isClerkReady) {
          return;
        }

        const validatedData = await onActiveUser({
          wantsClerkSignIn: isSignedInToExternalAuth && !isSessionSynced,
          markStale: markStaleOnActiveUser,
        });

        if (validatedData.meta.status_code !== 200) {
          throw new Error(validatedData.result.message);
        }

        if (validatedData.result.externalId !== externalIdForTokenRequests) {
          throw new Error('External ID mismatch');
        }

        if (isSignedInToExternalAuth && validatedData.result.signInToken) {
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
    [
      onActiveUser,
      signIn,
      setActive,
      isSignedInToExternalAuth,
      isClerkLoaded,
      isSignedInToClerk,
      signOut,
      isClerkReady,
      externalIdForTokenRequests,
      isSessionSynced,
      markStaleOnActiveUser,
    ],
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
    void addActiveUser();
    const interval = setInterval(() => {
      void addActiveUser();
    }, 5000);
    return () => clearInterval(interval);
  }, [addActiveUser]);

  useEffect(() => {
    if (error) {
      setContent(<div>{error}</div>);
    } else if (showSyncMessage) {
      setContent(<div>Syncing with clerk...</div>);
    } else if (blockRenderingUntilSessionIsSynced) {
      if (!isSessionSynced) {
        setContent(<div>Syncing with clerk...</div>);
      } else {
        setContent(children);
      }
    } else {
      setContent(children);
    }
  }, [
    error,
    showSyncMessage,
    blockRenderingUntilSessionIsSynced,
    isClerkReady,
    isSessionSynced,
    children,
  ]);

  const contextValue = {
    isSyncing,
    error,
    clerkSync,
  };

  return (
    <MigrationContext.Provider value={contextValue}>
      {content}
    </MigrationContext.Provider>
  );
};

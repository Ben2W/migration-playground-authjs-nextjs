'use client';
import { useState, useEffect, useCallback } from 'react';

export const ClerkMigrationsWrapper = ({
  children,
  sendHeartbeat,
  activeUserUrl,
}: {
  children: React.ReactNode;
  sendHeartbeat: boolean;
  activeUserUrl: string;
}) => {
  const [error, setError] = useState<string | null>(null);

  const addActiveUser = useCallback(async () => {
    try {
      const response = await fetch(activeUserUrl, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Request failed');
      }
      setError(null);
    } catch (error) {
      console.error('Error adding active user:', error);
      setError('Oh no, something went wrong. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (sendHeartbeat) {
      addActiveUser(); // Initial request
      const interval = setInterval(addActiveUser, 5000); // Subsequent requests every 5 seconds
      return () => clearInterval(interval); // Cleanup on component unmount or when sendHeartbeat changes to false
    }
  }, [sendHeartbeat, addActiveUser]);

  if (!sendHeartbeat) {
    return <>{children}</>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <>{children}</>;
};

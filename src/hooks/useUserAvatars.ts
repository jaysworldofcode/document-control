import { useState, useEffect, useCallback } from 'react';
import { UserAvatar } from '@/types/chat.types';

interface UseUserAvatarsReturn {
  userAvatars: Map<string, UserAvatar>;
  fetchUserAvatars: (userIds: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useUserAvatars(): UseUserAvatarsReturn {
  const [userAvatars, setUserAvatars] = useState<Map<string, UserAvatar>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAvatars = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;

    // Filter out user IDs we already have
    const missingUserIds = userIds.filter(id => !userAvatars.has(id));
    
    if (missingUserIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/avatars?userIds=${missingUserIds.join(',')}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user avatars');
      }

      const data = await response.json();
      
      if (data.success && data.users) {
        setUserAvatars(prev => {
          const newMap = new Map(prev);
          data.users.forEach((user: UserAvatar) => {
            newMap.set(user.id, user);
          });
          return newMap;
        });
      }
    } catch (err) {
      console.error('Error fetching user avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user avatars');
    } finally {
      setIsLoading(false);
    }
  }, [userAvatars]);

  return {
    userAvatars,
    fetchUserAvatars,
    isLoading,
    error
  };
}

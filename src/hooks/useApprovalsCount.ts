"use client";

import { useState, useEffect } from 'react';

export function useApprovalsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/approvals/count');
      
      // Handle network errors
      if (!response) {
        throw new Error('Network error - failed to connect to server');
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }
      
      // Handle API errors
      if (!response.ok) {
        const errorMessage = data?.error || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      // Handle missing or invalid count
      if (typeof data?.count !== 'number') {
        throw new Error('Invalid count data received from server');
      }

      setCount(data.count);
    } catch (err) {
      // Set a user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch approvals count';
      console.error('Error fetching approvals count:', err);
      setError(errorMessage);
      // Set count to 0 on error to avoid showing stale data
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Set up polling every minute
    const interval = setInterval(fetchCount, 60000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading, error, refresh: fetchCount };
}

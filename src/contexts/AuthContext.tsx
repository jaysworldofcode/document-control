"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string | null;
  role: 'owner' | 'admin' | 'member';
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  validateAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'document_control_user';
const LAST_CHECK_KEY = 'document_control_last_auth_check';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper functions for localStorage
  const saveUserToStorage = (userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
    }
  };

  const getUserFromStorage = (): User | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  const clearUserFromStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(LAST_CHECK_KEY);
    }
  };

  const shouldCheckAuth = (): boolean => {
    if (typeof window !== 'undefined') {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (!lastCheck) return true;
      
      const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
      return timeSinceLastCheck > CHECK_INTERVAL;
    }
    return true;
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Periodic background validation
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (shouldCheckAuth()) {
        validateAuthInBackground();
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user]);

  // Validate auth when user returns to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && shouldCheckAuth()) {
        validateAuthInBackground();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const initializeAuth = async () => {
    // First, try to get user from localStorage
    const cachedUser = getUserFromStorage();
    
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      
      // If it's been a while since last check, validate in background
      if (shouldCheckAuth()) {
        validateAuthInBackground();
      }
    } else {
      // No cached user, need to check with server
      await checkAuth();
    }
  };

  const validateAuthInBackground = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        setUser(userData);
        saveUserToStorage(userData);
      } else {
        // Token is invalid, clear everything
        setUser(null);
        clearUserFromStorage();
      }
    } catch (error) {
      console.error('Background auth validation failed:', error);
      // Don't clear user on network errors, keep the cached version
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        setUser(userData);
        saveUserToStorage(userData);
      } else {
        setUser(null);
        clearUserFromStorage();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      clearUserFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    const userData = data.user;
    setUser(userData);
    saveUserToStorage(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearUserFromStorage();
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const validateAuth = async () => {
    await validateAuthInBackground();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, validateAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

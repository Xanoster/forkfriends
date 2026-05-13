'use client';

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';
import { Review } from '@/lib/data';

export interface User {
  uid: string;
  email: string | null;
  name?: string;
  username?: string;
  age?: number;
  city?: string;
  dietary?: string;
  bio?: string;
  avatarSeed?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<User | null>;
  fetchPublicProfile: (username: string) => Promise<User | null>;
  fetchUserReviews: (uid: string) => Promise<Review[]>;
  deleteAccount: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authPages = new Set(['/signin', '/signup']);

const parseJson = async <T,>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed.');
  }
  return data as T;
};

const AuthStateProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded, userId } = useClerkAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const router = useRouter();

  const refreshCurrentUser = useCallback(async () => {
    if (!isLoaded) {
      setProfileLoading(true);
      return null;
    }

    if (!userId) {
      setUser(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      const data = await parseJson<{ user: User }>(await fetch('/api/me'));
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Could not load current user:', error);
      setUser(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = async (_email: string, _pass: string) => {
    router.push('/signin');
  };

  const signup = async (_name: string, _email: string, _pass: string) => {
    router.push('/signup');
  };

  const logout = async () => {
    await signOut({ redirectUrl: '/signin' });
    setUser(null);
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    const { uid: _uid, email: _email, ...profileUpdates } = updatedFields;
    const data = await parseJson<{ user: User }>(
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdates),
      })
    );
    setUser(data.user);
  };

  const fetchUserProfile = useCallback(async (_uid: string): Promise<User | null> => {
    try {
      const data = await parseJson<{ user: User }>(await fetch('/api/me'));
      return data.user;
    } catch {
      return null;
    }
  }, []);

  const fetchPublicProfile = useCallback(async (username: string): Promise<User | null> => {
    try {
      const data = await parseJson<{ user: User }>(await fetch(`/api/users/${encodeURIComponent(username)}`));
      return data.user;
    } catch {
      return null;
    }
  }, []);

  const fetchUserReviews = useCallback(async (uid: string): Promise<Review[]> => {
    const data = await parseJson<{ reviews: Review[] }>(
      await fetch(`/api/reviews?revieweeId=${encodeURIComponent(uid)}`)
    );
    return data.reviews;
  }, []);

  const deleteAccount = async () => {
    await parseJson<{ ok: true }>(
      await fetch('/api/me', {
        method: 'DELETE',
      })
    );
    await signOut({ redirectUrl: '/signin' });
    setUser(null);
  };

  useEffect(() => {
    if (user && authPages.has(window.location.pathname)) {
      router.push('/');
      router.refresh();
    }
  }, [user, router]);

  const value = {
    user,
    login,
    signup,
    logout,
    updateUser,
    fetchUserProfile,
    fetchPublicProfile,
    fetchUserReviews,
    deleteAccount,
    loading: !isLoaded || profileLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => (
  <AuthStateProvider>{children}</AuthStateProvider>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

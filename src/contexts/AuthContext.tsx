'use client';

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
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

const parseJson = async <T,>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed.');
  }
  return data as T;
};

const AuthStateProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const refreshCurrentUser = useCallback(async () => {
    if (status !== 'authenticated') {
      setUser(null);
      setProfileLoading(status === 'loading');
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
  }, [status]);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = async (email: string, pass: string) => {
    const result = await signIn('credentials', {
      email,
      password: pass,
      redirect: false,
    });

    if (result?.error) {
      toast({
        title: 'Sign In Failed',
        description: 'Incorrect email or password. Please try again.',
        variant: 'destructive',
      });
      throw new Error(result.error);
    }

    await refreshCurrentUser();
    if (window.location.pathname.startsWith('/signin')) {
      router.push('/');
      router.refresh();
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    await parseJson<{ user: User }>(
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      })
    );

    await login(email, pass);
  };

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.push('/signin');
    router.refresh();
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
    await signOut({ redirect: false });
    setUser(null);
  };

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
    loading: status === 'loading' || profileLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => (
  <SessionProvider>
    <AuthStateProvider>{children}</AuthStateProvider>
  </SessionProvider>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

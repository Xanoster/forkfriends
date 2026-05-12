'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, Dispatch, SetStateAction, useCallback } from 'react';
import { Dinner, Comment, Review, Notification } from '@/lib/data';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DinnerContextType {
  dinners: Dinner[];
  addDinner: (dinner: Omit<Dinner, 'id' | 'filledSlots' | 'bookedBy' | 'creatorId' | 'creatorName' | 'creatorImage' | 'creatorUsername'>) => Promise<string | null>;
  addReview: (dinnerId: string, review: Omit<Review, 'id' | 'reviewerId' | 'reviewerName' | 'reviewerImage' | 'createdAt'>) => Promise<void>;
  updateDinner: (dinnerId: string, updatedDinner: Partial<Dinner>) => Promise<void>;
  deleteDinner: (dinnerId: string) => Promise<void>;
  bookDinner: (dinnerId: string, userId: string) => Promise<void>;
  cancelBooking: (dinnerId: string, userId:string) => Promise<void>;
  getComments: (dinnerId: string, callback: (comments: Comment[]) => void) => () => void;
  addComment: (dinnerId: string, text: string) => Promise<void>;
  deleteComment: (dinnerId: string, commentId: string, isHost: boolean, isSelfDelete?: boolean) => Promise<void>;
  markCommentsAsRead: (dinnerId: string, comments: Comment[]) => Promise<void>;
  hasUnreadMessages: (dinnerId: string, comments: Comment[]) => boolean;
  unreadDinnerIds: string[];
  readDinnerIds: string[];
  notifications: Notification[];
  markNotificationsAsRead: () => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  loading: boolean;
  selectedCity: string;
  setSelectedCity: Dispatch<SetStateAction<string>>;
  selectedDietary: string;
  setSelectedDietary: Dispatch<SetStateAction<string>>;
}

const DinnerContext = createContext<DinnerContextType | undefined>(undefined);

const parseJson = async <T,>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed.');
  }
  return data as T;
};

export const DinnerProvider = ({ children }: { children: ReactNode }) => {
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreadDinnerIds, setUnreadDinnerIds] = useState<string[]>([]);
  const [readDinnerIds, setReadDinnerIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchDinners = useCallback(async () => {
    const data = await parseJson<{ dinners: Dinner[] }>(await fetch('/api/dinners'));
    setDinners(data.dinners);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const data = await parseJson<{ notifications: Notification[] }>(await fetch('/api/notifications'));
    setNotifications(data.notifications);
  }, [user]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        await fetchDinners();
      } catch (error) {
        console.error('Error fetching dinners:', error);
        if (active) {
          toast({
            title: 'Error',
            description: 'Could not fetch dinners from the database.',
            variant: 'destructive',
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [fetchDinners, toast]);

  useEffect(() => {
    fetchNotifications().catch((error) => console.error('Error fetching notifications:', error));
    const timer = window.setInterval(() => {
      fetchNotifications().catch((error) => console.error('Error fetching notifications:', error));
    }, 15000);

    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) {
      setUnreadDinnerIds([]);
      return;
    }

    const userDinners = dinners.filter(d => d.creatorId === user.uid || d.bookedBy?.includes(user.uid));

    const checkMessages = async () => {
      const unreadIds: string[] = [];
      await Promise.all(
        userDinners.map(async (dinner) => {
          try {
            const data = await parseJson<{ comments: Comment[] }>(await fetch(`/api/dinners/${dinner.id}/messages`));
            const hasUnread = data.comments.some(comment => comment.readBy && !comment.readBy.includes(user.uid));
            if (hasUnread) {
              unreadIds.push(dinner.id);
            }
          } catch {
            // A dinner can disappear while polling; ignore stale checks.
          }
        })
      );
      setUnreadDinnerIds(unreadIds);
    };

    checkMessages();
    const timer = window.setInterval(checkMessages, 10000);
    return () => window.clearInterval(timer);
  }, [user, dinners]);

  const addDinner = async (dinner: Omit<Dinner, 'id'| 'filledSlots' | 'bookedBy'| 'creatorId' | 'creatorName' | 'creatorImage' | 'creatorUsername'>) => {
    if (!user) {
      throw new Error('User not authenticated. Please sign in.');
    }

    const data = await parseJson<{ dinner: Dinner }>(
      await fetch('/api/dinners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dinner),
      })
    );
    await fetchDinners();
    return data.dinner.id;
  };

  const addReview = async (dinnerId: string, review: Omit<Review, 'id' | 'reviewerId' | 'reviewerName' | 'reviewerImage' | 'createdAt'>) => {
    await parseJson<{ review: Review }>(
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, dinnerId }),
      })
    );
    await fetchDinners();
  };

  const updateDinner = async (dinnerId: string, updatedDinner: Partial<Dinner>) => {
    await parseJson<{ dinner: Dinner }>(
      await fetch(`/api/dinners/${dinnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDinner),
      })
    );
    await fetchDinners();
  };

  const deleteDinner = async (dinnerId: string) => {
    await parseJson<{ ok: true }>(
      await fetch(`/api/dinners/${dinnerId}`, {
        method: 'DELETE',
      })
    );
    await fetchDinners();
  };

  const bookDinner = async (dinnerId: string) => {
    await parseJson<{ dinner: Dinner }>(
      await fetch(`/api/dinners/${dinnerId}/book`, {
        method: 'POST',
      })
    );
    await fetchDinners();
    await fetchNotifications();
  };

  const cancelBooking = async (dinnerId: string) => {
    await parseJson<{ dinner: Dinner }>(
      await fetch(`/api/dinners/${dinnerId}/book`, {
        method: 'DELETE',
      })
    );
    await fetchDinners();
    await fetchNotifications();
  };

  const getComments = (dinnerId: string, callback: (comments: Comment[]) => void) => {
    let active = true;
    const loadComments = async () => {
      try {
        const data = await parseJson<{ comments: Comment[] }>(await fetch(`/api/dinners/${dinnerId}/messages`));
        if (active) {
          callback(data.comments);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    loadComments();
    const timer = window.setInterval(loadComments, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  };

  const addComment = async (dinnerId: string, text: string) => {
    await parseJson<{ comment: Comment }>(
      await fetch(`/api/dinners/${dinnerId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    );
  };

  const deleteComment = async (dinnerId: string, commentId: string) => {
    await parseJson<{ ok: true }>(
      await fetch(`/api/dinners/${dinnerId}/messages/${commentId}`, {
        method: 'DELETE',
      })
    );
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;
    await parseJson<{ ok: true }>(
      await fetch('/api/notifications', {
        method: 'PATCH',
      })
    );
    await fetchNotifications();
  };

  const deleteAllNotifications = async () => {
    if (!user) return;
    try {
      await parseJson<{ ok: true }>(
        await fetch('/api/notifications', {
          method: 'DELETE',
        })
      );
      await fetchNotifications();
      toast({
        title: 'Notifications Cleared',
        description: 'All your booking notifications have been deleted.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not delete all notifications. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const markCommentsAsRead = useCallback(async (dinnerId: string, comments: Comment[]) => {
    if (!user || comments.length === 0) return;
    const hasUnread = comments.some(comment => comment.readBy && !comment.readBy.includes(user.uid));
    if (!hasUnread) return;

    await parseJson<{ ok: true }>(
      await fetch(`/api/dinners/${dinnerId}/messages/read`, {
        method: 'PATCH',
      })
    );

    setReadDinnerIds(prev => {
      const newHistory = [dinnerId, ...prev.filter(id => id !== dinnerId)];
      return newHistory.slice(0, 5);
    });
    setUnreadDinnerIds(prev => prev.filter(id => id !== dinnerId));
  }, [user]);

  const hasUnreadMessages = useCallback((dinnerId: string, comments: Comment[]) => {
    if (!user) return false;
    if (unreadDinnerIds.includes(dinnerId)) return true;
    return comments.some(comment => comment.readBy && !comment.readBy.includes(user.uid));
  }, [user, unreadDinnerIds]);

  const value = { dinners, addDinner, addReview, updateDinner, deleteDinner, bookDinner, cancelBooking, getComments, addComment, deleteComment, markCommentsAsRead, hasUnreadMessages, unreadDinnerIds, readDinnerIds, notifications, markNotificationsAsRead, deleteAllNotifications, loading, selectedCity, setSelectedCity, selectedDietary, setSelectedDietary };

  return (
    <DinnerContext.Provider value={value}>
      {children}
    </DinnerContext.Provider>
  );
};

export const useDinner = () => {
  const context = useContext(DinnerContext);
  if (context === undefined) {
    throw new Error('useDinner must be used within a DinnerProvider');
  }
  return context;
};

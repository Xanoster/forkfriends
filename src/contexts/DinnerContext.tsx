
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, Dispatch, SetStateAction, useCallback } from 'react';
import { Dinner, Comment, Review, Notification } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, query, where, arrayUnion, arrayRemove, getDoc, writeBatch, orderBy } from "firebase/firestore";
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
  deleteComment: (dinnerId: string, commentId: string, isHost: boolean) => Promise<void>;
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

export const DinnerProvider = ({ children }: { children: ReactNode }) => {
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const { user, fetchUserReviews } = useAuth();
  const { toast } = useToast();
  const [unreadDinnerIds, setUnreadDinnerIds] = useState<string[]>([]);
  const [readDinnerIds, setReadDinnerIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const q = query(collection(db, "dinners"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        setLoading(true);
        if (snapshot.empty) {
            setDinners([]);
            setLoading(false);
            return;
        }
        
        const dinnersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dinner));

        // Fetch creator profiles for all dinners
        const creatorIds = [...new Set(dinnersData.map(d => d.creatorId).filter(id => id))];
        
        const profilesMap = new Map<string, any>();
        const reviewsMap = new Map<string, Review[]>();

        // Firestore 'in' query is limited to 30 items per query. We might need to chunk this for larger apps.
        if (creatorIds.length > 0) {
            // Chunk the creatorIds array into groups of 30
            const chunks = [];
            for (let i = 0; i < creatorIds.length; i += 30) {
                chunks.push(creatorIds.slice(i, i + 30));
            }

            // Fetch profiles and reviews for each chunk
            for (const chunk of chunks) {
                if (chunk.length > 0) {
                    const usersRef = collection(db, "users");
                    const userQuery = query(usersRef, where('__name__', 'in', chunk));
                    const userSnapshots = await getDocs(userQuery);
                    userSnapshots.forEach(doc => {
                        profilesMap.set(doc.id, doc.data());
                    });
                    
                    const reviewsRef = collection(db, "reviews");
                    const reviewsQuery = query(reviewsRef, where('revieweeId', 'in', chunk));
                    const reviewsSnapshots = await getDocs(reviewsQuery);
                    reviewsSnapshots.forEach(doc => {
                        const review = doc.data() as Review;
                        const currentReviews = reviewsMap.get(review.revieweeId) || [];
                        reviewsMap.set(review.revieweeId, [...currentReviews, review]);
                    });
                }
            }
        }
        
        const hydratedDinners = dinnersData.map(dinner => {
            const hydratedDinner = { ...dinner };
            if (dinner.creatorId) {
                const creatorProfile = profilesMap.get(dinner.creatorId);
                if (creatorProfile) {
                    hydratedDinner.creatorName = creatorProfile.name || 'Unknown Host';
                    hydratedDinner.creatorUsername = creatorProfile.username || 'unknown';
                    hydratedDinner.creatorImage = `https://api.dicebear.com/7.x/micah/svg?seed=${creatorProfile.avatarSeed || creatorProfile.email}`;
                }

                const hostReviews = reviewsMap.get(dinner.creatorId) || [];
                hydratedDinner.hostReviewCount = hostReviews.length;
                if (hostReviews.length > 0) {
                    const totalRating = hostReviews.reduce((acc, r) => acc + r.rating, 0);
                    hydratedDinner.hostAverageRating = totalRating / hostReviews.length;
                } else {
                    hydratedDinner.hostAverageRating = 0;
                }
            } else {
                 hydratedDinner.creatorName = 'Unknown Host';
                 hydratedDinner.creatorUsername = 'unknown';
                 hydratedDinner.hostReviewCount = 0;
                 hydratedDinner.hostAverageRating = 0;
            }
            return hydratedDinner;
        });
        
        setDinners(hydratedDinners);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching dinners:", error);
        toast({
            title: "Error",
            description: "Could not fetch dinners from the database.",
            variant: "destructive"
        })
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  // Notification listener
  useEffect(() => {
    if (!user) {
        setNotifications([]);
        return () => {}; // Return an empty cleanup function
    }
    
    const notifQuery = query(
        collection(db, 'notifications'), 
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Notification));
        setNotifications(notifs);
    }, (error) => {
        console.error("Firestore Error:", error);
    });
    
    return () => unsubscribe();

  }, [user]);


  useEffect(() => {
    if (!user || dinners.length === 0) {
        setUnreadDinnerIds([]);
        return () => {}; // Return an empty cleanup function
    }

    const userDinners = dinners.filter(d => d.creatorId === user.uid || d.bookedBy?.includes(user.uid));
    const unsubscribes: (() => void)[] = [];
    
    userDinners.forEach(dinner => {
        const commentsQuery = query(collection(db, "dinners", dinner.id, "comments"));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const hasUnread = snapshot.docs.some(doc => {
                const comment = doc.data() as Comment;
                return comment.readBy && !comment.readBy.includes(user.uid);
            });
            setUnreadDinnerIds(prev => {
                const newSet = new Set(prev);
                if(hasUnread) {
                    newSet.add(dinner.id);
                } else {
                    newSet.delete(dinner.id);
                }
                return Array.from(newSet);
            })
        });
        unsubscribes.push(unsubscribe);
    })

    return () => {
        unsubscribes.forEach(unsub => unsub());
    }
  }, [user, dinners])

  const addDinner = async (dinner: Omit<Dinner, 'id'| 'filledSlots' | 'bookedBy'| 'creatorId' | 'creatorName' | 'creatorImage' | 'creatorUsername'>) => {
    if (!user) {
        throw new Error("User not authenticated. Please sign in.");
    }
    if (!user.name || !user.username) {
        toast({
            title: "Profile Not Ready",
            description: "Your user profile is still loading. Please wait a moment and try again.",
            variant: "destructive"
        })
        throw new Error("User profile is not fully loaded.");
    }

    try {
        const creatorAvatar = `https://api.dicebear.com/7.x/micah/svg?seed=${user.avatarSeed || user.email}`;
        const docRef = await addDoc(collection(db, "dinners"), {
            ...dinner,
            creatorId: user.uid,
            creatorName: user.name,
            creatorUsername: user.username,
            creatorImage: creatorAvatar,
            filledSlots: 1, 
            bookedBy: [user.uid],
            attendees: [{ uid: user.uid, name: user.name, username: user.username, avatar: creatorAvatar }],
            reviews: {}, // Initialize empty reviews map
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding dinner: ", error);
        throw error;
    }
  };

  const addReview = async (dinnerId: string, review: Omit<Review, 'id' | 'reviewerId' | 'reviewerName' | 'reviewerImage' | 'createdAt'>) => {
    if (!user || !user.username) {
        throw new Error("User not authenticated or profile incomplete.");
    }
    try {
        await addDoc(collection(db, "reviews"), {
            ...review,
            reviewerId: user.uid,
            reviewerName: user.username,
            reviewerImage: `https://api.dicebear.com/7.x/micah/svg?seed=${user.avatarSeed || user.email}`,
            createdAt: serverTimestamp(),
        });
        
        const dinnerRef = doc(db, 'dinners', dinnerId);
        const reviewMapField = `reviews.${user.uid}`;
        
        // Optimistically update local state first
        setDinners(prevDinners => prevDinners.map(d => {
            if (d.id === dinnerId) {
                const newReviews = { ...(d.reviews || {}) };
                if (!newReviews[user.uid]) {
                    newReviews[user.uid] = [];
                }
                newReviews[user.uid].push(review.revieweeId);
                return { ...d, reviews: newReviews };
            }
            return d;
        }));

        await updateDoc(dinnerRef, {
            [reviewMapField]: arrayUnion(review.revieweeId)
        });

    } catch(error) {
        console.error("Error adding review: ", error);
        throw error;
    }
  };

  const updateDinner = async (dinnerId: string, updatedDinner: Partial<Dinner>) => {
    const dinnerDocRef = doc(db, "dinners", dinnerId);
    try {
        await updateDoc(dinnerDocRef, updatedDinner);
    } catch(error) {
        console.error("Error updating dinner: ", error);
        throw error;
    }
  }

  const deleteDinner = async (dinnerId: string) => {
    const dinnerDocRef = doc(db, "dinners", dinnerId);
    try {
        await deleteDoc(dinnerDocRef);
    } catch(error) {
        console.error("Error deleting dinner: ", error);
        throw error;
    }
  }

  const bookDinner = async (dinnerId: string, userId: string) => {
    if (!user || !user.name || !user.username) {
        throw new Error("User profile not loaded");
    }
    
    const dinnerDocRef = doc(db, "dinners", dinnerId);
    
    const dinnerToUpdate = dinners.find(d => d.id === dinnerId);
    if (!dinnerToUpdate) {
        throw new Error("Dinner not found");
    }

    if ((dinnerToUpdate.filledSlots || 0) >= dinnerToUpdate.maxGuests) {
        toast({ title: "Dinner is full", description: "This dinner is already full.", variant: "destructive"});
        return; 
    }
    
    const userAvatar = `https://api.dicebear.com/7.x/micah/svg?seed=${user.avatarSeed || user.email}`;
    const attendeeData = { uid: user.uid, name: user.name, username: user.username, avatar: userAvatar };

    // Optimistic update of the local state
    setDinners(prevDinners => prevDinners.map(d => 
        d.id === dinnerId 
        ? {
            ...d, 
            filledSlots: (d.filledSlots || d.bookedBy.length) + 1,
            bookedBy: [...d.bookedBy, userId],
            attendees: [...(d.attendees || []), attendeeData]
          }
        : d
    ));

    try {
        // Update the database
        await updateDoc(dinnerDocRef, {
            filledSlots: (dinnerToUpdate.filledSlots || dinnerToUpdate.bookedBy.length) + 1,
            bookedBy: arrayUnion(userId),
            attendees: arrayUnion(attendeeData)
        });

        // Add a notification for the host
        await addDoc(collection(db, 'notifications'), {
            type: 'booking',
            dinnerId: dinnerId,
            dinnerName: dinnerToUpdate.restaurantName,
            actorId: user.uid,
            actorName: user.name,
            recipientId: dinnerToUpdate.creatorId,
            read: false,
            createdAt: serverTimestamp(),
        });
        
    } catch(error) {
        console.error("Error booking dinner: ", error);
         // Revert the local state if the database update fails
         setDinners(prevDinners => prevDinners.map(d => 
            d.id === dinnerId 
            ? {
                ...d, 
                filledSlots: (d.filledSlots || d.bookedBy.length) -1,
                bookedBy: d.bookedBy.filter(id => id !== userId),
                attendees: (d.attendees || []).filter(a => a.uid !== userId)
              }
            : d
        ));
        throw error;
    }
  };

  const cancelBooking = async (dinnerId: string, userId: string) => {
     if (!user || !user.name || !user.username) {
        throw new Error("User profile not loaded");
    }
    
    const dinnerDocRef = doc(db, "dinners", dinnerId);
    try {
        const dinnerSnapshot = await getDoc(dinnerDocRef);
        if (!dinnerSnapshot.exists()) {
            throw new Error("Dinner not found");
        }
        const dinnerToUpdate = dinnerSnapshot.data() as Dinner;

        const userAvatar = `https://api.dicebear.com/7.x/micah/svg?seed=${user.avatarSeed || user.email}`;
        const attendeeData = { uid: user.uid, name: user.name, username: user.username, avatar: userAvatar };

        await updateDoc(dinnerDocRef, {
            filledSlots: Math.max(0, (dinnerToUpdate.filledSlots || dinnerToUpdate.bookedBy.length) - 1),
            bookedBy: arrayRemove(userId),
            attendees: arrayRemove(attendeeData)
        });
    } catch(error) {
        console.error("Error cancelling booking: ", error);
        throw error;
    }
  }
  
  const markNotificationsAsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach(notif => {
        if (!notif.read) {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { read: true });
        }
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read: ", error);
    }
  }

  const deleteAllNotifications = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    const notifsToDelete = notifications.map(n => doc(db, 'notifications', n.id));
    notifsToDelete.forEach(notifRef => batch.delete(notifRef));
    try {
        await batch.commit();
        toast({
            title: "Notifications Cleared",
            description: "All your booking notifications have been deleted."
        })
    } catch(e) {
        console.error("Error deleting all notifications:", e);
        toast({
            title: "Error",
            description: "Could not delete all notifications. Please try again.",
            variant: "destructive"
        })
    }
  }


  const getComments = (dinnerId: string, callback: (comments: Comment[]) => void) => {
    const commentsColRef = collection(db, "dinners", dinnerId, "comments");
    const q = query(commentsColRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      callback(comments);
    });

    return unsubscribe;
  }

  const addComment = async (dinnerId: string, text: string) => {
    if (!user) {
        throw new Error("User not authenticated");
    }
    const fallbackUsername = user.email?.split('@')[0] || "anon";

    const commentsColRef = collection(db, "dinners", dinnerId, "comments");
    await addDoc(commentsColRef, {
      text: text,
      userId: user.uid,
      userName: user.username || fallbackUsername,
      userImage: `https://api.dicebear.com/7.x/micah/svg?seed=${user.avatarSeed || user.email}`,
      createdAt: serverTimestamp(),
      readBy: [user.uid], // User who sent it has read it
    });
  }

  const deleteComment = async (dinnerId: string, commentId: string, isHost: boolean) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    const commentRef = doc(db, "dinners", dinnerId, "comments", commentId);
    try {
      const message = isHost
        ? "[This message was deleted by the host]"
        : "[This message was deleted]";
      await updateDoc(commentRef, {
        text: message,
      });
    } catch (error) {
      console.error("Error deleting comment: ", error);
      throw error;
    }
  };

  const markCommentsAsRead = useCallback(async (dinnerId: string, comments: Comment[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    let markedAsRead = false;
    comments.forEach(comment => {
        if (comment.readBy && !comment.readBy.includes(user.uid)) {
            const commentRef = doc(db, "dinners", dinnerId, "comments", comment.id);
            batch.update(commentRef, {
                readBy: arrayUnion(user.uid)
            });
            markedAsRead = true;
        }
    });
    
    if (markedAsRead) {
        setReadDinnerIds(prev => {
            const newHistory = [dinnerId, ...prev.filter(id => id !== dinnerId)];
            return newHistory.slice(0, 5); // Keep only the last 5
        });
        await batch.commit();
    }
  }, [user]);

  const hasUnreadMessages = useCallback((dinnerId: string, comments: Comment[]) => {
      if (!user) return false;
      return comments.some(comment => comment.readBy && !comment.readBy.includes(user.uid));
  }, [user]);


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

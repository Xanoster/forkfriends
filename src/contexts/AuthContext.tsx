
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc as deleteFirestoreDoc } from "firebase/firestore"; 
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (uid: string): Promise<User | null> => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      const firebaseUser = auth.currentUser;
      if (userDoc.exists()) {
        return { uid, email: userDoc.data().email || firebaseUser?.email || null, ...userDoc.data() } as User;
      } else if (firebaseUser) {
         const defaultUsername = firebaseUser.email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'newuser';
         const newUserProfile = {
           name: firebaseUser.displayName || "New User",
           username: defaultUsername,
           email: firebaseUser.email,
           avatarSeed: firebaseUser.email,
         };
         await setDoc(userDocRef, newUserProfile);
         return { uid, ...newUserProfile } as User;
      }
      return null;
    } catch (error) {
      console.error("Could not fetch user profile:", error);
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
          return { uid: firebaseUser.uid, email: firebaseUser.email };
      }
      return null;
    }
}, []);

  const fetchPublicProfile = useCallback(async (username: string): Promise<User | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("No user found with that username.");
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }, []);

  const fetchUserReviews = useCallback(async (uid: string): Promise<Review[]> => {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("revieweeId", "==", uid));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser.uid);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      if (window.location.pathname.startsWith('/signin')) {
        router.push('/');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: 'Sign In Failed',
        description: 'Incorrect email or password. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;

        const defaultUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'newuser';
        const newUser: Partial<User> = {
            name: name,
            username: defaultUsername,
            email: email,
            avatarSeed: email,
        };
        
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        
        router.push('/');
    } catch (error: any) {
        console.error("Signup error:", error);
        throw new Error(error.message || 'An unknown error occurred during sign up.');
    }
  }

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/signin');
    } catch (error: any) {
       toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        try {
            await updateDoc(userDocRef, updatedFields);
            const updatedProfile = await fetchUserProfile(user.uid);
            setUser(updatedProfile);
        } catch (error) {
            console.error("Error updating user profile:", error);
            toast({
                title: "Update Failed",
                description: "Could not save your profile changes.",
                variant: "destructive"
            });
            throw error;
        }
    }
  };

  const deleteAccount = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        try {
            // Delete user's Firestore document first
            const userDocRef = doc(db, "users", firebaseUser.uid);
            await deleteFirestoreDoc(userDocRef);

            // Then delete the user from Firebase Auth
            await deleteUser(firebaseUser);
            
            setUser(null); // Clear user state
            // The onAuthStateChanged listener will handle redirecting
        } catch (error: any) {
            console.error("Error deleting account:", error);
            // This error can happen if the user needs to re-authenticate.
            if (error.code === 'auth/requires-recent-login') {
                throw new Error("This is a sensitive operation. Please log out and log back in before deleting your account.");
            }
            throw new Error(error.message || "An unknown error occurred while deleting the account.");
        }
    } else {
        throw new Error("No user is currently signed in.");
    }
  }


  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, fetchUserProfile, fetchPublicProfile, fetchUserReviews, deleteAccount, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

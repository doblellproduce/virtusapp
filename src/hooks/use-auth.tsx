
"use client";

import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    type User,
    signInWithEmailAndPassword,
    type UserCredential,
    type Auth,
    getAuth
} from 'firebase/auth';
import { doc, onSnapshot, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { UserProfile, UserRole } from '@/lib/types';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

// This is the public Firebase config for the client-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Define the shape of the context
interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

interface AuthContextType extends FirebaseServices {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to initialize Firebase on the client-side
const getClientFirebaseServices = (): FirebaseServices => {
    if (typeof window === "undefined") {
      return { app: null, auth: null, db: null, storage: null };
    }
    
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app),
    };
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const firebaseServices = useMemo(getClientFirebaseServices, []);

  useEffect(() => {
    if (!firebaseServices.auth || !firebaseServices.db) {
        setLoading(false); 
        return;
    }

    const { auth, db } = firebaseServices;
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = { id: docSnap.id, ...docSnap.data() } as UserProfile;
                setUserProfile(profileData);
                setRole(profileData.role);
            } else {
                // User is authenticated but has no profile document
                setUserProfile(null);
                setRole(null);
            }
             setLoading(false);
        }, (error) => {
           console.error("Error in user profile snapshot listener:", error);
           setUserProfile(null);
           setRole(null);
           setLoading(false);
        });
        return () => unsubProfile();
      } else {
        // No user is signed in
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseServices]);

  const handleLogin = (email: string, pass: string) => {
    if (!firebaseServices.auth) throw new Error("Firebase Auth is not initialized.");
    return signInWithEmailAndPassword(firebaseServices.auth, email, pass);
  };

  const handleLogout = () => {
    if (!firebaseServices.auth) throw new Error("Firebase Auth is not initialized.");
    return signOut(firebaseServices.auth);
  };

  const handlePasswordReset = (email: string) => {
    if (!firebaseServices.auth) throw new Error("Firebase Auth is not initialized.");
    return sendPasswordResetEmail(firebaseServices.auth, email);
  };

  const value: AuthContextType = {
    loading,
    user,
    userProfile,
    role,
    login: handleLogin,
    logout: handleLogout,
    sendPasswordReset: handlePasswordReset,
    ...firebaseServices,
  };

  return (
    <AuthContext.Provider value={value}>
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

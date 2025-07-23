
"use client";

import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    type User,
    getAuth
} from 'firebase/auth';
import { doc, onSnapshot, getFirestore, type Firestore, addDoc, collection, getDoc } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { UserProfile, UserRole, ActivityLog } from '@/lib/types';
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
  auth: ReturnType<typeof getAuth> | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

type LogActivity = (
    action: ActivityLog['action'], 
    entityType: ActivityLog['entityType'], 
    entityId: ActivityLog['entityId'], 
    details: ActivityLog['details']
) => Promise<void>;

interface AuthContextType extends FirebaseServices {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logActivity: LogActivity;
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
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices>({ app: null, auth: null, db: null, storage: null });


  useEffect(() => {
    // Initialize firebase services on the client
    const services = getClientFirebaseServices();
    setFirebaseServices(services);
  }, []);
  
  const logActivity: LogActivity = useCallback(async (action, entityType, entityId, details) => {
        if (!firebaseServices.db || !userProfile) return;
        try {
            const logEntry: Omit<ActivityLog, 'id'> = {
                timestamp: new Date().toISOString(),
                user: userProfile.name || userProfile.email,
                action,
                entityType,
                entityId,
                details,
                tenantId: userProfile.tenantId,
            };
            await addDoc(collection(firebaseServices.db, 'activityLogs'), logEntry);
        } catch (error) {
            console.error("Error logging activity: ", error);
        }
    }, [firebaseServices.db, userProfile]);


  useEffect(() => {
    if (!firebaseServices.auth || !firebaseServices.db) {
      // If services are not yet initialized, keep loading.
      // The previous useEffect will trigger a re-render once they are.
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(firebaseServices.auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Now fetch profile
        const userDocRef = doc(firebaseServices.db as Firestore, 'users', authUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = { id: docSnap.id, ...docSnap.data() } as UserProfile;
                setUserProfile(profileData);
                setRole(profileData.role);
            } else {
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
        return () => unsubscribeProfile();

      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [firebaseServices]);


  const handleLogin = async (email: string, pass: string) => {
    // The actual sign-in logic is now handled by the form, which calls the API route.
    // This function can remain to fulfill the context type, but the form should be the source of truth.
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || "Server-side authentication failed.");
    }
    // Auth state will be updated by onAuthStateChanged listener, triggered by the cookie being set.
  };

  const handleLogout = async () => {
    if (!firebaseServices.auth) throw new Error("Firebase Auth is not initialized.");
    await signOut(firebaseServices.auth);
    // Also clear the server-side session
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
    setUserProfile(null);
    setRole(null);
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
    logActivity,
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

    
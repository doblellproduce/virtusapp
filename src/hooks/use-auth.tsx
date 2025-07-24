
"use client";

import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    signInWithEmailAndPassword,
    type User,
} from 'firebase/auth';
import { doc, onSnapshot, addDoc, collection } from 'firebase/firestore';
import type { UserProfile, UserRole, ActivityLog } from '@/lib/types';
import { auth, db, storage } from '@/lib/firebase/client'; 
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from "firebase/storage";
import type { Auth } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  db: Firestore;
  storage: FirebaseStorage;
  auth: Auth;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logActivity: (action: ActivityLog['action'], entityType: ActivityLog['entityType'], entityId: string, details: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const postAuthAction = async (user: User) => {
    const idToken = await user.getIdToken(true); // Force refresh the token
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server-side session creation failed.' }));
        throw new Error(errorData.error);
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        setUser(authUser);
        // Create server-side session cookie
        await postAuthAction(authUser);

        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
              const profileData = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
              setUserProfile(profileData);
              const newRole = profileData.role || 'Client';
              setRole(newRole);
               if (newRole !== 'Client') {
                  router.push('/dashboard');
              } else {
                  router.push('/client-dashboard');
              }
            } else {
              setUserProfile(null);
              setRole('Client');
              router.push('/client-dashboard');
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setLoading(false)
        });
         return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (email: string, pass: string) => {
    // Just sign in. The onAuthStateChanged listener will handle the rest.
    await signInWithEmailAndPassword(auth, email, pass);
  };
  
  const handleLogout = async () => {
    if (user && userProfile) {
        await logActivity('Logout', 'Auth', user.uid, `User ${userProfile.name} logged out.`);
    }
    await signOut(auth);
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  const handlePasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };
  
  const logActivity = useCallback(async (action: ActivityLog['action'], entityType: ActivityLog['entityType'], entityId: string, details: string) => {
    if (!db) return;
    try {
        await addDoc(collection(db, 'activityLogs'), {
            timestamp: new Date().toISOString(),
            user: userProfile?.name || user?.email || 'System',
            action,
            entityType,
            entityId,
            details,
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
  }, [db, user, userProfile]);

  const value: AuthContextType = {
    loading,
    user,
    userProfile,
    role,
    login: handleLogin,
    logout: handleLogout,
    sendPasswordReset: handlePasswordReset,
    logActivity,
    db,
    storage,
    auth,
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

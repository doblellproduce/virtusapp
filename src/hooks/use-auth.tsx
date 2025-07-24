
"use client";

import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    type User,
} from 'firebase/auth';
import { doc, onSnapshot, addDoc, collection, setDoc, getDoc } from 'firebase/firestore';
import type { UserProfile, UserRole, ActivityLog } from '@/lib/types';
import { auth, db, storage } from '@/lib/firebase/admin'; 
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from "firebase/storage";
import type { Auth } from 'firebase/auth';

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        
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
  }, []);

  const postAuthAction = async (userCredential: any) => {
    const idToken = await userCredential.user.getIdToken();
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Server-side session creation failed.");
    }
  }

  const handleLogin = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    await postAuthAction(userCredential);
  };

  const handleLogout = async () => {
    if (user && userProfile) {
        await logActivity('Logout', 'Auth', user.uid, `User ${userProfile.name} logged out.`);
    }
    await signOut(auth);
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
    setUserProfile(null);
    setRole(null);
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

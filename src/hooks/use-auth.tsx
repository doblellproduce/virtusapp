
"use client";

import React, { useState, useEffect, useContext, createContext, useCallback, Suspense } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    signInWithEmailAndPassword,
    type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile, UserRole, ActivityLog } from '@/lib/types';
import { auth, db, storage } from '@/lib/firebase/client'; 
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from "firebase/storage";
import type { Auth } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Define a standalone logActivity function that can be called from anywhere
export const logActivity = async (action: ActivityLog['action'], entityType: ActivityLog['entityType'], entityId: string, details: string) => {
    try {
        // This function will now send a request to our new API route
        // instead of trying to write to Firestore from the client.
        await fetch('/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, entityType, entityId, details }),
        });
    } catch (error) {
        console.error("Error logging activity via API:", error);
    }
};


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

const AuthProviderContent = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        try {
            await postAuthAction(authUser);
            setUser(authUser); 

            const userDocRef = doc(db, 'users', authUser.uid);
            const unsubscribeSnapshot = onSnapshot(userDocRef, (userDocSnap) => {
                if (userDocSnap.exists()) {
                  const profileData = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
                  setUserProfile(profileData);
                  setRole(profileData.role || 'Client');
                } else {
                  // This can happen if the user exists in Auth but not in Firestore yet.
                  // e.g., a new client signing up.
                  setUserProfile(null); 
                  setRole('Client');
                }
                setLoading(false);
            }, (error) => {
                console.error("Firestore snapshot error on user doc:", error);
                // Don't sign the user out, but clear profile state
                setUserProfile(null);
                setRole(null);
                setLoading(false);
            });
             return () => unsubscribeSnapshot();
        } catch (error) {
            console.error("Auth action failed, logging out:", error);
            await signOut(auth);
            // State will be cleared by the onAuthStateChanged listener firing again with `null`
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
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
  
  return (
    <AuthContext.Provider value={{
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProviderContent>{children}</AuthProviderContent>
    </Suspense>
  )
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

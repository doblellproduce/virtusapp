
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from '@/components/login-form';

const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-primary">
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.4L19.6 8.2V15.8L12 19.6L4.4 15.8V8.2L12 4.4ZM12 12.5L7 9.8V14.2L12 16.9L17 14.2V9.8L12 12.5Z" fill="currentColor"/>
  </svg>
);

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is determined and a user exists, redirect.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);


  // Show spinner ONLY while the initial auth state is being determined.
  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // If not loading and no user, it's safe to show the login form.
  // The form itself will handle the redirection after a successful login.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <Logo />
            <CardTitle className="text-2xl font-bold tracking-tight mt-4">Virtus Admin Panel</CardTitle>
            <CardDescription>Sign in to manage your vehicle rentals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

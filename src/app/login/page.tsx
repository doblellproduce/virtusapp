
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from '@/components/login-form';

const Logo = () => (
    <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="text-5xl font-bold tracking-wider text-primary">VIRTUS</span>
        <span className="text-lg tracking-widest text-muted-foreground">CAR RENTAL</span>
    </div>
);


export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user object is present and authentication is not loading.
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);


  // Show a spinner ONLY while the initial auth state is being determined.
  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // If not loading and no user exists, it's safe to show the login form.
  // The LoginForm itself will now handle the redirection after a successful login.
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <Logo />
              <CardTitle className="text-2xl font-bold tracking-tight">Admin Panel</CardTitle>
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

  // Fallback for the brief moment between user being set and redirect firing
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

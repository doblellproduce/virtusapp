
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Do nothing while auth state is loading to prevent premature redirects
      return;
    }

    if (user) {
      if (role === 'Client') {
          router.replace('/client-dashboard');
      } else {
          // Redirect admins, supervisors, etc. to the main dashboard
          router.replace('/dashboard');
      }
    } else {
      // If no user and not loading, redirect to login
      router.replace('/login');
    }
  }, [user, loading, role, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

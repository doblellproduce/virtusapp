
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This layout is specifically for client-facing routes.
 * It ensures that only users with the 'Client' role can access this part of the application.
 * If a staff member (e.g., Admin, Supervisor) is logged in, they are redirected to the admin dashboard.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // If the authentication state is still loading, do nothing yet.
    if (loading) return;

    // If there is no authenticated user, redirect to the main login page.
    if (!user) {
      router.replace('/login');
    }
    
    // If an authenticated user is not a 'Client', redirect them to the admin dashboard.
    // This prevents staff members from accessing client-only pages.
    if (user && role && role !== 'Client') {
        router.replace('/dashboard');
    }
  }, [user, loading, role, router]);

  // While loading or if the user is not a 'Client', show a loading spinner.
  // This prevents content from flashing before the redirection or role check is complete.
  if (loading || !user || role !== 'Client') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is authenticated and has the 'Client' role, render the page content.
  return <main>{children}</main>;
}

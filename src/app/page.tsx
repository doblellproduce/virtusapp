
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only make a redirection decision once the loading state is finished.
    if (!loading) {
      if (user) {
        // If there's a user, redirect to the appropriate dashboard based on their role.
        if (role === 'Client') {
            router.replace('/client-dashboard');
        } else {
            router.replace('/dashboard');
        }
      } else {
        // If there is no user, the only option is to go to the login page.
        router.replace('/login');
      }
    }
    // The dependency on 'loading' is crucial. The effect will re-run
    // when 'loading' changes from true to false.
  }, [user, loading, role, router]);

  // While 'loading' is true, we show a spinner.
  // This prevents anything else from being displayed or a premature redirect attempt.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

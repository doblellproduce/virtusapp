
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Don't redirect until the auth state is definitive
    if (loading) {
      return;
    }

    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show a loading indicator while the auth state is being determined
  // to prevent a flash of content or a premature redirect.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando aplicación...</p>
        </div>
    </div>
  );
}

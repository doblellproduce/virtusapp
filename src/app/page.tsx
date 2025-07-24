
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // No redirigir hasta que se haya determinado el estado de autenticación
    if (!loading) {
      if (user) {
        // Si el usuario está autenticado, redirigir al dashboard
        router.replace('/dashboard');
      } else {
        // Si el usuario no está autenticado, redirigir a la página de login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Muestra un indicador de carga mientras se determina el estado de autenticación
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando aplicación...</p>
        </div>
    </div>
  );
}

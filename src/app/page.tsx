
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo tomar una decisión de redirección cuando el estado de carga haya terminado.
    if (!loading) {
      if (user) {
        // Si hay un usuario, redirigir al dashboard correspondiente a su rol.
        if (role === 'Client') {
            router.replace('/client-dashboard');
        } else {
            router.replace('/dashboard');
        }
      } else {
        // Si no hay usuario, la única opción es ir a la página de login.
        router.replace('/login');
      }
    }
    // La dependencia en 'loading' es crucial. El efecto se volverá a ejecutar
    // cuando 'loading' cambie de true a false.
  }, [user, loading, role, router]);

  // Mientras 'loading' sea true, mostramos un spinner.
  // Esto previene que se muestre cualquier otra cosa o que se intente una redirección prematura.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

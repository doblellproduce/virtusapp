
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
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la autenticación no está cargando y ya hay un usuario, redirigir.
    // Esto previene redirecciones prematuras.
    if (!loading && user) {
        // Redirigir al dashboard principal para todos los roles de personal.
        // El middleware y el layout se encargarán de las vistas específicas de cada rol.
        router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Muestra un spinner de carga global mientras se verifica el estado de autenticación.
  // Esto es crucial para prevenir que se muestre brevemente el login a un usuario ya autenticado.
  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // Si la carga ha terminado y NO hay usuario, es seguro mostrar el formulario de login.
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <Logo />
            </CardHeader>
            <CardContent className="space-y-4">
                 <CardHeader className="p-2 pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">Acceso de Personal</CardTitle>
                    <CardDescription className="text-center">
                        Inicia sesión para administrar el sistema.
                    </CardDescription>
                </CardHeader>
                <LoginForm />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Muestra un spinner como fallback mientras se efectúa la redirección del useEffect.
  // Este estado solo debería ser visible por un instante.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

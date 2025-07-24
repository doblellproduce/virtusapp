
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
    if (!loading && user) {
        // Si hay un usuario, sin importar el rol, lo llevamos al dashboard.
        // La lógica del middleware ya previene que roles no autorizados entren.
        router.replace('/dashboard');
    }
  }, [user, loading, role, router]);


  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // Si no hay usuario, siempre mostramos el formulario de login.
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

  // Fallback mientras se redirige.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

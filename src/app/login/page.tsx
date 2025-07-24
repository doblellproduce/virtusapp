

"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from '@/components/login-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RegisterForm from '@/components/register-form';

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
        if (role === 'Client') {
            router.replace('/client-dashboard');
        } else {
            router.replace('/dashboard');
        }
    }
  }, [user, loading, role, router]);


  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <Logo />
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <CardHeader className="p-2 pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight text-center">Bienvenido de Nuevo</CardTitle>
                        <CardDescription className="text-center">
                            Inicia sesión para acceder a tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <LoginForm />
                </TabsContent>
                <TabsContent value="register">
                    <CardHeader className="p-2 pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight text-center">Crear una Cuenta</CardTitle>
                        <CardDescription className="text-center">
                            Regístrate para reservar y gestionar tus alquileres.
                        </CardDescription>
                    </CardHeader>
                    <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

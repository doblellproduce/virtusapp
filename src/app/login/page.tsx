
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import LoginForm from '@/components/login-form';

const Logo = () => (
    <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="text-5xl font-bold tracking-wider text-primary">VIRTUS</span>
        <span className="text-lg tracking-widest text-muted-foreground">CAR RENTAL</span>
    </div>
);

export default function LoginPage() {
  // This page is now simplified. Its only job is to display the login form.
  // The root page layout (or a wrapper component) is responsible for handling
  // redirection if a user is already authenticated.
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


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
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <Logo />
            <CardTitle className="text-2xl font-bold tracking-tight">Acceso de Personal</CardTitle>
            <CardDescription>
                Inicia sesión para administrar el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
         <footer className="mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Virtus Car Rental S.R.L. | Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}

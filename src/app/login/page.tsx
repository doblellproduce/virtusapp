
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import LoginForm from '@/components/login-form';
import RegisterForm from '@/components/register-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Acceso Personal</TabsTrigger>
                <TabsTrigger value="register">Registro Cliente</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                 <CardHeader className="p-2 pb-4">
                  <CardTitle className="text-2xl font-bold tracking-tight text-center">Acceso de Personal</CardTitle>
                  <CardDescription className="text-center">
                      Inicia sesión para administrar el sistema.
                  </CardDescription>
                </CardHeader>
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                 <CardHeader className="p-2 pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">Crear una Cuenta</CardTitle>
                    <CardDescription className="text-center">
                        Regístrate para reservar vehículos.
                    </CardDescription>
                </CardHeader>
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
         <footer className="mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Virtus Car Rental S.R.L. | Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}

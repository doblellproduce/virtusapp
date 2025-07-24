
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Car, Fuel, Gauge, GitBranch, LogIn, Users } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video">
        <Image
          src={vehicle.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
          alt={`${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover"
          data-ai-hint={vehicle.dataAiHint}
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{vehicle.make} {vehicle.model}</CardTitle>
            <Badge variant="secondary">{vehicle.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>{vehicle.specs.seats} Asientos</span></div>
            <div className="flex items-center gap-2"><GitBranch className="h-4 w-4" /><span>{vehicle.specs.transmission}</span></div>
            <div className="flex items-center gap-2"><Gauge className="h-4 w-4" /><span>{vehicle.specs.engine}</span></div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
        <div>
            <span className="text-2xl font-bold">${vehicle.pricePerDay}</span>
            <span className="text-sm text-muted-foreground">/día</span>
        </div>
        <Button asChild>
          <Link href={`/vehiculo/${vehicle.id}`}>
            Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function HomePage() {
    const { db } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);
        const q = query(collection(db, 'vehicles'), where('status', '==', 'Available'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch vehicles: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);


    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                       <Car className="h-6 w-6"/>
                       <span>VIRTUS</span>
                    </Link>
                    <nav className="ml-auto flex items-center gap-4">
                        <Button variant="ghost" asChild>
                           <Link href="#fleet-section">Nuestra Flota</Link>
                        </Button>
                        <Button variant="ghost" asChild>
                           <Link href="#contact-section">Contacto</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" />
                                Acceso Admin
                            </Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow">
                <section className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
                        Tu Aventura Comienza Aquí
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                        Explora la República Dominicana con la comodidad y seguridad que solo Virtus Car Rental te puede ofrecer. Vehículos modernos a precios competitivos.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="#fleet-section">Ver Nuestra Flota</Link>
                    </Button>
                </section>

                <section id="fleet-section" className="py-16 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-8">Nuestra Flota</h2>
                        {loading ? (
                             <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                             </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {vehicles.map(vehicle => (
                                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                
                 <section id="contact-section" className="py-16">
                    <div className="container mx-auto px-4 text-center">
                         <h2 className="text-3xl font-bold text-center mb-4">¿Listo para Reservar?</h2>
                         <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                            Contáctanos hoy mismo para asegurar tu vehículo. Nuestro equipo está listo para asistirte.
                         </p>
                         <Button size="lg">Llamar Ahora: (809) 555-1234</Button>
                    </div>
                 </section>

            </main>

            <footer className="border-t">
                <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
                    © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}

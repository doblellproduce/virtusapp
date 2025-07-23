
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Car, Users, Gauge, GitBranch, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Vehicle } from '@/lib/types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Logo = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.4L19.6 8.2V15.8L12 19.6L4.4 15.8V8.2L12 4.4ZM12 12.5L7 9.8V14.2L12 16.9L17 14.2V9.8L12 12.5Z" fill="currentColor"/>
    </svg>
);

function VehicleCard({ vehicle, priority }: { vehicle: Vehicle; priority?: boolean }) {
  const imageUrl = vehicle.imageUrls && vehicle.imageUrls.length > 0 ? vehicle.imageUrls[0] : 'https://placehold.co/600x400.png';
  
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-0">
         <div className="relative aspect-video">
            <Image 
                src={imageUrl} 
                alt={`${vehicle.make} ${vehicle.model}`} 
                layout="fill"
                className="object-cover"
                data-ai-hint={vehicle.dataAiHint || `${vehicle.make} ${vehicle.model}`}
                priority={priority}
            />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow">
        <Badge variant="secondary" className="w-fit">{vehicle.category}</Badge>
        <CardTitle className="mt-2 text-xl font-bold">{vehicle.make} {vehicle.model}</CardTitle>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{vehicle.specs.seats} Asientos</span></div>
            <div className="flex items-center gap-1"><GitBranch className="h-4 w-4" /><span>{vehicle.specs.transmission}</span></div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
        <div>
            <span className="text-2xl font-bold">${vehicle.pricePerDay.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">/día</span>
        </div>
        <Button asChild>
            <Link href={`/vehiculo/${vehicle.id}`}>
                Reservar Ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function RootPage() {
    const { db } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);
        const q = query(collection(db, 'vehicles'), where('status', '==', 'Available'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching vehicles:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
       <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold text-foreground">Virtus Car Rental</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">
                Acceso Admin
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto py-12 px-4 flex-grow">
        <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">Tu Aventura Comienza Aquí</h1>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg">
                Explora nuestra flota de vehículos de alta calidad. Encuentra el coche perfecto para tu próximo viaje, ya sea de negocios o de placer.
            </p>
        </section>

        <section id="fleet-section" className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Nuestra Flota</h2>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle, index) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index === 0} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Car className="h-12 w-12 mx-auto mb-4" />
                    <p>No hay vehículos disponibles en este momento. Por favor, vuelva a intentarlo más tarde.</p>
                </div>
            )}
        </section>
      </main>
      
      <footer className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.
          </div>
      </footer>
    </div>
  );
}

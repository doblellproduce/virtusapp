
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Car, User, Loader2, Gauge, Users, GitBranch } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

const VehicleCard = ({ vehicle, priority }: { vehicle: Vehicle, priority: boolean }) => (
    <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
        <Link href={`/vehiculo/${vehicle.id}`}>
            <div className="relative aspect-video">
                <Image
                    src={vehicle.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    data-ai-hint={vehicle.dataAiHint}
                />
            </div>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="secondary">{vehicle.category}</Badge>
                        <CardTitle className="mt-2">{vehicle.make} {vehicle.model}</CardTitle>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${vehicle.pricePerDay}</p>
                        <p className="text-sm text-muted-foreground">/día</p>
                    </div>
                </div>
                 <CardDescription className="flex items-center gap-4 text-xs pt-2">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {vehicle.specs.seats}</span>
                    <span className="flex items-center gap-1"><Gauge className="h-4 w-4"/> {vehicle.specs.engine}</span>
                    <span className="flex items-center gap-1"><GitBranch className="h-4 w-4"/> {vehicle.specs.transmission}</span>
                </CardDescription>
            </CardHeader>
        </Link>
    </Card>
);

export default function HomePage() {
  const { db, user } = useAuth();
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
        console.error("Error fetching vehicles:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
             {user ? (
                 <Button asChild variant="secondary">
                     <Link href="/dashboard">
                        <User className="mr-2"/> Panel Admin
                     </Link>
                 </Button>
             ) : (
                <Button variant="ghost" asChild>
                    <Link href="/login">Acceso Admin</Link>
                </Button>
             )}
            <Button asChild>
              <a href="#fleet-section">
                <Car className="mr-2 h-4 w-4" />
                Ver Flota
              </a>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow">
        <section className="container mx-auto py-12 px-4 text-center">
             <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">Tu Aventura Comienza Aquí</h1>
             <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Explora la República Dominicana con la comodidad y seguridad que solo Virtus Car Rental te puede ofrecer. Vehículos modernos, precios competitivos y servicio de primera.
             </p>
        </section>

        <section id="fleet-section" className="container mx-auto py-12 px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Nuestra Flota Disponible</h2>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {vehicles.map((vehicle, index) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3} />
                   ))}
                </div>
            )}
        </section>
      </main>

      <footer className="border-t bg-muted/50">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.
          </div>
      </footer>
    </div>
  );
}

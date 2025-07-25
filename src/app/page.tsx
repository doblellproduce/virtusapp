

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Gauge, GitBranch, Loader2, LogIn, Users } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

function VehicleCard({ vehicle, priority }: { vehicle: Vehicle, priority: boolean }) {
    return (
        <Card className="overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Link href={`/vehiculo/${vehicle.id}`} className="block">
                <div className="relative aspect-video">
                    <Image
                        src={vehicle.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        data-ai-hint={vehicle.dataAiHint}
                        priority={priority}
                    />
                </div>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                            <h3 className="text-lg font-bold">{vehicle.make} {vehicle.model}</h3>
                        </div>
                         <Badge variant={vehicle.status === 'Available' ? 'default' : 'secondary'} className={vehicle.status === 'Available' ? 'bg-green-600' : ''}>
                            {vehicle.status}
                        </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{vehicle.specs.seats}</span></div>
                        <div className="flex items-center gap-1"><Gauge className="h-4 w-4" /><span>{vehicle.specs.engine}</span></div>
                        <div className="flex items-center gap-1"><GitBranch className="h-4 w-4" /><span>{vehicle.specs.transmission}</span></div>
                    </div>
                    <div className="mt-4 text-right">
                        <span className="text-xl font-bold text-primary">${vehicle.pricePerDay.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">/día</span>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}


export default function HomePage() {
  const { db } = useAuth();
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!db) return;

    const fetchVehicles = async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'vehicles'), where('status', 'in', ['Available', 'Rented']));
            const querySnapshot = await getDocs(q);
            const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        } catch (err) {
            console.error("Firestore Error:", err);
            setError("No se pudo cargar la flota. Es posible que no tengamos permisos para acceder a los datos.");
        } finally {
            setLoading(false);
        }
    };
    
    fetchVehicles();
  }, [db]);


  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4"/>
                Acceso Admin
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section id="fleet-section" className="container mx-auto py-12 px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Nuestra Flota</h2>
            {loading ? (
                <div className="flex justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : error ? (
                 <Card className="bg-destructive/10 border-destructive text-destructive-foreground p-4 text-center">
                    <p className="font-semibold">Error al Cargar</p>
                    <p>{error}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle, index) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index === 0}/>
                    ))}
                </div>
            )}
        </section>
      </main>

      <footer id="contact-section" className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados...
          </div>
      </footer>
    </div>
  );
}

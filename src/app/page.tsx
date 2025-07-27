

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Gauge, GitBranch, LogIn, Users } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { Suspense } from 'react';
import { getVehiclesForHomePage } from '@/lib/server-actions/vehicle-actions';


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

async function FleetList() {
    // This function now safely returns either vehicle data or an error string.
    const { vehicles, error } = await getVehiclesForHomePage();

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive text-destructive-foreground p-4 text-center col-span-1 md:col-span-2 lg:col-span-3">
                <p className="font-semibold">Error al Cargar la Flota</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-2">Por favor, contacte al administrador del sistema.</p>
            </Card>
        );
    }
    
    if (vehicles.length === 0) {
       return <p className="text-center text-muted-foreground col-span-1 md:col-span-2 lg:col-span-3">No hay vehículos disponibles en este momento.</p>;
    }

    return (
        <>
            {vehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3}/>
            ))}
        </>
    );
}


export default function HomePage() {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:col-span-3 gap-6">
                <Suspense fallback={
                    <>
                        {[...Array(3)].map((_, i) => (
                             <Card key={i} className="animate-pulse">
                                <div className="relative aspect-video bg-muted rounded-t-lg"></div>
                                <CardContent className="p-4 space-y-3">
                                    <div className="h-4 bg-muted rounded w-1/4"></div>
                                    <div className="h-6 bg-muted rounded w-3/4"></div>
                                    <div className="flex justify-between border-t pt-3 mt-4">
                                        <div className="h-4 bg-muted rounded w-1/6"></div>
                                        <div className="h-4 bg-muted rounded w-1/6"></div>
                                        <div className="h-4 bg-muted rounded w-1/6"></div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <div className="h-8 bg-muted rounded w-1/3"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                }>
                    <FleetList />
                </Suspense>
            </div>
        </section>
      </main>

      <footer id="contact-section" className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.
          </div>
      </footer>
    </div>
  );
}

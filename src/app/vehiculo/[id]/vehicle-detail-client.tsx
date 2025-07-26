'use client'; // This directive marks the component as a Client Component

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Gauge, GitBranch, Car } from 'lucide-react';
import VehicleBookingForm from './vehicle-booking-form';
import type { Vehicle } from '@/lib/types';
import { getVehicleData } from '@/lib/server-actions';
import { notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports with ssr: false are allowed because this is a Client Component.
const Carousel = dynamic(() => import('@/components/ui/carousel').then(m => m.Carousel), { ssr: false });
const CarouselContent = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselContent), { ssr: false });
const CarouselItem = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselItem), { ssr: false });
const CarouselNext = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselNext), { ssr: false });
const CarouselPrevious = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselPrevious), { ssr: false });

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

// This is now a standard Client Component that receives data via props.
export default function VehicleDetailClient({ vehicleId }: { vehicleId: string }) {
    const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchVehicle = async () => {
            setLoading(true);
            const data = await getVehicleData(vehicleId);
            if (!data) {
                toast({
                    variant: 'destructive',
                    title: 'Vehículo no encontrado',
                    description: 'El vehículo que buscas no existe o no está disponible.',
                });
                // In a real app, you might redirect here using `useRouter`
                // For now, we just show a loading state indefinitely or an error message.
            }
            setVehicle(data);
            setLoading(false);
        };
        fetchVehicle();
    }, [vehicleId, toast]);
    
    if (loading) {
       return (
        <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
             <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center px-4">
                  <Link href="/" className="flex items-center gap-2">
                    <Logo />
                  </Link>
                   <nav className="ml-auto flex items-center gap-2 sm:gap-4">
                     <Skeleton className="h-9 w-24" />
                     <Skeleton className="h-9 w-24" />
                  </nav>
                </div>
            </header>
             <main className="container mx-auto py-12 px-4 flex-grow">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    <div>
                        <Skeleton className="w-full aspect-video rounded-lg" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-24 rounded-md" />
                        <Skeleton className="h-12 w-3/4 rounded-md" />
                        <div className="flex items-center gap-6">
                            <Skeleton className="h-6 w-20 rounded-md" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                        </div>
                        <Skeleton className="w-full h-96 rounded-lg" />
                    </div>
                </div>
            </main>
        </div>
       )
    }

    if (!vehicle) {
        // This case is handled by the useEffect toast, but as a fallback:
        return (
             <div className="flex flex-col items-center justify-center h-screen text-center">
                <h1 className="text-4xl font-bold text-destructive">Vehículo no encontrado</h1>
                <p className="mt-4 text-muted-foreground">Lo sentimos, no pudimos encontrar los detalles para este vehículo.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Volver a la página principal</Link>
                </Button>
            </div>
        )
    }
    
    return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
       <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
            <Button asChild>
              <Link href="/#fleet-section">
                <Car className="mr-2 h-4 w-4" />
                Ver Flota
              </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/login">Acceso Admin</Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto py-12 px-4 flex-grow">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div>
                 <Carousel className="w-full">
                    <CarouselContent>
                        {vehicle.imageUrls && vehicle.imageUrls.length > 0 ? (
                           vehicle.imageUrls.map((url, index) => (
                             <CarouselItem key={index}>
                                <Card className="overflow-hidden border">
                                    <Image 
                                        src={url.replace('600x400', '800x600')}
                                        alt={`${vehicle.make} ${vehicle.model} image ${index + 1}`}
                                        width={800}
                                        height={600}
                                        className="object-cover w-full aspect-video"
                                        data-ai-hint={vehicle.dataAiHint}
                                        priority={index === 0}
                                    />
                                </Card>
                            </CarouselItem>
                           ))
                        ) : (
                             <CarouselItem>
                                 <Card className="overflow-hidden border">
                                    <Image 
                                        src={'https://placehold.co/800x600.png'}
                                        alt={`${vehicle.make} ${vehicle.model}`}
                                        width={800}
                                        height={600}
                                        className="object-cover w-full aspect-video"
                                        data-ai-hint="placeholder"
                                    />
                                </Card>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                    <CarouselPrevious className="ml-14" />
                    <CarouselNext className="mr-14"/>
                </Carousel>
            </div>
            <div>
                <Badge variant="secondary">{vehicle.category}</Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">{vehicle.make} {vehicle.model}</h1>
                <div className="mt-4 flex items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2"><Users className="h-5 w-5" /><span>{vehicle.specs.seats} Asientos</span></div>
                    <div className="flex items-center gap-2"><Gauge className="h-5 w-5" /><span>{vehicle.specs.engine}</span></div>
                    <div className="flex items-center gap-2"><GitBranch className="h-5 w-5" /><span>{vehicle.specs.transmission}</span></div>
                </div>

                <VehicleBookingForm vehicle={vehicle} />
            </div>
        </div>
      </main>
      
      <footer id="contact-section" className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. All Rights Reserved.
          </div>
      </footer>
      
    </div>
  );
}

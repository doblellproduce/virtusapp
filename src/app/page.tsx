
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Car, Users, Gauge, GitBranch, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Vehicle } from '@/lib/types';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
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
                fill
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
        if (!db) {
            setLoading(false); 
            return;
        }
        
        setLoading(true);
        const q = query(collection(db, 'vehicles'), orderBy('make'));
        
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
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
             <Button variant="ghost" asChild>
                <Link href="#contact-section">
                    Contacto
                </Link>
            </Button>
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
      
      <footer id="contact-section" className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-8 px-4 text-center">
             <div className="grid md:grid-cols-3 gap-8 text-sm text-muted-foreground">
                <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground mb-2">VIRTUS CAR RENTAL</h3>
                    <p>Ofrecemos una experiencia de alquiler de vehículos confiable y de alta calidad, con una flota moderna para satisfacer todas sus necesidades de viaje en la República Dominicana.</p>
                </div>
                 <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground mb-2">Contacto</h3>
                    <div className="flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4 text-primary"/>
                        <p>Ruta 66, Salida del aeropuerto Las Americas, La Caleta, R.D.</p>
                    </div>
                     <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-primary"/>
                        <p>Tel: 809-549-0144 | WhatsApp: 809-357-6291</p>
                    </div>
                     <div className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4 text-primary"/>
                        <p>virtuscr01@gmail.com</p>
                    </div>
                </div>
                 <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground mb-2">Horarios</h3>
                    <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                    <p>Sábados: 9:00 AM - 1:00 PM</p>
                    <p>Domingos: Cerrado</p>
                </div>
            </div>
            <div className="border-t mt-8 pt-6 text-xs text-muted-foreground">
                © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.
            </div>
          </div>
      </footer>
    </div>
  );
}

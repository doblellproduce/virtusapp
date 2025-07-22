
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Car, User, Globe, Loader2, Info } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from '@/hooks/use-auth';


const translations = {
  es: {
    adminLogin: "Acceso Admin",
    bookNow: "Reservar Ahora",
    heroTitle: "Encuentra Tu Vehículo Ideal",
    heroSubtitle: "Explora nuestra diversa flota de vehículos de calidad para cualquier ocasión. Simple, transparente y listo para la carretera.",
    fleetTitle: "Nuestra Flota Disponible",
    viewDetails: "Ver Detalles",
    day: "/día",
    category: "Categoría",
    loadingFleet: "Cargando nuestra flota...",
    noVehicles: "No hay vehículos disponibles en este momento. Por favor, inténtelo de nuevo más tarde.",
    dbError: "No se pudo cargar la flota. Verifique las reglas de seguridad de Firestore.",
  },
  en: {
    adminLogin: "Admin Login",
    bookNow: "Book Now",
    heroTitle: "Find Your Ideal Vehicle",
    heroSubtitle: "Explore our diverse fleet of quality vehicles for any occasion. Simple, transparent, and ready for the road.",
    fleetTitle: "Our Available Fleet",
    viewDetails: "View Details",
    day: "/day",
    category: "Category",
    loadingFleet: "Loading our fleet...",
    noVehicles: "No vehicles available at the moment. Please check back later.",
    dbError: "Could not load the fleet. Please check Firestore security rules.",
  }
};

const Logo = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.4L19.6 8.2V15.8L12 19.6L4.4 15.8V8.2L12 4.4ZM12 12.5L7 9.8V14.2L12 16.9L17 14.2V9.8L12 12.5Z" fill="currentColor"/>
    </svg>
);


export default function CustomerHomePage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dbError, setDbError] = React.useState(false);
  const [lang, setLang] = React.useState<'es' | 'en'>('es');
  const t = translations[lang];
  const fleetSectionRef = React.useRef<HTMLDivElement>(null);
  const { db } = useAuth();

  React.useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "vehicles"), where("status", "==", "Available"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        setVehicles(vehiclesData);
        setLoading(false);
        setDbError(false);
    }, (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
        setDbError(true);
    });

    return () => unsubscribe();
  }, [db]);

  const toggleLang = () => {
    setLang(prev => prev === 'es' ? 'en' : 'es');
  }
  
  const handleBookNowClick = () => {
    fleetSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderFleetContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t.loadingFleet}</p>
        </div>
      );
    }
    if (dbError || vehicles.length === 0) {
       return (
        <div className="flex flex-col items-center justify-center text-center h-48 border rounded-lg bg-muted/50">
          <Info className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground max-w-xs">{t.noVehicles}</p>
       </div>
      );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="overflow-hidden flex flex-col bg-card hover:border-primary/50 transition-all duration-300 border hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="p-0">
                <Image 
                  src={vehicle.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                  alt={`${vehicle.make} ${vehicle.model}`} 
                  width={600} 
                  height={400} 
                  className="object-cover w-full h-auto aspect-video"
                  data-ai-hint={vehicle.dataAiHint} 
                />
              </CardHeader>
              <CardContent className="pt-6 flex-grow">
                <Badge variant="secondary" className="mb-2">{vehicle.category}</Badge>
                <CardTitle className="text-xl font-bold">{vehicle.make} {vehicle.model}</CardTitle>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                <div>
                  <span className="text-2xl font-bold">${vehicle.pricePerDay}</span>
                  <span className="text-muted-foreground">{t.day}</span>
                </div>
                <Button asChild>
                  <Link href={`/vehiculo/${vehicle.id}`}>
                    {t.viewDetails} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold text-foreground">Virtus Car Rental</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
             <Button variant="ghost" asChild>
              <Link href="/login">
                <User className="mr-2" />
                {t.adminLogin}
              </Link>
            </Button>
            <Button onClick={handleBookNowClick}>
              <Car className="mr-2" />
              {t.bookNow}
            </Button>
             <Button variant="outline" size="icon" onClick={toggleLang} aria-label="Change language">
                <Globe className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto py-12 px-4">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">{t.heroTitle}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
        </section>

        <section ref={fleetSectionRef}>
          <h2 className="text-3xl font-bold mb-8">{t.fleetTitle}</h2>
          {renderFleetContent()}
        </section>
      </main>

       <footer className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. All Rights Reserved.
          </div>
      </footer>
    </div>
  );
}


'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ShieldCheck, Users, Gauge, GitBranch, User, Car, FileSignature, Globe, Loader2, LogIn, UserPlus } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays, format, differenceInCalendarDays } from "date-fns"
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker"
import { insuranceOptions } from '@/lib/data';
import type { Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/login-form';
import RegisterForm from '@/components/register-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const Carousel = dynamic(() => import('@/components/ui/carousel').then(m => m.Carousel), { ssr: false, loading: () => <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin"/></div> });
const CarouselContent = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselContent), { ssr: false });
const CarouselItem = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselItem), { ssr: false });
const CarouselNext = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselNext), { ssr: false });
const CarouselPrevious = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselPrevious), { ssr: false });


const translations = {
  es: {
    seats: "Asientos",
    transmission: "Transmisión",
    engine: "Motor",
    bookYourRental: "Reserva tu Alquiler",
    rentalDates: "Fechas de Alquiler",
    loadingDates: "Cargando fechas...",
    insuranceOptions: "Opciones de Seguro",
    day: "día",
    days: "días",
    vehicleCost: "Costo del vehículo",
    insuranceCost: "Costo del seguro",
    estimatedTotal: "Total Estimado",
    reserveNow: "Reservar Ahora",
    loginToBook: "Iniciar Sesión para Reservar",
    loginToBookDescription: "Por favor, inicia sesión o crea una cuenta para completar tu reserva.",
    loadingVehicle: "Cargando detalles del vehículo...",
    bookingSuccessTitle: "¡Reserva Creada!",
    bookingSuccessDescription: "Tu reserva ha sido creada exitosamente. Puedes ver los detalles en tu panel.",
    bookingErrorTitle: "Error en la Reserva",
    bookingErrorDescription: "No se pudo crear la reserva. Por favor, intenta de nuevo.",
    vehicleNotAvailable: "Este vehículo no está disponible para las fechas seleccionadas.",
  },
  en: {
    seats: "Seats",
    transmission: "Transmission",
    engine: "Engine",
    bookYourRental: "Book Your Rental",
    rentalDates: "Rental Dates",
    loadingDates: "Loading dates...",
    insuranceOptions: "Insurance Options",
    day: "day",
    days: "days",
    vehicleCost: "Vehicle cost",
    insuranceCost: "Insurance cost",
    estimatedTotal: "Estimated Total",
    reserveNow: "Reserve Now",
    loginToBook: "Login to Book",
    loginToBookDescription: "Please log in or create an account to complete your reservation.",
    loadingVehicle: "Loading vehicle details...",
    bookingSuccessTitle: "Reservation Created!",
    bookingSuccessDescription: "Your reservation has been successfully created. You can view the details in your dashboard.",
    bookingErrorTitle: "Booking Error",
    bookingErrorDescription: "Could not create reservation. Please try again.",
    vehicleNotAvailable: "This vehicle is not available for the selected dates.",
  }
}

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);


export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { db, user, userProfile, loading: authLoading } = useAuth();
  
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedInsuranceId, setSelectedInsuranceId] = React.useState<string>(insuranceOptions[0].id);
  const [isClient, setIsClient] = React.useState(false);
  const [lang, setLang] = React.useState<'es' | 'en'>('es');
  const t = translations[lang];
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchVehicle = async () => {
        if (!vehicleId || !db) return;
        setLoading(true);
        try {
            const vehicleRef = doc(db, 'vehicles', vehicleId);
            const vehicleSnap = await getDoc(vehicleRef);

            if (vehicleSnap.exists()) {
                setVehicle({ id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle);
            } else {
                notFound();
            }
        } catch (error) {
            console.error("Error fetching vehicle details:", error);
        } finally {
            setLoading(false);
        }
    };

    if(db) fetchVehicle();
  }, [vehicleId, db]);
  
  React.useEffect(() => {
    setDate({
        from: new Date(),
        to: addDays(new Date(), 5),
    });
    setIsClient(true);
  }, []);

  // Close auth modal if user logs in
  React.useEffect(() => {
      if (user && authModalOpen) {
          setAuthModalOpen(false);
      }
  }, [user, authModalOpen]);

  const checkVehicleAvailability = async (vehicleId: string, pickup: string, dropoff: string) => {
    if(!db) return true;
    
    let reservationsRef = query(
        collection(db, "reservations"),
        where("vehicleId", "==", vehicleId),
        where("status", "in", ["Upcoming", "Active"])
    );
    const querySnapshot = await getDocs(reservationsRef);
    const conflictingReservations = querySnapshot.docs.map(doc => doc.data());

    for (const res of conflictingReservations) {
        const existingPickup = new Date(res.pickupDate);
        const existingDropoff = new Date(res.dropoffDate);
        const newPickup = new Date(pickup);
        const newDropoff = new Date(dropoff);
        
        if (newPickup < existingDropoff && newDropoff > existingPickup) {
            toast({
                variant: 'destructive',
                title: 'Booking Conflict',
                description: t.vehicleNotAvailable,
                duration: 5000,
            });
            return false;
        }
    }
    return true;
  };

  const handleReserve = async () => {
    if (!user || !userProfile) {
        setAuthModalOpen(true);
        return;
    }
    
    if (!vehicle || !date?.from || !date?.to) return;
    setIsSubmitting(true);

    const pickupDateStr = format(date.from, 'yyyy-MM-dd');
    const dropoffDateStr = format(date.to, 'yyyy-MM-dd');

    const isAvailable = await checkVehicleAvailability(vehicle.id, pickupDateStr, dropoffDateStr);
    if (!isAvailable) {
        setIsSubmitting(false);
        return;
    }
    
    const selectedInsurance = insuranceOptions.find(opt => opt.id === selectedInsuranceId) || insuranceOptions[0];
    const rentalDays = differenceInCalendarDays(date.to, date.from) || 1;
    const vehicleTotal = rentalDays * vehicle.pricePerDay;
    const insuranceTotal = rentalDays * selectedInsurance.pricePerDay;
    const totalCost = vehicleTotal + insuranceTotal;

    const reservationData = {
        customerId: user.uid,
        customerName: userProfile.name,
        vehicleId: vehicle.id,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        pickupDate: pickupDateStr,
        dropoffDate: dropoffDateStr,
        status: 'Upcoming' as const,
        agent: 'Online Booking',
        insurance: selectedInsurance,
        totalCost: totalCost,
    };
    
    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(reservationData)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || 'Failed to create reservation');
        }

        toast({
            title: t.bookingSuccessTitle,
            description: t.bookingSuccessDescription,
        });
        router.push('/client-dashboard');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: t.bookingErrorTitle,
            description: error.message || t.bookingErrorDescription,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (loading || authLoading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{t.loadingVehicle}</p>
            </div>
        </div>
     )
  }

  if (!vehicle) {
    notFound();
  }
  
  const selectedInsurance = insuranceOptions.find(opt => opt.id === selectedInsuranceId) || insuranceOptions[0];
  const rentalDays = date?.from && date?.to ? (differenceInCalendarDays(date.to, date.from) || 1) : 0;
  const vehicleTotal = rentalDays * vehicle.pricePerDay;
  const insuranceTotal = rentalDays * selectedInsurance.pricePerDay;
  const totalCost = vehicleTotal + insuranceTotal;
  
  const toggleLang = () => {
    setLang(prev => prev === 'es' ? 'en' : 'es');
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
       <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
             {user && userProfile ? (
                 <Button asChild variant="secondary">
                     <Link href={userProfile.role === 'Client' ? "/client-dashboard" : "/dashboard"}>
                        <User className="mr-2"/> Mi Cuenta
                     </Link>
                 </Button>
             ) : (
                <Button variant="ghost" onClick={() => setAuthModalOpen(true)}>
                    Iniciar Sesión
                </Button>
             )}
            <Button asChild>
              <Link href="/#fleet-section">
                <Car className="mr-2 h-4 w-4" />
                Ver Flota
              </Link>
            </Button>
             <Button variant="outline" size="icon" onClick={toggleLang} aria-label="Change language">
                <Globe className="h-4 w-4" />
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
                    <div className="flex items-center gap-2"><Users className="h-5 w-5" /><span>{vehicle.specs.seats} {t.seats}</span></div>
                    <div className="flex items-center gap-2"><Gauge className="h-5 w-5" /><span>{vehicle.specs.engine}</span></div>
                    <div className="flex items-center gap-2"><GitBranch className="h-5 w-5" /><span>{vehicle.specs.transmission}</span></div>
                </div>

                <Card className="mt-8 bg-card border">
                    <CardHeader>
                        <CardTitle>{t.bookYourRental}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">{t.rentalDates}</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal bg-background"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {isClient && date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y", { locale: lang === 'es' ? es : undefined })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: lang === 'es' ? es : undefined })}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y", { locale: lang === 'es' ? es : undefined })
                                    )
                                    ) : (
                                    <span>{t.loadingDates}</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    locale={lang === 'es' ? es : undefined}
                                    disabled={{ before: new Date() }}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                        <Separator />

                        <div>
                            <Label className="text-sm font-medium">{t.insuranceOptions}</Label>
                             <RadioGroup value={selectedInsuranceId} onValueChange={setSelectedInsuranceId} className="mt-2 space-y-3">
                                {insuranceOptions.map(opt => (
                                    <Label key={opt.id} className="flex items-start gap-3 rounded-md border p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value={opt.id} id={opt.id} />
                                        <div className="grid gap-1.5">
                                            <div className="font-semibold flex justify-between items-center">
                                                <span>{lang === 'es' ? opt.title.es : opt.title.en}</span>
                                                <span className="text-primary">+${opt.pricePerDay.toFixed(2)}/{t.day}</span>
                                            </div>
                                            <p className="text-muted-foreground text-sm">
                                                {lang === 'es' ? opt.description.es : opt.description.en}
                                            </p>
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="border-t pt-4 space-y-2">
                             <div className="flex justify-between items-center text-muted-foreground">
                                <span>{t.vehicleCost} ({vehicle.pricePerDay.toFixed(2)} x {rentalDays} {rentalDays === 1 ? t.day : t.days})</span>
                                <span>${vehicleTotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center text-muted-foreground">
                                <span>{t.insuranceCost} ({selectedInsurance.pricePerDay.toFixed(2)} x {rentalDays} {rentalDays === 1 ? t.day : t.days})</span>
                                <span>${insuranceTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-xl mt-4 border-t pt-4">
                                <span>{t.estimatedTotal}</span>
                                <span>${totalCost.toFixed(2)} USD</span>
                            </div>
                        </div>

                        <Button size="lg" className="w-full text-lg h-12" onClick={handleReserve} disabled={!isClient || isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileSignature className="mr-2 h-5 w-5" />}
                            {user ? t.reserveNow : t.loginToBook}
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      
      <footer className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. All Rights Reserved.
          </div>
      </footer>
      
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">{t.loginToBook}</DialogTitle>
            <DialogDescription className="text-center">{t.loginToBookDescription}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login"><LogIn className="mr-2"/> Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register"><UserPlus className="mr-2"/> Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <LoginForm />
            </TabsContent>
            <TabsContent value="register">
                <RegisterForm />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

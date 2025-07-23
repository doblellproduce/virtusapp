
'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ShieldCheck, Users, Gauge, GitBranch, User, Car, FileSignature, Globe, Loader2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays, format } from "date-fns"
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker"
import { insuranceOptions } from '@/lib/data';
import type { Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

const Carousel = dynamic(() => import('@/components/ui/carousel').then(m => m.Carousel), { ssr: false, loading: () => <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin"/></div> });
const CarouselContent = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselContent), { ssr: false });
const CarouselItem = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselItem), { ssr: false });
const CarouselNext = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselNext), { ssr: false });
const CarouselPrevious = dynamic(() => import('@/components/ui/carousel').then(m => m.CarouselPrevious), { ssr: false });


const translations = {
  es: {
    adminLogin: "Acceso Admin",
    bookNow: "Reservar Ahora",
    seats: "Asientos",
    transmission: "Transmisión",
    engine: "Motor",
    bookYourRental: "Reserva tu Alquiler",
    bookDescription: "Selecciona las fechas, seguro y introduce tus datos para empezar.",
    fullName: "Nombre Completo",
    email: "Correo Electrónico",
    phone: "Número de Teléfono",
    rentalDates: "Fechas de Alquiler",
    loadingDates: "Cargando fechas...",
    insuranceOptions: "Opciones de Seguro",
    day: "día",
    days: "días",
    taxesAndFees: "Impuestos y Tasas",
    calculatedAtCheckout: "Calculado al finalizar",
    vehicleCost: "Costo del vehículo",
    insuranceCost: "Costo del seguro",
    estimatedTotal: "Total Estimado",
    reserveAndSign: "Reservar y Firmar Contrato",
    toastTitle: "Creando Reserva...",
    toastDescription: "Redirigiendo para firmar el contrato.",
    loadingVehicle: "Cargando detalles del vehículo...",
  },
  en: {
    adminLogin: "Admin Login",
    bookNow: "Book Now",
    seats: "Seats",
    transmission: "Transmission",
    engine: "Engine",
    bookYourRental: "Book Your Rental",
    bookDescription: "Select dates, insurance, and enter your details to get started.",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    rentalDates: "Rental Dates",
    loadingDates: "Loading dates...",
    insuranceOptions: "Insurance Options",
    day: "day",
    days: "days",
    taxesAndFees: "Taxes and Fees",
    calculatedAtCheckout: "Calculated at checkout",
    vehicleCost: "Vehicle cost",
    insuranceCost: "Insurance cost",
    estimatedTotal: "Estimated Total",
    reserveAndSign: "Reserve & Sign Contract",
    toastTitle: "Creating Reservation...",
    toastDescription: "Redirecting to sign the contract.",
    loadingVehicle: "Loading vehicle details...",
  }
}

const Logo = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.4L19.6 8.2V15.8L12 19.6L4.4 15.8V8.2L12 4.4ZM12 12.5L7 9.8V14.2L12 16.9L17 14.2V9.8L12 12.5Z" fill="currentColor"/>
    </svg>
);


export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { db } = useAuth();
  
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedInsuranceId, setSelectedInsuranceId] = React.useState<string>(insuranceOptions[0].id);
  const [isClient, setIsClient] = React.useState(false);
  const [lang, setLang] = React.useState<'es' | 'en'>('es');
  const t = translations[lang];

  const [customerInfo, setCustomerInfo] = React.useState({
    name: '',
    email: '',
    phone: ''
  });

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
            // Optionally show a toast or error message to the user
        } finally {
            setLoading(false);
        }
    };

    if(db) fetchVehicle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, db]);
  
  React.useEffect(() => {
    // This ensures date initialization only runs on the client
    setDate({
        from: new Date(),
        to: addDays(new Date(), 5),
    });
    setIsClient(true);
  }, []);

  if (loading) {
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
  const rentalDays = date?.from && date?.to ? Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 3600 * 24)) : 0;
  const vehicleTotal = rentalDays * vehicle.pricePerDay;
  const insuranceTotal = rentalDays * selectedInsurance.pricePerDay;
  const totalCost = vehicleTotal + insuranceTotal;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [id]: value }));
  }
  
  const toggleLang = () => {
    setLang(prev => prev === 'es' ? 'en' : 'es');
  }

  const handleReserve = () => {
    const newReservationId = `RES-${String(Math.floor(Math.random() * 900) + 100)}`;
    
    if (!vehicle) return;

    const newReservation = {
        id: newReservationId,
        customer: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        vehicleId: vehicle.id,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        pickupDate: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        dropoffDate: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        status: 'Pending Signature',
        agent: 'Online Booking',
        insurance: selectedInsurance, // Save selected insurance details
        totalCost: totalCost, // Save the calculated total cost
    };
    
    toast({
        title: t.toastTitle,
        description: t.toastDescription,
    });

    const queryParams = new URLSearchParams({
      reservationId: newReservation.id,
      customerName: newReservation.customer,
    });
    localStorage.setItem('pendingReservation', JSON.stringify(newReservation));
    
    router.push(`/contrato?${queryParams.toString()}`);
  }
  
  const isFormValid = customerInfo.name && customerInfo.email && customerInfo.phone && date?.from && date?.to;

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
            <Button asChild>
              <Link href="/#fleet-section">
                <Car className="mr-2" />
                {t.bookNow}
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
                        <CardDescription>{t.bookDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        <div className='space-y-4'>
                            <div>
                                <Label htmlFor="name">{t.fullName}</Label>
                                <Input id="name" placeholder="John Doe" value={customerInfo.name} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="email">{t.email}</Label>
                                <Input id="email" type="email" placeholder="tu@ejemplo.com" value={customerInfo.email} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="phone">{t.phone}</Label>
                                <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={customerInfo.phone} onChange={handleInputChange} required />
                            </div>
                        </div>
                        
                        <Separator />
                        
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

                        <Button size="lg" className="w-full text-lg h-12" onClick={handleReserve} disabled={!isFormValid || !isClient}>
                            <FileSignature className="mr-2 h-5 w-5" />
                            {t.reserveAndSign}
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
    </div>
  );
}

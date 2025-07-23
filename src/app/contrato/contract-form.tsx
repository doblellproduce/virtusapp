
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { insuranceOptions } from '@/lib/data';
import type { Vehicle } from '@/lib/types';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Home, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

const ContractHeader = () => (
    <div className="text-center mb-6">
        <h2 className="text-lg font-bold">Contrato Virtus Car Rental S.R.L.</h2>
        <p className="text-sm text-muted-foreground">RNC: 131-47377-6</p>
        <p className="text-sm text-muted-foreground">Ruta 66, Salida del aeropuerto Las Americas, La Caleta, R.D.</p>
        <p className="text-sm text-muted-foreground">Tel: 809-549-0144 | WhatsApp: 809-357-6291</p>
        <p className="text-sm text-muted-foreground">Email: virtuscr01@gmail.com | Web: www.virtuscarrentalsrl.com</p>
    </div>
);

type ReservationData = {
    id: string;
    customer: string;
    email: string;
    phone: string;
    vehicleId: string;
    vehicle: string;
    pickupDate: string;
    dropoffDate: string;
    insurance: typeof insuranceOptions[0];
    totalCost: number;
}

export default function ContractForm() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { db } = useAuth();
    
    const reservationId = searchParams.get('reservationId');
    const [reservation, setReservation] = React.useState<ReservationData | null>(null);
    const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
    const [termsAccepted, setTermsAccepted] = React.useState(false);
    const [submissionStatus, setSubmissionStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle');
    const [showTerms, setShowTerms] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    const [formData, setFormData] = React.useState({
        residence: '', city: '', state: '', idOrPassport: '', license: '', addressInDR: '',
        driver2Name: '', driver2License: '', driver2Address: '', driver2Phone: '',
    });
    
    React.useEffect(() => {
        const fetchReservationAndVehicle = async (res: ReservationData) => {
            if (!db) return;
            try {
                const vehicleRef = doc(db, 'vehicles', res.vehicleId);
                const vehicleSnap = await getDoc(vehicleRef);
                if (vehicleSnap.exists()) {
                    setVehicle({ id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle);
                }
            } catch (error) {
                console.error("Error fetching vehicle details for contract:", error);
            } finally {
                setLoading(false);
            }
        };

        const pendingReservationStr = localStorage.getItem('pendingReservation');
        if (pendingReservationStr) {
            const pendingRes = JSON.parse(pendingReservationStr);
            if (pendingRes.id === reservationId) {
                setReservation(pendingRes);
                fetchReservationAndVehicle(pendingRes);
            } else {
                 setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [reservationId, db]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    };

    const handleConfirmAndSign = async () => {
        if(!reservation || !db) return;
        setSubmissionStatus('submitting');
        
        const contractId = `CON-${reservation.id}`;
        const newContract = {
            id: contractId,
            customer: reservation.customer,
            type: "Rental Agreement",
            date: new Date().toISOString().split('T')[0],
            file: { name: `contract_${reservation.id}.pdf` },
            status: 'Signed' as const,
            reservationId: reservation.id,
            formData: { ...formData, ...reservation },
        };

        try {
            // 1. Save reservation to Firestore
            const resRef = doc(db, 'reservations', reservation.id);
            await setDoc(resRef, { ...reservation, status: 'Upcoming' });

            // 2. Save contract to Firestore
            const contractRef = doc(db, 'contracts', contractId);
            await setDoc(contractRef, newContract);

            // 3. Update vehicle status to 'Rented'
            const vehicleRef = doc(db, 'vehicles', reservation.vehicleId);
            await updateDoc(vehicleRef, { status: 'Rented' });
            
            localStorage.removeItem('pendingReservation');
            
            toast({
                title: "Contrato Confirmado",
                description: "La reserva y el contrato se han registrado con éxito.",
            });
            
            setSubmissionStatus('success');

        } catch (error) {
            console.error("Error confirming contract:", error);
            toast({
                variant: 'destructive',
                title: 'Error al Guardar',
                description: 'No se pudo guardar la reserva o el contrato. Por favor, inténtelo de nuevo.'
            });
            setSubmissionStatus('idle');
        }
    }
    
    if (loading) {
        return (
             <div className="flex h-screen items-center justify-center bg-muted/40">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
        )
    }

    if (!reservation && submissionStatus !== 'success') {
        return <div className="flex h-screen items-center justify-center">No se encontró la reserva pendiente. Por favor, vuelva a la página de inicio.</div>;
    }
    
    if (!vehicle && submissionStatus !== 'success') {
         return <div className="flex h-screen items-center justify-center">No se pudo cargar la información del vehículo.</div>;
    }
    
    const isFormValid = formData.idOrPassport && formData.license && termsAccepted;
    const isSubmitting = submissionStatus === 'submitting';
    
    const customerNameOnSuccess = reservation?.customer || searchParams.get('customerName');

    return (
        <div className="bg-muted/40 min-h-screen flex flex-col items-center p-4 sm:p-8">
             <header className="mb-4 text-center">
                 <Link href="/" className="flex items-center gap-2 justify-center">
                    <Logo />
                </Link>
            </header>
            
            <main className="w-full max-w-5xl">
                 <Card className="shadow-lg">
                    {submissionStatus !== 'success' && reservation && vehicle ? (
                        <>
                            <CardHeader>
                                <ContractHeader />
                                <CardTitle>Contrato de Alquiler de Vehículo</CardTitle>
                                <CardDescription>Por favor, complete sus datos, revise los términos y firme a continuación.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Customer Details */}
                                <section>
                                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Datos del Cliente</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><Label htmlFor="customer">Cliente / Customer</Label><Input id="customer" value={reservation.customer} readOnly /></div>
                                        <div><Label htmlFor="phone">Teléfono / Phone</Label><Input id="phone" value={reservation.phone} readOnly /></div>
                                        <div><Label htmlFor="residence">Residencia / Residence</Label><Input id="residence" value={formData.residence} onChange={handleInputChange}/></div>
                                        <div><Label htmlFor="city">Ciudad / City</Label><Input id="city" value={formData.city} onChange={handleInputChange}/></div>
                                        <div><Label htmlFor="state">Estado / State</Label><Input id="state" value={formData.state} onChange={handleInputChange}/></div>
                                        <div><Label htmlFor="idOrPassport">ID / Cedula or Pasaporte</Label><Input id="idOrPassport" value={formData.idOrPassport} onChange={handleInputChange} required /></div>
                                        <div><Label htmlFor="license">Licencia / License</Label><Input id="license" value={formData.license} onChange={handleInputChange} required /></div>
                                        <div className="md:col-span-2"><Label htmlFor="addressInDR">Dirección en R.D. / Address in D.R.</Label><Input id="addressInDR" value={formData.addressInDR} onChange={handleInputChange}/></div>
                                    </div>
                                </section>

                                {/* 2nd Driver Details */}
                                <section>
                                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">2do Conductor (Opcional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><Label htmlFor="driver2Name">Nombre / Name</Label><Input id="driver2Name" value={formData.driver2Name} onChange={handleInputChange}/></div>
                                        <div><Label htmlFor="driver2License">Licencia / License</Label><Input id="driver2License" value={formData.driver2License} onChange={handleInputChange}/></div>
                                        <div className="lg:col-span-3"><Label htmlFor="driver2Address">Dirección / Address</Label><Input id="driver2Address" value={formData.driver2Address} onChange={handleInputChange}/></div>
                                        <div><Label htmlFor="driver2Phone">Teléfono / Phone</Label><Input id="driver2Phone" value={formData.driver2Phone} onChange={handleInputChange}/></div>
                                    </div>
                                </section>

                                {/* Vehicle and Rental Details */}
                                <section>
                                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detalles del Vehículo y Alquiler</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div><Label>Marca / Make</Label><Input value={vehicle.make} readOnly /></div>
                                        <div><Label>Modelo / Model</Label><Input value={vehicle.model} readOnly /></div>
                                        <div><Label>Placa / Plate No.</Label><Input value={vehicle.plate} readOnly /></div>
                                        <div><Label>Color / Color</Label><Input value="N/A" readOnly /></div>
                                        <div><Label>Fecha de Salida</Label><Input value={format(new Date(reservation.pickupDate), 'MM/dd/yyyy')} readOnly /></div>
                                        <div><Label>Hora de Salida</Label><Input value="10:00 AM" readOnly /></div>
                                        <div><Label>Fecha de Entrada</Label><Input value={format(new Date(reservation.dropoffDate), 'MM/dd/yyyy')} readOnly /></div>
                                        <div><Label>Hora de Entrada</Label><Input value="10:00 AM" readOnly /></div>
                                        <div><Label>Tipo de Seguro</Label><Input value={reservation.insurance.title.es} readOnly /></div>
                                        <div><Label>Depósito de Seguridad</Label><Input value={`$${reservation.insurance.deposit.toFixed(2)}`} readOnly /></div>
                                        <div><Label>Deducible</Label><Input value={`$${reservation.insurance.deductible.toFixed(2)}`} readOnly /></div>
                                    </div>
                                </section>
                                
                                {/* Cost Summary */}
                                <section>
                                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Resumen de Costos</h3>
                                    <div className="space-y-2 max-w-sm ml-auto">
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>Costo del Vehículo y Seguro</span>
                                            <span>${reservation.totalCost.toFixed(2)}</span>
                                        </div>
                                         <div className="flex justify-between items-center text-muted-foreground">
                                            <span>Impuestos y Tasas</span>
                                            <span>Incluido</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center font-bold text-xl">
                                            <span>Total a Pagar</span>
                                            <span>${reservation.totalCost.toFixed(2)} USD</span>
                                        </div>
                                    </div>
                                </section>
                                
                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                                        <Label htmlFor="terms" className="text-sm font-medium leading-none">
                                            He leído y acepto los términos y condiciones del contrato.
                                        </Label>
                                    </div>
                                    <Button variant="link" onClick={() => setShowTerms(!showTerms)} className="p-0 h-auto">
                                        {showTerms ? 'Ocultar' : 'Ver'} Términos y Condiciones
                                    </Button>
                                </div>
                                {showTerms && (
                                    <Card>
                                        <CardContent className="p-4 max-h-60 overflow-y-auto text-sm">
                                            <TermsAndConditions />
                                        </CardContent>
                                    </Card>
                                )}
                            </CardContent>
                            <CardFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialog>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar y Firmar Contrato</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Está a punto de firmar digitalmente este contrato de alquiler. Esta acción es legalmente vinculante. ¿Desea continuar?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleConfirmAndSign} disabled={isSubmitting}>
                                                {isSubmitting ? 'Procesando...' : 'Sí, Confirmar y Firmar'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full sm:w-auto" disabled={!isFormValid || isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isSubmitting ? 'Procesando...' : 'Confirmar y Firmar'}
                                        </Button>
                                    </AlertDialogTrigger>
                                </AlertDialog>
                            </CardFooter>
                        </>
                    ) : (
                        <CardContent className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">¡Reserva Confirmada!</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                ¡Gracias, <span className="font-semibold">{customerNameOnSuccess || 'cliente'}</span>! Tu reserva <span className="font-semibold">{reservationId}</span> ha sido creada exitosamente.
                            </p>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                Hemos guardado tu contrato. En breve nos pondremos en contacto contigo para los siguientes pasos.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/">
                                    <Home className="mr-2 h-4 w-4"/>
                                    Volver al Inicio
                                </Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </main>
        </div>
    );
}

const TermsAndConditions = () => (
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
        <h4 className="font-bold text-foreground">Condiciones en Español</h4>
        <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>Solamente la persona cuyo nombre aparece en este contrato, y a quien se alquila este vehículo se responsabiliza de todos los daños durante el alquiler así como en caso de reparación.</li>
            <li>Este vehículo no será usado en carreras o competencias, ni se usará para enseñar a otra persona a manejar, no será usado para jalar, remolcar o empujar otro vehículo, ni se usará en caminos no pavimentados.</li>
            <li>El consumo de gasolina corresponde al cliente.</li>
            <li>El vehículo será devuelto el día y la hora indicada en el contrato, en la compañía, el incumplimiento de esto hará que la policía sea notificada de inmediato. No cumplir con la fecha de entrega le traerá al cliente, por todos los gastos y perjuicios.</li>
            <li>Si el conductor o consumidor alcohol, no podrá conducir el vehículo. Hasta haber pasado un total de al menos 12 horas desde su consumo.</li>
            <li>En caso de accidente, el cliente o la persona que lo acompañe, debe notificar de inmediato a la compañía y debe permanecer en el lugar del accidente sin mover el vehículo hasta la llegada de la policía y llevar una copia de la misma cuando entregue el vehículo. No hacerlo, entonces, el vehículo deberá ser llevado a un centro de reparación autorizado por la compañía y pagará el deducible que aparece en el frente. Si fuera inocente del accidente y el chofer culpable no tiene seguro, pagará todos los daños y perjuicios. El incumplimiento de cualquier parte de este párrafo anulará el seguro, y será necesario volver a la oficina de la compañía y hacer un nuevo depósito para continuar con el vehículo.</li>
            <li>El cliente pagará los impuestos del 18% a las compañías de seguros en todos sus vehículos.</li>
            <li>El cliente devolverá el vehículo en las mismas condiciones en que se le entregó.</li>
            <li>Si el vehículo debe ser recogido por la compañía, en la Rep. Dom. Deberá notificarlo a la compañía de inmediato. El incumplimiento de cualquiera de las condiciones anteriores anulará el contrato.</li>
            <li>Cualquier multa será responsabilidad del cliente y pagará una penalidad diaria de doscientos (200) kilómetros por día.</li>
            <li>Si el cliente desea extender el período de alquiler del vehículo, siempre y cuando no esté reservado para otro cliente, será necesario volver a la oficina de la compañía y hacer nuevos depósitos para continuar con el vehículo.</li>
            <li>Pasar los automóviles a fecha después del período establecido en el contrato.</li>
            <li>Los clientes no tienen autorización de controlar pagos de reparaciones de ningún tipo al vehículo.</li>
        </ol>
        
        <h4 className="font-bold text-foreground mt-6">Conditions in English</h4>
        <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>Only the person whose name appears in this contract and to whom this vehicle is rented is responsible for all costs of damage to the vehicle during the rental period.</li>
            <li>The vehicle will never be used in races or competitions, it will never be used to teach another person to drive, it will not be used as a tow, it will never be used to tow or push another vehicle, and it will be used on paved roads.</li>
            <li>The consumption of gasoline is the responsibility of the customer.</li>
            <li>The vehicle will be returned the day and time specified by the contract, in the company, failure to do so will cause the police to pick up the vehicle. Failure to comply with the return date will bring the client, for all expenses and prejudices.</li>
            <li>If the driver or consumer drinks alcohol, he or she should not drive the vehicle until about 12 hours have passed, regardless of the amount he or she has taken.</li>
            <li>In case of accident, theft or fire, the person who rents will immediately notify the company and the police, proceeding to draw up a report, remaining in the same place without moving the vehicle until the arrival of the police, proceeding to bring a copy of the police report when delivering the vehicle. If you were innocent of the accident and the other driver responsible did not have insurance, you will pay the deductible that appears in front. If you were innocent of the accident and the other driver responsible did not have insurance, you will pay the deductible that appears in front. If you were innocent of the accident and the culpable driver did not have insurance, he or she will pay the total loss of parts and damages. Failure to comply with any part of this paragraph will void all insurance, and will require you to return to the company office and make a new deposit to continue using the vehicle.</li>
            <li>The 18% business tax for any claim with the insurance of its vehicles.</li>
            <li>The customer will return the vehicle in the same conditions as it was delivered.</li>
            <li>If the vehicle must be picked up by the company by its address in the Dom Rep. He should notify the company immediately. Non-compliance with any of the above conditions will void the contract.</li>
            <li>Any fine will be the customer’s responsibility and will include a 200 km penalty per day.</li>
            <li>If the client wishes to extend the rental period of the vehicle, as long as it is not reserved for another client, it will be necessary to return to the company’s office, and make new deposits to continue using the vehicle.</li>
            <li>Pass cars from the delivery date will be void.</li>
            <li>The customer does not have authorization to control payments of any kind to the vehicle.</li>
        </ol>
    </div>
);

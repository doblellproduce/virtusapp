
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, FileText, FileCheck, Eye, Undo2, Loader2, Info, FileSignature } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import type { Reservation, Vehicle, Customer, VehicleInspection } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, addDoc, doc, updateDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CustomerCombobox } from '@/components/customer-combobox';
import DepartureInspectionModal from '@/components/departure-inspection-modal';
import { differenceInCalendarDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateContract } from '@/ai/flows/generate-contract-flow';
import { generateDepartureChecklist } from '@/ai/flows/generate-departure-checklist-flow';

type NewReservation = Omit<Reservation, 'id' | 'agent' | 'vehicle' | 'departureInspection' | 'returnInspection'>;

const emptyReservation: NewReservation = {
    customerId: '',
    customerName: '',
    vehicleId: '',
    pickupDate: '',
    dropoffDate: '',
    status: 'Upcoming',
};

export default function ReservationsClient() {
    const { user, db, storage, logActivity } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [editingReservation, setEditingReservation] = React.useState<Reservation | null>(null);
    const [reservationData, setReservationData] = React.useState<NewReservation>(emptyReservation);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [highlightedRes, setHighlightedRes] = React.useState<string | null>(null);
    
    const [isInspectionModalOpen, setIsInspectionModalOpen] = React.useState(false);
    const [inspectingReservation, setInspectingReservation] = React.useState<Reservation | null>(null);
    const [inspectionType, setInspectionType] = React.useState<'departure' | 'return'>('departure');

    React.useEffect(() => {
        if (!db || !user) return;
        setLoading(true);

        const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        }, (error) => {
            console.error("Error fetching vehicles:", error);
            toast({ variant: 'destructive', title: 'Error fetching vehicles' });
        });

        const unsubReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
            const reservationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            setReservations(reservationsData);
            if(loading) setLoading(false); // Set loading to false after first fetch
        }, (error) => {
            console.error("Error fetching reservations: ", error);
             toast({ variant: 'destructive', title: 'Error fetching reservations' });
            setLoading(false);
        });

        const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(customersData);
        }, (error) => {
             console.error("Error fetching customers: ", error);
             toast({ variant: 'destructive', title: 'Error fetching customers' });
        });

        return () => {
            unsubVehicles();
            unsubReservations();
            unsubCustomers();
        };
    }, [db, user, toast]);

    React.useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId) {
            setSearchTerm(viewId);
            setHighlightedRes(viewId);
            const timer = setTimeout(() => setHighlightedRes(null), 3000); // Highlight for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const isEditing = editingReservation !== null;
    
    const vehiclesForDropdown = React.useMemo(() => {
        if (isEditing && editingReservation) {
            const assignedVehicle = vehicles.find(v => v.id === editingReservation.vehicleId);
            const availableVehicles = vehicles.filter(v => v.status === 'Available');
            
            if (assignedVehicle && !availableVehicles.some(v => v.id === assignedVehicle.id)) {
                return [assignedVehicle, ...availableVehicles];
            }
            return availableVehicles;
        }
        return vehicles.filter(v => v.status === 'Available');
    }, [vehicles, isEditing, editingReservation]);

    const handleOpenDialog = (reservation: Reservation | null = null) => {
        if (reservation) {
            setEditingReservation(reservation);
            setReservationData(reservation);
        } else {
            setEditingReservation(null);
            setReservationData(emptyReservation);
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setReservationData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof NewReservation) => (value: string) => {
         setReservationData(prev => ({ ...prev, [id]: value as any }));
    };

    const handleCustomerSelect = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setReservationData(prev => ({...prev, customerId: customer.id, customerName: customer.name}));
        }
    };

    const generateNewReservationId = () => {
        const maxId = reservations.reduce((max, res) => {
            if (res && res.id && typeof res.id === 'string') {
                const idNum = parseInt(res.id.split('-')[1]);
                if (!isNaN(idNum) && idNum > max) {
                    return idNum;
                }
            }
            return max;
        }, 0);
        return `RES-${String(maxId > 0 ? maxId + 1 : Date.now().toString().slice(-3)).padStart(3, '0')}`;
    };

    const checkVehicleAvailability = async (vehicleId: string, pickup: string, dropoff: string, excludeReservationId?: string) => {
        if(!db) return true;
        
        let reservationsRef = query(
            collection(db, "reservations"),
            where("vehicleId", "==", vehicleId),
            where("status", "in", ["Upcoming", "Active"])
        );
        const querySnapshot = await getDocs(reservationsRef);
        const conflictingReservations = querySnapshot.docs
            .map(doc => ({id: doc.id, ...doc.data()} as Reservation))
            .filter(res => res.id !== excludeReservationId);

        for (const res of conflictingReservations) {
            const existingPickup = new Date(res.pickupDate);
            const existingDropoff = new Date(res.dropoffDate);
            const newPickup = new Date(pickup);
            const newDropoff = new Date(dropoff);
            
            if (newPickup < existingDropoff && newDropoff > existingPickup) {
                toast({
                    variant: 'destructive',
                    title: 'Booking Conflict',
                    description: `This vehicle is already booked from ${res.pickupDate} to ${res.dropoffDate}. Please choose a different vehicle or date range.`,
                    duration: 5000,
                });
                return false;
            }
        }
        return true;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !user) return;

        const isAvailable = await checkVehicleAvailability(reservationData.vehicleId, reservationData.pickupDate, reservationData.dropoffDate, isEditing ? editingReservation?.id : undefined);
        if (!isAvailable) {
            return;
        }

        const agentName = user?.displayName ?? 'System';
        const selectedVehicle = vehicles.find(v => v.id === reservationData.vehicleId);

        if (!selectedVehicle || !reservationData.pickupDate || !reservationData.dropoffDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Missing required reservation data.' });
            return;
        }

        const pickupDate = new Date(reservationData.pickupDate);
        const dropoffDate = new Date(reservationData.dropoffDate);
        const rentalDays = differenceInCalendarDays(dropoffDate, pickupDate) || 1;
        const totalCost = rentalDays * selectedVehicle.pricePerDay;

        const originalVehicleId = isEditing ? editingReservation?.vehicleId : null;

        const resId = isEditing ? editingReservation!.id : generateNewReservationId();
        const dataToSave = {
            ...reservationData,
            vehicle: `${selectedVehicle.make} ${selectedVehicle.model}`,
            totalCost: totalCost,
            agent: isEditing ? editingReservation!.agent : agentName,
        };

        if (isEditing) {
            const resRef = doc(db, 'reservations', resId);
            await updateDoc(resRef, dataToSave);
            await logActivity('Update', 'Reservation', resId, `Updated reservation for ${dataToSave.customerName}.`);
            toast({ title: "Reservation Updated" });
        } else {
            await setDoc(doc(db, 'reservations', resId), dataToSave);
            await logActivity('Create', 'Reservation', resId, `Created reservation for ${dataToSave.customerName}.`);
            toast({ title: "Reservation Created" });
        }
        
        // Update vehicle status
        if (originalVehicleId && originalVehicleId !== selectedVehicle.id) {
            await updateDoc(doc(db, 'vehicles', originalVehicleId), { status: 'Available' });
        }
        const newStatus = dataToSave.status === 'Completed' || dataToSave.status === 'Cancelled' ? 'Available' : 'Rented';
        await updateDoc(doc(db, 'vehicles', selectedVehicle.id), { status: newStatus });
        
        // Generate Invoice
        await handleGenerateInvoice({ ...dataToSave, id: resId });
        
        setOpen(false);
    };
    
    React.useEffect(() => {
        if (!open) {
            setEditingReservation(null);
            setReservationData(emptyReservation);
        }
    }, [open]);
    
    const handleCancelReservation = async (reservation: Reservation | null) => {
        if (!db || !reservation?.id || !reservation.vehicleId) return;
        const resRef = doc(db, 'reservations', reservation.id);
        await updateDoc(resRef, { status: 'Cancelled' });

        const vehicleRef = doc(db, 'vehicles', reservation.vehicleId);
        await updateDoc(vehicleRef, { status: 'Available' });
        
        await logActivity('Cancel', 'Reservation', reservation.id, `Cancelled reservation for ${reservation.customerName}.`);
        await logActivity('Update', 'Vehicle', reservation.vehicleId, `Status set to Available (reservation cancelled).`);

        toast({
            title: "Reservation Cancelled",
            description: `Reservation ${reservation.id} has been successfully cancelled.`,
        });
    };
    
    const handleGenerateInvoice = async (reservation: (Reservation | (Omit<Reservation, 'id'> & {id: string})) | null) => {
        if (!db || !reservation?.id || !user) return;
        
        const selectedVehicle = vehicles.find(v => v.id === reservation.vehicleId);
        if (!selectedVehicle) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not find vehicle details to calculate total cost.' });
            return;
        }

        const pickupDate = new Date(reservation.pickupDate);
        const dropoffDate = new Date(reservation.dropoffDate);
        const rentalDays = differenceInCalendarDays(dropoffDate, pickupDate) || 1;
        const totalCost = rentalDays * selectedVehicle.pricePerDay;

        const agentName = user.displayName ?? 'System';
        
        const newInvoiceId = `INV-${reservation.id.replace('RES-', '')}-${Date.now().toString().slice(-4)}`;
        
        const newInvoice = {
            customer: reservation.customerName,
            date: new Date().toISOString().split('T')[0],
            amount: String(totalCost.toFixed(2)),
            status: 'Draft' as const,
            createdBy: agentName,
            paymentMethod: 'N/A' as const,
            reservationId: reservation.id,
        };

        await setDoc(doc(db, 'invoices', newInvoiceId), newInvoice, { merge: true });
        await logActivity('Create', 'Invoice', newInvoiceId, `Generated/Updated invoice for reservation ${reservation.id}`);
        
        toast({
            title: 'Invoice Generated',
            description: `Invoice ${newInvoiceId} for ${reservation.id} has been created/updated.`,
        });
    };

    const handleGenerateContract = async (reservation: Reservation | null) => {
        if (!reservation || !db || !storage) return;

        toast({ title: 'Generating Contract...', description: 'Please wait a moment.' });

        try {
            const customer = customers.find(c => c.id === reservation.customerId);
            const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
            if (!customer || !vehicle) {
                throw new Error("Customer or vehicle data not found.");
            }

            const result = await generateContract({
                customerName: customer.name,
                customerIdOrPassport: customer.idOrPassport,
                customerAddress: customer.address,
                vehicleDescription: `${vehicle.make} ${vehicle.model}`,
                vehiclePlate: vehicle.plate,
                pickupDate: reservation.pickupDate,
                dropoffDate: reservation.dropoffDate,
                totalCost: reservation.totalCost || 0,
                deductible: vehicle.deductible,
            });

            const blob = new Blob([result.contractText], { type: 'text/plain;charset=utf-8' });
            const fileName = `Contract-${reservation.id}.txt`;
            const fileRef = ref(storage, `contracts/${fileName}`);

            await uploadBytes(fileRef, blob);
            const fileUrl = await getDownloadURL(fileRef);

            await addDoc(collection(db, 'documents'), {
                customer: reservation.customerName,
                type: 'Rental Agreement',
                date: new Date().toISOString().split('T')[0],
                fileUrl,
                fileName,
                status: 'Generated',
                reservationId: reservation.id,
            });

            await logActivity('Create', 'Contract', reservation.id, 'Generated rental agreement.');
            toast({ title: 'Contract Generated!', description: 'The rental agreement has been saved in Documents.' });
        } catch (error) {
            console.error("Error generating contract:", error);
            toast({ variant: 'destructive', title: 'Contract Generation Failed', description: 'Could not generate the contract.' });
        }
    };
    
    const handleStartInspection = (reservation: Reservation | null, type: 'departure' | 'return') => {
        if (!reservation) return;
        setInspectionType(type);
        setInspectingReservation(reservation);
        setIsInspectionModalOpen(true);
    };

    const handleInspectionSubmit = async (data: {
        mileage: string;
        fuelLevel: string;
        notes: string;
        photos: File[];
        signature: File | null;
    }) => {
        if (!inspectingReservation || !db || !storage) {
            toast({ variant: 'destructive', title: 'Error', description: 'No reservation selected or database not available.' });
            return;
        }

        try {
            const uploadPhoto = async (file: File, folder: string) => {
                if (!file) return '';
                const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
                await uploadBytes(fileRef, file);
                return getDownloadURL(fileRef);
            };
            
            const photoUrls = await Promise.all(data.photos.map(p => uploadPhoto(p, `inspections/${inspectingReservation.id}/${inspectionType}`)));
            const signatureUrl = data.signature ? await uploadPhoto(data.signature, `signatures/${inspectingReservation.id}/${inspectionType}`) : '';

            const inspectionData: VehicleInspection = {
                photos: photoUrls.filter(url => url),
                notes: data.notes,
                fuelLevel: data.fuelLevel as VehicleInspection['fuelLevel'],
                mileage: Number(data.mileage),
                signatureUrl,
                timestamp: new Date().toISOString(),
            };
            
            const resRef = doc(db, 'reservations', inspectingReservation.id);
            if (inspectionType === 'departure') {
                await updateDoc(resRef, {
                    departureInspection: inspectionData,
                    status: 'Active',
                });
                await logActivity('Update', 'Reservation', inspectingReservation.id, 'Completed departure inspection.');
                toast({ title: 'Inspection Complete', description: 'Vehicle departure inspection has been saved.' });

                // Generate Departure Checklist
                const vehicle = vehicles.find(v => v.id === inspectingReservation.vehicleId);
                if (vehicle) {
                    const checklistResult = await generateDepartureChecklist({
                        customerName: inspectingReservation.customerName,
                        vehicleDescription: `${vehicle.make} ${vehicle.model}`,
                        vehiclePlate: vehicle.plate,
                        pickupDate: inspectingReservation.pickupDate,
                        mileage: data.mileage,
                        fuelLevel: data.fuelLevel,
                        notes: data.notes,
                    });
                    const blob = new Blob([checklistResult.checklistText], { type: 'text/plain;charset=utf-8' });
                    const fileName = `Checklist-Salida-${inspectingReservation.id}.txt`;
                    const fileRef = ref(storage, `checklists/${fileName}`);
                    await uploadBytes(fileRef, blob);
                    const fileUrl = await getDownloadURL(fileRef);

                     await addDoc(collection(db, 'documents'), {
                        customer: inspectingReservation.customerName,
                        type: 'Departure Checklist',
                        date: new Date().toISOString().split('T')[0],
                        fileUrl,
                        fileName,
                        status: 'Generated',
                        reservationId: inspectingReservation.id,
                    });
                     toast({ title: 'Checklist de Salida Generado', description: 'El documento ha sido guardado.' });
                }

            } else {
                 await updateDoc(resRef, {
                    returnInspection: inspectionData,
                    status: 'Completed',
                });
                const vehicleRef = doc(db, 'vehicles', inspectingReservation.vehicleId);
                await updateDoc(vehicleRef, { status: 'Available' });

                await logActivity('Update', 'Reservation', inspectingReservation.id, 'Completed return inspection.');
                await logActivity('Update', 'Vehicle', inspectingReservation.vehicleId, 'Status set to Available (return inspection).');
                toast({ title: 'Return Complete', description: 'Vehicle return inspection has been saved.' });
            }
            
            setIsInspectionModalOpen(false);
            setInspectingReservation(null);
            
        } catch (error) {
            console.error('Inspection submit error:', error);
            toast({ variant: 'destructive', title: 'Submission Error', description: 'Failed to save inspection data.' });
        }
    };


    const getStatusVariant = (status: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Active': return 'default';
            case 'Upcoming': return 'secondary';
            case 'Completed': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusClass = (status: string | undefined) => {
        if (status === 'Active') return 'bg-green-600 hover:bg-green-700';
        return '';
    }
    
    const filteredReservations = React.useMemo(() => {
        const term = searchTerm || '';
        if (!term) {
            return reservations;
        }
        const lowercasedTerm = term.toLowerCase();
        
        return reservations.filter(res => {
            if (!res) return false;
            
            const customerNameMatch = typeof res.customerName === 'string' && res.customerName.toLowerCase().includes(lowercasedTerm);
            const idMatch = typeof res.id === 'string' && res.id.toLowerCase().includes(lowercasedTerm);
            const vehicleMatch = typeof res.vehicle === 'string' && res.vehicle.toLowerCase().includes(lowercasedTerm);
            
            return customerNameMatch || idMatch || vehicleMatch;
        });
    }, [reservations, searchTerm]);
    
    if (loading) {
        return (
             <div className="flex justify-center items-center h-96">
                <div className="flex flex-col items-center gap-2 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-lg font-semibold">Cargando Reservaciones...</p>
                    <p className="text-sm text-muted-foreground">Por favor espere mientras buscamos los datos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Reservations</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Reservation
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Reservations</CardTitle>
                    <CardDescription>View, create, and manage all vehicle reservations.</CardDescription>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by customer, vehicle, or ID..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredReservations.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reservation ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Pickup</TableHead>
                                    <TableHead>Drop-off</TableHead>
                                    <TableHead>Total Cost</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReservations.map((res) => (
                                    <TableRow key={res?.id || Math.random()} className={highlightedRes === res?.id ? 'bg-primary/10 transition-all duration-500' : ''}>
                                        <TableCell className="font-medium">{res?.id || 'N/A'}</TableCell>
                                        <TableCell>{res?.customerName || 'N/A'}</TableCell>
                                        <TableCell>{res?.vehicle || 'N/A'}</TableCell>
                                        <TableCell>{res?.pickupDate || 'N/A'}</TableCell>
                                        <TableCell>{res?.dropoffDate || 'N/A'}</TableCell>
                                        <TableCell>${res?.totalCost?.toFixed(2) || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(res?.status)}
                                                className={getStatusClass(res?.status)}
                                            >
                                                {res?.status || 'Unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    
                                                    {res?.status === 'Upcoming' && (
                                                        <DropdownMenuItem onClick={() => handleStartInspection(res, 'departure')} disabled={!res || !!res.departureInspection}>
                                                            <FileCheck className="mr-2 h-4 w-4" />
                                                            {res.departureInspection ? 'Departure Done' : 'Start Departure'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {res?.status === 'Active' && (
                                                        <DropdownMenuItem onClick={() => handleStartInspection(res, 'return')} disabled={!res || !!res.returnInspection}>
                                                            <Undo2 className="mr-2 h-4 w-4" />
                                                            {res.returnInspection ? 'Return Done' : 'Start Return'}
                                                        </DropdownMenuItem>
                                                    )}

                                                    {(res?.departureInspection || res?.returnInspection) && (
                                                        <DropdownMenuItem onClick={() => handleStartInspection(res, res.returnInspection ? 'return' : 'departure')}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Inspections
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem onClick={() => handleGenerateContract(res)} disabled={!res || res.status === 'Cancelled'}>
                                                        <FileSignature className="mr-2 h-4 w-4" />
                                                        Generate Contract
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleGenerateInvoice(res)} disabled={!res || res.status === 'Cancelled'}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Generate Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => res && handleOpenDialog(res)} disabled={!res}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                onSelect={(e) => e.preventDefault()}
                                                                className="text-destructive focus:text-destructive"
                                                                disabled={!res || res.status === 'Cancelled' || res.status === 'Completed' || res.status === 'Active'}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Cancel Reservation
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will cancel the reservation for <span className="font-semibold">{res?.customerName}</span> ({res?.id}). This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Back</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleCancelReservation(res)} className="bg-destructive hover:bg-destructive/90">
                                                                    Yes, Cancel Reservation
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground">
                            <Info className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Reservations Found</h3>
                            <p className="mt-2 text-sm">No reservations match your search criteria. Try a different search or create a new reservation.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Reservation' : 'Create New Reservation'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update the details for this reservation.' : 'Fill out the form to create a new reservation.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="customer">Customer</Label>
                            <CustomerCombobox
                                customers={customers}
                                onCustomerSelect={handleCustomerSelect}
                                selectedCustomerId={reservationData.customerId}
                            />
                        </div>
                        <div>
                            <Label htmlFor="vehicleId">Vehicle</Label>
                            <Select onValueChange={handleSelectChange('vehicleId')} value={String(reservationData.vehicleId)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehiclesForDropdown.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.make} {v.model} ({v.plate})
                                            {v.status !== 'Available' && <span className="text-muted-foreground ml-2">({v.status})</span>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="pickupDate">Pickup Date</Label>
                                <Input id="pickupDate" type="date" value={reservationData.pickupDate} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="dropoffDate">Drop-off Date</Label>
                                <Input id="dropoffDate" type="date" value={reservationData.dropoffDate} onChange={handleInputChange} required />
                            </div>
                        </div>
                         <div>
                            <Label htmlFor="status">Status</Label>
                            <Select onValueChange={(value) => handleSelectChange('status')(value)} value={reservationData.status} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">{isEditing ? 'Save Changes' : 'Create Reservation'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {isInspectionModalOpen && (
                <DepartureInspectionModal
                    isOpen={isInspectionModalOpen}
                    onClose={() => setIsInspectionModalOpen(false)}
                    onSubmit={handleInspectionSubmit}
                    reservation={inspectingReservation}
                    inspectionType={inspectionType}
                />
            )}
        </div>
    );
}

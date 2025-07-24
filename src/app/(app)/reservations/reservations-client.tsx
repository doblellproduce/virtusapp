

'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, FileText, FileCheck, Eye, Undo2 } from 'lucide-react';
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
    const [open, setOpen] = React.useState(false);
    const [editingReservation, setEditingReservation] = React.useState<Reservation | null>(null);
    const [reservationData, setReservationData] = React.useState<NewReservation>(emptyReservation);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [highlightedRes, setHighlightedRes] = React.useState<string | null>(null);
    
    const [isInspectionModalOpen, setIsInspectionModalOpen] = React.useState(false);
    const [inspectingReservation, setInspectingReservation] = React.useState<Reservation | null>(null);
    const [inspectionType, setInspectionType] = React.useState<'departure' | 'return'>('departure');

    React.useEffect(() => {
        if (!db) return;
        const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        });
        const unsubReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
            const reservationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            setReservations(reservationsData);
        });
        const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(customersData);
        });
        return () => {
            unsubVehicles();
            unsubReservations();
            unsubCustomers();
        };
    }, [db]);

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
        return `RES-${String(maxId + 1).padStart(3, '0')}`;
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
        if (!db) return;

        const isAvailable = await checkVehicleAvailability(reservationData.vehicleId, reservationData.pickupDate, reservationData.dropoffDate, isEditing ? editingReservation?.id : undefined);
        if (!isAvailable) {
            return;
        }

        const agentName = user?.displayName ?? 'System';
        const selectedVehicle = vehicles.find(v => v.id === reservationData.vehicleId);

        if (!selectedVehicle) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Selected vehicle not found. Please try again.',
            });
            return;
        }

        const originalVehicleId = isEditing ? editingReservation?.vehicleId : null;

        if (isEditing && editingReservation) {
            const resRef = doc(db, 'reservations', editingReservation.id);
            await updateDoc(resRef, {
                ...reservationData,
                vehicle: selectedVehicle.make + ' ' + selectedVehicle.model,
            });

            await logActivity('Update', 'Reservation', editingReservation.id, `Updated reservation for ${reservationData.customerName}.`);

            if (originalVehicleId && originalVehicleId !== selectedVehicle.id) {
                const oldVehicleRef = doc(db, 'vehicles', originalVehicleId);
                await updateDoc(oldVehicleRef, { status: 'Available' });
                await logActivity('Update', 'Vehicle', originalVehicleId, `Status set to Available (reservation updated).`);

                const newVehicleRef = doc(db, 'vehicles', selectedVehicle.id);
                await updateDoc(newVehicleRef, { status: 'Rented' });
                await logActivity('Update', 'Vehicle', selectedVehicle.id, `Status set to Rented (reservation updated).`);
            }

            toast({ title: "Reservation Updated" });
        } else {
            const newId = generateNewReservationId();
            const reservationToAdd: Omit<Reservation, 'id'> = {
                ...reservationData,
                vehicle: selectedVehicle.make + ' ' + selectedVehicle.model,
                agent: agentName,
            };
            await setDoc(doc(db, 'reservations', newId), reservationToAdd);
            await logActivity('Create', 'Reservation', newId, `Created reservation for ${reservationToAdd.customerName} with vehicle ${reservationToAdd.vehicle}`);

            const vehicleRef = doc(db, 'vehicles', selectedVehicle.id);
            await updateDoc(vehicleRef, { status: 'Rented' });
            await logActivity('Update', 'Vehicle', selectedVehicle.id, `Status set to Rented (new reservation).`);

            toast({ title: "Reservation Created" });
        }
        setOpen(false);
    };
    
    React.useEffect(() => {
        if (!open) {
            setEditingReservation(null);
            setReservationData(emptyReservation);
        }
    }, [open]);
    
    const handleCancelReservation = async (reservation: Reservation) => {
        if (!db) return;
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
    
    const handleGenerateInvoice = async (reservation: Reservation) => {
        if (!db) return;
        const agentName = user?.displayName ?? 'System';
        
        const newInvoiceId = `INV-2024-${String(Date.now()).slice(-4)}`;
        
        const newInvoice = {
            id: newInvoiceId,
            customer: reservation.customerName,
            date: new Date().toISOString().split('T')[0],
            amount: String(reservation.totalCost?.toFixed(2) || '0.00'),
            status: 'Draft' as const,
            createdBy: agentName,
            paymentMethod: 'N/A' as const,
            reservationId: reservation.id, // <-- Added reference ID
        };

        await setDoc(doc(db, 'invoices', newInvoiceId), newInvoice);
        await logActivity('Create', 'Invoice', newInvoiceId, `Generated invoice for reservation ${reservation.id}`);
        
        toast({
            title: 'Invoice Generated',
            description: `Invoice ${newInvoiceId} for ${reservation.id} created with amount $${newInvoice.amount}.`,
        });
    };
    
    const handleStartInspection = (reservation: Reservation, type: 'departure' | 'return') => {
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


    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Upcoming': return 'secondary';
            case 'Completed': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusClass = (status: string) => {
        if (status === 'Active') return 'bg-green-600 hover:bg-green-700';
        return '';
    }
    
    const filteredReservations = React.useMemo(() => {
        if (!searchTerm) {
            return reservations;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return reservations.filter(res => {
            // Robustly check if res and its properties exist before calling toLowerCase
            if (!res) return false;
            
            const customerNameMatch = typeof res.customerName === 'string' && res.customerName.toLowerCase().includes(lowercasedTerm);
            const idMatch = typeof res.id === 'string' && res.id.toLowerCase().includes(lowercasedTerm);
                
            return customerNameMatch || idMatch;
        });
    }, [reservations, searchTerm]);
    
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
                            placeholder="Search by customer or reservation ID..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
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
                                <TableRow key={res?.id || Math.random()} className={highlightedRes === res.id ? 'bg-primary/10 transition-all duration-500' : ''}>
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
                                                
                                                {res.status === 'Upcoming' && (
                                                    <DropdownMenuItem onClick={() => handleStartInspection(res, 'departure')} disabled={!!res.departureInspection}>
                                                        <FileCheck className="mr-2 h-4 w-4" />
                                                        {res.departureInspection ? 'Departure Done' : 'Start Departure'}
                                                    </DropdownMenuItem>
                                                )}
                                                {res.status === 'Active' && (
                                                     <DropdownMenuItem onClick={() => handleStartInspection(res, 'return')} disabled={!!res.returnInspection}>
                                                        <Undo2 className="mr-2 h-4 w-4" />
                                                         {res.returnInspection ? 'Return Done' : 'Start Return'}
                                                    </DropdownMenuItem>
                                                )}

                                                 {(res.departureInspection || res.returnInspection) && (
                                                    <DropdownMenuItem onClick={() => handleStartInspection(res, res.returnInspection ? 'return' : 'departure')}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Inspections
                                                    </DropdownMenuItem>
                                                )}
                                                
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => handleGenerateInvoice(res)} disabled={res.status === 'Cancelled' || res.status === 'Pending Signature'}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Generate Invoice
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(res)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="text-destructive focus:text-destructive"
                                                            disabled={res.status === 'Cancelled' || res.status === 'Completed' || res.status === 'Active'}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Cancel Reservation
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will cancel the reservation for <span className="font-semibold">{res.customerName}</span> ({res.id}). This action cannot be undone.
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

    
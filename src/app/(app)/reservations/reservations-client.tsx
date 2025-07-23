
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import type { Reservation, Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

type NewReservation = Omit<Reservation, 'id' | 'agent' | 'vehicle'>;

const emptyReservation: NewReservation = {
    customer: '',
    vehicleId: '',
    pickupDate: '',
    dropoffDate: '',
    status: 'Upcoming',
};

export default function ReservationsClient() {
    const { user, db } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [open, setOpen] = React.useState(false);
    const [editingReservation, setEditingReservation] = React.useState<Reservation | null>(null);
    const [reservationData, setReservationData] = React.useState<NewReservation>(emptyReservation);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [highlightedRes, setHighlightedRes] = React.useState<string | null>(null);

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
        return () => {
            unsubVehicles();
            unsubReservations();
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
    
    // QA Enhancement: Filter for available vehicles for new reservations
    const availableVehicles = vehicles.filter(v => v.status === 'Available');

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

    const generateNewReservationId = () => {
        const maxId = reservations.reduce((max, res) => {
            const idNum = parseInt(res.id.split('-')[1]);
            return idNum > max ? idNum : max;
        }, 0);
        return `RES-${String(maxId + 1).padStart(3, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;

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

        if (isEditing && editingReservation) {
            const resRef = doc(db, 'reservations', editingReservation.id);
            await updateDoc(resRef, {
                ...reservationData,
                vehicle: selectedVehicle.make + ' ' + selectedVehicle.model,
            });
            toast({ title: "Reservation Updated" });
        } else {
            const newId = generateNewReservationId();
            const reservationToAdd: Omit<Reservation, 'id'> = {
                ...reservationData,
                vehicle: selectedVehicle.make + ' ' + selectedVehicle.model,
                agent: agentName,
            };
            await setDoc(doc(db, 'reservations', newId), reservationToAdd);
            toast({ title: "Reservation Created" });
        }
        setOpen(false);
    };
    
    // Reset state when dialog closes
    React.useEffect(() => {
        if (!open) {
            setEditingReservation(null);
            setReservationData(emptyReservation);
        }
    }, [open]);
    
    const handleCancelReservation = async (reservationId: string) => {
        if (!db) return;
        const resRef = doc(db, 'reservations', reservationId);
        await updateDoc(resRef, { status: 'Cancelled' });
        toast({
            title: "Reservation Cancelled",
            description: `Reservation ${reservationId} has been successfully cancelled.`,
        });
    };
    
    const handleGenerateInvoice = async (reservation: Reservation) => {
        if (!db) return;
        const agentName = user?.displayName ?? 'System';
        
        // This is a simplified ID generation, a more robust solution would use a counter on the server
        const newInvoiceId = `INV-2024-${String(Date.now()).slice(-4)}`;
        
        const newInvoice = {
            id: newInvoiceId,
            customer: reservation.customer,
            date: new Date().toISOString().split('T')[0],
            amount: String(reservation.totalCost?.toFixed(2) || '0.00'),
            status: 'Draft' as const,
            createdBy: agentName,
            paymentMethod: 'N/A' as const,
        };

        await setDoc(doc(db, 'invoices', newInvoiceId), newInvoice);
        
        toast({
            title: 'Invoice Generated',
            description: `Invoice ${newInvoiceId} for ${reservation.id} created with amount $${newInvoice.amount}.`,
        });
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
    
    const filteredReservations = reservations.filter(res => 
        res.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                <TableRow key={res.id} className={highlightedRes === res.id ? 'bg-primary/10 transition-all duration-500' : ''}>
                                    <TableCell className="font-medium">{res.id}</TableCell>
                                    <TableCell>{res.customer}</TableCell>
                                    <TableCell>{res.vehicle}</TableCell>
                                    <TableCell>{res.pickupDate}</TableCell>
                                    <TableCell>{res.dropoffDate}</TableCell>
                                    <TableCell>${res.totalCost?.toFixed(2) || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStatusVariant(res.status)}
                                            className={getStatusClass(res.status)}
                                        >
                                            {res.status}
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
                                                <DropdownMenuItem onClick={() => handleOpenDialog(res)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleGenerateInvoice(res)} disabled={res.status === 'Cancelled' || res.status === 'Pending Signature'}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Generate Invoice
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="text-destructive focus:text-destructive"
                                                            disabled={res.status === 'Cancelled' || res.status === 'Completed'}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Cancel Reservation
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will cancel the reservation for <span className="font-semibold">{res.customer}</span> ({res.id}). This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Back</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleCancelReservation(res.id)} className="bg-destructive hover:bg-destructive/90">
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
                            <Label htmlFor="customer">Customer Name</Label>
                            <Input id="customer" value={reservationData.customer} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="vehicleId">Vehicle</Label>
                            <Select onValueChange={handleSelectChange('vehicleId')} value={String(reservationData.vehicleId)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isEditing && editingReservation ? (
                                        // If editing, show all vehicles in case the original vehicle is now unavailable, but add current one if not available
                                         <>
                                            {availableVehicles.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</SelectItem>
                                            ))}
                                            {!availableVehicles.find(v => v.id === editingReservation.vehicleId) && (
                                                <SelectItem key={editingReservation.vehicleId} value={editingReservation.vehicleId}>
                                                   (Not Available) {editingReservation.vehicle}
                                                </SelectItem>
                                            )}
                                        </>
                                    ) : (
                                        // If creating, only show available vehicles
                                        availableVehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</SelectItem>
                                        ))
                                    )}
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
        </div>
    );

    

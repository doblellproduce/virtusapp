
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Search, Loader2, RefreshCw, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type EditableVehicle = Omit<Vehicle, 'id' | 'dataAiHint'>;

const emptyVehicle: EditableVehicle = {
    make: '',
    model: '',
    plate: '',
    category: 'Economy',
    status: 'Available',
    imageUrls: [],
    pricePerDay: 0,
    insuranceCost: 0,
    deductible: 0,
    specs: { seats: 5, transmission: 'Automatic', engine: '' },
    lastServiceDate: new Date().toISOString().split('T')[0],
};


export default function VehiclesPage() {
    const { toast } = useToast();
    const { user, db, storage } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null>(null);
    const [vehicleData, setVehicleData] = React.useState<EditableVehicle>(emptyVehicle);
    const [imageFiles, setImageFiles] = React.useState<FileList | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);

    const fetchVehicles = React.useCallback(async () => {
        if (!db) return;
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'vehicles'));
            const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Error fetching vehicles: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch vehicle data. Check Firestore rules.' });
        } finally {
            setLoading(false);
        }
    }, [toast, db]);

    React.useEffect(() => {
        if(db) fetchVehicles();
    }, [fetchVehicles, db]);

    const isEditing = editingVehicle !== null;

    const handleOpenDialog = (vehicle: Vehicle | null = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            const { id, dataAiHint, ...editableData } = vehicle;
            setVehicleData(editableData);
            setImagePreviews(editableData.imageUrls || []);
        } else {
            setEditingVehicle(null);
            setVehicleData(emptyVehicle);
            setImagePreviews([]);
        }
        setImageFiles(null);
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
        setVehicleData(prev => ({ ...prev, [id]: processedValue }));
    }
    
    const handleSpecsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const processedValue = type === 'number' ? parseInt(value, 10) || 0 : value;
        setVehicleData(prev => ({
            ...prev,
            specs: { ...prev.specs, [id]: processedValue }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setImageFiles(files);
            const previews = Array.from(files).map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        } else {
            setImageFiles(null);
            setImagePreviews(isEditing ? vehicleData.imageUrls : []);
        }
    }

    const handleSelectChange = (id: keyof EditableVehicle) => (value: string) => {
        setVehicleData(prev => ({...prev, [id]: value as any }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !storage || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firebase is not initialized or user is not logged in.' });
            return;
        }
        
        setIsSubmitting(true);
        let finalImageUrls: string[] = editingVehicle?.imageUrls || [];

        try {
            if (imageFiles && imageFiles.length > 0) {
                 const uploadPromises = Array.from(imageFiles).map(async (file) => {
                    const storageRef = ref(storage, `vehicles/${user.uid}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                });
                const newImageUrls = await Promise.all(uploadPromises);
                // When editing, you might want to add to existing images, not replace.
                // For this form, we will replace them.
                finalImageUrls = newImageUrls;
            }

            if (finalImageUrls.length === 0) {
                toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload at least one image for the new vehicle.' });
                setIsSubmitting(false);
                return;
            }

            const dataToSave: Omit<Vehicle, 'id'> = {
                ...vehicleData,
                imageUrls: finalImageUrls,
                dataAiHint: `${vehicleData.make} ${vehicleData.model}`,
            };

            if (isEditing && editingVehicle) {
                const vehicleRef = doc(db, 'vehicles', String(editingVehicle.id));
                await updateDoc(vehicleRef, dataToSave as { [x: string]: any; });
                toast({ title: 'Vehicle Updated', description: 'The vehicle has been successfully updated.' });
            } else {
                await addDoc(collection(db, 'vehicles'), dataToSave);
                toast({ title: 'Vehicle Added', description: 'The new vehicle has been added to the catalog.' });
            }
            setOpen(false);
            fetchVehicles();
        } catch (error: any) {
            console.error("handleSubmit ERROR:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: `Error: ${error.message}. Please check console.` });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDelete = async (vehicleId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'vehicles', vehicleId));
            toast({ title: 'Vehicle Deleted', description: 'The vehicle has been removed from the catalog.' });
            fetchVehicles(); // Refresh data
        } catch (error) {
             console.error("Error deleting vehicle: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete vehicle.' });
        }
    };

    React.useEffect(() => {
        if (!open) {
            setEditingVehicle(null);
            setVehicleData(emptyVehicle);
            setImageFiles(null);
            setImagePreviews([]);
            setIsSubmitting(false);
        }
    }, [open]);
    
    const filteredVehicles = vehicles.filter(v => 
        v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.plate.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Vehicles</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchVehicles} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Vehicle
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Catalog</CardTitle>
                    <CardDescription>Manage your fleet of vehicles. Data is now live from Firestore.</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by make, model, or plate..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                <TableHead>Make & Model</TableHead>
                                <TableHead>Plate</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price/Day</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVehicles.map((vehicle) => (
                                <TableRow key={vehicle.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                          src={vehicle.imageUrls?.[0] || 'https://placehold.co/64x64.png'}
                                          alt={`${vehicle.make} ${vehicle.model}`}
                                          width={64}
                                          height={64}
                                          className="rounded-md object-cover"
                                          data-ai-hint={vehicle.dataAiHint}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                                    <TableCell>{vehicle.plate}</TableCell>
                                    <TableCell>{vehicle.category}</TableCell>
                                     <TableCell>${vehicle.pricePerDay.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                vehicle.status === 'Available' ? 'default' :
                                                vehicle.status === 'Rented' ? 'destructive' :
                                                'secondary'
                                            }
                                            className={
                                                vehicle.status === 'Available' ? 'bg-green-600 hover:bg-green-700' : ''
                                            }
                                        >
                                            {vehicle.status}
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
                                                <DropdownMenuItem onClick={() => handleOpenDialog(vehicle)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the vehicle <span className="font-semibold">{vehicle.make} {vehicle.model}</span>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(String(vehicle.id))} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, delete vehicle
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
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update the details of the vehicle.' : 'Fill in the details below to add a new vehicle.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                            <div>
                                <Label htmlFor="make">Make</Label>
                                <Input id="make" value={vehicleData.make} onChange={handleInputChange} placeholder="e.g. Toyota" required disabled={isSubmitting} />
                            </div>
                             <div>
                                <Label htmlFor="model">Model</Label>
                                <Input id="model" value={vehicleData.model} onChange={handleInputChange} placeholder="e.g. Camry" required disabled={isSubmitting} />
                            </div>
                             <div>
                                <Label htmlFor="plate">Plate</Label>
                                <Input id="plate" value={vehicleData.plate} onChange={handleInputChange} placeholder="e.g. AB123CD" required disabled={isSubmitting} />
                            </div>
                             <div>
                                <Label htmlFor="pricePerDay">Price per Day ($)</Label>
                                <Input id="pricePerDay" type="number" value={vehicleData.pricePerDay} onChange={handleInputChange} placeholder="55.00" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <Label htmlFor="insuranceCost">Insurance per Day ($)</Label>
                                <Input id="insuranceCost" type="number" value={vehicleData.insuranceCost} onChange={handleInputChange} placeholder="10.00" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <Label htmlFor="deductible">Deductible ($)</Label>
                                <Input id="deductible" type="number" value={vehicleData.deductible} onChange={handleInputChange} placeholder="500.00" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <Label htmlFor="category">Category</Label>
                                 <Select onValueChange={(value) => handleSelectChange('category')(value)} value={vehicleData.category} required disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sedan">Sedan</SelectItem>
                                        <SelectItem value="SUV">SUV</SelectItem>
                                        <SelectItem value="Economy">Economy</SelectItem>
                                        <SelectItem value="Luxury">Luxury</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={(value) => handleSelectChange('status')(value)} value={vehicleData.status} disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Rented">Rented</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="lastServiceDate">Last Service Date</Label>
                                <Input id="lastServiceDate" type="date" value={vehicleData.lastServiceDate} onChange={handleInputChange} required disabled={isSubmitting} />
                            </div>
                           <div className="md:col-span-3">
                                <Label>Specifications</Label>
                                <div className="grid grid-cols-3 gap-2 mt-1 rounded-lg border p-2">
                                    <div>
                                         <Label htmlFor="seats" className="text-xs text-muted-foreground">Seats</Label>
                                         <Input id="seats" type="number" value={vehicleData.specs.seats} onChange={handleSpecsChange} placeholder="5" required disabled={isSubmitting} />
                                    </div>
                                    <div>
                                         <Label htmlFor="transmission" className="text-xs text-muted-foreground">Transmission</Label>
                                         <Input id="transmission" value={vehicleData.specs.transmission} onChange={handleSpecsChange} placeholder="Automatic" required disabled={isSubmitting} />
                                    </div>
                                    <div>
                                         <Label htmlFor="engine" className="text-xs text-muted-foreground">Engine</Label>
                                         <Input id="engine" value={vehicleData.specs.engine} onChange={handleSpecsChange} placeholder="1.4L" required disabled={isSubmitting} />
                                    </div>
                                </div>
                           </div>
                            <div className="md:col-span-3">
                                <Label htmlFor="imageFile">Vehicle Images (first image is the primary)</Label>
                                <Input id="imageFile" type="file" onChange={handleFileChange} accept="image/*" multiple disabled={isSubmitting} />
                            </div>
                            {imagePreviews.length > 0 && (
                                 <div className="md:col-span-3">
                                     <Label className="text-sm">Image Previews</Label>
                                     <div className="mt-2 grid grid-cols-3 md:grid-cols-5 gap-2">
                                        {imagePreviews.map((previewUrl, index) => (
                                            <Image key={index} src={previewUrl} alt={`Vehicle preview ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                                        ))}
                                     </div>
                                 </div>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Add Vehicle'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

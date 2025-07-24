

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, LogOut, Car, Calendar, Star, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onSnapshot, collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Reservation, Review } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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


export default function ClientDashboardPage() {
    const { user, userProfile, loading, logout, db, logActivity } = useAuth();
    const router = useRouter();
    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [loadingReservations, setLoadingReservations] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);
    
    React.useEffect(() => {
        if (!db || !user) return;
        
        setLoadingReservations(true);
        const q = query(collection(db, "reservations"), where("customerId", "==", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userReservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            userReservations.sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime());
            setReservations(userReservations);
            setLoadingReservations(false);
        }, (error) => {
            console.error("Error fetching reservations: ", error);
            setLoadingReservations(false);
        });

        return () => unsubscribe();
    }, [db, user]);

    if (loading || !user || !userProfile) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleCancelReservation = async (reservation: Reservation) => {
        if (!db || !reservation?.id || !reservation.vehicleId) return;
        const resRef = doc(db, 'reservations', reservation.id);
        await updateDoc(resRef, { status: 'Cancelled' });

        const vehicleRef = doc(db, 'vehicles', reservation.vehicleId);
        await updateDoc(vehicleRef, { status: 'Available' });
        
        await logActivity('Cancel', 'Reservation', reservation.id, `Client ${userProfile.name} cancelled reservation.`);
        
        toast({
            title: "Reservation Cancelled",
            description: `Your reservation ${reservation.id} has been successfully cancelled.`,
        });
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).join('');
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
    };

    return (
        <div className="bg-muted/40 min-h-screen">
            <header className="bg-background shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="text-2xl font-bold tracking-wider text-primary">
                        VIRTUS
                    </Link>
                    <div className="flex items-center gap-4">
                         <Avatar className="h-9 w-9">
                            <AvatarImage src={userProfile.photoURL} />
                            <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Welcome, {userProfile.name?.split(' ')[0]}!</h1>
                    <p className="text-muted-foreground">Manage your reservations and view your history here.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Reservations</CardTitle>
                        <CardDescription>Here is a list of all your past and upcoming vehicle rentals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingReservations ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="text-center py-10">
                                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No Reservations Found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">You haven't made any reservations yet.</p>
                                <Button asChild className="mt-6">
                                    <Link href="/#fleet-section">
                                        <Car className="mr-2 h-4 w-4" />
                                        Browse Vehicles
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reservations.map(res => (
                                    <Card key={res.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex-grow space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusVariant(res.status)} className={getStatusClass(res.status)}>
                                                    {res.status}
                                                </Badge>
                                                <p className="font-semibold text-lg">{res.vehicle}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {res.pickupDate} to {res.dropoffDate}
                                            </p>
                                             <p className="text-xs text-muted-foreground">Reservation ID: {res.id}</p>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            {res.status === 'Completed' && (
                                                <Button variant="outline" size="sm">
                                                    <Star className="mr-2 h-4 w-4" />
                                                    Leave a Review
                                                </Button>
                                            )}
                                            {res.status === 'Upcoming' && (
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Cancel
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently cancel your reservation for the {res.vehicle}. This action cannot be undone.
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
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

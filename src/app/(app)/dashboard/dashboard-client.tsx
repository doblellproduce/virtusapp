
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ArrowRight, Car, User, DollarSign, Wrench, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Reservation, Vehicle } from '@/lib/types';
import { collection, onSnapshot, query } from 'firebase/firestore';

// Define a type for invoices since we are fetching them now
type Invoice = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  createdBy: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'N/A';
};

// Function to format currency, moved to module scope
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

const chartData = [
  { month: "Jan", revenue: 18600 },
  { month: "Feb", revenue: 30500 },
  { month: "Mar", revenue: 23700 },
  { month: "Apr", revenue: 27800 },
  { month: "May", revenue: 18900 },
  { month: "Jun", revenue: 23900 },
  { month: "Jul", revenue: 34900 },
];


function StatCard({ title, value, icon: Icon, description, isLoading }: { title: string, value: string, icon: React.ElementType, description: string, isLoading?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function RecentReservations({ reservations }: { reservations: Reservation[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Reservations</CardTitle>
                 <CardDescription>A quick look at the 5 most recent bookings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.slice(0, 5).map(res => (
                            <TableRow key={res.id}>
                                <TableCell>
                                    <div className="font-medium">{res.customer}</div>
                                    <div className="text-sm text-muted-foreground">{res.pickupDate}</div>
                                </TableCell>
                                <TableCell>{res.vehicle}</TableCell>
                                <TableCell>
                                     <Badge variant={
                                        res.status === 'Active' ? 'default' :
                                        res.status === 'Upcoming' ? 'secondary' :
                                        res.status === 'Completed' ? 'outline' :
                                        'destructive'
                                    } className={res.status === 'Active' ? 'bg-green-600' : ''}>
                                        {res.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/reservations">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function RevenueChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={chartData} accessibilityLayer>
                        <XAxis
                            dataKey="month"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip 
                            cursor={{fill: 'hsl(var(--accent))', radius: 4}} 
                            content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>The last 5 invoices generated.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {invoices.slice(0, 5).map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <div className="font-medium">{invoice.customer}</div>
                                    <div className="text-sm text-muted-foreground">{invoice.date}</div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(parseFloat(invoice.amount))}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/invoices">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function DashboardClient() {
    const { userProfile, db } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;

        const collectionsToMonitor = 3;
        let collectionsLoaded = 0;

        const onDataLoaded = () => {
            collectionsLoaded++;
            if (collectionsLoaded === collectionsToMonitor) {
                setLoading(false);
            }
        };
        
        const unsubVehicles = onSnapshot(query(collection(db, 'vehicles')), (snapshot) => {
            setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
            onDataLoaded();
        }, (error) => { console.error("Error fetching vehicles:", error); onDataLoaded(); });

        const unsubReservations = onSnapshot(query(collection(db, 'reservations')), (snapshot) => {
            setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
            onDataLoaded();
        }, (error) => { console.error("Error fetching reservations:", error); onDataLoaded(); });

        const unsubInvoices = onSnapshot(query(collection(db, 'invoices')), (snapshot) => {
            setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
            onDataLoaded();
        }, (error) => { console.error("Error fetching invoices:", error); onDataLoaded(); });
        
        return () => {
            unsubVehicles();
            unsubReservations();
            unsubInvoices();
        };

    }, [db]);


    const totalRevenue = !loading ? invoices.reduce((acc, inv) => acc + parseFloat(inv.amount || '0'), 0) : 0;
    const activeRentals = !loading ? reservations.filter(r => r.status === 'Active').length : 0;
    const availableVehicles = !loading ? vehicles.filter(v => v.status === 'Available').length : 0;
    const vehiclesInMaintenance = !loading ? vehicles.filter(v => v.status === 'Maintenance').length : 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome back, {userProfile?.name?.split(' ')[0] || 'Admin'}!</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Revenue" 
                    value={formatCurrency(totalRevenue)}
                    icon={DollarSign}
                    description="+20.1% from last month"
                    isLoading={loading}
                />
                 <StatCard 
                    title="Active Rentals" 
                    value={`+${activeRentals}`}
                    icon={User}
                    description="Currently on the road"
                    isLoading={loading}
                />
                 <StatCard 
                    title="Vehicles Available" 
                    value={`${availableVehicles}`}
                    icon={Car}
                    description="Ready for new rentals"
                    isLoading={loading}
                />
                 <StatCard 
                    title="In Maintenance" 
                    value={`${vehiclesInMaintenance}`}
                    icon={Wrench}
                    description="Temporarily unavailable"
                    isLoading={loading}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RevenueChart />
                </div>
                 <div className="lg:col-span-3">
                    <RecentInvoices invoices={invoices} />
                </div>
            </div>
             <div className="grid gap-6 md:grid-cols-1">
                <RecentReservations reservations={reservations} />
            </div>
        </div>
    );
}

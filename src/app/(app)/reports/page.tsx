
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, Coins, TrendingUp, TrendingDown, Loader2, Printer } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Vehicle, Reservation, Invoice, Expense } from '@/lib/types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: React.ElementType, colorClass?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", colorClass)} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

function VehicleProfitabilityReport() {
    const { db } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>('');
    const [loading, setLoading] = React.useState(true);
    const [reportData, setReportData] = React.useState<{
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        invoices: Invoice[];
        expenses: Expense[];
    } | null>(null);
    const [isCalculating, setIsCalculating] = React.useState(false);

    React.useEffect(() => {
        const fetchVehicles = async () => {
            if (!db) return;
            try {
                const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
                const vehiclesData = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
                setVehicles(vehiclesData);
            } catch (error) {
                console.error("Error fetching vehicles:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, [db]);

    const handleGenerateReport = async () => {
        if (!selectedVehicleId || !db) return;
        setIsCalculating(true);
        setReportData(null);

        try {
            // Find invoices directly linked to reservations for this vehicle
            const reservationsQuery = query(collection(db, 'reservations'), where('vehicleId', '==', selectedVehicleId));
            const reservationsSnapshot = await getDocs(reservationsQuery);
            const reservationIds = reservationsSnapshot.docs.map(doc => doc.id);

            let totalRevenue = 0;
            let fetchedInvoices: Invoice[] = [];

            if (reservationIds.length > 0) {
                 // Firestore 'in' queries are limited to 30 items. For more reservations, chunking would be needed.
                const invoicesQuery = query(collection(db, 'invoices'), where('reservationId', 'in', reservationIds));
                const invoicesSnapshot = await getDocs(invoicesQuery);
                fetchedInvoices = invoicesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Invoice));
                totalRevenue = fetchedInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
            }

            // Find expenses directly linked to the vehicle
            const expensesQuery = query(collection(db, 'expenses'), where('vehicleId', '==', selectedVehicleId));
            const expensesSnapshot = await getDocs(expensesQuery);
            const fetchedExpenses = expensesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Expense));
            const totalExpenses = fetchedExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);
            
            setReportData({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                invoices: fetchedInvoices,
                expenses: fetchedExpenses
            });

        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsCalculating(false);
        }
    };
    
    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Profitability Analysis</CardTitle>
                    <CardDescription>Analyze the financial performance of individual vehicles in your fleet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="flex-grow">
                            <label htmlFor="vehicle-select" className="text-sm font-medium">Select a Vehicle</label>
                            <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                                <SelectTrigger id="vehicle-select" disabled={loading}>
                                    <SelectValue placeholder={loading ? "Loading vehicles..." : "Choose a vehicle"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.make} {v.model} ({v.plate})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateReport} disabled={!selectedVehicleId || isCalculating}>
                            {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isCalculating && (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}
            
            {reportData && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                         <StatCard title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} icon={TrendingUp} colorClass="text-green-500"/>
                         <StatCard title="Total Expenses" value={formatCurrency(reportData.totalExpenses)} icon={TrendingDown} colorClass="text-red-500"/>
                         <StatCard title="Net Profit" value={formatCurrency(reportData.netProfit)} icon={DollarSign} colorClass={reportData.netProfit >= 0 ? "text-green-500" : "text-red-500"}/>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Revenue Breakdown (Invoices)</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.invoices.length > 0 ? reportData.invoices.map(inv => (
                                            <TableRow key={inv.id}><TableCell>{inv.date}</TableCell><TableCell>{inv.customer}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(inv.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No invoices found for this vehicle.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.expenses.length > 0 ? reportData.expenses.map(exp => (
                                            <TableRow key={exp.id}><TableCell>{exp.date}</TableCell><TableCell>{exp.description}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(exp.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No expenses found for this vehicle.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

function FinancialSummaryReport() {
    const { db } = useAuth();
    const [date, setDate] = React.useState<DateRange | undefined>(undefined);
    const [reportData, setReportData] = React.useState<{
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        invoices: Invoice[];
        expenses: Expense[];
        chartData: { name: string; Ingresos: number; Gastos: number }[];
    } | null>(null);
    const [isCalculating, setIsCalculating] = React.useState(false);
    
    // Set initial date range to last month with data
    React.useEffect(() => {
        if (!db) return;
        
        const findLastActivityMonth = async () => {
             // Let's check invoices for the last activity
             const lastInvoiceQuery = query(collection(db, "invoices"), orderBy("date", "desc"), limit(1));
             const snapshot = await getDocs(lastInvoiceQuery);
             let lastActivityDate = new Date();

             if (!snapshot.empty) {
                 lastActivityDate = new Date(snapshot.docs[0].data().date);
             }
             
             setDate({
                 from: startOfMonth(lastActivityDate),
                 to: endOfMonth(lastActivityDate)
             });
        };
        findLastActivityMonth();
    }, [db]);


    const handleGenerateReport = React.useCallback(async (range: DateRange | undefined) => {
        if (!range?.from || !range?.to || !db) return;
        setIsCalculating(true);
        setReportData(null);

        const fromDateStr = format(range.from, 'yyyy-MM-dd');
        const toDateStr = format(range.to, 'yyyy-MM-dd');

        try {
            const invoicesQuery = query(collection(db, 'invoices'), where('date', '>=', fromDateStr), where('date', '<=', toDateStr));
            const expensesQuery = query(collection(db, 'expenses'), where('date', '>=', fromDateStr), where('date', '<=', toDateStr));

            const [invoicesSnapshot, expensesSnapshot] = await Promise.all([
                getDocs(invoicesQuery),
                getDocs(expensesQuery)
            ]);

            const fetchedInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
            const fetchedExpenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

            const totalRevenue = fetchedInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
            const totalExpenses = fetchedExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);

            const chartData = [{
                name: 'Summary',
                Ingresos: totalRevenue,
                Gastos: totalExpenses
            }];
            
            setReportData({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                invoices: fetchedInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                expenses: fetchedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                chartData
            });

        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsCalculating(false);
        }
    }, [db]);
    
    // Auto-generate report when date range changes
    React.useEffect(() => {
        if (date) {
            handleGenerateReport(date);
        }
    }, [date, handleGenerateReport]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>General Financial Summary</CardTitle>
                    <CardDescription>Select a period to see a summary of revenue, expenses, and profitability.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
                                <Select onValueChange={(value) => {
                                    const now = new Date();
                                    if(value === "this_month") setDate({from: startOfMonth(now), to: endOfMonth(now)})
                                    else if (value === "last_month") {
                                        const lastMonth = subMonths(now, 1);
                                        setDate({from: startOfMonth(lastMonth), to: endOfMonth(lastMonth)})
                                    } else if (value === "this_week") setDate({from: startOfWeek(now), to: endOfWeek(now)})
                                }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Quick Ranges" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                </SelectContent>
                                </Select>
                                <div className="rounded-md border">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <Button variant="outline" onClick={() => window.print()} disabled={!reportData}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </CardContent>
            </Card>

            {isCalculating && (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}

            {reportData && (
                 <div className="printable-area space-y-6">
                     <div className="grid gap-4 md:grid-cols-3">
                         <StatCard title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} icon={TrendingUp} colorClass="text-green-500"/>
                         <StatCard title="Total Expenses" value={formatCurrency(reportData.totalExpenses)} icon={TrendingDown} colorClass="text-red-500"/>
                         <StatCard title="Net Profit" value={formatCurrency(reportData.netProfit)} icon={DollarSign} colorClass={reportData.netProfit >= 0 ? "text-green-500" : "text-red-500"}/>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue vs. Expenses Chart</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value:any) => formatCurrency(value as number)} />
                                    <Legend />
                                    <Bar dataKey="Ingresos" fill="#22c55e" />
                                    <Bar dataKey="Gastos" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Revenue Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.invoices.length > 0 ? reportData.invoices.map(inv => (
                                            <TableRow key={inv.id}><TableCell>{inv.date}</TableCell><TableCell>{inv.customer}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(inv.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No revenue found in this period.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.expenses.length > 0 ? reportData.expenses.map(exp => (
                                            <TableRow key={exp.id}><TableCell>{exp.date}</TableCell><TableCell>{exp.description}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(exp.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No expenses found in this period.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}


export default function ReportsPage() {
    return (
        <div className="space-y-6">
             <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .non-printable {
                        display: none;
                    }
                }
            `}</style>
            <div className="non-printable">
                <h1 className="text-3xl font-bold font-headline">Reports</h1>
            </div>
            
            <Tabs defaultValue="summary" className="w-full non-printable">
                <TabsList>
                    <TabsTrigger value="summary">Financial Summary</TabsTrigger>
                    <TabsTrigger value="profitability">Vehicle Profitability</TabsTrigger>
                </TabsList>
                <TabsContent value="summary">
                    <FinancialSummaryReport />
                </TabsContent>
                <TabsContent value="profitability">
                    <VehicleProfitabilityReport />
                </TabsContent>
            </Tabs>
            
            {/* This div is only for printing */}
            <div className="hidden print:block">
                 <FinancialSummaryReport />
            </div>

        </div>
    );
}

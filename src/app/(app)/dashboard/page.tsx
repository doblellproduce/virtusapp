import * as React from 'react';
import DashboardClient from './dashboard-client';
import { adminDB } from '@/lib/firebase/admin';
import type { Reservation, Vehicle, Invoice } from '@/lib/types';
import { subMonths, format } from 'date-fns';

// This function will run on the server to fetch all required data in parallel
async function getDashboardData() {
  try {
    const reservationsQuery = adminDB.collection('reservations');
    const vehiclesQuery = adminDB.collection('vehicles');
    const invoicesQuery = adminDB.collection('invoices');

    const [reservationsSnapshot, vehiclesSnapshot, invoicesSnapshot] = await Promise.all([
      reservationsQuery.get(),
      vehiclesQuery.get(),
      invoicesQuery.get(),
    ]);

    const reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    
    // --- STATS AGGREGATION ---
    const totalRevenue = invoices.reduce((acc, inv) => acc + parseFloat(inv.amount || '0'), 0);
    const activeRentals = reservations.filter(r => r.status === 'Active').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;
    
    // --- CHART DATA AGGREGATION ---
    const sevenMonthsAgo = subMonths(new Date(), 6);
    sevenMonthsAgo.setDate(1); // Start from the beginning of the month

    const monthlyRevenue: { [key: string]: number } = {};
    const monthLabels: string[] = [];

    // Initialize the last 7 months
    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM');
        monthlyRevenue[monthKey] = 0;
        if(!monthLabels.includes(monthLabel)) {
           monthLabels.push(monthLabel);
        }
    }
    
    invoices.forEach(inv => {
        const invoiceDate = new Date(inv.date);
        if(invoiceDate >= sevenMonthsAgo) {
            const monthKey = format(invoiceDate, 'yyyy-MM');
            if(monthlyRevenue.hasOwnProperty(monthKey)) {
                monthlyRevenue[monthKey] += parseFloat(inv.amount || '0');
            }
        }
    });

    const chartData = monthLabels.map(label => {
        // Find the year-month key that corresponds to the label
        const key = Object.keys(monthlyRevenue).find(k => format(new Date(k), 'MMM') === label);
        return {
            month: label,
            revenue: key ? monthlyRevenue[key] : 0,
        };
    });


    // --- FINAL DATA STRUCTURE ---
    return {
      stats: {
        totalRevenue,
        activeRentals,
        availableVehicles,
        vehiclesInMaintenance
      },
      recentReservations: reservations.sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime()).slice(0, 5),
      recentInvoices: invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
      chartData: chartData,
    };
  } catch (error) {
    console.error("Error fetching dashboard data on server:", error);
    // Return empty/default data on error to prevent crashing the page
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
      chartData: [],
    };
  }
}


export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient initialData={data} />;
}

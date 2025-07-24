
'use server';

import { subMonths, format, startOfMonth, getMonth, getYear } from 'date-fns';
import { adminDB } from '@/lib/firebase/admin';
import type { Reservation, Vehicle, Invoice } from '@/lib/types';

// This function will run on the server to fetch all required data in parallel
export async function getDashboardData() {
  try {
    const reservationsQuery = adminDB.collection('reservations').orderBy('pickupDate', 'desc').limit(5).get();
    const vehiclesQuery = adminDB.collection('vehicles').get();
    const invoicesQuery = adminDB.collection('invoices').orderBy('date', 'desc').get();

    const [reservationsSnapshot, vehiclesSnapshot, invoicesSnapshot] = await Promise.all([
      reservationsQuery,
      vehiclesQuery,
      invoicesQuery,
    ]);

    const recentReservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    const allInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    
    // --- STATS AGGREGATION ---
    const totalRevenue = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount || '0'), 0);
    const activeRentals = vehicles.filter(v => v.status === 'Rented').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;
    
    // --- CHART DATA AGGREGATION ---
    const monthlyRevenue: { [key: string]: number } = {};
    const monthLabels: string[] = [];
    const now = new Date();

    // Initialize the last 7 months
    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM');
        if(!monthLabels.includes(monthLabel)) {
           monthLabels.push(monthLabel);
        }
        monthlyRevenue[monthKey] = 0;
    }
    
    // Invoices are already sorted by date desc, so we can iterate to find relevant ones
    const sevenMonthsAgo = startOfMonth(subMonths(now, 6));
    
    allInvoices.forEach(inv => {
        const invoiceDate = new Date(inv.date);
        if(invoiceDate >= sevenMonthsAgo) {
            const monthKey = format(invoiceDate, 'yyyy-MM');
            if(monthlyRevenue.hasOwnProperty(monthKey)) {
                monthlyRevenue[monthKey] += parseFloat(inv.amount || '0');
            }
        }
    });

    const chartData = monthLabels.map(label => {
      const year = getYear(now);
      const monthIndex = new Date(Date.parse(label +" 1, 2012")).getMonth();
      const monthIsPast = monthIndex > getMonth(now);
      const correctYear = monthIsPast ? year - 1 : year;
      const key = `${correctYear}-${String(monthIndex + 1).padStart(2, '0')}`;
      
      return {
          month: label,
          revenue: monthlyRevenue[key] || 0,
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
      recentReservations: recentReservations,
      recentInvoices: allInvoices.slice(0, 5),
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


'use server';

import { subMonths, format, startOfMonth } from 'date-fns';
import { getDb } from '@/lib/firebase/server/admin';
import type { Reservation, Vehicle, Invoice } from '@/lib/types';
import { initialVehicles } from '@/lib/data';

// This function will run on the server to fetch all required data in parallel
export async function getDashboardData() {
  try {
    const db = getDb();
    const reservationsQuery = db.collection('reservations').orderBy('pickupDate', 'desc').limit(5).get();
    const vehiclesQuery = db.collection('vehicles').get();
    const invoicesQuery = db.collection('invoices').orderBy('date', 'desc').get();

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
    const chartData: { month: string; revenue: number }[] = [];
    const now = new Date();

    // Initialize the last 7 months
    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
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

    // Generate final chart data structure, ordered from oldest to newest
    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        chartData.push({
            month: format(monthDate, 'MMM'),
            revenue: monthlyRevenue[monthKey] || 0,
        });
    }

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
  } catch (error: any) {
    console.error("Error fetching dashboard data on server:", error.message);
    // Return empty/default data on error to prevent crashing the page
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
      chartData: [],
      error: `Error fetching dashboard data on server: ${error.message}`
    };
  }
}


export async function getVehiclesForHomePage(): Promise<{ vehicles: Vehicle[], error?: string }> {
    try {
        const db = getDb();
        const vehiclesSnapshot = await db.collection('vehicles')
            .where('status', '==', 'Available')
            .limit(6)
            .get();
        
        if (vehiclesSnapshot.empty) {
            return { vehicles: [] };
        }
        
        const vehiclesData = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        
        return { vehicles: vehiclesData };

    } catch (err: any) {
        console.error("Error fetching vehicles for homepage:", err.message);
        // This fallback ensures the page can still render even if the database connection fails.
        // It provides a clear error message that will be displayed on the page.
        return { 
            vehicles: [], 
            error: "No se pudo conectar a la base de datos para cargar la flota. Por favor, contacte al administrador del sistema." 
        };
    }
}

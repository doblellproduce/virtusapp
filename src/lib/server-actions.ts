
'use server';

import { headers } from 'next/headers';
import { subMonths, format, startOfMonth, getMonth, getYear } from 'date-fns';
import { adminAuth, adminDB } from '@/lib/firebase/server/admin';
import type { Reservation, Vehicle, Invoice, UserProfile } from '@/lib/types';


async function getTenantIdForRequest(): Promise<string | null> {
    // In a server component, we can't rely on cookies directly in the same way.
    // However, the middleware adds the Authorization header, which we can use.
    const authorization = headers().get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            const userDoc = await adminDB.collection('users').doc(decodedToken.uid).get();
            if (userDoc.exists) {
                return (userDoc.data() as UserProfile).tenantId;
            }
        } catch (error) {
            console.error("Error verifying token on server:", error);
        }
    }
    // Fallback if headers aren't forwarded correctly, might happen in some scenarios
    // This part requires careful handling in real-world complex scenarios.
    // For now, we rely on the middleware forwarding the token.
    return null;
}


// This function will run on the server to fetch all required data in parallel
export async function getDashboardData() {
  const tenantId = await getTenantIdForRequest();
  
  if (!tenantId) {
    console.error("Could not determine tenantId for dashboard data.");
    // Return a default empty state to avoid crashing the client
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
      chartData: [],
    };
  }
  
  try {
    const reservationsQuery = adminDB.collection('reservations').where('tenantId', '==', tenantId).orderBy('pickupDate', 'desc').limit(5).get();
    const vehiclesQuery = adminDB.collection('vehicles').where('tenantId', '==', tenantId).get();
    const invoicesQuery = adminDB.collection('invoices').where('tenantId', '==', tenantId).orderBy('date', 'desc').get();

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

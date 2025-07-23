import * as React from 'react';
import DashboardClient from './dashboard-client';
import { adminDB } from '@/lib/firebase/admin';
import type { Reservation, Vehicle, Invoice } from '@/lib/types';

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
    
    // Perform aggregations on the server
    const totalRevenue = invoices.reduce((acc, inv) => acc + parseFloat(inv.amount || '0'), 0);
    const activeRentals = reservations.filter(r => r.status === 'Active').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;

    // We pass both aggregated data and recent items to the client
    return {
      stats: {
        totalRevenue,
        activeRentals,
        availableVehicles,
        vehiclesInMaintenance
      },
      recentReservations: reservations.sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime()).slice(0, 5),
      recentInvoices: invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  } catch (error) {
    console.error("Error fetching dashboard data on server:", error);
    // Return empty/default data on error to prevent crashing the page
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
    };
  }
}


export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient initialData={data} />;
}

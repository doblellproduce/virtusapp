
'use server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';
import { subMonths, format, startOfMonth } from 'date-fns';
import type { Reservation, Vehicle, Invoice } from '@/lib/types';


const initializeAdminApp = (): App => {
    const existingApp = getApps().find(app => app.name === 'firebase-admin-app');
    if (existingApp) {
        return existingApp;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error("Firebase Admin credentials are not fully set in environment variables.");
    }

    try {
        return initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, 'firebase-admin-app');
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        throw new Error("Could not initialize Firebase Admin SDK. See server logs for details.");
    }
};

export const getDb = (): Firestore => {
    const app = initializeAdminApp();
    return getFirestore(app);
}

export const getAuth = (): Auth => {
    const app = initializeAdminApp();
    return getAdminAuth(app);
}

export const getStorage = (): Storage => {
    const app = initializeAdminApp();
    return getAdminStorage(app);
}

// --- SERVER ACTIONS ---

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

    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyRevenue[monthKey] = 0;
    }
    
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

    for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        chartData.push({
            month: format(monthDate, 'MMM'),
            revenue: monthlyRevenue[monthKey] || 0,
        });
    }

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
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
      chartData: [],
    };
  }
}

export async function getVehiclesForHomePage(): Promise<{ vehicles: Vehicle[], error?: string }> {
    try {
        const db = getDb();
        const vehiclesQuery = db.collection('vehicles').where('status', 'in', ['Available', 'Rented']);
        const querySnapshot = await vehiclesQuery.get();
        if (querySnapshot.empty) {
            return { vehicles: [] };
        }
        const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        return { vehicles: vehiclesData };
    } catch (err: any) {
        console.error("Error in getVehiclesForHomePage:", err);
        if (err.code === 'permission-denied') {
            return { vehicles: [], error: "No se pudo cargar la flota. Verifique los permisos de la base de datos." };
        }
        return { vehicles: [], error: "Ocurrió un error inesperado al cargar los vehículos." };
    }
}

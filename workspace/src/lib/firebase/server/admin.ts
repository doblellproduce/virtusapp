
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { Reservation, Vehicle, Invoice } from '@/lib/types';
import { subMonths, format, startOfMonth } from 'date-fns';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDB: Firestore | null = null;
let adminStorage: Storage | null = null;

function initializeAdminApp() {
    if (getApps().some(app => app.name === 'firebase-admin-app')) {
        adminApp = getApps().find(app => app.name === 'firebase-admin-app')!;
    } else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (privateKey && clientEmail && projectId) {
            try {
                const serviceAccount = {
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                };
                adminApp = initializeApp({
                    credential: cert(serviceAccount),
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                }, 'firebase-admin-app');
            } catch (error) {
                console.error("Failed to initialize Firebase Admin SDK:", error);
                adminApp = null;
            }
        }
    }

    if (adminApp) {
        adminAuth = getAuth(adminApp);
        adminDB = getFirestore(adminApp);
        adminStorage = getStorage(adminApp);
    }
}

// Ensure the app is initialized when this module is loaded on the server.
initializeAdminApp();

// Export a function that ensures initialization and returns the DB instance.
function getDb() {
    if (!adminDB) {
        initializeAdminApp(); // Attempt to re-initialize if not available
        if (!adminDB) {
            throw new Error("Firebase Admin SDK could not be initialized. Check server credentials.");
        }
    }
    return adminDB;
}

// Export the auth and storage instances through getters as well
function getAuthInstance() {
    if (!adminAuth) {
        throw new Error("Firebase Admin Auth is not initialized.");
    }
    return adminAuth;
}

function getStorageInstance() {
    if (!adminStorage) {
        throw new Error("Firebase Admin Storage is not initialized.");
    }
    return adminStorage;
}

export { adminApp, getAuthInstance as adminAuth, getDb, getStorageInstance as adminStorage };


// --- Server-only Data Fetching Functions ---

export async function fetchDashboardData() {
  const db = getDb();
  try {
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
    
    const totalRevenue = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount || '0'), 0);
    const activeRentals = vehicles.filter(v => v.status === 'Rented').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;
    
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
      stats: { totalRevenue, activeRentals, availableVehicles, vehiclesInMaintenance },
      recentReservations,
      recentInvoices: allInvoices.slice(0, 5),
      chartData,
    };
  } catch (error) {
    console.error("Error in fetchDashboardData:", error);
    return {
      stats: { totalRevenue: 0, activeRentals: 0, availableVehicles: 0, vehiclesInMaintenance: 0 },
      recentReservations: [],
      recentInvoices: [],
      chartData: [],
    };
  }
}

export async function fetchVehiclesForHomePage(): Promise<{ vehicles: Vehicle[], error?: string }> {
    const db = getDb();
    try {
        const vehiclesQuery = db.collection('vehicles').where('status', 'in', ['Available', 'Rented']);
        const querySnapshot = await vehiclesQuery.get();
        if (querySnapshot.empty) {
            return { vehicles: [] };
        }
        const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        return { vehicles: vehiclesData };
    } catch (err: any) {
        console.error("Error in fetchVehiclesForHomePage:", err);
        if (err.code === 'permission-denied') {
            return { vehicles: [], error: "No se pudo cargar la flota. Verifique los permisos de la base de datos." };
        }
        return { vehicles: [], error: "Ocurrió un error inesperado al cargar los vehículos." };
    }
}

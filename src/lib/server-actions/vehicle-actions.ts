
import { getDb } from '@/lib/firebase/server/admin';
import type { Vehicle } from '@/lib/types';


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
        const errorMessage = `Could not connect to the database to load the fleet. Please check your Firebase credentials and server configuration. Details: ${err.message}`;
        console.error("Error fetching vehicles for homepage:", errorMessage);
        // This fallback ensures the page can still render even if the database connection fails.
        // It provides a clear error message that will be displayed on the page.
        return { 
            vehicles: [], 
            error: errorMessage
        };
    }
}


export async function getVehicleData(vehicleId: string): Promise<Vehicle | null> {
    try {
        const db = getDb();
        const vehicleRef = db.collection('vehicles').doc(vehicleId);
        const vehicleSnap = await vehicleRef.get();

        if (vehicleSnap.exists) {
            return { id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle;
        }
        return null;
    } catch (error) {
        console.error("Server-side error fetching vehicle:", error);
        // In case of a DB connection error on the server, we can treat it as not found.
        return null;
    }
}


import * as React from 'react';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/firebase/server/admin';
import type { Vehicle } from '@/lib/types';
import VehicleDetailClient from './vehicle-detail-client';

async function getVehicleData(vehicleId: string): Promise<Vehicle | null> {
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

// NOTE: We are letting Next.js and TypeScript infer the types for `params` here.
// Explicitly typing it can cause conflicts with Next.js's internal PageProps.
export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
    const vehicle = await getVehicleData(params.id);

    if (!vehicle) {
        notFound();
    }

    return <VehicleDetailClient initialVehicle={vehicle} />;
}


import * as React from 'react';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/firebase/server/admin';
import type { Vehicle } from '@/lib/types';
import VehicleDetailClient from './vehicle-detail-client';

type VehicleDetailPageProps = {
    params: {
        id: string;
    };
};

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

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
    const vehicle = await getVehicleData(params.id);

    if (!vehicle) {
        notFound();
    }

    return <VehicleDetailClient initialVehicle={vehicle} />;
}

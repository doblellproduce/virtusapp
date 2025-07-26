
import * as React from 'react';
import { notFound } from 'next/navigation';
import { getVehicleData } from '@/lib/server-actions';
import VehicleDetailClient from './vehicle-detail-client';

// NOTE: We are letting Next.js and TypeScript infer the types for `params` here.
// This is the simplest and most robust way to avoid type conflicts with Next.js internals.
export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
    const vehicle = await getVehicleData(params.id);

    if (!vehicle) {
        notFound();
    }

    return <VehicleDetailClient initialVehicle={vehicle} />;
}

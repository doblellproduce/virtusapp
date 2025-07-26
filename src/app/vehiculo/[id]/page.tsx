
import * as React from 'react';
import VehicleDetailClient from './vehicle-detail-client';
import { getVehicleData } from '@/lib/server-actions';
import { notFound } from 'next/navigation';

// This is now an async Server Component, its only job is to fetch data
// and pass it to the client component.
export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicleData(params.id);

  // If no vehicle is found, render the 404 page.
  if (!vehicle) {
    notFound();
  }

  // We pass the resolved vehicle data to the client component.
  return <VehicleDetailClient vehicle={vehicle} />;
}

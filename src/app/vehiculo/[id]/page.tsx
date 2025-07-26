import * as React from 'react';
import VehicleDetailClient from './vehicle-detail-client';
import { getVehicleData } from '@/lib/server-actions';
import { notFound } from 'next/navigation';

// This is the main Server Component for the page.
// Its only job is to fetch the data on the server and pass it to the client component.
export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicleData(params.id);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailClient vehicle={vehicle} />;
}

// This is the main page component. It is now an async Server Component.
// Its only job is to get the `id` from the route params, fetch the data,
// and then pass that data to the client component for rendering.

import * as React from 'react';
import { notFound } from 'next/navigation';
import { getVehicleData } from '@/lib/server-actions';
import VehicleDetailClient from './vehicle-detail-client';

// The page component is async to allow for data fetching.
export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  // Fetch data on the server.
  const vehicle = await getVehicleData(params.id);

  // If no vehicle is found, render the 404 page.
  if (!vehicle) {
    notFound();
  }

  // Pass the fetched data to the client component for rendering.
  return <VehicleDetailClient vehicle={vehicle} />;
}

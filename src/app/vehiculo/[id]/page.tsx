import * as React from 'react';
import VehicleDetailClient from './vehicle-detail-client';

// This is now a standard, non-async Server Component.
// Its only job is to pass the params to the component that will handle data fetching.
// This structure avoids the complex type inference issues with async pages.
export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  // We pass the ID to the client component, which will be responsible for fetching and rendering.
  return <VehicleDetailClient id={params.id} />;
}

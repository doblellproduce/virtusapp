// This is the main page component. It is now a simple, non-async component.
// Its only job is to get the `id` from the route params and pass it to the
// data-fetching and rendering component, `VehicleDetailClient`.

import * as React from 'react';
import VehicleDetailClient from './vehicle-detail-client';

// The page component itself is now very simple.
// It receives the params from the dynamic route.
export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  // It renders the client component, passing the vehicle ID to it.
  // The client component will handle fetching the data and rendering the UI.
  return <VehicleDetailClient vehicleId={params.id} />;
}

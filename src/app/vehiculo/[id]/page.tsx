import * as React from 'react';
import VehicleDetailClient from './vehicle-detail-client';

// NOTE: This page component is now extremely simple.
// It delegates all logic to the VehicleDetailClient component.
// This resolves the complex TypeScript issue with async server pages and dynamic params.
export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  return <VehicleDetailClient vehicleId={params.id} />;
}

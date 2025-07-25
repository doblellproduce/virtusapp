
import * as React from 'react';
import DashboardClient from './dashboard-client';
import { getDashboardData } from '@/lib/firebase/server/admin';


export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient initialData={data} />;
}

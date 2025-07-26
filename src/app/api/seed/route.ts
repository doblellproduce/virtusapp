
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/server/admin';
import {
    initialVehicles,
    initialCustomers,
    initialReservations,
    initialInvoices,
    initialExpenses,
    initialMaintenanceLogs,
    initialReviews
} from '@/lib/data';
import type { Vehicle, Customer, Reservation, Invoice, Expense, MaintenanceLog, Review } from '@/lib/types';

// WARNING: This is a one-time use endpoint to seed the database.
// It should be secured or removed after use in a real production environment.

async function seedCollection<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>[] | (T & { id: string })[]
) {
    const db = getDb();
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.limit(1).get();

    if (!snapshot.empty) {
        console.log(`Collection '${collectionName}' already contains data. Skipping seed.`);
        return { success: true, message: `Skipped: ${collectionName} not empty.` };
    }

    console.log(`Seeding collection '${collectionName}'...`);
    const batch = db.batch();

    let seededCount = 0;
    for (const item of data) {
        // For data with pre-defined IDs
        if ('id' in item && typeof item.id === 'string') {
             const docRef = collectionRef.doc(item.id);
             batch.set(docRef, item);
        } else { // For data without pre-defined IDs
            const docRef = collectionRef.doc();
            batch.set(docRef, item);
        }
        seededCount++;
    }

    await batch.commit();
    console.log(`Successfully seeded ${seededCount} documents into '${collectionName}'.`);
    return { success: true, message: `Seeded ${seededCount} documents into ${collectionName}.` };
}


export async function POST() {
  try {
    console.log("Starting database seed process...");

    // We pass a copy of the arrays to avoid potential modifications to the original objects
    await seedCollection<Vehicle>('vehicles', [...initialVehicles]);
    await seedCollection<Customer>('customers', [...initialCustomers]);
    await seedCollection<Reservation>('reservations', [...initialReservations]);
    await seedCollection<Invoice>('invoices', [...initialInvoices]);
    await seedCollection<Expense>('expenses', [...initialExpenses]);
    await seedCollection<MaintenanceLog>('maintenanceLogs', [...initialMaintenanceLogs]);
    await seedCollection<Review>('reviews', [...initialReviews]);
    
    return NextResponse.json({ success: true, message: 'Database seeded successfully!' });
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

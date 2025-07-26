
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
    db: FirebaseFirestore.Firestore,
    collectionName: string,
    data: (Omit<T, 'id'> | (T & { id: string }))[]
) {
    const collectionRef = db.collection(collectionName);
    
    // Clear existing documents in the collection to prevent duplicates
    const snapshot = await collectionRef.get();
    if (!snapshot.empty) {
        console.log(`Clearing existing documents from '${collectionName}'...`);
        const deleteBatch = db.batch();
        snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        console.log(`Cleared ${snapshot.size} documents from '${collectionName}'.`);
    }

    console.log(`Seeding collection '${collectionName}'...`);
    const batch = db.batch();
    let seededCount = 0;

    for (const item of data) {
        const docRef = 'id' in item && typeof item.id === 'string'
            ? collectionRef.doc(item.id)
            : collectionRef.doc();
        
        batch.set(docRef, item);
        seededCount++;
    }

    await batch.commit();
    console.log(`Successfully seeded ${seededCount} documents into '${collectionName}'.`);
}

export async function POST() {
  try {
    console.log("Starting database seed process...");
    const db = getDb();

    // The seedCollection function now handles clearing before seeding.
    await seedCollection<Vehicle>(db, 'vehicles', [...initialVehicles]);
    await seedCollection<Customer>(db, 'customers', [...initialCustomers]);
    await seedCollection<Reservation>(db, 'reservations', [...initialReservations]);
    await seedCollection<Invoice>(db, 'invoices', [...initialInvoices]);
    await seedCollection<Expense>(db, 'expenses', [...initialExpenses]);
    await seedCollection<MaintenanceLog>(db, 'maintenanceLogs', [...initialMaintenanceLogs]);
    await seedCollection<Review>(db, 'reviews', [...initialReviews]);
    
    return NextResponse.json({ success: true, message: 'Database seeded successfully!' });
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

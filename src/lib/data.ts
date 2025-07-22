
import type { Reservation, Vehicle, UserProfile, MaintenanceLog } from '@/lib/types';

// This initial data is now only for reference and prototyping.
// The live application will use Firestore.

export const initialReservations: Reservation[] = [
    { id: 'RES-001', customer: 'Liam Johnson', vehicleId: 'some-firestore-id-3', vehicle: 'Hyundai Accent', pickupDate: '2024-07-25', dropoffDate: '2024-07-28', status: 'Completed', agent: 'Admin User', totalCost: 250.00 },
    { id: 'RES-002', customer: 'Olivia Smith', vehicleId: 'some-firestore-id-5', vehicle: 'Chevrolet Tracker', pickupDate: '2024-07-26', dropoffDate: '2024-08-02', status: 'Active', agent: 'Sarah Johnson', totalCost: 600.00 },
];

export const initialInvoices = [
    { id: 'INV-2024-001', customer: 'Liam Johnson', date: '2024-07-28', amount: '250.00', status: 'Paid', createdBy: 'Admin User', paymentMethod: 'Credit Card' },
    { id: 'INV-2024-002', customer: 'Olivia Smith', date: '2024-08-02', amount: '600.00', status: 'Paid', createdBy: 'Sarah Johnson', paymentMethod: 'Bank Transfer' },
];

// This is no longer the source of truth for users, but can be used for seeding the database.
export const initialUsers: Omit<UserProfile, 'id'>[] = [
    { name: 'Admin User', email: 'soypromord@gmail.com', role: 'Admin' },
    { name: 'Sarah Johnson', email: 'sarah.j@example.com', role: 'Supervisor' },
    { name: 'Mark Williams', email: 'mark.w@example.com', role: 'Secretary' },
];

export const initialExpenses = [
    { id: 'EXP-001', description: 'Vehicle Maintenance - Toyota Raize', category: 'Maintenance', amount: '150.00', date: '2024-07-20', status: 'Paid' },
    { id: 'EXP-002', description: 'Office Rent - August', category: 'Utilities', amount: '1200.00', date: '2024-08-01', status: 'Paid' },
];

export const initialMaintenanceLogs: MaintenanceLog[] = [
    { id: 'LOG-001', vehicleId: 'some-firestore-id-4', vehicleName: 'Toyota Raize', date: '2023-12-15', serviceType: 'Oil Change', cost: '80.00', notes: 'Replaced oil and filter.' },
    { id: 'LOG-002', vehicleId: 'some-firestore-id-6', vehicleName: 'Chevrolet Captiva', date: '2024-01-30', serviceType: 'Brake Service', cost: '250.00', notes: 'Replaced front brake pads and rotors.' },
];

export const insuranceOptions = [
    { 
        id: 'law', 
        pricePerDay: 10,
        deposit: 500,
        deductible: 1000,
        title: {
            es: 'Seguro de Ley',
            en: 'Liability Insurance'
        },
        description: {
            es: 'Cobertura básica requerida. Cubre daños a terceros. Requiere un depósito de seguridad de $500 y tiene un deducible de $1,000.',
            en: 'Basic required coverage. Covers damages to third parties. Requires a $500 security deposit and has a $1,000 deductible.'
        }
    },
    { 
        id: 'semi-full', 
        pricePerDay: 25,
        deposit: 250,
        deductible: 500,
        title: {
            es: 'Seguro Semifull',
            en: 'Semi-Full Insurance'
        },
        description: {
            es: 'Cobertura ampliada que incluye daños al vehículo. Reduce el depósito a $250 y tiene un deducible de $500.',
            en: 'Extended coverage including damages to the vehicle. Reduces the deposit to $250 and has a $500 deductible.'
        }
    }
];


import type { Reservation, Vehicle, UserProfile, MaintenanceLog, Expense, Review, Customer, Invoice } from '@/lib/types';


// --- VEHICLES ---
export const initialVehicles: Omit<Vehicle, 'id'>[] = [
    { make: 'Hyundai', model: 'Accent', plate: 'A123456', category: 'Sedan', status: 'Available', pricePerDay: 55, insuranceCost: 10, deductible: 500, specs: { seats: 5, transmission: 'Automatic', engine: '1.6L' }, lastServiceDate: '2024-05-10', imageUrls: ['https://placehold.co/600x400.png'], dataAiHint: 'Hyundai Accent sedan'},
    { make: 'Kia', model: 'Picanto', plate: 'B789012', category: 'Economy', status: 'Rented', pricePerDay: 45, insuranceCost: 10, deductible: 500, specs: { seats: 4, transmission: 'Automatic', engine: '1.2L' }, lastServiceDate: '2024-06-20', imageUrls: ['https://placehold.co/600x400.png'], dataAiHint: 'Kia Picanto economy' },
    { make: 'Chevrolet', model: 'Tracker', plate: 'C345678', category: 'SUV', status: 'Maintenance', pricePerDay: 70, insuranceCost: 10, deductible: 500, specs: { seats: 5, transmission: 'Automatic', engine: '1.8L' }, lastServiceDate: '2024-02-15', imageUrls: ['https://placehold.co/600x400.png'], dataAiHint: 'Chevrolet Tracker SUV' },
    { make: 'Toyota', model: 'Raize', plate: 'D901234', category: 'SUV', status: 'Available', pricePerDay: 75, insuranceCost: 10, deductible: 500, specs: { seats: 5, transmission: 'Automatic', engine: '1.5L' }, lastServiceDate: '2024-07-01', imageUrls: ['https://placehold.co/600x400.png'], dataAiHint: 'Toyota Raize SUV' },
    { make: 'Chevrolet', model: 'Captiva', plate: 'E567890', category: 'SUV', status: 'Available', pricePerDay: 80, insuranceCost: 10, deductible: 500, specs: { seats: 7, transmission: 'Automatic', engine: '2.0L' }, lastServiceDate: '2024-04-22', imageUrls: ['https://placehold.co/600x400.png'], dataAiHint: 'Chevrolet Captiva SUV' },
    { make: 'Mercedes-Benz', model: 'Clase A', plate: 'F123789', category: 'Luxury', status: 'Available', pricePerDay: 150, insuranceCost: 25, deductible: 1000, specs: { seats: 5, transmission: 'Automatic', engine: '2.5L Turbo' }, lastServiceDate: '2024-07-10', imageUrls: ['https://placehold.co/600x400.png'], dataAiHint: 'Mercedes-Benz A-Class luxury' },
];

// --- CUSTOMERS ---
export const initialCustomers: Omit<Customer, 'id'>[] = [
    { name: 'Liam Johnson', email: 'liam.j@example.com', phone: '809-111-2222', idOrPassport: '123-4567890-1', license: 'US-LI-123', address: '123 Main St, Santo Domingo', createdAt: new Date().toISOString() },
    { name: 'Olivia Smith', email: 'olivia.s@example.com', phone: '829-333-4444', idOrPassport: 'A98765432', license: 'CA-OS-456', address: '456 Oak Ave, Punta Cana', createdAt: new Date().toISOString() },
    { name: 'Noah Williams', email: 'noah.w@example.com', phone: '849-555-6666', idOrPassport: '402-1234567-8', license: 'DO-NW-789', address: '789 Pine Rd, Santiago', createdAt: new Date().toISOString() }
];

// --- RESERVATIONS ---
// Note: Use placeholder IDs that correspond to the vehicles and customers above.
export const initialReservations: Reservation[] = [
    { id: 'RES-001', customerId: 'CUST-001', customerName: 'Liam Johnson', vehicleId: 'some-firestore-id-3', vehicle: 'Hyundai Accent', pickupDate: '2024-07-25', dropoffDate: '2024-07-28', status: 'Completed', agent: 'Admin User', totalCost: 250.00 },
    { id: 'RES-002', customerId: 'CUST-002', customerName: 'Olivia Smith', vehicleId: 'some-firestore-id-5', vehicle: 'Chevrolet Tracker', pickupDate: '2024-07-26', dropoffDate: '2024-08-02', status: 'Active', agent: 'Sarah Johnson', totalCost: 600.00 },
    { id: 'RES-003', customerId: 'CUST-003', customerName: 'Noah Williams', vehicleId: 'some-firestore-id-1', vehicle: 'Toyota Raize', pickupDate: '2024-08-10', dropoffDate: '2024-08-15', status: 'Upcoming', agent: 'Admin User', totalCost: 450.00 },
];

// --- INVOICES ---
export const initialInvoices: Omit<Invoice, 'id'>[] = [
    { customer: 'Liam Johnson', date: '2024-07-28', amount: '250.00', status: 'Paid', createdBy: 'Admin User', paymentMethod: 'Credit Card', reservationId: 'RES-001' },
    { customer: 'Olivia Smith', date: '2024-08-02', amount: '600.00', status: 'Paid', createdBy: 'Sarah Johnson', paymentMethod: 'Bank Transfer', reservationId: 'RES-002' },
    { customer: 'Noah Williams', date: '2024-08-10', amount: '450.00', status: 'Draft', createdBy: 'Admin User', paymentMethod: 'N/A', reservationId: 'RES-003' },
];

// --- USERS (for reference) ---
export const initialUsers: Omit<UserProfile, 'id'>[] = [
    { name: 'Admin User', email: 'soypromord@gmail.com', role: 'Admin' },
    { name: 'Sarah Johnson', email: 'sarah.j@example.com', role: 'Supervisor' },
    { name: 'Mark Williams', email: 'mark.w@example.com', role: 'Secretary' },
];

// --- EXPENSES ---
export const initialExpenses: Omit<Expense, 'id'>[] = [
    { description: 'Vehicle Maintenance - Toyota Raize', category: 'Maintenance', amount: '150.00', date: '2024-07-20', status: 'Paid', createdBy: 'Admin User', vehicleId: 'some-firestore-id-4' },
    { description: 'Office Rent - August', category: 'Utilities', amount: '1200.00', date: '2024-08-01', status: 'Paid', createdBy: 'Admin User' },
    { description: 'Fuel for fleet', category: 'Fuel', amount: '300.00', date: '2024-07-29', status: 'Paid', createdBy: 'Sarah Johnson' },
];

// --- MAINTENANCE LOGS ---
export const initialMaintenanceLogs: Omit<MaintenanceLog, 'id'>[] = [
    { vehicleId: 'some-firestore-id-4', vehicleName: 'Toyota Raize', date: '2023-12-15', serviceType: 'Oil Change', cost: '80.00', notes: 'Replaced oil and filter.', createdBy: 'Admin User' },
    { vehicleId: 'some-firestore-id-6', vehicleName: 'Chevrolet Captiva', date: '2024-01-30', serviceType: 'Brake Service', cost: '250.00', notes: 'Replaced front brake pads and rotors.', createdBy: 'Admin User' },
];

// --- REVIEWS ---
export const initialReviews: Omit<Review, 'id'>[] = [
    { vehicleId: 'some-firestore-id-3', customerId: 'CUST-001', customerName: 'Liam Johnson', rating: 5, comment: 'Excellent car, very clean and economical. The service was top-notch!', timestamp: new Date().toISOString(), status: 'Approved'},
    { vehicleId: 'some-firestore-id-5', customerId: 'CUST-002', customerName: 'Olivia Smith', rating: 4, comment: 'Good vehicle, but pickup took a little longer than expected. Overall a positive experience.', timestamp: new Date().toISOString(), status: 'Pending'},
];


// --- INSURANCE OPTIONS (Remains the same) ---
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

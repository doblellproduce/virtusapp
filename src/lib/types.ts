

// In a real application, this data would come from a database.

export type UserRole = 'Admin' | 'Supervisor' | 'Secretary' | 'SuperAdmin';

export type UserProfile = {
    id: string; // Corresponds to Firebase Auth UID
    name: string;
    email: string;
    role: UserRole;
    photoURL?: string;
    tenantId: string; // ID of the company the user belongs to
};

export type Tenant = {
    id: string;
    name: string; // e.g., "Virtus Car Rental"
    createdAt: string; // ISO string
    status: 'active' | 'suspended' | 'trial';
};

export type Customer = {
    id: string;
    name: string;
    email: string;
    phone: string;
    idOrPassport: string;
    license: string;
    address: string;
    createdAt: string; // ISO string
    tenantId: string;
};

export type Vehicle = {
    id: string; 
    make: string;
    model: string;
    plate: string;
    category: 'Economy' | 'Sedan' | 'SUV' | 'Luxury';
    status: 'Available' | 'Rented' | 'Maintenance';
    imageUrls: string[];
    dataAiHint: string;
    pricePerDay: number;
    insuranceCost: number;
    deductible: number;
    specs: {
        seats: number;
        transmission: string;
        engine: string;
    };
    lastServiceDate: string;
    tenantId: string;
};

export type VehicleInspection = {
    photos: string[]; // URLs of the inspection photos
    notes: string;
    fuelLevel: 'Full' | '3/4' | '1/2' | '1/4' | 'Empty';
    mileage: number;
    signatureUrl: string; // URL of the customer's signature image
    timestamp: string; // ISO string of when the inspection was done
};

export type Reservation = {
    id: string;
    customerId: string;
    customerName: string;
    vehicleId: string;
    vehicle: string;
    pickupDate: string;
    dropoffDate: string;
    status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled' | 'Pending Signature';
    agent: string;
    totalCost?: number; 
    insurance?: any;
    departureInspection?: VehicleInspection;
    returnInspection?: VehicleInspection;
    tenantId: string;
};

export type Invoice = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  createdBy: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'N/A';
  reservationId?: string;
  tenantId: string;
};

export type Expense = {
    id: string;
    description: string;
    category: 'Maintenance' | 'Fuel' | 'Insurance' | 'Salaries' | 'Office Supplies' | 'Utilities' | 'Other';
    amount: string;
    date: string;
    status: 'Pending' | 'Paid' | 'Overdue';
    createdBy: string;
    vehicleId?: string;
    tenantId: string;
};

export type MaintenanceLog = {
    id: string;
    vehicleId: string;
    vehicleName: string;
    date: string;
    serviceType: string;
    cost: string;
    notes: string;
    createdBy: string;
    tenantId: string;
};

export type ActivityLog = {
    id: string;
    timestamp: string;
    user: string;
    action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout' | 'Cancel';
    entityType: 'Reservation' | 'Vehicle' | 'User' | 'Invoice' | 'Expense' | 'Contract' | 'Auth' | 'Maintenance' | 'Customer' | 'Tenant';
    entityId: string;
    details: string;
    tenantId: string;
};

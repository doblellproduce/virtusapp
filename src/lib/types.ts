

// In a real application, this data would come from a database.

export type UserRole = 'Admin' | 'Supervisor' | 'Secretary';

export type UserProfile = {
    id: string; // Corresponds to Firebase Auth UID
    name: string;
    email: string;
    role: UserRole;
    photoURL?: string;
};

export type Vehicle = {
    id: string; // Changed to string to match Firestore document IDs
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
};

export type Reservation = {
    id: string;
    customer: string;
    vehicleId: string; // Changed to string to match Firestore document IDs
    vehicle: string;
    pickupDate: string;
    dropoffDate: string;
    status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled' | 'Pending Signature';
    agent: string;
    totalCost?: number; // Added to store the calculated cost
    insurance?: any; // Using any for simplicity as it's complex
};

export type Invoice = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  createdBy: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'N/A';
};

export type Expense = {
    id: string;
    description: string;
    category: 'Maintenance' | 'Fuel' | 'Insurance' | 'Salaries' | 'Office Supplies' | 'Utilities' | 'Other';
    amount: string;
    date: string;
    status: 'Pending' | 'Paid' | 'Overdue';
    createdBy: string;
};

export type MaintenanceLog = {
    id: string;
    vehicleId: string; // Changed to string to match Firestore document IDs
    vehicleName: string;
    date: string;
    serviceType: string;
    cost: string;
    notes: string;
    createdBy: string;
};

export type ActivityLog = {
    id: string;
    timestamp: string; // Should be an ISO string
    user: string; // User's name or email
    action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout' | 'Cancel';
    entityType: 'Reservation' | 'Vehicle' | 'User' | 'Invoice' | 'Expense' | 'Contract' | 'Auth' | 'Maintenance';
    entityId: string;
    details: string;
};

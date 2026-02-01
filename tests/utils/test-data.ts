/**
 * Test data utilities for BN-Aura E2E Testing
 * Centralized test data management for multi-tenant scenarios
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'super_admin' | 'clinic_owner' | 'sales_staff' | 'beautician' | 'customer';
  clinic_id?: string;
  name: string;
}

export interface TestClinic {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'premium' | 'enterprise';
  quota: number;
  owner_email: string;
}

// Test Users for different scenarios
export const TEST_USERS: Record<string, TestUser> = {
  super_admin: {
    email: 'nuttapong161@gmail.com',
    password: 'your-actual-password',
    role: 'super_admin',
    name: 'Nuttapong - System Administrator'
  },
  clinic_owner_1: {
    email: 'owner1@clinic1-test.com',
    password: 'Test123!@#',
    role: 'clinic_owner',
    clinic_id: 'clinic-1-uuid',
    name: 'Clinic Owner 1'
  },
  clinic_owner_2: {
    email: 'owner2@clinic2-test.com',
    password: 'Test123!@#',
    role: 'clinic_owner',
    clinic_id: 'clinic-2-uuid',
    name: 'Clinic Owner 2'
  },
  sales_staff_1: {
    email: 'sales1@clinic1-test.com',
    password: 'Test123!@#',
    role: 'sales_staff',
    clinic_id: 'clinic-1-uuid',
    name: 'Sales Staff 1'
  },
  sales_staff_2: {
    email: 'sales2@clinic2-test.com',
    password: 'Test123!@#',
    role: 'sales_staff',
    clinic_id: 'clinic-2-uuid',
    name: 'Sales Staff 2'
  },
  beautician_1: {
    email: 'beautician1@clinic1-test.com',
    password: 'Test123!@#',
    role: 'beautician',
    clinic_id: 'clinic-1-uuid',
    name: 'Beautician 1'
  },
  customer_1: {
    email: 'customer1@test.com',
    password: 'Test123!@#',
    role: 'customer',
    clinic_id: 'clinic-1-uuid',
    name: 'Test Customer 1'
  },
  customer_2: {
    email: 'customer2@test.com',
    password: 'Test123!@#',
    role: 'customer',
    clinic_id: 'clinic-2-uuid',
    name: 'Test Customer 2'
  }
};

// Test Clinics
export const TEST_CLINICS: Record<string, TestClinic> = {
  clinic_1: {
    id: 'clinic-1-uuid',
    name: 'Premium Beauty Clinic',
    plan: 'professional',
    quota: 200,
    owner_email: 'owner1@clinic1-test.com'
  },
  clinic_2: {
    id: 'clinic-2-uuid',
    name: 'Luxury Aesthetic Center',
    plan: 'premium',
    quota: 500,
    owner_email: 'owner2@clinic2-test.com'
  },
  clinic_3: {
    id: 'clinic-3-uuid',
    name: 'Starter Clinic',
    plan: 'starter',
    quota: 50,
    owner_email: 'owner3@clinic3-test.com'
  }
};

// Test treatment data
export const TEST_TREATMENTS = [
  {
    name: 'Acne Treatment Package',
    price: 15000,
    duration: 60,
    category: 'facial'
  },
  {
    name: 'Anti-Aging Facial',
    price: 25000,
    duration: 90,
    category: 'facial'
  },
  {
    name: 'Brightening Treatment',
    price: 18000,
    duration: 75,
    category: 'facial'
  }
];

// Test customer data for skin analysis
export const TEST_CUSTOMERS = [
  {
    name: 'Alice Johnson',
    email: 'alice.test@example.com',
    phone: '0812345678',
    age: 28,
    skin_type: 'combination',
    concerns: ['acne', 'dark_spots']
  },
  {
    name: 'Bob Smith',
    email: 'bob.test@example.com',
    phone: '0887654321',
    age: 35,
    skin_type: 'oily',
    concerns: ['wrinkles', 'large_pores']
  }
];

// Environment configuration
export const TEST_CONFIG = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  testTimeout: 30000,
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0
};

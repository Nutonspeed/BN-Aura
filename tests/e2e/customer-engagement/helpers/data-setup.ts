import { Page } from '@playwright/test';
import { createTestCustomer } from './customer-helpers';

export interface TestSetupData {
  customers: Array<{
    id: string;
    email: string;
    password: string;
    fullName: string;
  }>;
  treatments: Array<{
    id: string;
    name: string;
    price: number;
    points: number;
    category: string;
  }>;
  memberships: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    benefits: string[];
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    condition: any;
    pointsReward: number;
  }>;
  rewards: Array<{
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    type: string;
    value: number;
  }>;
}

/**
 * Setup test data for customer engagement tests
 */
export async function setupTestData(page: Page): Promise<TestSetupData> {
  const setupData: TestSetupData = {
    customers: [],
    treatments: [],
    memberships: [],
    achievements: [],
    rewards: []
  };

  // Create test customers
  setupData.customers = await createTestCustomers(page);
  
  // Setup test treatments
  setupData.treatments = await setupTestTreatments(page);
  
  // Setup test memberships
  setupData.memberships = await setupTestMemberships(page);
  
  // Setup test achievements
  setupData.achievements = await setupTestAchievements(page);
  
  // Setup test rewards
  setupData.rewards = await setupTestRewards(page);

  return setupData;
}

/**
 * Create test customers
 */
async function createTestCustomers(page: Page) {
  const testCustomers = [
    {
      email: 'customer.e2e.1@bntest.com',
      password: 'CustomerE2E1!',
      fullName: 'Customer E2E Test 1',
      phone: '0811111111',
      dateOfBirth: '1990-01-01',
      gender: 'female' as const,
      skinType: 'normal' as const
    },
    {
      email: 'customer.e2e.2@bntest.com',
      password: 'CustomerE2E2!',
      fullName: 'Customer E2E Test 2',
      phone: '0812222222',
      dateOfBirth: '1992-02-02',
      gender: 'male' as const,
      skinType: 'oily' as const
    },
    {
      email: 'customer.e2e.3@bntest.com',
      password: 'CustomerE2E3!',
      fullName: 'Customer E2E Test 3',
      phone: '0813333333',
      dateOfBirth: '1994-03-03',
      gender: 'female' as const,
      skinType: 'dry' as const
    }
  ];

  const createdCustomers = [];
  
  for (const customerData of testCustomers) {
    try {
      const customer = await createTestCustomer(page, customerData);
      createdCustomers.push({
        id: customer.id,
        email: customerData.email,
        password: customerData.password,
        fullName: customerData.fullName
      });
    } catch (error) {
      // Customer might already exist, try to get existing
      const response = await page.request.get(`/api/customers/by-email/${customerData.email}`);
      if (response.ok()) {
        const data = await response.json();
        createdCustomers.push({
          id: data.customer.id,
          email: customerData.email,
          password: customerData.password,
          fullName: customerData.fullName
        });
      }
    }
  }

  return createdCustomers;
}

/**
 * Setup test treatments
 */
async function setupTestTreatments(page: Page) {
  const treatments = [
    {
      id: 'treatment-e2e-1',
      name: 'E2E Facial Treatment Basic',
      price: 1500,
      points: 150,
      category: 'facial'
    },
    {
      id: 'treatment-e2e-2',
      name: 'E2e Advanced Skin Care',
      price: 3000,
      points: 300,
      category: 'skincare'
    },
    {
      id: 'treatment-e2e-3',
      name: 'E2E Premium Spa Package',
      price: 5000,
      points: 500,
      category: 'spa'
    },
    {
      id: 'treatment-e2e-4',
      name: 'E2E Laser Treatment',
      price: 8000,
      points: 800,
      category: 'laser'
    },
    {
      id: 'treatment-e2e-5',
      name: 'E2E VIP Full Service',
      price: 15000,
      points: 1500,
      category: 'vip'
    }
  ];

  // Create treatments via API
  for (const treatment of treatments) {
    await page.request.post('/api/treatments', {
      data: treatment
    });
  }

  return treatments;
}

/**
 * Setup test memberships
 */
async function setupTestMemberships(page: Page) {
  const memberships = [
    {
      id: 'membership-e2e-1',
      name: 'E2E Silver Member',
      price: 5000,
      duration: 12, // months
      benefits: ['10% discount', 'Priority booking', 'Birthday gift']
    },
    {
      id: 'membership-e2e-2',
      name: 'E2E Gold Member',
      price: 10000,
      duration: 12,
      benefits: ['15% discount', 'VIP treatment', 'Free consultation']
    },
    {
      id: 'membership-e2e-3',
      name: 'E2E Platinum Member',
      price: 20000,
      duration: 12,
      benefits: ['20% discount', 'All services VIP', 'Exclusive events']
    }
  ];

  // Create memberships via API
  for (const membership of memberships) {
    await page.request.post('/api/memberships', {
      data: membership
    });
  }

  return memberships;
}

/**
 * Setup test achievements
 */
async function setupTestAchievements(page: Page) {
  const achievements = [
    {
      id: 'achievement-e2e-1',
      name: 'E2E First Treatment',
      description: 'Complete your first treatment',
      category: 'milestone',
      condition: {
        type: 'visit_count',
        value: 1
      },
      pointsReward: 100
    },
    {
      id: 'achievement-e2e-2',
      name: 'E2E Regular Customer',
      description: 'Complete 5 treatments',
      category: 'frequency',
      condition: {
        type: 'visit_count',
        value: 5
      },
      pointsReward: 250
    },
    {
      id: 'achievement-e2e-3',
      name: 'E2E Big Spender',
      description: 'Spend 10,000 baht',
      category: 'spending',
      condition: {
        type: 'total_spent',
        value: 10000
      },
      pointsReward: 500
    },
    {
      id: 'achievement-e2e-4',
      name: 'E2E Social Butterfly',
      description: 'Refer 3 friends',
      category: 'referral',
      condition: {
        type: 'referral_count',
        value: 3
      },
      pointsReward: 300
    },
    {
      id: 'achievement-e2e-5',
      name: 'E2E Loyal Customer',
      description: 'Reach Gold tier',
      category: 'milestone',
      condition: {
        type: 'tier_reached',
        value: 'gold'
      },
      pointsReward: 1000
    }
  ];

  // Create achievements via API
  for (const achievement of achievements) {
    await page.request.post('/api/achievements', {
      data: achievement
    });
  }

  return achievements;
}

/**
 * Setup test rewards
 */
async function setupTestRewards(page: Page) {
  const rewards = [
    {
      id: 'reward-e2e-1',
      name: 'E2E 10% Discount',
      description: 'Get 10% off on your next treatment',
      pointsCost: 500,
      type: 'discount',
      value: 10
    },
    {
      id: 'reward-e2e-2',
      name: 'E2E Free Facial',
      description: 'Get a free basic facial treatment',
      pointsCost: 1500,
      type: 'service',
      value: 1500
    },
    {
      id: 'reward-e2e-3',
      name: 'E2E Product Sample',
      description: 'Get premium skincare product sample',
      pointsCost: 300,
      type: 'product',
      value: 500
    },
    {
      id: 'reward-e2e-4',
      name: 'E2E VIP Upgrade',
      description: 'Upgrade your treatment to VIP level',
      pointsCost: 1000,
      type: 'service',
      value: 2000
    },
    {
      id: 'reward-e2e-5',
      name: 'E2E Birthday Special',
      description: 'Special birthday package with 25% discount',
      pointsCost: 800,
      type: 'discount',
      value: 25
    }
  ];

  // Create rewards via API
  for (const reward of rewards) {
    await page.request.post('/api/loyalty/rewards', {
      data: reward
    });
  }

  return rewards;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(page: Page, testData: TestSetupData) {
  // Delete test customers
  for (const customer of testData.customers) {
    await page.request.delete(`/api/customers/${customer.id}`);
  }

  // Delete test treatments
  for (const treatment of testData.treatments) {
    await page.request.delete(`/api/treatments/${treatment.id}`);
  }

  // Delete test memberships
  for (const membership of testData.memberships) {
    await page.request.delete(`/api/memberships/${membership.id}`);
  }

  // Delete test achievements
  for (const achievement of testData.achievements) {
    await page.request.delete(`/api/achievements/${achievement.id}`);
  }

  // Delete test rewards
  for (const reward of testData.rewards) {
    await page.request.delete(`/api/loyalty/rewards/${reward.id}`);
  }
}

/**
 * Reset customer loyalty data
 */
export async function resetCustomerLoyalty(page: Page, customerId: string) {
  await page.request.post(`/api/loyalty/reset`, {
    data: { customerId }
  });
}

/**
 * Create test booking
 */
export async function createTestBooking(page: Page, data: {
  customerId: string;
  treatmentId: string;
  date: string;
  time: string;
}) {
  const response = await page.request.post('/api/booking/create', {
    data
  });
  
  if (!response.ok()) {
    throw new Error('Failed to create test booking');
  }
  
  return await response.json();
}

/**
 * Complete test booking
 */
export async function completeTestBooking(page: Page, bookingId: string) {
  const response = await page.request.post(`/api/appointments/${bookingId}/complete`, {
    data: {
      status: 'completed',
      notes: 'E2E Test Completion'
    }
  });
  
  if (!response.ok()) {
    throw new Error('Failed to complete test booking');
  }
  
  return await response.json();
}

/** @jest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentModal from '@/components/pos/PaymentModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } } })
    }
  })
}));

jest.mock('@/lib/utils/promptpay', () => ({
  generatePromptPayQR: jest.fn(() => 'mock-qr-code')
}));

// Mock fetch
global.fetch = jest.fn() as any;

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
  amount: 1500,
  transactionId: 'test-txn-123',
  clinicId: 'test-clinic-123',
  customer: {
    id: 'test-customer',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+66812345678',
    metadata: { total_spent: 5000 },
    assigned_sales_id: 'test-sales-id'
  },
  items: [
    {
      id: 'item-1',
      item_name: 'Test Treatment',
      quantity: 1,
      unit_price: 1500,
      total: 1500
    }
  ]
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('PaymentModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { payment: { id: 'test-payment' } } })
    });
  });

  test('renders payment modal with correct amount', () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    expect(screen.getByText('Payment Settlement')).toBeInTheDocument();
    expect(screen.getByText('฿1,500')).toBeInTheDocument();
  });

  test('displays customer information when customer is provided', () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Points to Earn:')).toBeInTheDocument();
  });

  test('shows different payment methods', () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    expect(screen.getByText('QR PromptPay')).toBeInTheDocument();
    expect(screen.getByText('Physical Cash')).toBeInTheDocument();
    expect(screen.getByText('Credit / Debit')).toBeInTheDocument();
  });

  test('calculates loyalty points correctly', () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    // 1500 THB should give 15 points (1 point per 100 THB)
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  test('handles payment method selection', () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    const cardButton = screen.getByText('Credit / Debit');
    fireEvent.click(cardButton);

    // Should show card payment form (this would need more detailed testing with Stripe mocks)
    expect(cardButton.closest('button')).toHaveClass('border-primary/40');
  });

  test('calls onSuccess when payment is successful', async () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    const confirmButton = screen.getByText('Confirm Payment Node');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  test('calls onClose when cancel button is clicked', () => {
    renderWithProviders(<PaymentModal {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('shows error message when payment fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Payment failed' } })
    });

    renderWithProviders(<PaymentModal {...mockProps} />);

    const confirmButton = screen.getByText('Confirm Payment Node');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('System Exception: Payment failed')).toBeInTheDocument();
    });
  });
});

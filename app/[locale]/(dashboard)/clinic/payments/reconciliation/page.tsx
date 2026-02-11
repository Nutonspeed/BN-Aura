'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bank,
  CreditCard,
  Money,
  QrCode,
  WaveTriangle,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Download,
  Funnel,
  Calendar,
  TrendUp,
  CurrencyCircleDollar,
  Warning
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface ReconciliationData {
  summary: {
    totalTransactions: number;
    totalAmount: number;
    completedAmount: number;
    failedAmount: number;
    refundedAmount: number;
    disputedAmount: number;
    statusBreakdown: Record<string, number>;
    methodBreakdown: Record<string, number>;
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    payment_date: string;
    metadata: any;
    created_by_user?: { full_name: string };
    updated_by_user?: { full_name: string };
  }>;
  reconciliationEvents: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    created_at: string;
    metadata: any;
  }>;
  dateRange: { startDate: string; endDate: string };
}

export default function PaymentReconciliationPage() {
  const { goBack } = useBackNavigation();
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchReconciliationData();
  }, [dateRange, statusFilter]);

  const fetchReconciliationData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate + 'T23:59:59').toISOString(),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/payments/reconciliation?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch reconciliation data');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Reconciliation fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      case 'disputed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return Money;
      case 'CARD': return CreditCard;
      case 'PROMPTPAY': return QrCode;
      case 'TRANSFER': return Bank;
      default: return CurrencyCircleDollar;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <ArrowsClockwise className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <WaveTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Reconciliation Data</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchReconciliationData} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-8"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb items={[
              { label: 'Clinic Dashboard', href: '/th/clinic' },
              { label: 'Payment Reconciliation' }
            ]} />
            <h1 className="text-3xl font-bold text-foreground tracking-tight mt-2">
              Payment Reconciliation
            </h1>
            <p className="text-muted-foreground">
              Monitor payment status, handle disputes, and track reconciliation events
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchReconciliationData}>
              <ArrowsClockwise className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Range Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Funnel className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Start Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">End Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Funnel className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="disputed">Disputed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Transactions"
            value={data.summary.totalTransactions.toLocaleString()}
            icon={CurrencyCircleDollar}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            title="Total Amount"
            value={formatAmount(data.summary.totalAmount)}
            icon={TrendUp}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            title="Failed Payments"
            value={formatAmount(data.summary.failedAmount)}
            icon={XCircle}
            trend={{ value: data.summary.failedAmount > 0 ? -5 : 0, isPositive: false }}
            className={data.summary.failedAmount > 0 ? 'border-red-200 bg-red-50' : ''}
          />
          <StatCard
            title="Disputed Amount"
            value={formatAmount(data.summary.disputedAmount)}
            icon={WaveTriangle}
            trend={{ value: data.summary.disputedAmount > 0 ? -10 : 0, isPositive: false }}
            className={data.summary.disputedAmount > 0 ? 'border-purple-200 bg-purple-50' : ''}
          />
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(data.summary.statusBreakdown).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">{status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(data.summary.methodBreakdown).map(([method, count]) => {
                const Icon = getMethodIcon(method);
                return (
                  <div key={method} className="flex items-center gap-3 p-4 border border-border rounded-lg">
                    <Icon className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-semibold">{count}</div>
                      <div className="text-xs text-muted-foreground capitalize">{method.toLowerCase()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.payments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    {React.createElement(getMethodIcon(payment.payment_method), {
                      className: "w-8 h-8 text-primary"
                    })}
                    <div>
                      <div className="font-semibold">{formatAmount(payment.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.created_by_user?.full_name || 'Unknown'} • {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge className={cn("capitalize", getStatusColor(payment.status))}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reconciliation Events */}
        {data.reconciliationEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warning className="w-5 h-5" />
                Reconciliation Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.reconciliationEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      event.priority === 'critical' ? 'bg-red-500' :
                      event.priority === 'high' ? 'bg-orange-500' :
                      event.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-sm text-muted-foreground">{event.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyCircleDollar,
  TrendUp,
  TrendDown,
  Calendar,
  Download,
  Plus,
  Funnel,
  ChartBar,
  ChartPie,
  FileText,
  Receipt,
  WaveTriangle,
  CheckCircle,
  XCircle,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface RevenueData {
  summary: {
    totalRevenue: number;
    subscriptionRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueGrowth: number;
    currency: string;
    period: { startDate: string; endDate: string };
  };
  revenueByPeriod: Array<{ period: string; revenue: number }>;
  revenueByMethod: Array<{ method: string; revenue: number; count: number; average: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
  transactionCount: number;
  averageTransactionValue: number;
}

export default function FinancialReportsPage() {
  const { goBack } = useBackNavigation();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'expenses' | 'profit-loss'>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate + 'T23:59:59').toISOString()
      });

      const [revenueRes, expensesRes] = await Promise.all([
        fetch(`/api/finance/reports/revenue?${params}`),
        fetch(`/api/finance/expenses?${params}`)
      ]);

      const revenueResult = await revenueRes.json();
      const expensesResult = await expensesRes.json();

      if (revenueRes.ok) {
        setRevenueData(revenueResult.data);
      }

      if (expensesRes.ok) {
        setExpenses(expensesResult.data?.expenses || []);
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'THB') => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return CheckCircle;
    if (profit < 0) return XCircle;
    return WaveTriangle;
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBar },
    { id: 'revenue', label: 'Revenue', icon: TrendUp },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'profit-loss', label: 'P&L Statement', icon: FileText }
  ];

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
              { label: 'Financial Reports' }
            ]} />
            <h1 className="text-3xl font-bold text-foreground tracking-tight mt-2">
              Financial Reports
            </h1>
            <p className="text-muted-foreground">
              Comprehensive revenue, expense, and profit analysis for your clinic
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchFinancialData}>
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
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Period:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && revenueData && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(revenueData.summary.totalRevenue)}
                  icon={CurrencyCircleDollar}
                  trend={{
                    value: revenueData.summary.revenueGrowth,
                    isPositive: revenueData.summary.revenueGrowth >= 0
                  }}
                />
                <StatCard
                  title="Total Expenses"
                  value={formatCurrency(revenueData.summary.totalExpenses)}
                  icon={Receipt}
                  trend={{ value: 0, isPositive: false }}
                />
                <StatCard
                  title="Net Profit"
                  value={formatCurrency(revenueData.summary.netProfit)}
                  icon={getProfitIcon(revenueData.summary.netProfit)}
                  trend={{
                    value: revenueData.summary.netProfit > 0 ? 15 : -10,
                    isPositive: revenueData.summary.netProfit > 0
                  }}
                  className={cn(
                    revenueData.summary.netProfit >= 0
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  )}
                />
                <StatCard
                  title="Avg Transaction"
                  value={formatCurrency(revenueData.averageTransactionValue)}
                  icon={ChartBar}
                  trend={{ value: 0, isPositive: true }}
                />
              </div>

              {/* Revenue vs Expenses Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Expenses Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <ChartBar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Chart visualization would be implemented here</p>
                      <p className="text-xs">Revenue: {formatCurrency(revenueData.summary.totalRevenue)}</p>
                      <p className="text-xs">Expenses: {formatCurrency(revenueData.summary.totalExpenses)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'revenue' && revenueData && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Revenue by Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueData.revenueByMethod.map((method) => (
                      <div key={method.method} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CurrencyCircleDollar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold capitalize">{method.method.toLowerCase()}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.count} transactions • Avg: {formatCurrency(method.average)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(method.revenue)}</div>
                          <div className="text-sm text-muted-foreground">
                            {((method.revenue / revenueData.summary.totalRevenue) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Add Expense Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Expense Management</h3>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>

              {/* Expenses List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses.length > 0 ? (
                    <div className="space-y-4">
                      {expenses.slice(0, 10).map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                              <div className="font-semibold">{expense.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {expense.category} • {new Date(expense.expense_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">-{formatCurrency(expense.amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No expenses recorded for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expense Categories */}
              {revenueData?.expensesByCategory && revenueData.expensesByCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueData.expensesByCategory.map((category) => (
                        <div key={category.category} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                              <ChartPie className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                              <div className="font-semibold capitalize">{category.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">{formatCurrency(category.amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'profit-loss' && revenueData && (
            <motion.div
              key="profit-loss"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Period: {new Date(revenueData.summary.period.startDate).toLocaleDateString()} - {new Date(revenueData.summary.period.endDate).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">Revenue</h4>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between">
                        <span>Service Revenue</span>
                        <span className="font-medium">{formatCurrency(revenueData.summary.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subscription Revenue</span>
                        <span className="font-medium">{formatCurrency(revenueData.summary.subscriptionRevenue)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total Revenue</span>
                        <span className="font-bold text-green-600">{formatCurrency(revenueData.summary.totalRevenue + revenueData.summary.subscriptionRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">Expenses</h4>
                    <div className="space-y-2 pl-4">
                      {revenueData.expensesByCategory.map((category) => (
                        <div key={category.category} className="flex justify-between">
                          <span className="capitalize">{category.category}</span>
                          <span className="font-medium">{formatCurrency(category.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total Expenses</span>
                        <span className="font-bold text-red-600">{formatCurrency(revenueData.summary.totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Net Profit</span>
                      <div className={cn("text-lg font-bold flex items-center gap-2", getProfitColor(revenueData.summary.netProfit))}>
                        {revenueData.summary.netProfit >= 0 ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        {formatCurrency(revenueData.summary.netProfit)}
                      </div>
                    </div>
                    {revenueData.summary.revenueGrowth !== 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Revenue growth: {revenueData.summary.revenueGrowth > 0 ? '+' : ''}{revenueData.summary.revenueGrowth}% vs previous period
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

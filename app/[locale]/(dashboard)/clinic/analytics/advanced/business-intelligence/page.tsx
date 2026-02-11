'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendUp,
  TrendDown,
  Users,
  CurrencyCircleDollar,
  Target,
  ChartBar,
  ChartPie,
  Pulse,
  WaveTriangle,
  CheckCircle,
  ArrowsClockwise,
  Download,
  Lightbulb,
  UserCheck,
  UserMinus,
  Crown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { cn } from '@/lib/utils';

interface BusinessIntelligenceData {
  customerAnalytics: {
    totalCustomers: number;
    segments: {
      new: number;
      active: number;
      vip: number;
      atRisk: number;
    };
    averageCLV: number;
    acquisitionByStaff: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
    retentionRate: number;
  };
  revenueAnalytics: {
    monthlyRevenue: Record<string, number>;
    growthRate: number;
    quarterlyRevenue: Record<number, number>;
    forecast: {
      nextMonth: number;
      confidence: number;
    };
    averageMonthlyRevenue: number;
  };
  treatmentAnalytics: {
    successRate: number;
    averageTreatmentsPerCustomer: number;
    popularTreatments: any[];
    treatmentCategories: Record<string, number>;
  };
  staffPerformance: {
    staffPerformance: Array<{
      id: string;
      name: string;
      role: string;
      totalCustomers: number;
      totalRevenue: number;
      averageRevenuePerCustomer: number;
      performanceScore: number;
    }>;
    topPerformers: any[];
    averagePerformanceScore: number;
  };
  predictiveInsights: {
    churnPrediction: {
      atRiskCustomers: number;
      churnRate: number;
      recommendedActions: string[];
    };
    revenuePrediction: {
      nextMonth: number;
      confidence: number;
      factors: string[];
    };
    opportunities: Array<{
      type: string;
      description: string;
      potentialRevenue: number;
    }>;
  };
}

export default function BusinessIntelligencePage() {
  const [data, setData] = useState<BusinessIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'revenue' | 'staff' | 'predictions'>('overview');

  useEffect(() => {
    fetchBusinessIntelligenceData();
  }, []);

  const fetchBusinessIntelligenceData = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/analytics/advanced/business-intelligence');
      const result = await response.json();

      if (response.ok) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch BI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  if (!data) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBar },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'revenue', label: 'Revenue', icon: CurrencyCircleDollar },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'predictions', label: 'Predictions', icon: Lightbulb }
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
              { label: 'Business Intelligence' }
            ]} />
            <h1 className="text-3xl font-bold text-foreground tracking-tight mt-2">
              Business Intelligence
            </h1>
            <p className="text-muted-foreground">
              Advanced analytics, predictive insights, and business intelligence for data-driven decisions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchBusinessIntelligenceData}>
              <ArrowsClockwise className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap",
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
          {activeTab === 'overview' && (
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
                  title="Total Customers"
                  value={data.customerAnalytics.totalCustomers.toLocaleString()}
                  icon={Users}
                  trend={{ value: 0, isPositive: true }}
                />
                <StatCard
                  title="Average CLV"
                  value={formatCurrency(data.customerAnalytics.averageCLV)}
                  icon={CurrencyCircleDollar}
                  trend={{ value: 0, isPositive: true }}
                />
                <StatCard
                  title="Revenue Growth"
                  value={formatPercentage(data.revenueAnalytics.growthRate)}
                  icon={data.revenueAnalytics.growthRate >= 0 ? TrendUp : TrendDown}
                  trend={{
                    value: Math.abs(data.revenueAnalytics.growthRate),
                    isPositive: data.revenueAnalytics.growthRate >= 0
                  }}
                />
                <StatCard
                  title="Retention Rate"
                  value={`${data.customerAnalytics.retentionRate}%`}
                  icon={UserCheck}
                  trend={{
                    value: data.customerAnalytics.retentionRate - 70, // Assuming 70% is baseline
                    isPositive: data.customerAnalytics.retentionRate >= 70
                  }}
                />
              </div>

              {/* Customer Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segmentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                      <UserCheck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{data.customerAnalytics.segments.new}</div>
                      <div className="text-sm text-muted-foreground">New Customers</div>
                    </div>
                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                      <Pulse className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{data.customerAnalytics.segments.active}</div>
                      <div className="text-sm text-muted-foreground">Active Customers</div>
                    </div>
                    <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                      <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{data.customerAnalytics.segments.vip}</div>
                      <div className="text-sm text-muted-foreground">VIP Customers</div>
                    </div>
                    <div className="text-center p-4 bg-red-500/10 rounded-lg">
                      <UserMinus className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">{data.customerAnalytics.segments.atRisk}</div>
                      <div className="text-sm text-muted-foreground">At Risk</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(data.revenueAnalytics.forecast.nextMonth)}
                      </div>
                      <div className="text-sm text-muted-foreground">Predicted next month revenue</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Confidence: {Math.round(data.revenueAnalytics.forecast.confidence * 100)}%
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Based on 90-day trends
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Customer Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Customers"
                  value={data.customerAnalytics.totalCustomers.toLocaleString()}
                  icon={Users}
                />
                <StatCard
                  title="Average CLV"
                  value={formatCurrency(data.customerAnalytics.averageCLV)}
                  icon={CurrencyCircleDollar}
                />
                <StatCard
                  title="Retention Rate"
                  value={`${data.customerAnalytics.retentionRate}%`}
                  icon={UserCheck}
                />
              </div>

              {/* Acquisition by Staff */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Acquisition by Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.customerAnalytics.acquisitionByStaff.map((staff, index) => (
                      <div key={staff.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{staff.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {staff.count} customers • {formatCurrency(staff.revenue)} revenue
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Avg per customer</div>
                          <div className="font-bold">
                            {formatCurrency(staff.count > 0 ? staff.revenue / staff.count : 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'revenue' && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Monthly Growth"
                  value={formatPercentage(data.revenueAnalytics.growthRate)}
                  icon={data.revenueAnalytics.growthRate >= 0 ? TrendUp : TrendDown}
                  trend={{
                    value: Math.abs(data.revenueAnalytics.growthRate),
                    isPositive: data.revenueAnalytics.growthRate >= 0
                  }}
                />
                <StatCard
                  title="Average Monthly"
                  value={formatCurrency(data.revenueAnalytics.averageMonthlyRevenue)}
                  icon={ChartBar}
                />
                <StatCard
                  title="Next Month Forecast"
                  value={formatCurrency(data.revenueAnalytics.forecast.nextMonth)}
                  icon={Target}
                />
              </div>

              {/* Quarterly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Quarterly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(quarter => (
                      <div key={quarter} className="text-center p-4 bg-secondary rounded-lg">
                        <div className="text-sm text-muted-foreground">Q{quarter}</div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(data.revenueAnalytics.quarterlyRevenue[quarter] || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Staff Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="Top Performer"
                  value={data.staffPerformance.topPerformers[0]?.name || 'N/A'}
                  icon={Crown}
                />
                <StatCard
                  title="Average Performance"
                  value={data.staffPerformance.averagePerformanceScore.toFixed(1)}
                  icon={Target}
                />
              </div>

              {/* Staff Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.staffPerformance.staffPerformance.map((staff, index) => (
                      <div key={staff.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                            index < 3 ? "bg-yellow-500 text-white" : "bg-secondary text-foreground"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{staff.name}</div>
                            <div className="text-sm text-muted-foreground capitalize">{staff.role}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-right">
                          <div>
                            <div className="text-sm text-muted-foreground">Customers</div>
                            <div className="font-bold">{staff.totalCustomers}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                            <div className="font-bold">{formatCurrency(staff.totalRevenue)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Score</div>
                            <div className="font-bold">{staff.performanceScore}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'predictions' && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Churn Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WaveTriangle className="w-5 h-5 text-orange-500" />
                    Churn Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {data.predictiveInsights.churnPrediction.atRiskCustomers}
                      </div>
                      <div className="text-sm text-muted-foreground">Customers at risk of churning</div>
                      <div className="text-lg font-semibold text-orange-600 mt-2">
                        {data.predictiveInsights.churnPrediction.churnRate}% churn rate
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Recommended Actions</h4>
                      <ul className="space-y-2">
                        {data.predictiveInsights.churnPrediction.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="w-5 h-5 text-blue-500" />
                    Revenue Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {formatCurrency(data.predictiveInsights.revenuePrediction.nextMonth)}
                      </div>
                      <div className="text-sm text-muted-foreground">Predicted revenue next month</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Confidence: {Math.round(data.predictiveInsights.revenuePrediction.confidence * 100)}%
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Prediction Factors</h4>
                      <ul className="space-y-2">
                        {data.predictiveInsights.revenuePrediction.factors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <ChartBar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-500" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.predictiveInsights.opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <div className="font-semibold capitalize">{opportunity.type} Opportunity</div>
                            <div className="text-sm text-muted-foreground">{opportunity.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Potential Revenue</div>
                          <div className="font-bold text-green-600">{formatCurrency(opportunity.potentialRevenue)}</div>
                        </div>
                      </div>
                    ))}
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

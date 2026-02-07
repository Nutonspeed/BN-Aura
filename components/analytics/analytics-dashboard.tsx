// Advanced Analytics Dashboard
// Real-time analytics with WebSocket integration

'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendUp,
  TrendDown,
  Users,
  CurrencyDollar,
  CalendarDots,
  Pulse,
  Eye,
  Cursor,
  Clock,
  WarningCircle,
  CheckCircle
} from '@phosphor-icons/react';
import { useNotifications } from '@/hooks/use-notifications';

interface AnalyticsData {
  revenue: Array<{ date: string; amount: number; target: number }>;
  customers: Array<{ date: string; new: number; returning: number; total: number }>;
  treatments: Array<{ name: string; count: number; revenue: number }>;
  performance: Array<{ metric: string; current: number; previous: number; change: number }>;
  realTime: {
    activeUsers: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  color = 'blue'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className={`p-6 rounded-lg border ${getColorClasses()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value || 0}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2 text-sm">
              {getTrendIcon()}
              <span className={`ml-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-white/50">
          {icon}
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
  
  const { trackEvent } = useNotifications();

  // Mock data generation
  const generateMockData = (): AnalyticsData => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const revenue = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i - 1));
      const baseAmount = 50000 + Math.random() * 30000;
      return {
        date: date.toLocaleDateString(),
        amount: Math.round(baseAmount),
        target: Math.round(60000 + Math.random() * 20000)
      };
    });

    const customers = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i - 1));
      const newCustomers = Math.floor(5 + Math.random() * 15);
      const returningCustomers = Math.floor(10 + Math.random() * 25);
      return {
        date: date.toLocaleDateString(),
        new: newCustomers,
        returning: returningCustomers,
        total: newCustomers + returningCustomers
      };
    });

    const treatments = [
      { name: 'Facial Treatment', count: 145, revenue: 435000 },
      { name: 'Skin Analysis', count: 89, revenue: 178000 },
      { name: 'Anti-aging', count: 67, revenue: 335000 },
      { name: 'Acne Treatment', count: 54, revenue: 162000 },
      { name: 'Whitening', count: 43, revenue: 215000 }
    ];

    const performance = [
      { metric: 'Revenue', current: 1250000, previous: 1180000, change: 5.9 },
      { metric: 'Customers', current: 398, previous: 376, change: 5.9 },
      { metric: 'Treatments', current: 0, count: 398, previous: 367, change: 8.4 },
      { metric: 'Avg. Order Value', current: 3142, previous: 3138, change: 0.1 }
    ];

    return {
      revenue,
      customers,
      treatments,
      performance,
      realTime: {
        activeUsers: Math.floor(15 + Math.random() * 10),
        pageViews: Math.floor(200 + Math.random() * 50),
        avgSessionDuration: Math.floor(180 + Math.random() * 120),
        bounceRate: Math.round(25 + Math.random() * 15)
      }
    };
  };

  // Load analytics data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const data = generateMockData();
      setAnalyticsData(data);
      setIsLoading(false);
      
      // Track analytics view
      trackEvent({
        type: 'user_action',
        category: 'analytics',
        action: 'dashboard_view',
        data: { timeRange }
      });
    }, 1000);
  }, [timeRange, trackEvent]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (analyticsData) {
        const update = {
          timestamp: new Date().toISOString(),
          type: ['page_view', 'user_action', 'conversion'][Math.floor(Math.random() * 3)],
          userId: `user_${Math.floor(Math.random() * 100)}`,
          data: {
            page: ['/dashboard', '/analytics', '/customers', '/treatments'][Math.floor(Math.random() * 4)],
            action: 'view'
          }
        };
        
        setRealTimeUpdates(prev => [update, ...prev.slice(0, 9)]);
        
        // Update real-time metrics
        setAnalyticsData(prev => prev ? {
          ...prev,
          realTime: {
            ...prev.realTime,
            activeUsers: Math.max(5, prev.realTime.activeUsers + (Math.random() > 0.5 ? 1 : -1)),
            pageViews: prev.realTime.pageViews + Math.floor(Math.random() * 3)
          }
        } : null);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [analyticsData]);

  if (isLoading || !analyticsData) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time business insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`฿${(analyticsData.revenue.reduce((sum, r) => sum + r.amount, 0) / 1000000).toFixed(1)}M`}
          change={5.9}
          icon={<CurrencyDollar className="w-6 h-6" />}
          trend="up"
          color="green"
        />
        <MetricCard
          title="Total Customers"
          value={analyticsData.customers[analyticsData.customers.length - 1].total}
          change={5.9}
          icon={<Users className="w-6 h-6" />}
          trend="up"
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={analyticsData.realTime.activeUsers}
          icon={<Pulse className="w-6 h-6" />}
          color="yellow"
        />
        <MetricCard
          title="Avg Session"
          value={`${Math.floor(analyticsData.realTime.avgSessionDuration / 60)}m`}
          icon={<Clock className="w-6 h-6" />}
          color="blue"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, '']} />
              <Legend />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
                name="Target"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Growth */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.customers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="new"
                stroke="#3B82F6"
                strokeWidth={2}
                name="New Customers"
              />
              <Line
                type="monotone"
                dataKey="returning"
                stroke="#10B981"
                strokeWidth={2}
                name="Returning Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment Popularity */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Popular Treatments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.treatments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Treatment */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Revenue by Treatment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.treatments}
                cx="50%"
                cy="50%"
                labelLine={false}
                  label={(({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`) as any}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {analyticsData.treatments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {/* @ts-ignore */}
              <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Real-time Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {realTimeUpdates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Waiting for activity...</p>
            ) : (
              realTimeUpdates.map((update, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Pulse className="w-4 h-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{update.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-600">
                      {update.userId} • {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {update.type === 'conversion' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-4">
            {analyticsData.performance.map((metric) => (
              <div key={metric.metric} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{metric.metric}</p>
                  <p className="text-xs text-gray-600">
                    vs. previous period
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {metric.current.toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    metric.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
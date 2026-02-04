// Security Monitoring Dashboard Component
// Real-time security monitoring and threat detection

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Warning,
  Pulse,
  Users,
  Eye,
  Lock,
  LockOpen,
  TrendUp,
  TrendDown,
  CalendarDots,
  Funnel,
  Download,
  ArrowsClockwise,
  WarningCircle,
  CheckCircle,
  XCircle,
  Info,
  MagnifyingGlass
} from '@phosphor-icons/react';
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

interface SecurityMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address: string;
  description: string;
  status: 'active' | 'resolved' | 'investigating';
}

interface ThreatData {
  timestamp: string;
  threats: number;
  blocked: number;
  critical: number;
}

interface UserActivity {
  hour: string;
  logins: number;
  failed_logins: number;
  data_access: number;
}

const SecurityDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data generation
  const generateMockData = () => {
    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    
    const threatData = Array.from({ length: Math.min(hours, 24) }, (_, i) => {
      const time = new Date(now);
      time.setHours(time.getHours() - (Math.min(hours, 24) - i - 1));
      
      return {
        timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        threats: Math.floor(Math.random() * 20) + 5,
        blocked: Math.floor(Math.random() * 15) + 3,
        critical: Math.floor(Math.random() * 3)
      };
    });

    const userActivity = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - (23 - i));
      
      return {
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        logins: Math.floor(Math.random() * 50) + 10,
        failed_logins: Math.floor(Math.random() * 10) + 2,
        data_access: Math.floor(Math.random() * 100) + 20
      };
    });

    const securityMetrics: SecurityMetric[] = [
      {
        name: 'Active Threats',
        value: 12,
        change: -15,
        trend: 'down',
        severity: 'high'
      },
      {
        name: 'Failed Logins',
        value: 47,
        change: 8,
        trend: 'up',
        severity: 'medium'
      },
      {
        name: 'Blocked Requests',
        value: 234,
        change: 25,
        trend: 'up',
        severity: 'low'
      },
      {
        name: 'Security Score',
        value: 87,
        change: -2,
        trend: 'down',
        severity: 'low'
      }
    ];

    const securityEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        type: 'Multiple Failed Logins',
        severity: 'high',
        user_id: 'user_123',
        ip_address: '192.168.1.100',
        description: '5 failed login attempts detected from IP 192.168.1.100',
        status: 'investigating'
      },
      {
        id: '2',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        type: 'Suspicious Data Access',
        severity: 'medium',
        user_id: 'user_456',
        ip_address: '10.0.0.50',
        description: 'Unusual data access pattern detected',
        status: 'active'
      },
      {
        id: '3',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        type: 'Rate Limit Exceeded',
        severity: 'low',
        ip_address: '203.0.113.1',
        description: 'API rate limit exceeded for IP 203.0.113.1',
        status: 'resolved'
      },
      {
        id: '4',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        type: 'Unauthorized Access Attempt',
        severity: 'critical',
        ip_address: '198.51.100.1',
        description: 'Attempted access to admin endpoints without authorization',
        status: 'investigating'
      }
    ];

    return {
      threatData,
      userActivity,
      metrics: securityMetrics,
      events: securityEvents
    };
  };

  // Load security data
  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const data = generateMockData();
      setThreatData(data.threatData);
      setUserActivity(data.userActivity);
      setMetrics(data.metrics);
      setEvents(data.events);
      setIsLoading(false);
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'investigating': return <Search className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];

  if (isLoading) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Security Monitoring Dashboard
          </h1>
          <p className="text-gray-600">Real-time security monitoring and threat detection</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border ${
              autoRefresh 
                ? 'bg-green-50 border-green-300 text-green-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className={`p-6 rounded-lg border ${getSeverityColor(metric.severity)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{metric.name}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                <div className="flex items-center mt-2 text-sm">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  ) : null}
                  <span className={metric.change > 0 ? 'text-red-600' : 'text-green-600'}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/50">
                {metric.severity === 'critical' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                {metric.severity === 'high' && <Shield className="w-6 h-6 text-orange-600" />}
                {metric.severity === 'medium' && <AlertCircle className="w-6 h-6 text-yellow-600" />}
                {metric.severity === 'low' && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Trends */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Threat Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={threatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="threats"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
                name="Threats"
              />
              <Area
                type="monotone"
                dataKey="blocked"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Blocked"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">User Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="logins"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Logins"
              />
              <Line
                type="monotone"
                dataKey="failed_logins"
                stroke="#EF4444"
                strokeWidth={2}
                name="Failed Logins"
              />
              <Line
                type="monotone"
                dataKey="data_access"
                stroke="#10B981"
                strokeWidth={2}
                name="Data Access"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Events</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User/IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      {event.user_id && <div>{event.user_id}</div>}
                      <div className="text-gray-500">{event.ip_address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={event.description}>
                      {event.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(event.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {event.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Investigate
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;

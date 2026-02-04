'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Pulse, HardDrives, CheckCircle, Cpu, HardDrive, Users, ArrowsClockwise, SpinnerGap,
  Warning, Database, WifiHigh, WifiSlash, Clock
} from '@phosphor-icons/react';
import { SystemMonitoringProvider, useSystemMonitoringContext } from './context';

function SystemMonitoringContent() {
  const { metrics, alerts, health, loading, refreshing, fetchMetrics, fetchAlerts, fetchHealth } = useSystemMonitoringContext();
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'disk'>('cpu');

  useEffect(() => {
    fetchMetrics();
    fetchAlerts();
    fetchHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
      fetchAlerts();
      fetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMetrics, fetchAlerts, fetchHealth]);

  const getStatusColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value <= threshold.good) return 'text-emerald-400';
    if (value <= threshold.warning) return 'text-amber-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'degraded':
        return <Warning className="w-5 h-5 text-amber-400" />;
      case 'offline':
        return <WifiSlash className="w-5 h-5 text-red-400" />;
      default:
        return <WifiHigh className="w-5 h-5 text-gray-400" />;
    }
  };

  const currentMetric = metrics[0];
  const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => !a.resolved && a.severity === 'high').length;

  if (loading && metrics.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Pulse className="w-8 h-8 text-primary" />
            System Monitoring
          </h1>
          <p className="text-white/60 mt-1">Real-time system health and performance monitoring</p>
        </div>
        <button 
          onClick={() => {
            fetchMetrics();
            fetchAlerts();
            fetchHealth();
          }}
          disabled={refreshing}
          className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowsClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <HardDrives className="w-6 h-6 text-emerald-400" />
            </div>
            <span className={`text-xs font-bold ${
              health?.status === 'healthy' ? 'text-emerald-400' :
              health?.status === 'warning' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {health?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{health?.uptime || 99.9}%</p>
            <p className="text-white/60 text-sm">System Uptime</p>
          </div>
        </motion.div>

        {/* CPU Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Cpu className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div>
            <p className={`text-3xl font-bold ${getStatusColor(currentMetric?.cpu || 0, { good: 60, warning: 80 })}`}>
              {currentMetric?.cpu.toFixed(1) || 0}%
            </p>
            <p className="text-white/60 text-sm">CPU Usage</p>
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <HardDrive className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <p className={`text-3xl font-bold ${getStatusColor(currentMetric?.memory || 0, { good: 70, warning: 85 })}`}>
              {currentMetric?.memory.toFixed(1) || 0}%
            </p>
            <p className="text-white/60 text-sm">Memory Usage</p>
          </div>
        </motion.div>

        {/* Active Connections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{currentMetric?.active_connections || 0}</p>
            <p className="text-white/60 text-sm">Active Connections</p>
          </div>
        </motion.div>
      </div>

      {/* Alerts Section */}
      {(criticalAlerts > 0 || warningAlerts > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-6 rounded-2xl border ${
            criticalAlerts > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-amber-500/50 bg-amber-500/5'
          }`}
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Warning className="w-5 h-5" />
            Active Alerts
          </h3>
          <div className="flex gap-4">
            {criticalAlerts > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-400">{criticalAlerts} Critical</span>
              </div>
            )}
            {warningAlerts > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-amber-400">{warningAlerts} High</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Services Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Database className="w-5 h-5 text-primary" />
          Service Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {health?.services && Object.entries(health.services).map(([service, status]) => (
            <div key={service} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <span className="text-white/80 capitalize">{service}</span>
              {getStatusIcon(status)}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Performance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <HardDrives className="w-5 h-5 text-primary" />
          Performance Metrics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Average Response Time</span>
            <span className={`font-bold ${getStatusColor(currentMetric?.response_time || 0, { good: 200, warning: 500 })}`}>
              {currentMetric?.response_time || 0}ms
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80">Error Rate</span>
            <span className={`font-bold ${getStatusColor(currentMetric?.error_rate || 0, { good: 0.5, warning: 2 })}`}>
              {currentMetric?.error_rate.toFixed(2) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80">Disk Usage</span>
            <span className={`font-bold ${getStatusColor(currentMetric?.disk || 0, { good: 70, warning: 85 })}`}>
              {currentMetric?.disk.toFixed(1) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80">Last Check</span>
            <span className="font-bold text-white/80">
              {health?.last_check ? new Date(health.last_check).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SystemMonitoringPage() {
  return (
    <SystemMonitoringProvider>
      <SystemMonitoringContent />
    </SystemMonitoringProvider>
  );
}

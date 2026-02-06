'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Globe, 
  HardDrives, 
  Database, 
  Cloud, 
  Shield, 
  Buildings,
  Pulse,
  Clock,
  Lightning,
  HardDrive,
  Users,
  TrendUp,
  WarningCircle
} from '@phosphor-icons/react';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

interface NetworkNodeDetailPanelProps {
  node: NetworkNode | null;
  onClose: () => void;
}

export default function NetworkNodeDetailPanel({ node, onClose }: NetworkNodeDetailPanelProps) {
  if (!node) return null;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'server': return <HardDrives className="w-6 h-6" />;
      case 'database': return <Database className="w-6 h-6" />;
      case 'api': return <Cloud className="w-6 h-6" />;
      case 'auth': return <Shield className="w-6 h-6" />;
      case 'storage': return <Database className="w-6 h-6" />;
      case 'clinic': return <Buildings className="w-6 h-6" />;
      default: return <Globe className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'offline': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getHealthScore = () => {
    const { latency, uptime, load } = node.metrics;
    const latencyScore = Math.max(0, 100 - latency);
    const uptimeScore = uptime;
    const loadScore = Math.max(0, 100 - load);
    return Math.round((latencyScore * 0.3 + uptimeScore * 0.5 + loadScore * 0.2));
  };

  const healthScore = getHealthScore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${getStatusColor(node.status)}`}>
              {getNodeIcon(node.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{node.name}</h2>
              <p className="text-sm text-white/60">{node.location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(node.status)}`}>
            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-400/20">
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </div>
        </div>

        {/* Health Score */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white/80">Health Score</h3>
            <Pulse className="w-4 h-4 text-white/60" />
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white">{healthScore}</span>
            <span className="text-lg text-white/60 mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                healthScore >= 80 ? 'bg-emerald-400' : 
                healthScore >= 60 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-white/80 mb-3">Performance Metrics</h3>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lightning className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/80">Latency</span>
              </div>
              <span className="text-lg font-bold text-white">{node.metrics.latency}ms</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  node.metrics.latency < 50 ? 'bg-emerald-400' :
                  node.metrics.latency < 100 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(100, (node.metrics.latency / 200) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/80">Uptime</span>
              </div>
              <span className="text-lg font-bold text-white">{node.metrics.uptime}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-400"
                style={{ width: `${node.metrics.uptime}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/80">System Load</span>
              </div>
              <span className="text-lg font-bold text-white">{node.metrics.load}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  node.metrics.load < 60 ? 'bg-emerald-400' :
                  node.metrics.load < 80 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${node.metrics.load}%` }}
              />
            </div>
          </div>

          {node.type === 'clinic' && (
            <>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white/80">Active Users</span>
                  </div>
                  <span className="text-lg font-bold text-white">{node.metrics.users || 0}</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-white/80">Staff Members</span>
                  </div>
                  <span className="text-lg font-bold text-white">{node.metrics.staff || 0}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-white/80 mb-3">Quick Actions</h3>
          
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-left transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendUp className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">View Performance History</p>
                <p className="text-xs text-white/60">Last 24 hours data</p>
              </div>
            </div>
          </button>

          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-left transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Pulse className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">View System Logs</p>
                <p className="text-xs text-white/60">Recent activity & errors</p>
              </div>
            </div>
          </button>

          {node.status === 'offline' && (
            <button className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/20 rounded-xl p-3 text-left transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Pulse className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400">Restart Node</p>
                  <p className="text-xs text-emerald-400/60">Attempt to bring online</p>
                </div>
              </div>
            </button>
          )}

          {node.status === 'warning' && (
            <button className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 rounded-xl p-3 text-left transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <WarningCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400">View Warnings</p>
                  <p className="text-xs text-amber-400/60">Check issues & alerts</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Recent Events */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/80 mb-3">Recent Events</h3>
          
          <div className="space-y-2">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-white">Node started successfully</p>
                  <p className="text-xs text-white/60 mt-1">2 minutes ago</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-white">Performance metrics updated</p>
                  <p className="text-xs text-white/60 mt-1">5 minutes ago</p>
                </div>
              </div>
            </div>

            {node.status === 'warning' && (
              <div className="bg-white/5 border border-amber-400/20 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-400">High latency detected</p>
                    <p className="text-xs text-amber-400/60 mt-1">15 minutes ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
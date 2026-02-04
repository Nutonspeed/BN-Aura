'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Warning, XCircle } from '@phosphor-icons/react';

interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'unusual_access' | 'data_breach' | 'malware' | 'phishing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: number;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  onAlertClick?: (alert: SecurityAlert) => void;
}

export default function SecurityAlerts({ alerts, onAlertClick }: SecurityAlertsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Warning className="w-5 h-5" />
          Security Alerts
        </h3>
        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
          {alerts.filter(a => a.status === 'active').length} Active
        </span>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => onAlertClick?.(alert)}
            className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.status === 'active' ? 'bg-red-500/20 text-red-400' :
                    alert.status === 'investigating' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {alert.status}
                  </span>
                </div>
                <h4 className="font-medium text-white mb-1">{alert.title}</h4>
                <p className="text-gray-300 text-sm mb-2">{alert.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{formatTime(alert.timestamp)}</span>
                  <span>{alert.affectedUsers} affected users</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

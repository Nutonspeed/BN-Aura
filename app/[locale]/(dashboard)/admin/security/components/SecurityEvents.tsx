'use client';

import { motion } from 'framer-motion';
import { Pulse, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';

interface SecurityEvent {
  id: string;
  type: 'login' | 'password_change' | '2fa_enabled' | 'suspicious' | 'security_alert';
  user: string;
  email: string;
  ip: string;
  location: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning' | 'critical';
  details: string;
}

interface SecurityEventsProps {
  events: SecurityEvent[];
}

export default function SecurityEvents({ events }: SecurityEventsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'critical': return <Activity className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
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
      transition={{ delay: 0.8 }}
      className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Security Events
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-300 text-sm border-b border-slate-600">
              <th className="pb-3 font-semibold">Event</th>
              <th className="pb-3 font-semibold">User</th>
              <th className="pb-3 font-semibold">IP Address</th>
              <th className="pb-3 font-semibold">Location</th>
              <th className="pb-3 font-semibold">Time</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {events.map((event) => (
              <tr key={event.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                <td className="py-3">
                  <div>
                    <p className="text-white capitalize font-medium">{event.type.replace('_', ' ')}</p>
                    <p className="text-gray-400 text-xs">{event.details}</p>
                  </div>
                </td>
                <td className="py-3">
                  <div>
                    <p className="text-white font-medium">{event.user}</p>
                    <p className="text-gray-400 text-xs">{event.email}</p>
                  </div>
                </td>
                <td className="py-3 text-gray-300 font-mono text-xs">{event.ip}</td>
                <td className="py-3 text-gray-300">{event.location}</td>
                <td className="py-3 text-gray-400">{formatTime(event.timestamp)}</td>
                <td className="py-3">
                  {getStatusIcon(event.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

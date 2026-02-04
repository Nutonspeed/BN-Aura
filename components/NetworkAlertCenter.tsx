'use client';

import React, { useState } from 'react';
import { Bell, Warning, CheckCircle, Info, XCircle } from '@phosphor-icons/react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function NetworkAlertCenter({ alerts }: { alerts: Alert[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = alerts.filter(a => !a.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
      >
        <Bell className="w-5 h-5 text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-50 max-h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-3">Alerts ({alerts.length})</h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  {getIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{alert.title}</p>
                    <p className="text-white/60 text-xs mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

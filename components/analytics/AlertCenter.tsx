'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  Package, 
  X,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Alert {
  type: 'revenue_drop' | 'customer_churn' | 'staff_performance' | 'inventory_low';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  value?: string;
  timestamp?: Date;
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/ai/business-advisor?type=alerts');
      const result = await response.json();

      if (result.success && result.alerts.alerts) {
        const alertsWithTimestamp = result.alerts.alerts.map((alert: Alert) => ({
          ...alert,
          timestamp: new Date()
        }));
        setAlerts(alertsWithTimestamp);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'revenue_drop':
        return <TrendingDown className="w-5 h-5" />;
      case 'customer_churn':
        return <Users className="w-5 h-5" />;
      case 'staff_performance':
        return <AlertCircle className="w-5 h-5" />;
      case 'inventory_low':
        return <Package className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getSeverityConfig = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-500/10 border-red-500/30',
          textColor: 'text-red-500',
          badgeColor: 'bg-red-500 text-white',
          iconBg: 'bg-red-500/20'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-500/10 border-orange-500/30',
          textColor: 'text-orange-500',
          badgeColor: 'bg-orange-500 text-white',
          iconBg: 'bg-orange-500/20'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-500/10 border-yellow-500/30',
          textColor: 'text-yellow-500',
          badgeColor: 'bg-yellow-500 text-black',
          iconBg: 'bg-yellow-500/20'
        };
      case 'low':
        return {
          bgColor: 'bg-blue-500/10 border-blue-500/30',
          textColor: 'text-blue-500',
          badgeColor: 'bg-blue-500 text-white',
          iconBg: 'bg-blue-500/20'
        };
      default:
        return {
          bgColor: 'bg-muted/20 border-border',
          textColor: 'text-muted-foreground',
          badgeColor: 'bg-muted text-muted-foreground',
          iconBg: 'bg-muted/30'
        };
    }
  };

  const dismissAlert = (alertIndex: number) => {
    const alertKey = `${alerts[alertIndex].type}_${alertIndex}`;
    setDismissed(prev => new Set(prev).add(alertKey));
  };

  const visibleAlerts = alerts.filter((_, index) => {
    const alertKey = `${alerts[index].type}_${index}`;
    return !dismissed.has(alertKey);
  });

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-muted rounded-xl" />
          <div className="w-32 h-6 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 bg-muted/20 rounded-xl">
              <div className="w-full h-4 bg-muted rounded mb-2" />
              <div className="w-3/4 h-3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Smart Alerts</h3>
              <p className="text-sm text-muted-foreground">การแจ้งเตือนอัตโนมัติเพื่อการตัดสินใจ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {visibleAlerts.length > 0 && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-bold">
                {visibleAlerts.length}
              </span>
            )}
            <button
              onClick={fetchAlerts}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              title="รีเฟรช"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {visibleAlerts.length > 0 ? (
            <div className="p-4 space-y-3">
              {visibleAlerts.map((alert, index) => {
                const config = getSeverityConfig(alert.severity);
                
                return (
                  <motion.div
                    key={`${alert.type}_${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border rounded-xl relative ${config.bgColor}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${config.iconBg} ${config.textColor} flex-shrink-0 mt-0.5`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground text-sm">
                              {alert.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${config.badgeColor}`}>
                              {alert.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                          
                          {alert.value && (
                            <div className="text-lg font-bold text-foreground">
                              {alert.value}
                            </div>
                          )}
                          
                          <div className="p-3 bg-background/50 rounded-lg border border-border">
                            <p className="text-xs font-medium text-foreground mb-1">คำแนะนำ:</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.recommendation}
                            </p>
                          </div>
                          
                          {alert.timestamp && (
                            <p className="text-xs text-muted-foreground">
                              {alert.timestamp.toLocaleTimeString('th-TH', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} น.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            // TODO: Navigate to detailed view
                          }}
                          className="p-1 hover:bg-background/50 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => dismissAlert(index)}
                          className="p-1 hover:bg-background/50 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="ปิดการแจ้งเตือน"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">ไม่มีการแจ้งเตือน</p>
              <p className="text-xs opacity-60">ระบบทำงานปกติ ไม่พบสิ่งผิดปกติ</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {visibleAlerts.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/20">
          <button
            onClick={() => {
              // Mark all alerts as read/dismissed
              const allKeys = alerts.map((_, index) => `${alerts[index].type}_${index}`);
              setDismissed(new Set(allKeys));
            }}
            className="w-full py-2 px-4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ปิดการแจ้งเตือนทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}

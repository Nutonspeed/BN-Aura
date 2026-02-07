'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { 
  Warning,
  CheckCircle,
  Bell,
  ArrowsClockwise,
  X
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  type: string;
  severity: 'warning' | 'critical' | 'urgent';
  clinicName: string;
  message: string;
  details: {
    currentUsage: number;
    monthlyQuota: number;
    utilizationRate: number;
    recommendedAction: string;
  };
  timestamp: string;
  acknowledged: boolean;
}

interface QuotaAlertPanelProps {
  clinicId?: string;
  compact?: boolean;
}

export default function QuotaAlertPanel({ clinicId, compact = false }: QuotaAlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAlerts(); }, [clinicId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = clinicId ? `/api/alerts/quota?clinicId=${clinicId}` : '/api/alerts/quota';
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setAlerts(result.data.alerts);
        setStats(result.data.stats);
      }
    } catch { /* API may not be available */ }
    setLoading(false);
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/alerts/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId })
      });
      fetchAlerts();
    } catch (e) { console.error(e); }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-red-500/10 border-red-500/30 text-red-500';
      case 'critical': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      default: return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'urgent') return <Warning weight="fill" className="w-5 h-5 text-red-500" />;
    return <Warning weight="duotone" className="w-5 h-5 text-amber-500" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4" />
        <span className="text-sm">{alerts.filter(a => !a.acknowledged).length} alerts</span>
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell weight="duotone" className="w-4 h-4 text-primary" />
            Quota Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">{alerts.filter(a => !a.acknowledged).length}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchAlerts}>
            <ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">กำลังโหลด...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle weight="duotone" className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">ไม่มี alerts</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.slice(0, 5).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`p-3 rounded-xl border ${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{alert.clinicName}</span>
                      <Badge variant="outline" className="text-[10px]">{alert.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        ใช้ไป {alert.details.utilizationRate}%
                      </span>
                      {!alert.acknowledged && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => acknowledgeAlert(alert.id)}>
                          รับทราบ
                        </Button>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button onClick={() => acknowledgeAlert(alert.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {stats && (
          <div className="pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-lg font-bold text-red-500">{stats.bySeverity?.urgent || 0}</div><div className="text-[10px] text-muted-foreground">Urgent</div></div>
            <div><div className="text-lg font-bold text-amber-500">{stats.bySeverity?.critical || 0}</div><div className="text-[10px] text-muted-foreground">Critical</div></div>
            <div><div className="text-lg font-bold text-yellow-500">{stats.bySeverity?.warning || 0}</div><div className="text-[10px] text-muted-foreground">Warning</div></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

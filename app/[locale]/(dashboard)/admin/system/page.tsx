'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pulse,
  HardDrives,
  CheckCircle,
  Cpu,
  HardDrive,
  Users,
  ArrowsClockwise,
  SpinnerGap,
  Warning,
  Database,
  WifiHigh,
  WifiSlash,
  Clock,
  ArrowLeft,
  ChartLineUp,
  ChartLine,
  ShieldCheck
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useSystemMonitoringContext, SystemMonitoringProvider } from './context';

function SystemMonitoringContent() {
  const { goBack } = useBackNavigation();
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
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Pulse weight="duotone" className="w-4 h-4" />
            สถานะระบบ
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            System <span className="text-primary">Monitoring</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            ตรวจสอบประสิทธิภาพระบบ สถานะเซิร์ฟเวอร์ และการเชื่อมต่อ
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              fetchMetrics();
              fetchAlerts();
              fetchHealth();
            }}
            disabled={refreshing}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Sync Metrics
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Global Uptime"
          value={health?.uptime || 99.9}
          suffix="%"
          decimals={1}
          icon={HardDrives}
          trend={health?.status === 'healthy' ? 'up' : 'down'}
          iconColor={health?.status === 'healthy' ? 'text-emerald-500' : 'text-rose-500'}
        />
        <StatCard
          title="CPU Compute"
          value={currentMetric?.cpu || 0}
          suffix="%"
          decimals={1}
          icon={Cpu}
          trend={(currentMetric?.cpu || 0) > 80 ? 'down' : 'neutral'}
          iconColor={(currentMetric?.cpu || 0) > 80 ? 'text-rose-500' : 'text-blue-500'}
        />
        <StatCard
          title="Memory Load"
          value={currentMetric?.memory || 0}
          suffix="%"
          decimals={1}
          icon={HardDrive}
          trend={(currentMetric?.memory || 0) > 85 ? 'down' : 'neutral'}
          iconColor={(currentMetric?.memory || 0) > 85 ? 'text-rose-500' : 'text-purple-500'}
        />
        <StatCard
          title="การเชื่อมต่อ"
          value={currentMetric?.active_connections || 0}
          icon={Users}
          trend="neutral"
          iconColor="text-amber-500"
        />
      </div>

      {/* Alerts Section */}
      <AnimatePresence>
        {(criticalAlerts > 0 || warningAlerts > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className={cn(
              "border-none relative overflow-hidden",
              criticalAlerts > 0 ? "bg-rose-500/10" : "bg-amber-500/10"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/5" />
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                      criticalAlerts > 0 ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                    )}>
                      <Warning weight="fill" className={cn("w-6 h-6", criticalAlerts > 0 && "animate-pulse")} />
                    </div>
                    <div>
                      <h3 className={cn("text-lg font-bold uppercase tracking-tight", criticalAlerts > 0 ? "text-rose-500" : "text-amber-500")}>
                        Active Infrastructure Alerts
                      </h3>
                      <p className="text-muted-foreground text-sm font-medium">Critical systems require immediate diagnostic review.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {criticalAlerts > 0 && (
                      <Badge variant="destructive" pulse className="font-black px-4 py-1.5 uppercase">
                        {criticalAlerts} วิกฤต
                      </Badge>
                    )}
                    {warningAlerts > 0 && (
                      <Badge variant="warning" className="font-black px-4 py-1.5 uppercase">
                        {warningAlerts} คำเตือน
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services Status */}
        <Card className="relative overflow-hidden group border-border/50">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <Database className="w-48 h-48 text-primary" />
          </div>

          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <Database weight="duotone" className="w-5 h-5 text-primary" />
              สถานะบริการหลัก
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {health?.services && Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-all group/node">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover/node:bg-primary transition-colors" />
                    <span className="text-[11px] font-black text-foreground/80 uppercase tracking-widest">{service}</span>
                  </div>
                  {getStatusIcon(status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="relative overflow-hidden group border-border/50">
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full" />
          
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-primary">
              <ChartLine weight="duotone" className="w-5 h-5" />
              Telemetry Analytics
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            {[
              { label: "Mean Latency", value: `${currentMetric?.response_time || 0}ms`, icon: Clock, threshold: { val: currentMetric?.response_time || 0, good: 200, warning: 500 } },
              { label: "Error Frequency", value: `${(currentMetric?.error_rate || 0).toFixed(2)}%`, icon: ChartLineUp, threshold: { val: currentMetric?.error_rate || 0, good: 0.5, warning: 2 } },
              { label: "Disk Volume Load", value: `${(currentMetric?.disk || 0).toFixed(1)}%`, icon: HardDrive, threshold: { val: currentMetric?.disk || 0, good: 70, warning: 85 } },
            ].map((metric, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground">
                    <metric.icon weight="duotone" className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-foreground tracking-tight">{metric.label}</span>
                </div>
                <span className={cn(
                  "text-base font-black tabular-nums",
                  getStatusColor(metric.threshold.val, { good: metric.threshold.good, warning: metric.threshold.warning })
                )}>
                  {metric.value}
                </span>
              </div>
            ))}
            
            <div className="pt-4 flex items-center justify-between border-t border-border/50 mt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck weight="duotone" className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">สถานะ: ปกติ</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground italic">
                Last heartbeat: {health?.last_check ? new Date(health.last_check).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
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

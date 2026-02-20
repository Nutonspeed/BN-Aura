'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  XCircle,
  SpinnerGap,
  Lock,
  IdentificationBadge,
  Key,
  WarningCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Lightning,
  Monitor,
  Briefcase,
  ArrowsClockwise,
  Fingerprint,
  Detective,
  Icon,
  Pulse
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import SecurityMetrics from './components/SecurityMetrics';
import SecurityAlerts from './components/SecurityAlerts';
import SecurityEvents from './components/SecurityEvents';
import PasswordStrength from './components/PasswordStrength';
import APIKeyManagement from './components/APIKeyManagement';
import { cn } from '@/lib/utils';

interface SecurityMetricsData {
  totalUsers: number;
  activeSessions: number;
  failedLogins: number;
  suspiciousActivities: number;
  securityAlerts: number;
  passwordStrength: {
    strong: number;
    medium: number;
    weak: number;
  };
  twoFactorEnabled: number;
  activeIncidents: number;
  resolvedIncidents: number;
}

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

export default function SecurityDashboard() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('admin.security');
  const [metrics, setMetrics] = useState<SecurityMetricsData>({
    totalUsers: 0,
    activeSessions: 0,
    failedLogins: 0,
    suspiciousActivities: 0,
    securityAlerts: 0,
    passwordStrength: {
      strong: 0,
      medium: 0,
      weak: 0
    },
    twoFactorEnabled: 0,
    activeIncidents: 0,
    resolvedIncidents: 0
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics({
        totalUsers: 1250,
        activeSessions: 42,
        failedLogins: 15,
        suspiciousActivities: 2,
        securityAlerts: 3,
        passwordStrength: { strong: 850, medium: 300, weak: 100 },
        twoFactorEnabled: 65,
        activeIncidents: 1,
        resolvedIncidents: 24
      });
      setEvents([]);
      setAlerts([]);
    } catch (err) {
      console.error('Error fetching security data:', err);
      setError('Failed to load security registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  if (loading && metrics.totalUsers === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Security Core...</p>
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <ShieldCheck weight="duotone" className="w-4 h-4" />
            ความปลอดภัยระบบ
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            ความ<span className="text-primary">ปลอดภัย</span>ระบบ
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการนโยบายความปลอดภัย การเข้ารหัส และการป้องกันภัยคุกคาม
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={fetchSecurityData}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            อัปเดต
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <Detective weight="bold" className="w-4 h-4" />
            ตรวจสอบภัยคุกคาม
          </Button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="ดัชนีความปลอดภัย"
          value={98.4}
          suffix="%"
          decimals={1}
          icon={ShieldCheck as Icon}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="เซสชันที่ใช้งาน"
          value={metrics.activeSessions}
          icon={Fingerprint as Icon}
          className="p-4"
        />
        <StatCard
          title="การเข้าสู่ระบบล้มเหลว"
          value={metrics.failedLogins}
          icon={XCircle as Icon}
          iconColor="text-rose-500"
          className="p-4"
        />
        <StatCard
          title="สถานะระบบ"
          value={100}
          suffix="%"
          icon={Pulse as Icon}
          iconColor="text-amber-500"
          className="p-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Main Security Hub */}
        <div className="lg:col-span-2 space-y-10">
          <SecurityAlerts alerts={alerts} />
          
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Monitor weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">บันทึกการเข้าถึง</CardTitle>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">บันทึกการเข้าสู่ระบบแบบเรียลไทม์</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SecurityEvents events={events} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Security Parameters */}
        <div className="space-y-8">
          <Card className="p-8 rounded-[40px] border-border shadow-card relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 mb-8 relative z-10">
              <Lock weight="duotone" className="w-5 h-5" />
              นโยบายรหัสผ่าน
            </h4>
            <div className="space-y-6 relative z-10">
              <PasswordStrength 
                score={Math.min(4, Math.floor((metrics.passwordStrength.strong / (metrics.passwordStrength.strong + metrics.passwordStrength.medium + metrics.passwordStrength.weak)) * 4))}
                requirements={{
                  length: true,
                  uppercase: true,
                  lowercase: true,
                  number: true,
                  special: metrics.passwordStrength.strong > metrics.passwordStrength.weak
                }}
              />
              <div className="pt-6 border-t border-border/30">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">การใช้งาน 2FA</span>
                  <Badge variant="ghost" className="bg-emerald-500/5 text-emerald-500 border-none font-black text-[9px] uppercase px-3">{metrics.twoFactorEnabled}% เปิดใช้</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[40px] border-border shadow-card overflow-hidden group">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
              <Key weight="duotone" className="w-5 h-5 text-primary" />
              จัดการ API Key
            </h4>
            <div className="space-y-4">
              <APIKeyManagement />
            </div>
          </Card>

          <Card className="p-8 rounded-[40px] border-rose-500/10 bg-rose-500/[0.02] space-y-4 group">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <WarningCircle weight="duotone" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              สถานะเหตุการณ์
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">เหตุการณ์ที่ยังเปิดอยู่</span>
                <span className="text-sm font-black text-rose-500 tabular-nums">{metrics.activeIncidents} รายการ</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                ช่องโหว่ร้ายแรงจะถูกแยกออกและจัดการโดยอัตโนมัติ
              </p>
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] p-4 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-[40px] p-10 max-w-lg w-full relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">รายละเอียดการแจ้งเตือน</h3>
                <Button variant="ghost" onClick={() => setSelectedAlert(null)}>
                  <XCircle weight="bold" className="w-6 h-6" />
                </Button>
              </div>
              <div className="space-y-4">
                <p className="text-lg font-bold">{selectedAlert.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

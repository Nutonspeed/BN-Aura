'use client';

import { 
  Shield,
  User,
  WarningCircle,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  ArrowsClockwise,
  DownloadSimple,
  SpinnerGap,
  ArrowLeft,
  CalendarDots,
  FileText,
  Fingerprint,
  Pulse,
  Clock,
  CaretRight,
  ClockCounterClockwise,
  Funnel,
  Monitor,
  ChartLineUp,
  IdentificationBadge,
  ShieldCheck
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import type { Icon } from '@phosphor-icons/react';

interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_email: string;
  action: string;
  table_name: string;
  resource_name: string;
  success: boolean;
  ip_address: string;
  event_type: string;
  description: string;
}

export default function AuditTrailPage() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('admin.audit');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState<string | null>(null);

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage the same way we did in Support/Security pages
      let token = null;
      
      try {
        const sessionStr = localStorage.getItem('sb-sb-royeyoxaaieipdajijni-auth-token');
        
        if (sessionStr) {
          const base64Data = sessionStr.replace('base64-', '');
          const decodedSession = JSON.parse(atob(base64Data));
          token = decodedSession.access_token;
        }
      } catch (tokenError) {
        console.warn('Failed to get token from localStorage:', tokenError);
      }
      
      // Fallback: Try to get session from Supabase client
      if (!token) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        } catch (supabaseError) {
          console.warn('Failed to get token from Supabase client:', supabaseError);
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch logs
      const logsRes = await fetch(`/api/admin/audit?type=logs&timeRange=${timeRange}&limit=100`, {
        method: 'GET',
        headers
      });
      if (!logsRes.ok) throw new Error('Failed to fetch logs');
      const { data: logsData } = await logsRes.json();
      setLogs(logsData.logs || []);

      // Fetch stats
      const statsRes = await fetch(`/api/admin/audit?type=stats&timeRange=${timeRange}`, {
        method: 'GET',
        headers
      });
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const { data: statsData } = await statsRes.json();
      setStats(statsData.stats || { total: 0, successful: 0, failed: 0 });
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExport = async () => {
    try {
      // Get token from localStorage the same way we did in fetchAuditData
      let token = null;
      
      try {
        const sessionStr = localStorage.getItem('sb-sb-royeyoxaaieipdajijni-auth-token');
        
        if (sessionStr) {
          const base64Data = sessionStr.replace('base64-', '');
          const decodedSession = JSON.parse(atob(base64Data));
          token = decodedSession.access_token;
        }
      } catch (tokenError) {
        console.warn('Failed to get token from localStorage:', tokenError);
      }
      
      // Fallback: Try to get session from Supabase client
      if (!token) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        } catch (supabaseError) {
          console.warn('Failed to get token from Supabase client:', supabaseError);
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'export',
          filters: { timeRange }
        })
      });
      
      if (!res.ok) throw new Error('Failed to export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data');
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: t('time'),
      accessor: (log: AuditLog) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatTime(log.timestamp)}
        </span>
      )
    },
    {
      header: t('user'),
      accessor: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {typeof log.user_name === 'string' ? log.user_name : String(log.user_name || 'Unknown')}
          </span>
        </div>
      )
    },
    {
      header: t('action'),
      accessor: (log: AuditLog) => (
        <span className="text-sm text-foreground font-medium">
          {(() => {
            try {
              const actionStr = typeof log.action === 'string' ? log.action : String(log.action || 'UNKNOWN');
              return t(`actions.${actionStr}` as any) || actionStr.replace('_', ' ');
            } catch (error) {
              const actionStr = typeof log.action === 'string' ? log.action : String(log.action || 'UNKNOWN');
              return actionStr.replace('_', ' ');
            }
          })()}
        </span>
      )
    },
    {
      header: t('resource'),
      accessor: (log: AuditLog) => (
        <span className="text-sm text-muted-foreground">
          {typeof log.resource_name === 'string' ? log.resource_name : String(log.resource_name || 'Unknown')}
        </span>
      )
    },
    {
      header: t('status'),
      accessor: (log: AuditLog) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          log.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        )}>
          {t(log.success ? 'successful' : 'failed')}
        </span>
      )
    }
  ];

  if (loading) {
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
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Shield weight="duotone" className="w-4 h-4" />
            Security Audit Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            System <span className="text-primary">Audit Trail</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            ตรวจสอบบันทึกกิจกรรม การเข้าสู่ระบบ และความปลอดภัย
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner">
            {[
              { id: '24h', label: '24H Cycle' },
              { id: '7d', label: '7D Cycle' },
              { id: '30d', label: '30D Cycle' },
              { id: 'all', label: 'Global' }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                  timeRange === range.id
                    ? "bg-primary text-primary-foreground border-primary shadow-premium"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={fetchAuditData}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Ledger
          </Button>
          <Button 
            onClick={handleExport}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
          >
            <DownloadSimple weight="bold" className="w-4 h-4" />
            Export Vault
          </Button>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Consolidated Logs"
          value={stats.total}
          icon={ClockCounterClockwise as Icon}
          className="p-4"
        />
        <StatCard
          title="Successful Nodes"
          value={stats.successful}
          icon={CheckCircle as Icon}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Failed Payloads"
          value={stats.failed}
          icon={XCircle as Icon}
          iconColor="text-rose-500"
          className="p-4"
        />
        <StatCard
          title="Ledger Integrity"
          value={stats.total ? Math.round((stats.successful / stats.total) * 100) : 100}
          suffix="%"
          icon={ShieldCheck as Icon}
          iconColor="text-primary"
          className="p-4"
        />
      </div>

      {/* Search & Intelligence Controls */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Query identity node name, email, or protocol action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                <Funnel weight="bold" className="w-4 h-4" />
                Protocol Filter
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Registry Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredLogs}
            loading={loading}
            rowKey={(log) => log.id}
            emptyMessage="No security events detected in current neural timeframe."
            mobileCard={(log) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      <IdentificationBadge weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{log.user_name || 'ANONYMOUS_NODE'}</p>
                      <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest">{log.user_email}</p>
                    </div>
                  </div>
                  <Badge variant={log.success ? 'success' : 'destructive'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                    {log.success ? 'SUCCESS' : 'EXCEPTION'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Protocol Action</p>
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight">
                      {(() => {
                        const actionStr = typeof log.action === 'string' ? log.action : String(log.action || 'UNKNOWN');
                        return actionStr.replace('_', ' ');
                      })()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Temporal Node</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{formatTime(log.timestamp)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60 ml-1">Transmission Directive</p>
                  <p className="text-[11px] text-muted-foreground font-medium italic leading-relaxed bg-secondary/30 p-4 rounded-2xl border border-border/50">
                    {log.description || 'No descriptive payload detected.'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Monitor weight="bold" className="w-3.5 h-3.5 opacity-60" />
                    IP Node: {log.ip_address}
                  </div>
                  <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-2 py-0.5">
                    {log.table_name}
                  </Badge>
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </motion.div>
  );
}

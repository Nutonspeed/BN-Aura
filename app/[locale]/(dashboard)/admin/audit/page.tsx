'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, User, CheckCircle, XCircle, MagnifyingGlass, ArrowsClockwise, DownloadSimple, SpinnerGap
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
            <Shield className="w-8 h-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-white/60 mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="24h">{t('last_24h')}</option>
            <option value="7d">{t('last_7d')}</option>
            <option value="30d">{t('last_30d')}</option>
            <option value="all">{t('all_time')}</option>
          </select>
          <button 
            onClick={fetchAuditData}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-white/60 text-sm">{t('total_activities')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.successful}</p>
              <p className="text-white/60 text-sm">{t('successful')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.failed}</p>
              <p className="text-white/60 text-sm">{t('failed')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Audit Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{t('recent_activity')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('time')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('user')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('action')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('resource')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white/80 text-sm">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">{typeof log.user_name === 'string' ? log.user_name : String(log.user_name || 'Unknown')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white/80 text-sm">
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
                  </td>
                  <td className="px-6 py-4 text-white/80 text-sm">
                    {typeof log.resource_name === 'string' ? log.resource_name : String(log.resource_name || 'Unknown')}
                  </td>
                  <td className="px-6 py-4">
                    {log.success ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/20">
                        {t('successful')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-red-400 bg-red-500/20">
                        {t('failed')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

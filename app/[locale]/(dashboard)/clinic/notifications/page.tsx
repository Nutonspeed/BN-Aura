'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCircle,
  Clock,
  Funnel,
  Lightning,
  MagnifyingGlass,
  Pulse,
  ShieldCheck,
  Sparkle,
  UserPlus,
  ChatCircle,
  CaretLeft,
  Trash
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { useBackNavigation } from '@/hooks/useBackNavigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  priority?: string;
}

type FilterType = 'all' | 'unread' | 'new_lead' | 'treatment_update' | 'message' | 'system' | 'quota_alert' | 'security_alert' | 'queue_called' | 'analysis_complete' | 'appointment_reminder';

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  new_lead: { label: 'New Lead', icon: UserPlus, color: 'emerald' },
  treatment_update: { label: 'Treatment', icon: Pulse, color: 'blue' },
  message: { label: 'Message', icon: ChatCircle, color: 'amber' },
  system: { label: 'System', icon: ShieldCheck, color: 'gray' },
  quota_alert: { label: 'Quota', icon: Lightning, color: 'rose' },
  security_alert: { label: 'Security', icon: ShieldCheck, color: 'red' },
  queue_called: { label: 'Queue', icon: Bell, color: 'indigo' },
  analysis_complete: { label: 'Analysis', icon: Sparkle, color: 'purple' },
  appointment_reminder: { label: 'Appointment', icon: Clock, color: 'cyan' },
};

export default function NotificationsPage() {
  const { goBack } = useBackNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload: any) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch { return null; }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) { setLoading(false); return; }

      const res = await fetch(`/api/notifications?page=${page}&limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(Array.isArray(data.data) ? data.data : []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'markRead', notificationId: id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  // Filtered notifications
  const filtered = useMemo(() => {
    let result = notifications;

    if (filter === 'unread') {
      result = result.filter(n => !n.is_read);
    } else if (filter !== 'all') {
      result = result.filter(n => n.type === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notifications, filter, search]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeConfig = (type: string) => TYPE_CONFIG[type] || { label: type, icon: Bell, color: 'gray' };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-white/5 rounded-xl transition">
            <CaretLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3">
              <Bell weight="duotone" className="w-7 h-7 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary/20 text-primary">{unreadCount} unread</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">All system notifications and alerts</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'unread', 'new_lead', 'treatment_update', 'queue_called', 'analysis_complete', 'quota_alert'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : getTypeConfig(f).label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs text-muted-foreground">Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications found</p>
              <p className="text-xs mt-1">
                {filter !== 'all' ? 'Try changing your filter' : 'All clear!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              <AnimatePresence>
                {filtered.map((n, idx) => {
                  const config = getTypeConfig(n.type);
                  const IconComponent = config.icon;

                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`flex items-start gap-4 p-5 hover:bg-muted/20 transition cursor-pointer ${
                        !n.is_read ? 'bg-primary/3' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        !n.is_read ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                      }`}>
                        <IconComponent className={`w-5 h-5 text-${config.color}-400`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`text-sm font-bold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </h4>
                          <Badge className={`text-[9px] bg-${config.color}-500/10 text-${config.color}-400`}>
                            {config.label}
                          </Badge>
                          {!n.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(n.created_at)}
                        </span>
                        {!n.is_read && (
                          <button
                            onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                            className="p-1 text-muted-foreground hover:text-primary transition"
                            title="Mark read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

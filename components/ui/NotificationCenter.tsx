'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  X,
  Lightning,
  UserPlus,
  ChatCircle,
  Pulse,
  ShieldCheck,
  Clock,
  CheckCircle,
  Checks
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  action_url?: string;
  is_read: boolean;
  priority?: string;
  created_at: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const getToken = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }, [supabase]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/notifications?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          fetchNotifications();
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    init();
  }, [supabase, fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: { new: Notification }) => {
        const newNotif = payload.new;
        setNotifications(prev => [newNotif, ...prev]);
        
        // Show toast notification
        const toastType = newNotif.priority === 'critical' ? 'error' 
          : newNotif.priority === 'high' ? 'warning' 
          : 'info';
        
        if (toastType === 'error') {
          toast.error(newNotif.title, { description: newNotif.message, duration: 8000 });
        } else if (toastType === 'warning') {
          toast.warning(newNotif.title, { description: newNotif.message, duration: 6000 });
        } else {
          toast(newNotif.title, { description: newNotif.message, duration: 4000 });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, isAuthenticated]);

  // Poll for new notifications every 30s
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'markRead', notificationId: id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'markAllRead' })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.action_url) {
      router.push(n.action_url);
      setIsOpen(false);
    }
  };

  const unreadCount = (notifications || []).filter(n => n && !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_lead': case 'workflow': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'treatment_update': case 'treatment': return <Pulse className="w-4 h-4 text-primary" />;
      case 'message': case 'chat': return <ChatCircle className="w-4 h-4 text-amber-400" />;
      case 'quota_alert': case 'quota': return <Lightning className="w-4 h-4 text-rose-400" />;
      case 'security_alert': case 'security': return <ShieldCheck className="w-4 h-4 text-red-400" />;
      case 'queue_called': case 'queue': return <Bell className="w-4 h-4 text-indigo-400" />;
      case 'analysis_complete': case 'analysis': return <Lightning className="w-4 h-4 text-purple-400" />;
      case 'appointment_reminder': case 'appointment': return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'system': return <Pulse className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-transparent';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary rounded-full border-2 border-[#121212] flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-4 w-80 md:w-96 glass-premium rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-muted-foreground">{unreadCount} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-[10px] text-primary flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <Checks className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center space-y-3 opacity-50">
                    <Bell className="w-10 h-10 mx-auto" />
                    <p className="text-xs">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-4 hover:bg-white/5 transition-all cursor-pointer border-l-2",
                          !n.is_read ? "bg-primary/5" : "",
                          getPriorityColor(n.priority)
                        )}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0",
                            !n.is_read ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={cn(
                                "text-xs font-semibold truncate",
                                !n.is_read ? "text-white" : "text-muted-foreground"
                              )}>{n.title}</h4>
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                {timeAgo(n.created_at)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            {!n.is_read && (
                              <div className="mt-1 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[9px] font-bold text-primary uppercase">New</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <button 
                  onClick={() => { router.push('/clinic/notifications'); setIsOpen(false); }}
                  className="w-full py-3 bg-white/5 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
                >
                  View All Notifications
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

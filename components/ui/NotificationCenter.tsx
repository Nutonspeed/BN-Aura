'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Lightning, 
  UserPlus, 
  ChatCircle, 
  Pulse, 
  ShieldCheck,
  Clock
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'new_lead' | 'treatment_update' | 'message' | 'system' | 'quota_alert' | 'security_alert';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Check if user is authenticated before fetching notifications
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          fetchNotifications();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.warn('Failed to check authentication:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    
    // Subscribe to real-time notifications only if authenticated
    let channel = null;
    if (isAuthenticated) {
      channel = supabase
        .channel('user-notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        }, (payload: { new: Notification }) => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, isAuthenticated]);

  const fetchNotifications = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    try {
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
      
      const res = await fetch('/api/notifications', {
        method: 'GET',
        headers
      });
      
      const data = await res.json();
      if (data.success) {
        setNotifications(Array.isArray(data.data) ? data.data : (data.data?.notifications || []));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Get token from localStorage the same way we did in fetchNotifications
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
      
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'markRead', notificationId: id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const unreadCount = (notifications || []).filter(n => n && !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_lead': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'treatment_update': return <Pulse className="w-4 h-4 text-primary" />;
      case 'message': return <ChatCircle className="w-4 h-4 text-amber-400" />;
      case 'quota_alert': return <Lightning className="w-4 h-4 text-rose-400" />;
      case 'security_alert': return <ShieldCheck className="w-4 h-4 text-red-400" />;
      default: return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#121212] animate-pulse" />
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
              initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
              className="absolute right-0 mt-4 w-80 md:w-96 glass-premium rounded-[32px] border border-white/10 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Notifications</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">System Intelligence Feed</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Syncing Feed...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center space-y-4 opacity-40">
                    <Bell className="w-12 h-12 mx-auto" />
                    <p className="text-xs font-light">All clear! No new updates at this node.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-5 hover:bg-white/5 transition-all group cursor-pointer",
                          !n.is_read ? "bg-primary/5" : ""
                        )}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all flex-shrink-0",
                            !n.is_read ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className={cn(
                                "text-xs font-bold uppercase tracking-tight",
                                !n.is_read ? "text-white" : "text-muted-foreground"
                              )}>{n.title}</h4>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-light line-clamp-2">
                              {n.message}
                            </p>
                            {!n.is_read && (
                              <div className="pt-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">New Priority</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="w-full py-4 bg-white/5 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all">
                View All Intelligence
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

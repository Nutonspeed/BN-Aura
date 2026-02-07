'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key,
  Plus,
  Trash,
  Copy,
  Check,
  Eye,
  EyeSlash,
  Shield,
  Clock,
  WarningCircle,
  ArrowsClockwise,
  SpinnerGap,
  Monitor,
  Lightning,
  CheckCircle,
  X,
  DotsThreeVertical,
  IdentificationBadge
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export default function APIKeyManagement() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    scopes: [] as string[],
    expiresIn: 'never',
    rateLimit: 1000
  });

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
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
      
      const response = await fetch('/api/admin/security/api-keys', {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      if (data.success) {
        setKeys(data.data.keys);
      } else {
        setError(data.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      setError('An error occurred while fetching API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const availableScopes = [
    { id: 'read:clinics', label: 'Read Clinics' },
    { id: 'write:clinics', label: 'Write Clinics' },
    { id: 'read:customers', label: 'Read Customers' },
    { id: 'write:analytics', label: 'Write Analytics' },
    { id: 'send:notifications', label: 'Send Notifications' },
    { id: 'admin:all', label: 'Full Admin Access' }
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateKey = async () => {
    setIsProcessing(true);
    setError(null);
    try {
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
      
      const response = await fetch('/api/admin/security/api-keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create',
          name: newKeyData.name,
          scopes: newKeyData.scopes,
          expiresIn: newKeyData.expiresIn,
          rateLimit: newKeyData.rateLimit
        })
      });
      const data = await response.json();
      if (data.success) {
        setKeys([data.data.key, ...keys]);
        setShowCreateModal(false);
        setNewKeyData({ name: '', scopes: [], expiresIn: 'never', rateLimit: 1000 });
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch (err) {
      setError('An error occurred while creating the API key');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    
    setIsProcessing(true);
    try {
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
      
      const response = await fetch('/api/admin/security/api-keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'revoke', id })
      });
      const data = await response.json();
      if (data.success) {
        setKeys(keys.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
      } else {
        setError(data.error || 'Failed to revoke API key');
      }
    } catch (err) {
      setError('An error occurred while revoking the API key');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse text-center">Synchronizing Encryption Keys...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Key weight="fill" className="w-64 h-64 text-primary" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                <Key weight="duotone" className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">API Key Management</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Global external access nodes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={fetchKeys}
                className="p-4 h-14 w-14 border-border/50 rounded-2xl text-muted-foreground hover:text-primary transition-all"
              >
                <ArrowsClockwise weight="bold" className={cn("w-5 h-5", isProcessing && "animate-spin")} />
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest group"
              >
                <Plus weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Generate Access Token
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-10 space-y-8 relative z-10">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
              <WarningCircle weight="fill" className="w-5 h-5 text-rose-500" />
              <p className="text-rose-500 text-xs font-black uppercase tracking-widest">Exception: {error}</p>
            </div>
          )}

          {keys.length === 0 ? (
            <div className="text-center py-20 bg-secondary/20 border-2 border-dashed border-border/50 rounded-[40px] opacity-40">
              <Key weight="duotone" className="w-16 h-16 text-muted-foreground mx-auto mb-6 shadow-inner" />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground uppercase tracking-widest">Registry Empty</h3>
                <p className="text-sm text-muted-foreground font-medium italic max-w-sm mx-auto">No API keys establishing external links in current node.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {keys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={cn(
                    "p-6 rounded-[32px] border transition-all duration-500 group/item relative overflow-hidden",
                    apiKey.status === 'revoked' 
                      ? 'bg-secondary/10 border-border/30 opacity-60 grayscale' 
                      : 'bg-secondary/20 border-border/50 hover:border-primary/30 shadow-card hover:shadow-card-hover'
                  )}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover/item:scale-110 transition-transform duration-700 pointer-events-none">
                    <Lightning weight="fill" className="w-32 h-32 text-primary" />
                  </div>

                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-inner",
                          apiKey.status === 'active' ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-border text-muted-foreground"
                        )}>
                          <Shield weight="duotone" className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight truncate">{apiKey.name}</h3>
                            <Badge variant={apiKey.status === 'active' ? 'success' : apiKey.status === 'expired' ? 'warning' : 'secondary'} size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1">
                              {apiKey.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                            <span className="flex items-center gap-1.5"><Clock weight="bold" className="w-3 h-3" /> Initialized: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><Lightning weight="bold" className="w-3 h-3" /> Last Payload: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-card border border-border/50 p-4 rounded-2xl shadow-inner group/key relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within/key:opacity-100 transition-opacity" />
                        <code className="text-xs font-mono text-primary flex-1 truncate relative z-10 font-bold tracking-wider">
                          {visibleKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </code>
                        <div className="flex items-center gap-1.5 relative z-10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                          >
                            {visibleKeys[apiKey.id] ? <EyeSlash weight="bold" className="w-4.5 h-4.5" /> : <Eye weight="bold" className="w-4.5 h-4.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(apiKey.id, apiKey.key)}
                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                          >
                            {copiedId === apiKey.id ? <CheckCircle weight="bold" className="w-4.5 h-4.5 text-emerald-500" /> : <Copy weight="bold" className="w-4.5 h-4.5" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {apiKey.scopes.map(scope => (
                          <Badge key={scope} variant="ghost" className="bg-primary/5 text-primary border border-primary/10 font-black text-[7px] tracking-widest px-2.5 py-1">
                            {scope.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex xl:flex-col items-center xl:items-end gap-4 shrink-0">
                      {apiKey.status === 'active' && (
                        <Button
                          variant="outline"
                          onClick={() => handleRevokeKey(apiKey.id)}
                          className="px-6 py-3 h-auto rounded-xl text-[9px] font-black uppercase tracking-widest border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all gap-2"
                        >
                          <Trash weight="bold" className="w-3.5 h-3.5" />
                          Revoke Access
                        </Button>
                      )}
                      <div className="hidden xl:flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                        <IdentificationBadge weight="bold" className="w-3 h-3" />
                        ID-{apiKey.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Modal Protocol */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card border border-border rounded-[40px] w-full max-w-lg shadow-premium relative overflow-hidden group p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Shield weight="fill" className="w-48 h-48 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner">
                      <Key weight="duotone" className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase leading-tight">Key Synthesis</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Initialize external access node</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Key Designation *</label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                      <input
                        type="text"
                        value={newKeyData.name}
                        onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                        placeholder="e.g. Clinical Widget Protocol"
                        className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Consumption Limit (Req/Hour)</label>
                    <input
                      type="number"
                      value={newKeyData.rateLimit}
                      onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) })}
                      className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold tabular-nums shadow-inner"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Authorized Protocol Scopes</label>
                    <div className="grid grid-cols-2 gap-3">
                      {availableScopes.map(scope => (
                        <label
                          key={scope.id}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                            newKeyData.scopes.includes(scope.id)
                              ? "bg-primary/10 border-primary text-primary shadow-glow-sm"
                              : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={newKeyData.scopes.includes(scope.id)}
                            onChange={() => {
                              const scopes = newKeyData.scopes.includes(scope.id)
                                ? newKeyData.scopes.filter(s => s !== scope.id)
                                : [...newKeyData.scopes, scope.id];
                              setNewKeyData({ ...newKeyData, scopes });
                            }}
                          />
                          <span className="text-[10px] font-black uppercase tracking-tight">{scope.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-amber-500/5 rounded-[28px] border border-amber-500/10 flex gap-4 shadow-inner relative overflow-hidden group/warning">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/warning:scale-110 transition-transform">
                      <WarningCircle weight="fill" className="w-10 h-10 text-amber-500" />
                    </div>
                    <WarningCircle weight="duotone" className="w-5 h-5 text-amber-500 flex-shrink-0 relative z-10" />
                    <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed relative z-10 uppercase tracking-widest">
                      Encryption keys grant global level access. Protocol requires secure vault storage only. Never distribute via public channels.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                    >
                      Abort
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={!newKeyData.name || newKeyData.scopes.length === 0 || isProcessing}
                      className="flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3 relative overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                      {isProcessing ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <Shield weight="bold" className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />}
                      Commit Synthesis
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
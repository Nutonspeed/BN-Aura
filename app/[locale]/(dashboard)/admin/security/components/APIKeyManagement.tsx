'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, Shield, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

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
      // Get token from localStorage the same way we did in fetchKeys
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
      // Get token from localStorage the same way we did in fetchKeys
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
      <div className="bg-slate-800 p-12 rounded-xl border-2 border-slate-600 shadow-lg mt-6 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-400">Loading API keys...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-lg mt-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Key className="w-6 h-6 text-primary" />
            API Key Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage external access to your system</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchKeys}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Key
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-700">
          <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-gray-400">No API keys found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((apiKey) => (
            <div
              key={apiKey.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                apiKey.status === 'revoked' ? 'bg-slate-900/50 border-slate-700 opacity-60' : 'bg-slate-700/50 border-slate-600'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-white">{apiKey.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      apiKey.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                      apiKey.status === 'expired' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {apiKey.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded border border-slate-600 mb-3">
                    <code className="text-xs font-mono text-primary flex-1 truncate">
                      {visibleKeys[apiKey.id] ? apiKey.key : `${apiKey.prefix}_••••••••••••••••`}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-1 hover:text-white text-gray-400 transition-colors"
                    >
                      {visibleKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopy(apiKey.id, apiKey.key)}
                      className="p-1 hover:text-white text-gray-400 transition-colors"
                    >
                      {copiedId === apiKey.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {apiKey.scopes.map(scope => (
                      <span key={scope} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-600">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end gap-4 md:gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    <span>Last used: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                  {apiKey.status === 'active' && (
                    <button
                      onClick={() => handleRevokeKey(apiKey.id)}
                      className="mt-2 flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Revoke Key
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 p-8 rounded-2xl border-2 border-slate-600 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                Create New API Key
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                    placeholder="e.g. Website Widget"
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rate Limit (Requests per hour)</label>
                  <input
                    type="number"
                    value={newKeyData.rateLimit}
                    onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Scopes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableScopes.map(scope => (
                      <label
                        key={scope.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          newKeyData.scopes.includes(scope.id)
                            ? 'bg-primary/10 border-primary text-white'
                            : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-500'
                        }`}
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
                        <span className="text-xs font-medium">{scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border-2 border-amber-500/20 p-4 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    API keys provide full access to the selected scopes. Never share keys in client-side code or public repositories.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyData.name || newKeyData.scopes.length === 0 || isProcessing}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Generate API Key
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

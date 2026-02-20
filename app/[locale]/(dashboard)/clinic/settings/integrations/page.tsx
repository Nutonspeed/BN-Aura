'use client';

import { 
  Gear,
  Phone,
  EnvelopeSimple,
  ChatCircle,
  Check,
  X,
  Eye,
  EyeSlash,
  FloppyDisk,
  ArrowsClockwise,
  Pulse,
  ShieldCheck,
  Lightning,
  Plus,
  Info,
  Translate,
  Globe,
  CaretRight,
  Monitor,
  IdentificationBadge,
  Browser,
  WebhooksLogo,
  Robot,
  SpinnerGap
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Integration {
  id?: string;
  platform: string;
  is_active: boolean;
  account_name?: string;
  connected_at?: string;
  settings?: Record<string, string>;
}

export default function IntegrationsPage() {
  const { goBack } = useBackNavigation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [twilioConfig, setTwilioConfig] = useState({ accountSid: '', authToken: '', phoneNumber: '' });
  const [sendgridConfig, setSendgridConfig] = useState({ apiKey: '', fromEmail: '', fromName: '' });
  const [lineConfig, setLineConfig] = useState({ channelAccessToken: '', channelSecret: '' });

  useEffect(() => { fetchIntegrations(); }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/social/integrations');
      const data = await res.json();
      setIntegrations(data.integrations || []);

      // Load existing configs
      for (const int of data.integrations || []) {
        if (int.platform === 'twilio' && int.settings) {
          setTwilioConfig(int.settings as typeof twilioConfig);
        }
        if (int.platform === 'sendgrid' && int.settings) {
          setSendgridConfig(int.settings as typeof sendgridConfig);
        }
        if (int.platform === 'line' && int.settings) {
          setLineConfig(prev => ({ ...prev, channelSecret: (int.settings as { channelSecret?: string })?.channelSecret || '' }));
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveIntegration = async (platform: string, settings: Record<string, string>) => {
    setSaving(platform);
    try {
      await fetch('/api/social/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          settings,
          accountName: platform === 'twilio' ? settings.phoneNumber : platform === 'sendgrid' ? settings.fromEmail : 'LINE Bot'
        })
      });
      fetchIntegrations();
    } catch (e) { console.error(e); }
    setSaving(null);
  };

  const disconnectIntegration = async (platform: string) => {
    if (!confirm('ยืนยันการยกเลิกการเชื่อมต่อ?')) return;
    await fetch(`/api/social/integrations?platform=${platform}`, { method: 'DELETE' });
    fetchIntegrations();
  };

  const isConnected = (platform: string) => integrations.some(i => i.platform === platform && i.is_active);

  const toggleSecret = (key: string) => setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  const maskValue = (value: string) => value ? '•'.repeat(Math.min(value.length, 20)) : '';

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
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
            <Pulse weight="duotone" className="w-4 h-4" />
            Neural Link Gateway
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            External <span className="text-primary">Integrations</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Synchronizing clinical data streams with specialized third-party infrastructure.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={fetchIntegrations}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Grid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-2">
        {/* Twilio SMS Node */}
        <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
          <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Phone className="w-48 h-48 text-primary" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Phone weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Twilio SMS</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Short message transmission protocol</p>
                </div>
              </div>
              <Badge variant={isConnected('twilio') ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                {isConnected('twilio') ? 'LINKED' : 'UNLINKED'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Account SID</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type="text"
                    value={twilioConfig.accountSid}
                    onChange={e => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-mono shadow-inner relative z-10"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Auth Token Node</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type={showSecrets.twilioAuth ? 'text' : 'password'}
                    value={twilioConfig.authToken}
                    onChange={e => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 pr-14 text-sm text-foreground focus:border-primary outline-none transition-all font-mono shadow-inner relative z-10"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button onClick={() => toggleSecret('twilioAuth')} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors z-20">
                    {showSecrets.twilioAuth ? <EyeSlash weight="bold" className="w-5 h-5" /> : <Eye weight="bold" className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Transmission Identity (Phone)</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type="text"
                    value={twilioConfig.phoneNumber}
                    onChange={e => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold tabular-nums relative z-10"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-border/30">
              <Button
                onClick={() => saveIntegration('twilio', twilioConfig)}
                disabled={saving === 'twilio' || !twilioConfig.accountSid}
                className="flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
              >
                {saving === 'twilio' ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk weight="bold" className="w-4 h-4" />}
                {saving === 'twilio' ? 'SYNCING...' : 'COMMIT LINK'}
              </Button>
              {isConnected('twilio') && (
                <Button 
                  variant="outline"
                  onClick={() => disconnectIntegration('twilio')} 
                  className="px-8 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30"
                >
                  ABORT
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SendGrid Email Node */}
        <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
          <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <EnvelopeSimple className="w-48 h-48 text-primary" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <EnvelopeSimple weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">SendGrid Email</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">SMTP & marketing dispatch protocol</p>
                </div>
              </div>
              <Badge variant={isConnected('sendgrid') ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                {isConnected('sendgrid') ? 'LINKED' : 'UNLINKED'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">API Key Node</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type={showSecrets.sendgridKey ? 'text' : 'password'}
                    value={sendgridConfig.apiKey}
                    onChange={e => setSendgridConfig({ ...sendgridConfig, apiKey: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 pr-14 text-sm text-foreground focus:border-primary outline-none transition-all font-mono shadow-inner relative z-10"
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button onClick={() => toggleSecret('sendgridKey')} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors z-20">
                    {showSecrets.sendgridKey ? <EyeSlash weight="bold" className="w-5 h-5" /> : <Eye weight="bold" className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Transmission Origin (Email)</label>
                  <input
                    type="email"
                    value={sendgridConfig.fromEmail}
                    onChange={e => setSendgridConfig({ ...sendgridConfig, fromEmail: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-medium italic shadow-inner"
                    placeholder="noreply@clinic.network"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Sender Designation</label>
                  <input
                    type="text"
                    value={sendgridConfig.fromName}
                    onChange={e => setSendgridConfig({ ...sendgridConfig, fromName: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold uppercase text-xs tracking-widest shadow-inner"
                    placeholder="BN-AURA CLINIC"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-border/30">
              <Button
                onClick={() => saveIntegration('sendgrid', sendgridConfig)}
                disabled={saving === 'sendgrid' || !sendgridConfig.apiKey}
                className="flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
              >
                {saving === 'sendgrid' ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk weight="bold" className="w-4 h-4" />}
                {saving === 'sendgrid' ? 'SYNCING...' : 'COMMIT LINK'}
              </Button>
              {isConnected('sendgrid') && (
                <Button 
                  variant="outline"
                  onClick={() => disconnectIntegration('sendgrid')} 
                  className="px-8 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30"
                >
                  ABORT
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LINE OA Node */}
        <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
          <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <ChatCircle className="w-48 h-48 text-primary" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
                  <ChatCircle weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">LINE Official Account</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Social chat & reservation uplink</p>
                </div>
              </div>
              <Badge variant={isConnected('line') ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                {isConnected('line') ? 'LINKED' : 'UNLINKED'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Channel Access Token</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type={showSecrets.lineToken ? 'text' : 'password'}
                    value={lineConfig.channelAccessToken}
                    onChange={e => setLineConfig({ ...lineConfig, channelAccessToken: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 pr-14 text-sm text-foreground focus:border-primary outline-none transition-all font-mono shadow-inner relative z-10"
                    placeholder="Long-lived channel access token"
                  />
                  <button onClick={() => toggleSecret('lineToken')} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors z-20">
                    {showSecrets.lineToken ? <EyeSlash weight="bold" className="w-5 h-5" /> : <Eye weight="bold" className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Channel Secret Node</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type={showSecrets.lineSecret ? 'text' : 'password'}
                    value={lineConfig.channelSecret}
                    onChange={e => setLineConfig({ ...lineConfig, channelSecret: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 pr-14 text-sm text-foreground focus:border-primary outline-none transition-all font-mono shadow-inner relative z-10"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button onClick={() => toggleSecret('lineSecret')} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors z-20">
                    {showSecrets.lineSecret ? <EyeSlash weight="bold" className="w-5 h-5" /> : <Eye weight="bold" className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="p-5 bg-primary/5 rounded-[28px] border border-primary/10 space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <WebhooksLogo weight="bold" className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Webhook Payload Gateway</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-[10px] text-muted-foreground font-mono truncate">https://bn-aura.vercel.app/api/webhooks/line</code>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 text-primary">
                    <Plus weight="bold" className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-border/30">
              <Button
                onClick={() => saveIntegration('line', { ...lineConfig, accessToken: lineConfig.channelAccessToken })}
                disabled={saving === 'line' || !lineConfig.channelAccessToken}
                className="flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
              >
                {saving === 'line' ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk weight="bold" className="w-4 h-4" />}
                {saving === 'line' ? 'SYNCING...' : 'COMMIT LINK'}
              </Button>
              {isConnected('line') && (
                <Button 
                  variant="outline"
                  onClick={() => disconnectIntegration('line')} 
                  className="px-8 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30"
                >
                  ABORT
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Global Synchronization Info */}
        <div className="xl:col-span-2">
          <Card className="p-8 rounded-[40px] border-primary/10 bg-primary/[0.02] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
              <Lightning weight="duotone" className="w-10 h-10" />
            </div>
            <div className="flex-1 space-y-2 relative z-10 text-center md:text-left">
              <h4 className="text-xl font-black text-foreground uppercase tracking-tight">System Link Protocol v1.0</h4>
              <p className="text-sm text-muted-foreground font-medium italic leading-relaxed max-w-2xl">
                การเชื่อมต่อภายนอกช่วยให้สามารถส่งการแจ้งเตือน ติดตามลูกค้า และเชื่อมต่อกับโซเชียลมีเดียได้โดยอัตโนมัติ
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Badge variant="success" size="sm" className="font-black text-[10px] tracking-[0.2em] px-6 py-2 rounded-full shadow-premium">
                NETWORK_READY
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

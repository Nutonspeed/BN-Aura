'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt,
  TestTube,
  CalendarDots,
  Users,
  Buildings,
  Info,
  Sparkle,
  Globe,
  TrendUp,
  CheckCircle,
  WarningCircle,
  Monitor,
  IdentificationBadge,
  Browser,
  WebhooksLogo,
  Robot,
  CaretRight,
  X,
  Clock,
  EnvelopeSimple,
  Pulse,
  Target,
  SpinnerGap
} from '@phosphor-icons/react';
import { useBroadcastContext, BroadcastFormData } from '../context';

export default function ComposeMessage() {
  const { createMessage, sendTestMessage, creating, clinics } = useBroadcastContext();
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    content: '',
    message_type: 'notification',
    target_type: 'all',
    target_plans: [],
    target_clinics: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMessage(formData);
      // Reset form
      setFormData({
        title: '',
        content: '',
        message_type: 'notification',
        target_type: 'all',
        target_plans: [],
        target_clinics: []
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTest = async () => {
    try {
      await sendTestMessage(formData);
    } catch (error) {
      console.error('Failed to send test:', error);
    }
  };

  const plans = ['starter', 'professional', 'premium', 'enterprise'];
  const planLabels = {
    starter: 'Starter',
    professional: 'Professional',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  const selectedClinicCount = formData.target_type === 'specific' 
    ? formData.target_clinics.length 
    : formData.target_type === 'plan' 
    ? clinics.filter(c => formData.target_plans.includes(c.plan)).length
    : clinics.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <PaperPlaneTilt weight="fill" className="w-64 h-64 text-primary" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <PaperPlaneTilt weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Transmission Uplink</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Compose system-wide broadcast payload</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-10 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Message Title */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Payload Header *</label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                  placeholder="Enter message title node..."
                  required
                />
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Communication Body *</label>
              <div className="relative group/input">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full bg-secondary/30 border border-border rounded-[28px] py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-medium leading-relaxed italic shadow-inner resize-none"
                  placeholder="Type your clinical broadcast payload here..."
                  required
                />
              </div>
            </div>

            {/* Delivery Method Hub */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Delivery Channel Protocol</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'notification', label: 'In-App Registry', icon: Monitor, desc: 'Digital HUD' },
                  { value: 'email', label: 'Neural Mail', icon: EnvelopeSimple, desc: 'SMTP Uplink' },
                  { value: 'sms', label: 'SMS Stream', icon: TrendUp, desc: 'Cellular Node' }
                ].map((type) => (
                  <label
                    key={type.value}
                    className={cn(
                      "p-5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-3 relative overflow-hidden group/method",
                      formData.message_type === type.value
                        ? "bg-primary/10 border-primary/40 text-primary shadow-glow-sm"
                        : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="message_type"
                      value={type.value}
                      checked={formData.message_type === type.value}
                      onChange={(e) => setFormData({ ...formData, message_type: e.target.value as any })}
                      className="sr-only"
                    />
                    <type.icon weight={formData.message_type === type.value ? "fill" : "duotone"} className="w-6 h-6" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">{type.label}</div>
                      <div className="text-[8px] font-bold opacity-60 uppercase mt-0.5">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Audience Matrix */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">Recipient Cluster Matrix</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'all', label: 'Global Network', icon: Globe },
                  { value: 'plan', label: 'Protocol Tiers', icon: Buildings },
                  { value: 'specific', label: 'Cluster Nodes', icon: Users }
                ].map((target) => (
                  <label
                    key={target.value}
                    className={cn(
                      "p-5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-3",
                      formData.target_type === target.value
                        ? "bg-primary/10 border-primary/40 text-primary shadow-glow-sm"
                        : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="target_type"
                      value={target.value}
                      checked={formData.target_type === target.value}
                      onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                      className="sr-only"
                    />
                    <target.icon weight={formData.target_type === target.value ? "fill" : "duotone"} className="w-6 h-6" />
                    <div className="text-[10px] font-black uppercase tracking-widest">{target.label}</div>
                  </label>
                ))}
              </div>

              {/* Conditional Target Selectors */}
              <AnimatePresence mode="wait">
                {formData.target_type === 'plan' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner"
                  >
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">Select Protocol Tiers:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {plans.map((plan) => (
                        <label 
                          key={plan} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            formData.target_plans.includes(plan)
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-card border-border/50 text-muted-foreground hover:bg-secondary/40"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={formData.target_plans.includes(plan)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, target_plans: [...formData.target_plans, plan] });
                              } else {
                                setFormData({ ...formData, target_plans: formData.target_plans.filter(p => p !== plan) });
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary/20"
                          />
                          <span className="text-[10px] font-black uppercase tracking-tight">{planLabels[plan as keyof typeof planLabels]}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {formData.target_type === 'specific' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner"
                  >
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">Establish Cluster Links:</label>
                    <div className="relative group/select">
                      <select
                        multiple
                        value={formData.target_clinics}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, target_clinics: selected });
                        }}
                        className="w-full h-40 bg-card border border-border rounded-2xl py-3 px-4 text-sm text-foreground focus:border-primary outline-none transition-all shadow-inner relative z-10 custom-scrollbar"
                      >
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id} className="p-2 border-b border-border/20 last:border-0 hover:bg-primary/5">
                            {clinic.name.toUpperCase()} [{clinic.plan.toUpperCase()}]
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-muted-foreground font-medium italic mt-3 px-1">Node Synchronization: Hold Ctrl/Cmd to establish multiple links.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Audience Sync Summary */}
              <div className="p-5 bg-primary/5 rounded-[28px] border border-primary/10 flex items-center justify-between group/summary overflow-hidden relative shadow-inner">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/summary:scale-110 transition-transform">
                  <Pulse weight="fill" className="w-16 h-16 text-primary" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                    <Target weight="bold" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Recipients</p>
                    <p className="text-lg font-black text-foreground tabular-nums tracking-tighter">{selectedClinicCount} Clinical Nodes</p>
                  </div>
                </div>
                <Badge variant="success" className="font-black text-[8px] tracking-widest px-3 py-1 shadow-sm relative z-10">SYNC_READY</Badge>
              </div>
            </div>

            {/* Schedule Protocol */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <CalendarDots weight="bold" className="w-3.5 h-3.5" />
                Temporal Dispatch Protocol (Optional)
              </label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                <input
                  type="datetime-local"
                  value={formData.scheduled_at || ''}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium italic opacity-60 ml-1">Leave null for immediate system-wide distribution.</p>
            </div>

            {/* Action Selection */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
              <Button
                type="submit"
                disabled={creating || !formData.title || !formData.content}
                className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-premium gap-3 relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                {creating ? <SpinnerGap className="w-5 h-5 animate-spin" /> : <PaperPlaneTilt weight="bold" className="w-5 h-5 group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-all" />}
                {creating ? 'TRANSMITTING...' : 'EXECUTE BROADCAST'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={creating || !formData.title || !formData.content}
                className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[11px] border-border/50 hover:bg-secondary gap-3"
              >
                <TestTube weight="bold" className="w-5 h-5" />
                Ping Node
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

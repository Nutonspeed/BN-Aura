'use client';

import { useState } from 'react';
import { 
  Bell,
  FloppyDisk,
  CalendarDots,
  CheckCircle,
  SpinnerGap,
  X,
  Monitor,
  Eye,
  Flag
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnnouncementContext, AnnouncementFormData } from '../context';

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormData> & { id?: string };
  onClose?: () => void;
}

export default function AnnouncementForm({ initialData, onClose }: AnnouncementFormProps) {
  const { createAnnouncement, updateAnnouncement, saving, clinics } = useAnnouncementContext();
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    target_audience: initialData?.target_audience || {
      roles: [],
      clinics: [],
      plans: []
    },
    display_location: initialData?.display_location || 'banner',
    priority: initialData?.priority || 'normal',
    start_date: initialData?.start_date || new Date().toISOString().slice(0, 16),
    end_date: initialData?.end_date || '',
    is_active: initialData?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
        await updateAnnouncement(initialData.id, formData);
      } else {
        await createAnnouncement(formData);
      }
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to save announcement:', error);
    }
  };

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'clinic_owner', label: 'Clinic Owner' },
    { value: 'clinic_admin', label: 'Clinic Admin' },
    { value: 'clinic_staff', label: 'Clinic Staff' },
    { value: 'sales_staff', label: 'Sales Staff' },
    { value: 'customer', label: 'Customer' }
  ];

  const plans = ['starter', 'professional', 'premium', 'enterprise'];
  const planLabels = {
    starter: 'Starter',
    professional: 'Professional',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Bell weight="fill" className="w-64 h-64 text-primary" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <FloppyDisk weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">
                {initialData?.id ? 'Modify Protocol' : 'Initialize Broadcast'}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">System-wide transmission parameters</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-10 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Title Node */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Transmission Header *</label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                  placeholder="Enter announcement identity node..."
                  required
                />
              </div>
            </div>

            {/* Content Payload */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Broadcast Payload *</label>
              <div className="relative group/input">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full bg-secondary/30 border border-border rounded-[28px] py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-medium leading-relaxed italic shadow-inner resize-none"
                  placeholder="Type your clinical announcement payload here..."
                  required
                />
              </div>
            </div>

            {/* Target Audience Matrix */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">Audience Selection Matrix</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Roles Cluster */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Identity Roles</p>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <label
                        key={role.value}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          formData.target_audience.roles.includes(role.value)
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.target_audience.roles.includes(role.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                target_audience: {
                                  ...formData.target_audience,
                                  roles: [...formData.target_audience.roles, role.value]
                                }
                              });
                            } else {
                              setFormData({
                                ...formData,
                                target_audience: {
                                  ...formData.target_audience,
                                  roles: formData.target_audience.roles.filter(r => r !== role.value)
                                }
                              });
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span className="text-[10px] font-black uppercase tracking-tight">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Plans Node */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Protocol Tiers</p>
                  <div className="grid grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <label
                        key={plan}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          formData.target_audience.plans.includes(plan)
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.target_audience.plans.includes(plan)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                target_audience: {
                                  ...formData.target_audience,
                                  plans: [...formData.target_audience.plans, plan]
                                }
                              });
                            } else {
                              setFormData({
                                ...formData,
                                target_audience: {
                                  ...formData.target_audience,
                                  plans: formData.target_audience.plans.filter(p => p !== plan)
                                }
                              });
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span className="text-[10px] font-black uppercase tracking-tight">{planLabels[plan as keyof typeof planLabels]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Display Node Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Display Hub</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'banner', label: 'Banner', icon: Monitor },
                    { value: 'modal', label: 'Modal', icon: Eye },
                    { value: 'sidebar', label: 'Sidebar', icon: Flag }
                  ].map((location) => (
                    <label
                      key={location.value}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                        formData.display_location === location.value
                          ? "bg-primary/10 border-primary/40 text-primary shadow-glow-sm"
                          : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="display_location"
                        value={location.value}
                        checked={formData.display_location === location.value}
                        onChange={(e) => setFormData({ ...formData, display_location: e.target.value as any })}
                        className="sr-only"
                      />
                      <location.icon weight={formData.display_location === location.value ? "fill" : "bold"} className="w-5 h-5" />
                      <div className="text-[10px] font-black uppercase tracking-widest">{location.label}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ระดับความสำคัญ</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'low', label: 'Normal', color: 'text-blue-500' },
                    { value: 'normal', label: 'Alert', color: 'text-amber-500' },
                    { value: 'high', label: 'Critical', color: 'text-rose-500' }
                  ].map((priority) => (
                    <label
                      key={priority.value}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                        formData.priority === priority.value
                          ? "bg-primary/10 border-primary/40 text-primary shadow-glow-sm"
                          : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={cn("text-[10px] font-black uppercase tracking-widest", formData.priority === priority.value ? "text-primary" : priority.color)}>{priority.label}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Lifecycle Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <CalendarDots weight="bold" className="w-3.5 h-3.5" />
                  Initial Transmission
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <CalendarDots weight="bold" className="w-3.5 h-3.5" />
                  Node Lifecycle End
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner"
                />
              </div>
            </div>

            {/* Active Switch Protocol */}
            <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-between group/active shadow-inner">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
                  formData.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-secondary border-border text-muted-foreground opacity-40"
                )}>
                  <CheckCircle weight="duotone" className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-foreground uppercase tracking-tight">Transmission Readiness</p>
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">Synchronize node with global dashboard registry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={cn(
                  "relative w-14 h-8 rounded-2xl transition-all duration-500 shadow-inner overflow-hidden",
                  formData.is_active ? "bg-primary shadow-glow-sm" : "bg-card border border-border/50"
                )}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 rounded-xl bg-white shadow-lg"
                  animate={{ left: formData.is_active ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Action Selection */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
              <Button
                type="submit"
                disabled={saving || !formData.title || !formData.content}
                className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-premium gap-3 relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                {saving ? (
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle weight="bold" className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                )}
                {saving ? 'กำลังส่ง...' : initialData?.id ? 'ส่งประกาศ' : 'INITIALIZE BROADCAST'}
              </Button>

              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[11px] border-border/50 hover:bg-secondary"
                >
                  Abort Cycle
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

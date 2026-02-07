'use client';

import { 
  X,
  CalendarDots,
  Clock,
  User,
  FirstAidKit,
  MapPin,
  Tag,
  SpinnerGap,
  FloppyDisk,
  CaretDown,
  CheckCircle,
  Pulse,
  IdentificationBadge,
  Briefcase
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: any;
  selectedDate?: Date;
}

export default function AppointmentModal({ isOpen, onClose, onSuccess, appointment, selectedDate }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    staff_id: '',
    appointment_date: '',
    start_time: '09:00',
    end_time: '10:00',
    appointment_type: 'consultation',
    status: 'scheduled',
    treatment_ids: [] as string[],
    notes: '',
    branch_id: null as string | null
  });

  const fetchData = useCallback(async () => {
    setFetchingData(true);
    try {
      const [customersRes, staffRes, treatmentsRes] = await Promise.all([
        fetch('/api/customers?limit=100'),
        fetch('/api/staff/invite?type=list'), // Assuming this exists or using a generic staff list
        fetch('/api/pricing?type=treatments')
      ]);

      const [customersData, staffData, treatmentsData] = await Promise.all([
        customersRes.json(),
        staffRes.json(),
        treatmentsRes.json()
      ]);

      if (customersData.success) setCustomers(customersData.data);
      // Fallback for staff if the endpoint isn't ready
      if (staffData.success) setStaffList(staffData.data);
      if (treatmentsData.success) setTreatments(treatmentsData.data);
    } catch (err) {
      console.error('Error fetching modal data:', err);
    } finally {
      setFetchingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      
      if (appointment) {
        setFormData({
          customer_id: appointment.customer_id || '',
          staff_id: appointment.staff_id || '',
          appointment_date: appointment.appointment_date || '',
          start_time: appointment.start_time?.substring(0, 5) || '09:00',
          end_time: appointment.end_time?.substring(0, 5) || '10:00',
          appointment_type: appointment.appointment_type || 'consultation',
          status: appointment.status || 'scheduled',
          treatment_ids: appointment.treatment_ids || [],
          notes: appointment.notes || '',
          branch_id: appointment.branch_id || null
        });
      } else {
        const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setFormData({
          customer_id: '',
          staff_id: '',
          appointment_date: dateStr,
          start_time: '09:00',
          end_time: '10:00',
          appointment_type: 'consultation',
          status: 'scheduled',
          treatment_ids: [],
          notes: '',
          branch_id: null
        });
      }
    }
  }, [isOpen, appointment, selectedDate, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments';
      const method = appointment ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save appointment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <CalendarDots className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <CalendarDots weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">
                    {appointment ? 'Modify Node' : 'Schedule Node'}
                  </h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    {appointment ? 'Synchronizing temporal data' : 'Initializing clinical transformation'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <X weight="bold" className="w-6 h-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Patient Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Patient Identity Node *
                  </label>
                  <div className="relative group/input">
                    <User weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="customer_id"
                      required
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      <option value="" className="bg-card">Select Client Node...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id} className="bg-card">
                          {c.full_name.toUpperCase()} {c.nickname ? `(${c.nickname.toUpperCase()})` : ''}
                        </option>
                      ))}
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Staff Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Clinical Practitioner *
                  </label>
                  <div className="relative group/input">
                    <IdentificationBadge weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="staff_id"
                      required
                      value={formData.staff_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      <option value="" className="bg-card">Assign Staff Node...</option>
                      {staffList.length > 0 ? staffList.map(s => (
                        <option key={s.id} value={s.id} className="bg-card">{(s.full_name || s.email).toUpperCase()}</option>
                      )) : (
                        <option value="current" className="bg-card">Self (System Default)</option>
                      )}
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Temporal Coordinate *
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                    <CalendarDots weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <input
                      type="date"
                      name="appointment_date"
                      required
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums relative z-10 shadow-inner"
                    />
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Start Phase
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      required
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      End Phase
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      required
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Transformation Logic *
                  </label>
                  <div className="relative group/input">
                    <Tag weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="appointment_type"
                      required
                      value={formData.appointment_type}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      <option value="consultation" className="bg-card">Consultation Matrix</option>
                      <option value="treatment" className="bg-card">Treatment Execution</option>
                      <option value="follow_up" className="bg-card">Post-Op Validation</option>
                      <option value="skin_analysis" className="bg-card">AI Skin Analysis</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Cycle Status
                  </label>
                  <div className="relative group/input">
                    <Pulse weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase tracking-widest text-[10px]",
                        formData.status === 'confirmed' || formData.status === 'completed' ? "text-emerald-500" : 
                        formData.status === 'in_progress' ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <option value="scheduled" className="bg-card">SCHEDULED</option>
                      <option value="confirmed" className="bg-card text-emerald-500">CONFIRMED</option>
                      <option value="in_progress" className="bg-card text-primary">EXECUTING</option>
                      <option value="completed" className="bg-card text-emerald-500">COMPLETED</option>
                      <option value="cancelled" className="bg-card text-rose-500">TERMINATED</option>
                      <option value="no_show" className="bg-card text-muted-foreground">NO-SHOW</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Clinical Directives / Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-[24px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed italic shadow-inner"
                  placeholder="Additional temporal telemetry and clinical observations..."
                />
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center"
                  >
                    System Exception: {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:flex-1 py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                >
                  Abort Cycle
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.customer_id || !formData.appointment_date}
                  className="w-full sm:flex-[2] py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="w-5 h-5" />
                      {appointment ? 'Commit Updates' : 'Initialize Session'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
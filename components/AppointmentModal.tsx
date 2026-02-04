'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDots, Clock, User, FirstAidKit, MapPin, Tag, SpinnerGap, FloppyDisk } from '@phosphor-icons/react';

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {appointment ? 'Edit Appointment Node' : 'Schedule New Node'}
                  </h3>
                  <p className="text-sm text-muted-foreground italic font-light">
                    {appointment ? 'Updating existing temporal orchestration' : 'Initializing new clinical transformation'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Patient Identity *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <select
                      name="customer_id"
                      required
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0A0A0A]">Select Patient...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#0A0A0A]">
                          {c.full_name} {c.nickname ? `(${c.nickname})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Staff Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Practitioner / Staff *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <select
                      name="staff_id"
                      required
                      value={formData.staff_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0A0A0A]">Select Staff...</option>
                      {staffList.length > 0 ? staffList.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0A0A0A]">{s.full_name || s.email}</option>
                      )) : (
                        <option value="current" className="bg-[#0A0A0A]">Self (System Default)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Temporal Coordinate (Date) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="date"
                      name="appointment_date"
                      required
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Start Phase
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="time"
                        name="start_time"
                        required
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      End Phase
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="time"
                        name="end_time"
                        required
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Transformation Type *
                  </label>
                  <select
                    name="appointment_type"
                    required
                    value={formData.appointment_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="consultation" className="bg-[#0A0A0A]">Consultation</option>
                    <option value="treatment" className="bg-[#0A0A0A]">Treatment Execution</option>
                    <option value="follow_up" className="bg-[#0A0A0A]">Post-Op Follow-up</option>
                    <option value="skin_analysis" className="bg-[#0A0A0A]">AI Skin Analysis</option>
                  </select>
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="scheduled" className="bg-[#0A0A0A]">Scheduled</option>
                    <option value="confirmed" className="bg-[#0A0A0A]">Confirmed</option>
                    <option value="in_progress" className="bg-[#0A0A0A]">Executing</option>
                    <option value="completed" className="bg-[#0A0A0A]">Completed</option>
                    <option value="cancelled" className="bg-[#0A0A0A]">Terminated</option>
                    <option value="no_show" className="bg-[#0A0A0A]">No-Show (Exception)</option>
                  </select>
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none"
                  placeholder="Additional temporal telemetry..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-widest text-center"
                >
                  System Exception: {error}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.customer_id || !formData.appointment_date}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs shadow-premium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Orchestrating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {appointment ? 'Commit Updates' : 'Initialize Node'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

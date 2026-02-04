'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDots, 
  Clock, 
  User, 
  FirstAidKit, 
  CaretRight, 
  CaretLeft,
  CheckCircle,
  SpinnerGap,
  WarningCircle,
  Sparkle,
  ArrowRight
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Treatment {
  id: string;
  names: { th: string; en: string };
  category: string;
  price_min: number;
}

interface Staff {
  id: string;
  full_name: string;
}

function CustomerBookingContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treatmentsRes, staffRes] = await Promise.all([
        fetch('/api/treatments?activeOnly=true'),
        fetch('/api/staff/invite?type=list') // Assuming this returns clinic staff
      ]);

      const [treatmentsData, staffData] = await Promise.all([
        treatmentsRes.json(),
        staffRes.json()
      ]);

      if (treatmentsData.success) setTreatments(treatmentsData.data);
      if (staffData.success) setStaffList(staffData.data);
    } catch (err) {
      console.error('Error fetching booking data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBooking = async () => {
    if (!selectedTreatment || !selectedDate || !selectedTime) return;
    
    setSubmitting(true);
    try {
      // Get current customer info first (real customer id linked to user)
      const customerRes = await fetch('/api/customers/me'); // Need to create this or handle in API
      const customerData = await customerRes.json();
      
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerData.data.id,
          treatment_ids: [selectedTreatment.id],
          appointment_date: selectedDate,
          start_time: selectedTime,
          appointment_type: 'treatment',
          staff_id: selectedStaff?.id || staffList[0]?.id, // Default to first staff if none selected
          customer_notes: customerNotes,
          status: 'pending'
        })
      });

      const result = await res.json();
      if (result.success) {
        setBookingSuccess(result.data.appointment_code);
      } else {
        throw new Error(result.error?.message || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing with Booking Node...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <CalendarIcon className="w-4 h-4" />
            Clinical Orchestration
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Book your <span className="text-primary text-glow">Transformation</span></h1>
          <p className="text-muted-foreground font-light text-sm italic">Reserve your temporal node for aesthetic excellence.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-md">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                step === s ? "bg-primary text-primary-foreground shadow-glow-sm" : 
                step > s ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                "bg-white/5 text-white/20 border border-white/5"
              )}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className="w-4 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Treatment */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {treatments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTreatment(t)}
                  className={cn(
                    "p-8 rounded-[40px] border transition-all text-left group relative overflow-hidden",
                    selectedTreatment?.id === t.id 
                      ? "bg-primary/10 border-primary/40 shadow-glow-sm scale-[1.02]" 
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                      selectedTreatment?.id === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 text-primary border-white/10"
                    )}>
                      <BriefcaseMedical className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Base Rate</p>
                      <p className="text-xl font-black text-white">฿{t.price_min.toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{t.names.th}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">{t.names.en}</p>
                  <div className="mt-6 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.category}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <button
                disabled={!selectedTreatment}
                onClick={() => setStep(2)}
                className="group flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 disabled:opacity-20 transition-all"
              >
                Next Configuration
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-premium p-10 rounded-[48px] border border-white/10">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  Select Temporal Node
                </h3>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-xl font-black text-white focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                />
              </div>

              <div className="glass-premium p-10 rounded-[48px] border border-white/10">
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  Select Time Cycle
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "py-4 rounded-2xl border text-sm font-black transition-all",
                        selectedTime === time 
                          ? "bg-primary text-primary-foreground border-primary shadow-glow-sm" 
                          : "bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass-premium p-8 rounded-[40px] border border-white/10">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6">Current Config</h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <BriefcaseMedical className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase">Treatment</p>
                      <p className="text-sm font-bold text-white line-clamp-1">{selectedTreatment?.names.th}</p>
                    </div>
                  </div>
                  {selectedDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase">Date</p>
                        <p className="text-sm font-bold text-white">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="p-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-3 py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 disabled:opacity-20 transition-all"
                >
                  Finalize Node
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Final Review */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-premium p-12 rounded-[56px] border border-white/10 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Sparkles className="w-48 h-48 text-primary" />
              </div>

              <div className="text-center space-y-2 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Review Protocol Node</h3>
                <p className="text-sm text-muted-foreground italic font-light">Validating clinical transformation parameters</p>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Protocol Type</p>
                    <p className="text-base font-bold text-white">{selectedTreatment?.names.th}</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Investment</p>
                    <p className="text-base font-bold text-primary">฿{selectedTreatment?.price_min.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Temporal Node</p>
                    <p className="text-base font-bold text-white">{new Date(selectedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cycle Phase</p>
                    <p className="text-base font-bold text-white">{selectedTime}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Clinical Directives (Notes)</label>
                  <textarea 
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Enter any additional telemetry or requirements..."
                    className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all resize-none italic font-light"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Modify
                </button>
                <button
                  onClick={handleBooking}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-3 py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 transition-all"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Finalize Transformation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/10 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-[#0A0A0A] border border-primary/30 rounded-[48px] p-12 text-center shadow-[0_0_50px_rgba(var(--primary),0.2)]"
            >
              <div className="w-24 h-24 rounded-[32px] bg-primary/20 border border-primary/20 flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Reserved</h3>
              <p className="text-sm text-muted-foreground mb-8">Clinical node initialized successfully</p>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Appointment Token</p>
                <p className="text-sm font-mono text-primary font-bold tracking-widest">{bookingSuccess}</p>
              </div>

              <button
                onClick={() => router.push('/customer')}
                className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-widest shadow-premium hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Control Center
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CustomerBookingPage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Interface node...</p>
      </div>
    }>
      <CustomerBookingContent />
    </Suspense>
  );
}

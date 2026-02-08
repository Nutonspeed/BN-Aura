'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  CreditCard,
  CalendarDots,
  User,
  CurrencyDollar,
  SpinnerGap,
  CaretDown,
  CheckCircle,
  Wallet
} from '@phosphor-icons/react';
import { useConfirmPayment } from '@/hooks/useWorkflowStatus';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  customerId: string;
  customerName: string;
}

export default function ConfirmPaymentModal({
  isOpen,
  onClose,
  workflowId,
  customerId,
  customerName,
}: ConfirmPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [treatmentName, setTreatmentName] = useState('');
  const [beauticianId, setBeauticianId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [beauticians, setBeauticians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const confirmPayment = useConfirmPayment();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchBeauticians();
      // Set default scheduled time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setScheduledTime(defaultTime.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const fetchBeauticians = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_staff')
        .select('id, user_id, users:user_id(id, full_name)')
        .eq('role', 'beautician');

      if (error) throw error;
      setBeauticians(data || []);
    } catch (error) {
      console.error('Error fetching beauticians:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !beauticianId || !treatmentName || !scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await confirmPayment.mutateAsync({
        workflowId,
        customerId,
        beauticianId,
        treatmentName,
        scheduledTime,
        amount: parseFloat(amount),
        paymentMethod,
      });

      toast.success('ยืนยันการชำระเงินสำเร็จ! มอบหมายงานให้ช่างแล้ว');
      onClose();
      
      // Reset form
      setAmount('');
      setTreatmentName('');
      setBeauticianId('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-card border border-border rounded-[32px] shadow-premium overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Wallet className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50 p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <CreditCard weight="duotone" className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">ยืนยันการชำระเงิน</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Client: {customerName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10">
              <div className="space-y-6">
                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Settlement Amount (THB) *
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                    <CurrencyDollar weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-14 pr-4 py-6 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-3xl font-black tabular-nums relative z-10"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Method Node
                    </label>
                    <div className="relative group/input">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase tracking-widest text-[10px]"
                      >
                        <option value="cash" className="bg-card">CASH (Physical)</option>
                        <option value="credit_card" className="bg-card">CREDIT CARD</option>
                        <option value="bank_transfer" className="bg-card">BANK TRANSFER</option>
                        <option value="promptpay" className="bg-card">PROMPTPAY (QR)</option>
                      </select>
                      <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Treatment Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Protocol Node *
                    </label>
                    <input
                      type="text"
                      value={treatmentName}
                      onChange={(e) => setTreatmentName(e.target.value)}
                      placeholder="e.g. HydraFacial Matrix"
                      className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Beautician */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Assign Practitioner *
                    </label>
                    <div className="relative group/input">
                      <User weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                      <select
                        value={beauticianId}
                        onChange={(e) => setBeauticianId(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-medium"
                        required
                      >
                        <option value="" className="bg-card">Select Identity...</option>
                        {beauticians.map((b) => (
                          <option key={b.user_id} value={b.user_id} className="bg-card">
                            {(b.users as any)?.full_name || 'Unknown Node'}
                          </option>
                        ))}
                      </select>
                      <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Temporal Sync *
                    </label>
                    <div className="relative group/input">
                      <CalendarDots weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-6 rounded-[20px] font-black uppercase tracking-widest text-[10px]"
                  disabled={loading}
                >ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-[2] py-6 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-5 h-5 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="w-5 h-5" />
                      Confirm Payment Node
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
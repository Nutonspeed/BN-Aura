'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Calendar, User, DollarSign, Loader2 } from 'lucide-react';
import { useConfirmPayment } from '@/hooks/useWorkflowStatus';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

      toast.success('Payment confirmed! Task assigned to beautician.');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Confirm Payment</h3>
                  <p className="text-sm text-muted-foreground">{customerName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Payment Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="promptpay">PromptPay</option>
              </select>
            </div>

            {/* Treatment Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Treatment Name *
              </label>
              <input
                type="text"
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
                placeholder="e.g., HydraFacial, Laser Treatment"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Beautician */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assign to Beautician *
              </label>
              <select
                value={beauticianId}
                onChange={(e) => setBeauticianId(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select beautician...</option>
                {beauticians.map((b) => (
                  <option key={b.user_id} value={b.user_id}>
                    {(b.users as any)?.full_name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Time */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

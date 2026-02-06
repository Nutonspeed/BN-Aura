'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Money, QrCode, SpinnerGap, CheckCircle, Download, Printer, Star } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePromptPayQR } from '@/lib/utils/promptpay';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  amount: number;
  transactionId: string;
  clinicId: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    metadata?: any;
    assigned_sales_id?: string;
  } | null;
  items?: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

type PaymentMethod = 'CASH' | 'PROMPTPAY' | 'CARD' | 'TRANSFER';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  amount, 
  transactionId,
  clinicId,
  customer,
  items = []
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('PROMPTPAY');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [promptPayId, setPromptPayId] = useState('0812345678'); // Mock clinic PromptPay ID
  
  // Calculate loyalty points (1 point per ฿100 spent)
  const calculateLoyaltyPoints = (amount: number): number => {
    return Math.floor(amount / 100);
  };
  
  const loyaltyPoints = customer ? calculateLoyaltyPoints(amount) : 0;

  useEffect(() => {
    if (method === 'PROMPTPAY' && amount > 0) {
      try {
        const qr = generatePromptPayQR(promptPayId, amount);
        setQrCode(qr);
      } catch (err: any) {
        console.error('Error generating QR:', err);
        setError('Failed to generate PromptPay QR');
      }
    }
  }, [method, amount, promptPayId]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Process payment
      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          amount,
          payment_method: method,
          customer_id: customer?.id,
          clinic_id: clinicId,
          items: items,
          metadata: {
            promptpay_id: method === 'PROMPTPAY' ? promptPayId : undefined,
            timestamp: new Date().toISOString(),
            loyalty_points_earned: loyaltyPoints
          }
        })
      });

      const paymentResult = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentResult.error?.message || 'Payment recording failed');
      }

      // Step 2: Award loyalty points if customer exists
      if (customer && loyaltyPoints > 0) {
        try {
          const loyaltyRes = await fetch('/api/loyalty/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: customer.id,
              clinicId: clinicId,
              points: loyaltyPoints,
              transactionId: transactionId,
              source: 'purchase',
              description: `Purchase ฿${amount.toLocaleString()} - ${items.length} item(s)`
            })
          });

          const loyaltyResult = await loyaltyRes.json();
          
          if (!loyaltyRes.ok) {
            console.warn('Loyalty points award failed:', loyaltyResult.error);
            // Continue with success even if loyalty fails
          } else {
            console.log(`✅ Awarded ${loyaltyPoints} loyalty points to ${customer.first_name}`);
          }
        } catch (loyaltyErr) {
          console.warn('Loyalty API error:', loyaltyErr);
          // Continue with success even if loyalty fails
        }
      }

      // Step 3: Record commission for sales staff
      if (customer && customer.assigned_sales_id) {
        try {
          const commissionRes = await fetch('/api/commissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              salesId: customer.assigned_sales_id,
              customerId: customer.id,
              treatmentName: items.map(i => i.item_name).join(', ') || 'Treatment',
              amount: amount,
              commissionRate: 15, // 15% commission rate
              clinicId: clinicId
            })
          });

          const commissionResult = await commissionRes.json();
          
          if (!commissionRes.ok) {
            console.warn('Commission recording failed:', commissionResult.error);
          } else {
            console.log(`✅ Commission recorded for sales staff: ${customer.assigned_sales_id}`);
          }
        } catch (commissionErr) {
          console.warn('Commission API error:', commissionErr);
        }
      }

      // Step 4: Update customer metadata with purchase history
      if (customer) {
        try {
          const currentSpent = parseFloat(customer.metadata?.total_spent || '0');
          const currentPurchases = parseInt(customer.metadata?.total_purchases || '0');
          
          const updatedMetadata = {
            ...customer.metadata,
            total_spent: currentSpent + amount,
            total_purchases: currentPurchases + 1,
            last_purchase_date: new Date().toISOString(),
            last_purchase_amount: amount,
            loyalty_points: (customer.metadata?.loyalty_points || 0) + loyaltyPoints
          };

          console.log(`🔄 Updating customer ${customer.id} metadata:`, updatedMetadata);
          
          const metadataRes = await fetch(`/api/customers/${customer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metadata: updatedMetadata
            })
          });

          const metadataResult = await metadataRes.json();

          if (!metadataRes.ok) {
            console.error('❌ Customer metadata update failed:', {
              status: metadataRes.status,
              error: metadataResult.error || metadataResult,
              customer: customer.id
            });
            // Still continue with success, metadata update is not critical
          } else {
            console.log(`✅ Updated customer metadata for ${customer.first_name}:`, {
              customerId: customer.id,
              newTotalSpent: updatedMetadata.total_spent,
              newTotalPurchases: updatedMetadata.total_purchases
            });
          }
        } catch (metaErr) {
          console.error('❌ Customer metadata update error:', {
            error: metaErr,
            customer: customer.id,
            amount: amount
          });
          // Continue with success even if metadata update fails
        }
      }

      onSuccess({
        ...paymentResult.data,
        loyalty_points_earned: loyaltyPoints,
        customer_updated: !!customer
      });
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Payment Settlement</h3>
                  <p className="text-sm text-muted-foreground italic font-light tracking-tight">Executing financial node for TXN-{transactionId.substring(0, 8)}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left: Payment Selection */}
              <div className="space-y-6">
                <div className="p-5 bg-secondary border border-border rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Outstanding</p>
                  <p className="text-4xl font-black text-primary tracking-tighter tabular-nums">฿{amount.toLocaleString()}</p>
                </div>

                {/* Customer & Loyalty Points Section */}
                {customer && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Customer Loyalty</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Points to Earn:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-sm font-bold text-amber-500">+{loyaltyPoints}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Select Method</p>
                  {[
                    { id: 'PROMPTPAY', label: 'QR PromptPay', icon: QrCode, color: 'text-blue-400' },
                    { id: 'CASH', label: 'Physical Cash', icon: Money, color: 'text-emerald-400' },
                    { id: 'CARD', label: 'Credit / Debit', icon: CreditCard, color: 'text-amber-400' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as PaymentMethod)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        method === m.id 
                          ? "bg-primary/10 border-primary/40 shadow-lg" 
                          : "bg-secondary border-border hover:border-primary/30 opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        method === m.id ? "bg-primary text-primary-foreground" : "bg-white/5"
                      )}>
                        <m.icon className="w-5 h-5" />
                      </div>
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        method === m.id ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Payment View (QR or Confirmation) */}
              <div className="flex flex-col items-center justify-center p-6 bg-secondary border border-border rounded-xl relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {method === 'PROMPTPAY' ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center space-y-6 w-full"
                    >
                      <div className="p-4 bg-white rounded-3xl shadow-glow inline-block">
                        {qrCode ? (
                          <QRCodeSVG value={qrCode} size={180} />
                        ) : (
                          <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-2xl">
                            <SpinnerGap className="w-8 h-8 text-primary animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Scan to Pay</p>
                        <p className="text-xs text-muted-foreground font-light">Available on all Thai Banking Apps</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Download className="w-4 h-4 text-white/40" /></button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Printer className="w-4 h-4 text-white/40" /></button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center space-y-6"
                    >
                      <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 border-dashed",
                        method === 'CASH' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-amber-500/30 text-amber-400 bg-amber-500/5"
                      )}>
                        {method === 'CASH' ? <Money className="w-10 h-10" /> : <CreditCard className="w-10 h-10" />}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">{method} Settlement</h4>
                        <p className="text-xs text-muted-foreground font-light px-4">Please verify payment completion before confirming this node.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-secondary border border-border text-foreground rounded-xl font-medium hover:bg-accent transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 text-xs shadow-premium"
              >
                {loading ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Payment Node
              </button>
            </div>

            {error && (
              <p className="mt-4 text-center text-rose-400 text-[10px] font-black uppercase tracking-widest">System Exception: {error}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  MagnifyingGlass, 
  User, 
  SpinnerGap, 
  SquaresFour,
  ClockCounterClockwise,
  CheckCircle,
  XCircle,
  Clock,
  CaretLeft,
  ArrowLeft,
  CurrencyCircleDollar,
  Receipt,
  IdentificationCard,
  Plus
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSCart, { CartItem } from '@/components/pos/POSCart';
import PaymentModal from '@/components/pos/PaymentModal';
import DigitalReceipt from '@/components/pos/DigitalReceipt';
import { createClient } from '@/lib/supabase/client';

export default function POSPage() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('clinic.pos' as any);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [transactionSuccessData, setTransactionSuccessData] = useState<any | null>(null);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [clinicId, setClinicId] = useState<string>('');
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [currency, setCurrency] = useState<'THB' | 'USD'>('THB');
  const exchangeRate = 35.5; // Mock rate: 1 USD = 35.5 THB

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, treatmentsRes, customersRes, userRes, clinicRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/treatments'),
        fetch('/api/customers?limit=100'),
        fetch('/api/staff/invite?type=profile'),
        fetch('/api/clinic/settings')
      ]);

      const [productsData, treatmentsData, customersData, userData, clinicData] = await Promise.all([
        productsRes.json(),
        treatmentsRes.json(),
        customersRes.json(),
        userRes.json(),
        clinicRes.json()
      ]);

      if (productsData.success) setProducts(productsData.data);
      if (treatmentsData.success) setTreatments(treatmentsData.data);
      if (customersData.success) setCustomers(customersData.data);
      if (userData.success) setClinicId(userData.data.clinic_id);
      if (clinicData.success) {
        setClinicInfo({
          name: clinicData.data.display_name?.th || clinicData.data.display_name?.en || 'Clinic Node',
          address: clinicData.data.metadata?.address || 'Operational Cluster Address',
          phone: clinicData.data.metadata?.phone || '00-000-0000'
        });
      }
    } catch (err) {
      console.error('Error fetching POS data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectItem = (item: any, type: 'PRODUCT' | 'TREATMENT') => {
    const existingItem = cartItems.find(i => i.item_id === item.id && i.item_type === type);
    
    if (existingItem) {
      handleUpdateQuantity(existingItem.id, 1);
    } else {
      const name = type === 'TREATMENT' 
        ? (typeof item.names === 'object' ? (item.names.th || item.names.en) : item.names)
        : item.name;
      
      // Always store base price in THB in the cart, conversion happens at display time
      const priceTHB = type === 'TREATMENT' ? item.price_min : item.sale_price;
      
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        item_id: item.id,
        item_type: type,
        item_name: name,
        quantity: 1,
        unit_price: Number(priceTHB),
        total: Number(priceTHB),
        discount: 0
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const convertPrice = (amount: number) => {
    if (currency === 'USD') return amount / exchangeRate;
    return amount;
  };

  const formatPrice = (amount: number) => {
    const converted = convertPrice(amount);
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: 2
    }).format(converted);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckoutInitiate = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    
    setIsCheckoutLoading(true);
    try {
      const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
      const res = await fetch('/api/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          items: cartItems,
          subtotal,
          total_amount: subtotal,
          payment_status: 'pending' // Initialize as pending
        })
      });

      const result = await res.json();
      if (result.success) {
        setPendingTransactionId(result.data.id);
        setIsPaymentModalOpen(true);
      } else {
        throw new Error(result.error?.message || 'Transaction initiation failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Checkout failed. Please check console.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setTransactionSuccessData({
      id: pendingTransactionId,
      number: paymentData.metadata?.transaction_number || 'TXN-GENERATING',
      date: new Date().toISOString(),
      customerName: selectedCustomer.full_name,
      items: cartItems,
      subtotal: cartItems.reduce((acc, i) => acc + i.total, 0),
      total: cartItems.reduce((acc, i) => acc + i.total, 0)
    });
    setCartItems([]);
    setSelectedCustomer(null);
    setIsPaymentModalOpen(false);
    setPendingTransactionId(null);
    fetchData(); // Refresh stock
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch) ||
    c.nickname?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Sales Interface...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-140px)] -m-8 flex font-sans overflow-hidden bg-background"
    >
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        amount={cartItems.reduce((acc, item) => acc + item.total, 0)}
        transactionId={pendingTransactionId || ''}
        clinicId={clinicId}
        customer={selectedCustomer}
        items={cartItems}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden print:hidden relative border-r border-border/50">
        <div className="flex-shrink-0 mb-8">
          <Breadcrumb />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-6">
            <div className="space-y-1">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
              >
                <SquaresFour weight="duotone" className="w-4 h-4" />
                Sales Orchestration Node
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-heading font-bold text-foreground tracking-tight"
              >
                Point of <span className="text-primary">Sale</span>
              </motion.h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-secondary/50 border border-border p-1 rounded-2xl shadow-inner">
                {(['THB', 'USD'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      currency === curr 
                        ? "bg-card text-primary border-border/50 shadow-sm" 
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {curr}
                  </button>
                ))}
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push('/clinic/pos/history')}
                className="gap-2"
              >
                <ClockCounterClockwise weight="bold" className="w-4 h-4" />
                Recent Logs
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <POSProductGrid 
            products={products}
            treatments={treatments}
            onSelectItem={handleSelectItem}
            currency={currency}
            formatPrice={formatPrice}
          />
        </div>
      </div>

      {/* Sidebar - Cart */}
      <div className="w-[400px] flex-shrink-0 print:hidden bg-card/30 backdrop-blur-xl">
        <POSCart 
          items={cartItems}
          customer={selectedCustomer}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onSelectCustomer={() => setIsCustomerSelectOpen(true)}
          onCheckout={handleCheckoutInitiate}
          loading={isCheckoutLoading}
          currency={currency}
          formatPrice={formatPrice}
        />
      </div>

      {/* Customer Selection Modal */}
      <AnimatePresence>
        {isCustomerSelectOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card border border-border rounded-[32px] p-8 shadow-premium overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <IdentificationCard className="w-48 h-48 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <User weight="duotone" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Identity Registry</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Select target client node</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCustomerSelectOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  <XCircle weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="relative mb-8 relative z-10 group">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by identity name, phone, or alias..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-5 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar relative z-10">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsCustomerSelectOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-[24px] border transition-all group/item",
                      selectedCustomer?.id === customer.id 
                        ? "bg-primary text-white border-primary shadow-premium" 
                        : "bg-secondary/30 border-border/50 hover:border-primary/30 hover:bg-secondary/50 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm transition-colors",
                        selectedCustomer?.id === customer.id ? "bg-white/20" : "bg-card border border-border group-hover/item:text-primary"
                      )}>
                        {customer.full_name.charAt(0)}
                      </div>
                      <div className="text-left space-y-0.5">
                        <p className={cn("font-bold text-base tracking-tight", selectedCustomer?.id === customer.id ? "text-white" : "text-foreground")}>{customer.full_name}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedCustomer?.id === customer.id ? "text-white/60" : "text-muted-foreground")}>{customer.phone || 'No Phone Node'}</p>
                      </div>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <div className="bg-white/20 p-1.5 rounded-full">
                        <CheckCircle weight="fill" className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                    <User weight="duotone" className="w-16 h-16" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Zero Identities Detected</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Success Modal */}
      <AnimatePresence>
        {transactionSuccessData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-2xl w-full py-10 relative">
              <div className="flex justify-center mb-10 print:hidden">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-3 rounded-full flex items-center gap-4 shadow-lg backdrop-blur-md"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Transaction Node Validated</span>
                </motion.div>
              </div>

              <DigitalReceipt 
                transactionNumber={transactionSuccessData.number}
                date={transactionSuccessData.date}
                customerName={transactionSuccessData.customerName}
                items={transactionSuccessData.items}
                subtotal={transactionSuccessData.subtotal}
                discount={0}
                tax={0}
                total={transactionSuccessData.total}
                clinicInfo={clinicInfo || { name: 'BN-Aura Clinical Node', address: 'Operational Data Loading...', phone: '...' }}
              />

              <div className="mt-12 flex flex-col items-center gap-6 print:hidden">
                <Button
                  onClick={() => setTransactionSuccessData(null)}
                  className="px-12 py-6 rounded-[24px] shadow-premium text-base font-bold uppercase tracking-widest"
                >
                  Confirm & New Sale
                </Button>
                <button className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">
                  Archive Digital Transcript
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

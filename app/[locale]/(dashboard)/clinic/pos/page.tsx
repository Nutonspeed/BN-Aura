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
  CaretLeft
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSCart, { CartItem } from '@/components/pos/POSCart';
import PaymentModal from '@/components/pos/PaymentModal';
import DigitalReceipt from '@/components/pos/DigitalReceipt';
import { createClient } from '@/lib/supabase/client';

export default function POSPage() {
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
    <div className="flex h-[calc(100vh-140px)] -m-10 overflow-hidden font-sans">
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        amount={cartItems.reduce((acc, item) => acc + item.total, 0)}
        transactionId={pendingTransactionId || ''}
        clinicId={clinicId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-10 overflow-hidden print:hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <SquaresFour className="w-4 h-4" />
              Sales Orchestration
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Point of <span className="text-primary text-glow">Sale</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl mr-2">
              {(['THB', 'USD'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    currency === curr ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
            <button 
              onClick={() => router.push('/clinic/pos/history')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              <ClockCounterClockwise className="w-4 h-4" />
              Recent Logs
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
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
      <div className="print:hidden">
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

      {/* Customer Selection Drawer/Overlay */}
      <AnimatePresence>
        {isCustomerSelectOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:hidden"
            onClick={() => setIsCustomerSelectOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Select Patient</h3>
                    <p className="text-sm text-muted-foreground italic font-light">Linking transaction to identity</p>
                  </div>
                </div>
                <button onClick={() => setIsCustomerSelectOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="relative mb-6">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Search by name, phone, or alias..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsCustomerSelectOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                      selectedCustomer?.id === customer.id 
                        ? "bg-primary/20 border-primary/40" 
                        : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-primary text-xs font-black">
                        {customer.full_name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{customer.full_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{customer.phone || 'No Phone'}</p>
                      </div>
                    </div>
                    {selectedCustomer?.id === customer.id && <CheckCircle className="w-5 h-5 text-primary" />}
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="py-10 text-center opacity-30">
                    <User className="w-12 h-12 mx-auto mb-2 stroke-[1px]" />
                    <p className="text-xs font-black uppercase tracking-widest">No Patients Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Success Modal with Digital Receipt */}
      <AnimatePresence>
        {transactionSuccessData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-2xl w-full py-10">
              <div className="flex justify-center mb-8 print:hidden">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/20 border border-emerald-500/30 px-6 py-2 rounded-full flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Transaction Validated</span>
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
                clinicInfo={clinicInfo || { name: 'BN-Aura Clinic', address: 'Loading...', phone: '...' }}
              />

              <div className="mt-8 flex justify-center print:hidden">
                <button
                  onClick={() => setTransactionSuccessData(null)}
                  className="px-12 py-4 bg-white/5 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-xs"
                >
                  Close & New Sale
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

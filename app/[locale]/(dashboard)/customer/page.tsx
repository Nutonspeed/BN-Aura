'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkle, 
  ChatCircle, 
  CalendarDots, 
  SpinnerGap,
  CaretRight,
  TrendUp,
  Lightning,
  ShieldCheck
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import MySalesRep from '@/components/customer/MySalesRep';
import TreatmentJourney from '@/components/customer/TreatmentJourney';
import DirectChat from '@/components/customer/DirectChat';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [realCustomerId, setRealCustomerId] = useState<string | null>(null);
  const [salesRep, setSalesRep] = useState<{ id: string; name: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [overview, setOverview] = useState({
    skinScore: 0,
    activeTreatments: 0,
    nextSessionDate: null as string | null
  });

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchCustomerData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch customer specific data using the Auth User ID (user_id)
          const { data: customer } = await supabase
            .from('customers')
            .select('id, full_name, assigned_sales_id')
            .eq('user_id', user.id)
            .single();
          
          if (customer) {
            setCustomerName(customer.full_name);
            setRealCustomerId(customer.id);
            
            // Fetch sales rep info separately if assigned
            if (customer.assigned_sales_id) {
              const { data: salesUser } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('id', customer.assigned_sales_id)
                .single();
              if (salesUser) {
                setSalesRep({
                  id: salesUser.id,
                  name: salesUser.full_name
                });
              }
            }

            // Fetch real-time overview and points
            const [pointsRes, overviewRes] = await Promise.all([
              fetch('/api/loyalty/points'),
              fetch('/api/reports?type=customer_overview')
            ]);

            const [pointsData, overviewData] = await Promise.all([
              pointsRes.json(),
              overviewRes.json()
            ]);

            if (pointsData.success) {
              setLoyaltyPoints(pointsData.data.points || 0);
            }

            if (overviewData.success) {
              setOverview(overviewData.data);
            }
          }
        }
      } catch (err) {
        console.error('Customer Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomerData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          Loading Your Aesthetic Profile...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Sparkle className="w-4 h-4" />
            Elite Aura Member
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Welcome, <span className="text-primary text-glow">{customerName || 'Valued Guest'}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Your path to aesthetic excellence starts here.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Link href="/customer/booking">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-2">
              <CalendarDots className="w-4 h-4" />
              Book Treatment
            </button>
          </Link>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <ChatCircle className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            Chat Advisor
          </button>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Journey and Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Skin Health Score', value: `${overview.skinScore}/100`, icon: TrendUp, color: 'text-emerald-400' },
              { label: 'Active Treatments', value: overview.activeTreatments.toString(), icon: Lightning, color: 'text-primary' },
              { label: 'Next Session', value: overview.nextSessionDate ? new Date(overview.nextSessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None', icon: CalendarDots, color: 'text-amber-400' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="glass-card p-5 rounded-3xl border border-white/5 flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Treatment Journey */}
          {realCustomerId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <TreatmentJourney customerId={realCustomerId} />
            </motion.div>
          )}

          {/* Skin Analysis Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 min-h-[300px] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700">
              <Sparkle className="w-32 h-32 text-primary" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Latest Skin <span className="text-primary">Intelligence</span></h3>
                <Link href="/customer/skin-profile">
                  <button className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:gap-3 transition-all">
                    Full Report <CaretRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: 'Hydration', value: 'Good', percentage: 75, color: 'bg-blue-400' },
                  { label: 'Elasticity', value: 'Premium', percentage: 92, color: 'bg-emerald-400' },
                  { label: 'Texture', value: 'Fair', percentage: 60, color: 'bg-amber-400' },
                  { label: 'Pores', value: 'Excellent', percentage: 85, color: 'bg-primary' }
                ].map((item, i) => (
                  <motion.div 
                    key={item.label} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="space-y-3"
                  >
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                    <p className="text-lg font-black text-white">{item.value}</p>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={cn("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]", item.color)} 
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Advisor and Offers */}
        <div className="space-y-8">
          {/* Advisor Card */}
          {realCustomerId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <MySalesRep customerId={realCustomerId} />
            </motion.div>
          )}

          {/* Personalized Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden group"
          >
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">AI For <span className="text-primary">You</span></h3>
              <ShieldCheck className="w-6 h-6 text-primary opacity-60" />
            </div>

            <div className="space-y-4 relative z-10">
              {[
                { title: 'Vitamin C Brightening', type: 'Clinical Product', price: '฿2,450', color: 'text-emerald-400' },
                { title: 'HydraFacial Plus', type: 'Treatment Protocol', price: '฿4,500', color: 'text-primary' }
              ].map((offer, i) => (
                <motion.div 
                  key={offer.title}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group hover:bg-white/[0.08]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{offer.title}</span>
                    <span className={cn("text-[10px] font-black bg-white/5 px-2 py-1 rounded-lg uppercase tracking-tighter border border-white/5", offer.color)}>
                      {offer.price}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">{offer.type}</p>
                </motion.div>
              ))}
            </div>

            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 relative z-10">
              Explore All Suggestions
            </button>
          </motion.div>

          {/* Loyalty / Membership */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-8 rounded-[40px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/10 space-y-6 relative overflow-hidden group"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] relative z-10">Aura Elite <span className="text-primary">Status</span></h3>
            <div className="space-y-4 relative z-10">
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">{loyaltyPoints.toLocaleString()} <span className="text-xs font-light text-muted-foreground uppercase tracking-widest ml-1">Points</span></p>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (loyaltyPoints / 3000) * 100)}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)] rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-muted-foreground text-right uppercase tracking-widest font-black pt-1">
                  {loyaltyPoints < 3000 ? `${3000 - loyaltyPoints} points until Platinum` : 'Platinum Status Achieved'}
                </p>
              </div>
              <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all">
                Membership Benefits
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Integrated Chat */}
      {realCustomerId && salesRep && (
        <DirectChat
          customerId={realCustomerId}
          salesId={salesRep.id}
          salesName={salesRep.name}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </motion.div>
  );
}

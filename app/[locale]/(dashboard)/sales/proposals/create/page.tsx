'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash, 
  Sparkle,
  CaretLeft,
  CheckCircle,
  FirstAidKit,
  CurrencyDollar,
  SpinnerGap,
  Package,
  ShoppingBag,
  ArrowRight,
  FileText,
  User,
  Brain
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/routing';

interface Lead {
  id: string;
  name: string;
  email: string;
  clinic_id: string;
}

interface Treatment {
  id: string;
  names: { [key: string]: string } | string;
  category: string;
  price_min: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  sale_price: number;
}

interface SelectedItem {
  id: string;
  type: 'treatment' | 'product';
  name?: string;
  names?: { [key: string]: string } | string;
  category: string;
  quantity: number;
  current_price: number;
}

interface AIRecommendation {
  treatments?: Array<{
    program: string;
    standardCategory: string;
    sessions: number;
    whyThis: string;
  }>;
  products?: Array<{
    name: string;
    standardCategory: string;
    keyIngredients: string;
    usage: string;
  }>;
}

interface AIAnalysis {
  id: string;
  overall_score: number;
  skin_age: number;
  spots_detections?: Array<{ name: string }>;
  recommendations?: AIRecommendation;
}

export default function CreateProposalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [proposalTitle, setProposalTitle] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, treatmentsRes, productsRes] = await Promise.all([
          supabase.from('sales_leads').select('*').order('name'),
          supabase.from('treatments').select('*').order('category'),
          supabase.from('inventory_products').select('*').order('category')
        ]);

        if (leadsRes.error) throw leadsRes.error;
        if (treatmentsRes.error) throw treatmentsRes.error;
        if (productsRes.error) throw productsRes.error;

        setLeads(leadsRes.data || []);
        setTreatments(treatmentsRes.data || []);
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  // Fetch AI analysis when a lead is selected
  useEffect(() => {
    async function fetchAiAnalysis() {
      if (!selectedLead) {
        setAiAnalysis(null);
        return;
      }

      const { data } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('clinic_id', selectedLead.clinic_id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setAiAnalysis(data as unknown as AIAnalysis);
    }
    fetchAiAnalysis();
  }, [selectedLead, supabase]);

  const addItem = (item: Treatment | Product, type: 'treatment' | 'product') => {
    if (selectedItems.find(i => i.id === item.id && i.type === type)) return;
    const price = type === 'treatment' ? (item as Treatment).price_min : (item as Product).sale_price;
    const newItem: SelectedItem = { 
      ...item, 
      type, 
      quantity: 1, 
      current_price: price 
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const removeItem = (id: string, type: string) => {
    setSelectedItems(selectedItems.filter(i => !(i.id === id && i.type === type)));
  };

  const updateQuantity = (id: string, type: string, delta: number) => {
    setSelectedItems(selectedItems.map(i => 
      (i.id === id && i.type === type) ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, i) => acc + (Number(i.current_price) * i.quantity), 0);
  };

  const handleSave = async () => {
    if (!selectedLead || selectedItems.length === 0 || !proposalTitle) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sales_proposals')
        .insert({
          lead_id: selectedLead.id,
          clinic_id: selectedLead.clinic_id,
          title: proposalTitle,
          treatments: selectedItems.map(i => ({
            id: i.id,
            type: i.type,
            name: i.type === 'treatment' ? (typeof i.names === 'object' ? i.names.en : i.names) : i.name,
            price: i.current_price,
            quantity: i.quantity
          })),
          total_value: calculateTotal(),
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/sales/proposals?id=${data.id}`);
    } catch (err) {
      console.error('Error saving proposal:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm uppercase tracking-widest font-heading">Initialising Builder...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
            >
              <FileText className="w-4 h-4" />
              Creative Studio
            </motion.div>
            <h1 className="text-4xl font-heading font-bold text-white uppercase tracking-tight">Proposal <span className="text-primary text-glow">Builder</span></h1>
            <p className="text-muted-foreground font-light text-sm italic">Crafting a bespoke aesthetic journey for your distinguished client.</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || !selectedLead || selectedItems.length === 0 || !proposalTitle}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-premium hover:brightness-110 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[3px]" />}
          <span>Authorize & Dispatch</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Selection */}
        <div className="lg:col-span-2 space-y-10">
          {/* Step 1: Select Lead */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <User className="w-32 h-32 text-primary" />
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 font-black shadow-premium">1</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Lead <span className="text-primary">Identification</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              {leads.map((lead, idx) => (
                <motion.div 
                  key={lead.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  onClick={() => setSelectedLead(lead)}
                  className={cn(
                    "p-6 rounded-[32px] border transition-all cursor-pointer group flex items-center justify-between relative overflow-hidden",
                    selectedLead?.id === lead.id 
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_25px_rgba(59,130,246,0.15)]" 
                      : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500",
                      selectedLead?.id === lead.id ? "bg-primary text-white shadow-premium" : "bg-white/5 text-muted-foreground border border-white/5"
                    )}>
                      {lead.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">{lead.email}</p>
                    </div>
                  </div>
                  {selectedLead?.id === lead.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Step 2: Customise Plan */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 font-black shadow-premium">2</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Curated <span className="text-primary">Selection</span></h2>
            </div>

            {/* Catalog Tabs/Selectors */}
            <div className="space-y-10 relative z-10">
              {/* Treatments Selector */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <BriefcaseMedical className="w-4 h-4 text-primary" /> Clinical Protocols
                  </h3>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{treatments.length} Available</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {treatments.map((t) => (
                    <motion.button
                      key={t.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addItem(t, 'treatment')}
                      className="flex-shrink-0 px-6 py-3 bg-white/5 border border-white/10 rounded-[20px] text-xs font-bold text-white hover:bg-white/10 hover:border-primary/30 transition-all whitespace-nowrap flex items-center gap-3 group"
                    >
                      <Plus className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                      {typeof t.names === 'object' ? t.names.en : t.names}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Products Selector */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" /> Premium Skincare
                  </h3>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{products.length} Available</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {products.map((p) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addItem(p, 'product')}
                      className="flex-shrink-0 px-6 py-3 bg-white/5 border border-white/10 rounded-[20px] text-xs font-bold text-white hover:bg-white/10 hover:border-emerald-400/30 transition-all whitespace-nowrap flex items-center gap-3 group"
                    >
                      <Plus className="w-3.5 h-3.5 group-hover:text-emerald-400 transition-colors" />
                      {p.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Suggestions Section */}
            <AnimatePresence>
              {aiAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-8 border-t border-white/5"
                >
                  <div className="flex items-center gap-3 text-primary">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 animate-glow-pulse" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">Cognitive Neural Mapping</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Suggest Treatments */}
                    {aiAnalysis.recommendations?.treatments?.map((rec, i) => (
                      <motion.div 
                        key={rec.program} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="p-5 bg-primary/5 border border-primary/20 rounded-[32px] flex items-center justify-between group hover:bg-primary/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <BriefcaseMedical className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{rec.program}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{rec.sessions} Protocol Cycles</p>
                          </div>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const match = treatments.find(t => t.category === rec.standardCategory);
                            if (match) addItem(match, 'treatment');
                          }}
                          className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg hover:brightness-110 transition-all"
                        >
                          <Plus className="w-4 h-4 stroke-[3px]" />
                        </motion.button>
                      </motion.div>
                    ))}
                    {/* Suggest Products */}
                    {aiAnalysis.recommendations?.products?.map((rec, i) => (
                      <motion.div 
                        key={rec.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] flex items-center justify-between group hover:bg-emerald-500/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="pr-4">
                            <p className="text-sm font-black text-white line-clamp-1">{rec.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest line-clamp-1">{rec.usage}</p>
                          </div>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const match = products.find(p => p.category === rec.standardCategory);
                            if (match) addItem(match, 'product');
                          }}
                          className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg hover:brightness-110 transition-all flex-shrink-0"
                        >
                          <Plus className="w-4 h-4 stroke-[3px]" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Items List */}
            <div className="space-y-6 pt-8 border-t border-white/5 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Bespoke Composition</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedItems.length} Items Configured</span>
              </div>
              
              <AnimatePresence mode="popLayout">
                {selectedItems.map((item) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/30 transition-all hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                        item.type === 'treatment' ? "bg-primary/10 text-primary border border-primary/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      )}>
                        {item.type === 'treatment' ? <BriefcaseMedical className="w-7 h-7" /> : <Package className="w-7 h-7" />}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white tracking-tight">{item.type === 'treatment' ? (typeof item.names === 'object' ? item.names.en : item.names) : item.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black italic">{item.category}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 md:gap-12 justify-between md:justify-end">
                      <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-1.5 border border-white/5 shadow-inner">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.type, -1)} 
                          className="w-10 h-10 rounded-xl hover:bg-white/10 text-white flex items-center justify-center transition-all font-black"
                        >-</motion.button>
                        <span className="w-6 text-center text-sm font-black text-white tabular-nums">{item.quantity}</span>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.type, 1)} 
                          className="w-10 h-10 rounded-xl hover:bg-white/10 text-white flex items-center justify-center transition-all font-black"
                        >+</motion.button>
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-black text-white tracking-tight">฿{(Number(item.current_price) * item.quantity).toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Investment</p>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.id, item.type)} 
                        className="p-3 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {selectedItems.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 border-2 border-dashed border-white/5 rounded-[48px] text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto opacity-20 border border-white/10 animate-float">
                    <ShoppingBag className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-white/40 uppercase tracking-widest">Composer Empty</p>
                    <p className="text-xs text-muted-foreground font-light italic max-w-xs mx-auto">Initialize the plan by selecting clinical protocols or products from the available catalog.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Right Column: Preview & Summary */}
        <div className="space-y-8">
          {/* AI Context Card */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Intelligence Context</h3>
            </div>

            {aiAnalysis ? (
              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-primary/10 rounded-3xl border border-primary/20 backdrop-blur-md">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-2">Cutaneous Deviation</p>
                  <p className="text-base font-black text-white leading-tight">{aiAnalysis.spots_detections?.[0]?.name || 'Dermal Mapping Active'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-[24px] border border-white/5 text-center">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Aura Score</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{aiAnalysis.overall_score}%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-[24px] border border-white/5 text-center">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Dermal Age</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{aiAnalysis.skin_age || 24}</p>
                  </div>
                </div>
                <Link href={`/analysis/results?id=${aiAnalysis.id}`} className="block">
                  <motion.button 
                    whileHover={{ x: 5 }}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 group/btn"
                  >
                    Examine Full Report 
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 text-white/10 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-light">No cutaneous scan found.</p>
                  <button className="text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:underline hover:text-primary/80 transition-colors">Initialize Diagnostic</button>
                </div>
              </div>
            )}
          </motion.section>

          {/* Summary Card */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-premium p-8 rounded-[40px] border border-primary/30 bg-primary/5 space-y-10 relative overflow-hidden"
          >
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Composition Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Aura Glow Protocol"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg font-black focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                />
              </div>
            </div>

            <div className="space-y-5 border-t border-white/10 pt-8 relative z-10">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Configured Nodes ({selectedItems.length})</span>
                <span className="text-white tabular-nums">฿{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Neural Intelligence mapping</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">Synced</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
              
              <div className="pt-8 flex justify-between items-end border-t border-white/10 mt-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Consolidated Value</p>
                  <p className="text-4xl font-black text-white tracking-tighter tabular-nums">฿{calculateTotal().toLocaleString()}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 relative z-10">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest group-hover:text-emerald-400 transition-colors">3D Genomic Visualization Included</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest group-hover:text-emerald-400 transition-colors">AI Personalized Diagnostics Active</p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

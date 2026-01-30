'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  BriefcaseMedical,
  DollarSign,
  Loader2,
  Package,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
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
    <div className="space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Proposal Builder</h1>
            <p className="text-muted-foreground font-light text-sm italic">Crafting a bespoke aesthetic journey for your client.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || !selectedLead || selectedItems.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span className="uppercase tracking-widest text-xs">Generate Proposal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Select Lead */}
          <section className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
              <h2 className="text-xl font-bold text-white font-heading uppercase tracking-tight">Select Lead</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leads.map((lead) => (
                <div 
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={cn(
                    "p-4 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between",
                    selectedLead?.id === lead.id 
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                      selectedLead?.id === lead.id ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                    )}>
                      {lead.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground font-light">{lead.email}</p>
                    </div>
                  </div>
                  {selectedLead?.id === lead.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
              ))}
            </div>
          </section>

          {/* Step 2: Customise Plan */}
          <section className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
              <h2 className="text-xl font-bold text-white font-heading uppercase tracking-tight">Customise Bespoke Plan</h2>
            </div>

            {/* Catalog Tabs/Selectors */}
            <div className="space-y-6">
              {/* Treatments Selector */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <BriefcaseMedical className="w-3.5 h-3.5" /> Clinical Treatments
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {treatments.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => addItem(t, 'treatment')}
                      className="flex-shrink-0 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-medium text-white hover:bg-white/10 transition-all whitespace-nowrap flex items-center gap-2 group"
                    >
                      <Plus className="w-3 h-3 group-hover:scale-125 transition-transform" />
                      {typeof t.names === 'object' ? t.names.en : t.names}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Selector */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5" /> Skincare Inventory
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p, 'product')}
                      className="flex-shrink-0 px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs font-medium text-white hover:bg-emerald-500/10 transition-all whitespace-nowrap flex items-center gap-2 group"
                    >
                      <Plus className="w-3 h-3 group-hover:scale-125 transition-transform text-emerald-400" />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Suggestions Section */}
            {aiAnalysis && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">AI Intelligence Suggestions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Suggest Treatments */}
                  {aiAnalysis.recommendations?.treatments?.map((rec: { program: string; sessions: number; standardCategory: string }) => (
                    <div key={rec.program} className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <BriefcaseMedical className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rec.program}</p>
                          <p className="text-[10px] text-muted-foreground">{rec.sessions} sessions</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const match = treatments.find(t => t.category === rec.standardCategory);
                          if (match) addItem(match, 'treatment');
                        }}
                        className="p-1.5 rounded-lg bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {/* Suggest Products */}
                  {aiAnalysis.recommendations?.products?.map((rec: { name: string; usage: string; standardCategory: string }) => (
                    <div key={rec.name} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rec.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{rec.usage}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const match = products.find(p => p.category === rec.standardCategory);
                          if (match) addItem(match, 'product');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Items List */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <AnimatePresence mode="popLayout">
                {selectedItems.map((item) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between gap-6 group hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        item.type === 'treatment' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {item.type === 'treatment' ? <BriefcaseMedical className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{item.type === 'treatment' ? (typeof item.names === 'object' ? item.names.en : item.names) : item.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{item.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3 bg-background/50 rounded-xl p-1 border border-white/5">
                        <button onClick={() => updateQuantity(item.id, item.type, -1)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white flex items-center justify-center transition-all">-</button>
                        <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.type, 1)} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white flex items-center justify-center transition-all">+</button>
                      </div>
                      
                      <div className="text-right w-24">
                        <p className="text-sm font-bold text-white">฿{(Number(item.current_price) * item.quantity).toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Subtotal</p>
                      </div>

                      <button onClick={() => removeItem(item.id, item.type)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selectedItems.length === 0 && (
                <div className="p-16 border-2 border-dashed border-white/5 rounded-[40px] text-center space-y-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-muted-foreground font-light italic">No items added yet. Choose treatments or products from the catalog.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Preview & Summary */}
        <div className="space-y-8">
          {/* AI Context Card */}
          <section className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Intelligence Context</h3>
            </div>

            {aiAnalysis ? (
              <div className="space-y-4 relative z-10">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tighter mb-1">Detected Concern</p>
                  <p className="text-sm font-medium text-white">{aiAnalysis.spots_detections?.[0]?.name || 'Mapping Skin Texture'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Skin Score</p>
                    <p className="text-lg font-bold text-white">{aiAnalysis.overall_score}%</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Skin Age</p>
                    <p className="text-lg font-bold text-white">{aiAnalysis.skin_age || 24}</p>
                  </div>
                </div>
                <Link href={`/analysis/results?id=${aiAnalysis.id}`}>
                  <button className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    View Full Report <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 relative z-10">
                <p className="text-xs text-muted-foreground font-light">No active scan found for this lead.</p>
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">+ New Scan</button>
              </div>
            )}
          </section>

          {/* Summary Card */}
          <section className="glass-card p-8 rounded-[40px] border border-primary/30 bg-primary/5 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Proposal Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Aura Glow Transformation"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Selected Items ({selectedItems.length})</span>
                <span className="text-white font-medium">฿{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">AI Intelligence mapping</span>
                <span className="text-emerald-400 font-medium">Synced</span>
              </div>
              <div className="pt-4 flex justify-between items-end border-t border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Grand Total</p>
                  <p className="text-3xl font-heading font-bold text-white">฿{calculateTotal().toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Includes Interactive 3D Skin Report
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Personalised AI Recommendations
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

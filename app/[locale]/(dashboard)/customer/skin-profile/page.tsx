'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle, 
  ClockCounterClockwise, 
  ArrowLeft, 
  SpinnerGap, 
  CaretRight,
  TrendUp,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  CalendarDots,
  Lightning,
  Info
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import BeforeAfterReport from '@/components/BeforeAfterReport';

interface SkinAnalysis {
  id: string;
  image_url: string;
  overall_score: number;
  skin_type: string;
  skin_age: number;
  analyzed_at: string;
  pores_score: number;
  wrinkles_score: number;
  texture_score: number;
  spots_score: number;
  recommendations: any;
}

function SkinProfileContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<SkinAnalysis | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<SkinAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'progress' | 'compare'>('history');

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch all analyses
      const { data: analysisData, error: analysisError } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false });

      if (analysisError) throw analysisError;
      setAnalyses(analysisData || []);

      // 2. Fetch existing comparisons
      const res = await fetch(`/api/analysis/compare?userId=${user.id}`);
      const compResult = await res.json();
      if (compResult.success) {
        setComparisons(compResult.data);
      }
    } catch (err) {
      console.error('Error fetching skin profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateComparison = async () => {
    if (!selectedBefore || !selectedAfter) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/api/analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          before_analysis_id: selectedBefore.id,
          after_analysis_id: selectedAfter.id
        })
      });
      
      const result = await res.json();
      if (result.success) {
        fetchData();
        setActiveTab('history');
        setSelectedBefore(null);
        setSelectedAfter(null);
      }
    } catch (err) {
      console.error('Error creating comparison:', err);
    }
  };

  const chartData = [...analyses].reverse().map(a => ({
    date: new Date(a.analyzed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: a.overall_score,
    texture: a.texture_score,
    pores: a.pores_score,
    wrinkles: a.wrinkles_score
  }));

  if (loading && analyses.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Neural Archive...</p>
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
          <button 
            onClick={() => router.back()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <Sparkle className="w-4 h-4" />
              Aesthetic Intelligence Profile
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Skin <span className="text-primary text-glow">Evolution</span></h1>
          </div>
        </div>

        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
          {[
            { id: 'history', label: 'History', icon: History },
            { id: 'progress', label: 'Progress', icon: TrendUp },
            { id: 'compare', label: 'Compare', icon: Camera }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {analyses.map((scan, i) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-6 group hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden group-hover:border-primary/30 transition-all">
                      {scan.image_url ? (
                        <img src={scan.image_url} alt="Skin Analysis" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Score</p>
                      <p className="text-3xl font-black text-primary text-glow">{scan.overall_score}</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Diagnostic Phase</span>
                      <span className="text-white/60">{new Date(scan.analyzed_at).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                        Type: <span className="text-primary ml-1">{scan.skin_type}</span>
                      </div>
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                        Age node: <span className="text-primary ml-1">{scan.skin_age}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/5 relative z-10">
                    {[
                      { label: 'Pores', val: scan.pores_score },
                      { label: 'Wrinkles', val: scan.wrinkles_score },
                      { label: 'Texture', val: scan.texture_score },
                      { label: 'Spots', val: scan.spots_score }
                    ].map((metric) => (
                      <div key={metric.label} className="text-center">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">{metric.label}</p>
                        <p className="text-xs font-black text-white">{metric.val}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Comparisons Section */}
            {comparisons.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] px-4 flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" />
                  Evolution Checkpoints
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {comparisons.map((comp, i) => (
                    <motion.div
                      key={comp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-premium p-8 rounded-[48px] border border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-8">
                        <div className="flex -space-x-6">
                          <div className="w-16 h-16 rounded-2xl border-2 border-background overflow-hidden relative z-10">
                            <img src={comp.before.image_url} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] font-black text-white uppercase">Before</div>
                          </div>
                          <div className="w-16 h-16 rounded-2xl border-2 border-background overflow-hidden relative z-20">
                            <img src={comp.after.image_url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-[8px] font-black text-white uppercase">After</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Aesthetic Delta</h4>
                          <p className="text-[10px] text-muted-foreground font-medium italic">
                            {new Date(comp.before.analyzed_at).toLocaleDateString()} → {new Date(comp.after.analyzed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Improvement</p>
                        <p className="text-2xl font-black text-emerald-400 text-glow">+{comp.overall_improvement}%</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="glass-premium p-10 rounded-[48px] border border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Neural Trajectory</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Holistic skin health mapping</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                    <Area type="monotone" dataKey="score" stroke="#FFD700" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { key: 'pores', label: 'Pore Optimization', color: '#4A90E2' },
                { key: 'wrinkles', label: 'Structural Resilience', color: '#50E3C2' },
                { key: 'texture', label: 'Surface Uniformity', color: '#FF6B6B' }
              ].map((m) => (
                <div key={m.key} className="glass-card p-8 rounded-[40px] border border-white/5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">{m.label}</h4>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={3} dot={{ fill: m.color, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="glass-premium p-10 rounded-[48px] border border-white/5 space-y-10">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Evolution Diagnostic</h3>
                <p className="text-sm text-muted-foreground italic font-light">Select two clinical nodes to analyze transformation delta.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Select Before */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Temporal Origin (Before)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {analyses.map((a) => (
                      <button
                        key={`before-${a.id}`}
                        onClick={() => setSelectedBefore(a)}
                        className={cn(
                          "aspect-square rounded-2xl border-2 overflow-hidden transition-all relative group",
                          selectedBefore?.id === a.id ? "border-primary shadow-glow-sm scale-105" : "border-white/5 opacity-40 hover:opacity-100"
                        )}
                      >
                        <img src={a.image_url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black text-white">{new Date(a.analyzed_at).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select After */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Current Node (After)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {analyses.map((a) => (
                      <button
                        key={`after-${a.id}`}
                        onClick={() => setSelectedAfter(a)}
                        className={cn(
                          "aspect-square rounded-2xl border-2 overflow-hidden transition-all relative group",
                          selectedAfter?.id === a.id ? "border-primary shadow-glow-sm scale-105" : "border-white/5 opacity-40 hover:opacity-100"
                        )}
                      >
                        <img src={a.image_url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black text-white">{new Date(a.analyzed_at).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  disabled={!selectedBefore || !selectedAfter || selectedBefore.id === selectedAfter.id}
                  onClick={handleCreateComparison}
                  className="group flex items-center gap-3 px-12 py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 disabled:opacity-20 transition-all"
                >
                  {selectedBefore && selectedAfter && selectedBefore.id === selectedAfter.id ? 'Select Distinct Nodes' : 'Synthesize Evolution'}
                  <CaretRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Preview if both selected (Optional visual feedback before saving) */}
            {selectedBefore && selectedAfter && selectedBefore.id !== selectedAfter.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="glass-card p-8 rounded-[40px] border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Node</h4>
                  <img src={selectedBefore.image_url} className="w-full aspect-square object-cover rounded-3xl border border-white/10" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-white">{new Date(selectedBefore.analyzed_at).toLocaleDateString()}</span>
                    <span className="text-xl font-black text-primary">{selectedBefore.overall_score}</span>
                  </div>
                </div>
                <div className="glass-card p-8 rounded-[40px] border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Node</h4>
                  <img src={selectedAfter.image_url} className="w-full aspect-square object-cover rounded-3xl border border-white/10" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-white">{new Date(selectedAfter.analyzed_at).toLocaleDateString()}</span>
                    <span className="text-xl font-black text-primary">{selectedAfter.overall_score}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SkinProfilePage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Interface node...</p>
      </div>
    }>
      <SkinProfileContent />
    </Suspense>
  );
}

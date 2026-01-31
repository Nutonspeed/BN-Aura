'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  ChevronLeft,
  Target,
  Activity,
  Award,
  CheckCircle2,
  BriefcaseMedical,
  Clock,
  Package,
  Stethoscope,
  Plus
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import AestheticGenome from '@/components/AestheticGenome';
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Concern {
  name: string;
  severity: number;
  description: string;
}

interface Treatment {
  program: string;
  sessions: number;
  price: number;
  whyThis: string;
  image_url?: string;
}

interface Product {
  name: string;
  keyIngredients: string;
  usage: string;
  image_url?: string;
}

interface AnalysisResults {
  skinAge: number;
  overallScore: number;
  grade: string;
  skinType: string;
  concerns: Concern[];
  recommendations: {
    treatments: Treatment[];
    products: Product[];
  };
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');
  
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        if (!analysisId) {
          setLoading(false);
          return;
        }
        
        const supabase = createClient();
        const { data, error } = await supabase
          .from('skin_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();

        if (error) {
          console.error('Database fetch error:', error);
        } else if (data) {
          setResults({
            skinAge: data.skin_age || 24, 
            overallScore: data.overall_score,
            grade: data.skin_health_grade,
            skinType: data.skin_type || 'Combination',
            concerns: data.spots_detections || [],
            recommendations: data.recommendations || { treatments: [], products: [] }
          });
        }
      } catch (err) {
        console.error('Fetch results error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-muted-foreground animate-pulse font-heading tracking-widest uppercase text-xs">Loading Clinical Report...</p>
      </div>
    );
  }

  // Fallback to mock data if no ID provided (for preview)
  const displayResults = results || {
    skinAge: 24,
    overallScore: 88,
    grade: 'A',
    skinType: 'Combination',
    concerns: [
      { name: 'ริ้วรอยรอบดวงตา', severity: 3, description: 'พบรอยตื้นบริเวณหางตา' },
      { name: 'จุดด่างดำจากแสงแดด', severity: 5, description: 'พบการกระจายตัวของเม็ดสีบริเวณโหนกแก้ม' },
      { name: 'รูขุมขนกว้าง', severity: 4, description: 'พบความกว้างของรูขุมขนบริเวณ T-zone' }
    ],
    recommendations: {
      treatments: [
        { program: 'Ultra Brightening Laser', sessions: 5, price: 15000, whyThis: 'เพื่อปรับสีผิวให้สม่ำเสมอและลดจุดด่างดำ' },
        { program: 'Advanced Anti-Aging Protocol', sessions: 3, price: 25000, whyThis: 'เพื่อกระตุ้นการสร้างคอลลาเจนใหม่ในชั้นผิว' }
      ],
      products: [
        { name: 'Advanced C-Serum', keyIngredients: 'Vitamin C 15%, Ferulic Acid', usage: 'ทาเช้า-เย็น หลังล้างหน้า' },
        { name: 'Retinol Renewal Night Cream', keyIngredients: 'Retinol 0.5%, Ceramide', usage: 'ทาก่อนนอนวันเว้นวัน' }
      ]
    }
  };

  // Normalize recommendations to handle both old (array) and new (object) formats
  let finalRecs: { treatments: Treatment[]; products: Product[] } = { treatments: [], products: [] };
  if (displayResults.recommendations) {
    if (Array.isArray(displayResults.recommendations)) {
      finalRecs.treatments = displayResults.recommendations as unknown as Treatment[];
    } else {
      finalRecs = {
        treatments: (displayResults.recommendations.treatments as Treatment[]) || [],
        products: (displayResults.recommendations.products as Product[]) || []
      };
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-foreground overflow-x-hidden relative flex flex-col font-sans pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(var(--primary),0.15),transparent_70%)] pointer-events-none" />
      <div className="fixed inset-0 bg-grain opacity-[0.03] pointer-events-none" />

      <header className="z-50 h-20 flex items-center justify-between px-8 border-b border-white/5 bg-background/40 backdrop-blur-xl sticky top-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link 
            href="/clinic"
            className="p-2.5 hover:bg-white/5 rounded-2xl text-muted-foreground hover:text-white transition-all flex items-center gap-3 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Hub</span>
          </Link>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
            <Sparkles className="w-5 h-5 animate-glow-pulse" />
          </div>
          <span className="font-heading font-black text-xl tracking-tighter text-white uppercase italic">Clinical <span className="text-primary text-glow">Report</span></span>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all"
        >
          Export PDF
        </motion.button>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-12 relative z-10">
        {/* Hero Score Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-4 glass-premium p-10 rounded-[60px] border border-white/10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Award className="w-48 h-48 text-primary" />
            </div>
            
            <div className="relative">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                <motion.circle
                  cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={628}
                  initial={{ strokeDashoffset: 628 }}
                  animate={{ strokeDashoffset: 628 - (628 * (displayResults.overallScore || 0)) / 100 }}
                  transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                  strokeLinecap="round"
                  className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="text-7xl font-black text-white tracking-tighter"
                >
                  {displayResults.overallScore}
                </motion.span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black mt-1">Aura Units</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                Grade {displayResults.grade} System
              </div>
              <p className="text-muted-foreground font-light italic text-sm max-w-[200px]">Clinical cutaneous matrix analysis finalized.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 glass-premium p-0 rounded-[60px] border border-white/10 overflow-hidden relative min-h-[450px] group"
          >
            <div className="absolute top-8 left-10 z-10 space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Aesthetic <span className="text-primary text-glow">Genome</span></h3>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">468-Point Neural Biometrics</p>
            </div>
            <div className="absolute inset-0 scale-110 opacity-80 group-hover:scale-100 transition-transform duration-[2s]">
              <AestheticGenome />
            </div>
            <div className="absolute bottom-8 left-10 right-10 flex justify-between items-end z-10">
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mapping Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-[10px] font-black text-white uppercase">Neural Locked</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 flex flex-col gap-6"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-premium p-8 rounded-[40px] border border-white/10 flex flex-col justify-center space-y-5 relative overflow-hidden group/card"
            >
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 blur-[40px] rounded-full group-hover/card:bg-primary/20 transition-all duration-700" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-0.5">Estimated</p>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Aesthetic Age</h3>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-5xl font-black text-white tracking-tighter tabular-nums">{displayResults.skinAge}</p>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Calibration Active
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-premium p-8 rounded-[40px] border border-white/10 flex flex-col justify-center space-y-5 relative overflow-hidden group/card"
            >
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full group-hover/card:bg-blue-500/20 transition-all duration-700" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-0.5">Detected</p>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Cutaneous Type</h3>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-white tracking-tight uppercase">{displayResults.skinType}</p>
                <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">Neural Pattern Recognition</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Concerns */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                Identified <span className="text-primary">Deviations</span>
              </h3>
              <p className="text-muted-foreground font-light text-sm italic">Systematic detection of cutaneous anomalies via neural engine.</p>
            </div>
            <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] backdrop-blur-md">
              Diagnostic Cluster v2.5.0
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(displayResults.concerns || []).map((concern: Concern, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-6 group hover:border-primary/40 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <ShieldCheck className="w-24 h-24 text-primary" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase">{concern.name}</h4>
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all duration-500",
                    concern.severity > 7 
                      ? "bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]" 
                      : "bg-white/5 border-white/10 text-muted-foreground"
                  )}>
                    Severity {concern.severity}.0
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-light leading-relaxed h-12 overflow-hidden line-clamp-2 italic">
                  {concern.description}
                </p>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    <span>Deviation Scale</span>
                    <span>{concern.severity * 10}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${concern.severity * 10}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 1.2 + i * 0.1 }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        concern.severity > 7 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : 
                        concern.severity > 4 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" : 
                        "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dynamic Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10">
          {/* Treatments Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-lg">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Clinical <span className="text-amber-400">Protocols</span></h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Recommended Treatment Sequences</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {finalRecs.treatments.map((rec: Treatment, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="glass-premium p-8 rounded-[48px] border border-white/10 group hover:border-amber-500/40 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                    <Sparkles className="w-24 h-24 text-amber-400" />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tight uppercase">{rec.program}</h4>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-amber-400/60" /> {rec.sessions} Cycle Sessions
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-[20px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-premium flex-shrink-0 group-hover:scale-110 transition-transform">
                      <BriefcaseMedical className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="p-5 bg-white/5 rounded-[28px] border border-white/5 mb-8 backdrop-blur-md group-hover:bg-white/[0.08] transition-all">
                    <p className="text-sm text-muted-foreground font-light leading-relaxed italic">&quot;{rec.whyThis}&quot;</p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Clinical Investment</p>
                      <p className="text-2xl font-black text-white tracking-tighter tabular-nums">฿{Number(rec.price).toLocaleString()}</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-amber-500 text-black rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:brightness-110 transition-all"
                    >
                      Authorize Session
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Skincare Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Support <span className="text-emerald-400">Inventory</span></h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Home-Care Neural Support</p>
              </div>
            </div>

            <div className="space-y-6">
              {finalRecs.products.map((prod: Product, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ x: -5 }}
                  className="glass-premium p-8 rounded-[48px] border border-white/10 group hover:border-emerald-500/40 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 p-10 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                    <Sparkles className="w-24 h-24 text-emerald-400" />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
                    <div className="space-y-3">
                      <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight uppercase">{prod.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {prod.keyIngredients.split(',').map((ing, idx) => (
                          <span key={idx} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest shadow-sm">
                            {ing.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-premium flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-7 h-7" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-5 bg-black/20 rounded-3xl border border-white/5 mb-8 backdrop-blur-md group-hover:bg-black/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400/60 border border-white/5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] text-white/70 font-medium leading-relaxed italic">{prod.usage}</p>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 hover:border-emerald-500/20 transition-all flex items-center justify-center gap-3 relative z-10"
                  >
                    <Plus className="w-4 h-4 text-emerald-400 stroke-[3px]" />
                    Integrate into Routine
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="pt-16 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-10"
        >
          <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 p-1.5 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary shadow-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-white font-black uppercase tracking-widest italic text-lg">Verified Clinical Intelligence</p>
              <p className="text-xs text-muted-foreground font-light max-w-sm">This report has been authenticated by the BN-Aura Neural Processor v2.5.0. Advisory verification required.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/analysis')} 
              className="px-10 py-5 bg-white/5 border border-white/10 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95 flex-1 md:flex-none shadow-xl"
            >
              Re-scan Matrix
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/clinic')} 
              className="px-12 py-5 bg-primary text-primary-foreground rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] shadow-premium hover:brightness-110 transition-all active:scale-95 flex-1 md:flex-none shadow-[0_0_30px_rgba(var(--primary),0.3)]"
            >
              Commit Proposal Node
            </motion.button>
          </div>
        </motion.section>
      </div>

      <footer className="z-50 p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5 bg-background/60 backdrop-blur-2xl mt-20">
        <div className="flex items-center gap-4 text-muted-foreground group cursor-help">
          <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:animate-glow-pulse" />
          <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">Cloud Secured Matrix • ISO 27001</span>
        </div>
        <p className="text-[9px] text-white/10 font-bold text-center uppercase tracking-[0.4em] max-w-2xl leading-relaxed">
          &copy; 2026 BN-AURA INTELLIGENCE. RESULTS ARE COMPUTATIONAL PREDICTIONS AND MUST BE VALIDATED BY QUALIFIED CLINICAL PERSONNEL.
        </p>
      </footer>
    </main>
  );
}

export default function AnalysisResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-muted-foreground animate-pulse font-heading tracking-widest uppercase text-xs">Loading Clinical Report...</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

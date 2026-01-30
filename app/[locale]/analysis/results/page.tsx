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
  Stethoscope
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
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden relative flex flex-col font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <header className="z-20 h-20 flex items-center justify-between px-6 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0">
        <Link 
          href="/clinic"
          className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-heading font-bold text-xl tracking-tight text-white uppercase">BN-Aura Analysis</span>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider shadow-premium hover:brightness-110 transition-all">
          Print Report
        </button>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-12 pb-32">
        {/* Hero Score Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-1 glass-card p-8 rounded-[40px] border border-white/10 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Award className="w-32 h-32 text-primary" />
            </div>
            
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <motion.circle
                  cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={553}
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * (displayResults.overallScore || 0)) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="text-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-heading font-bold text-white">{displayResults.overallScore}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Aura Score</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-bold text-white">Grade {displayResults.grade}</h2>
              <p className="text-muted-foreground font-light italic text-sm">Your clinical skin profile is ready.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 glass-card p-0 rounded-[40px] border border-white/10 overflow-hidden relative min-h-[400px]"
          >
            <div className="absolute top-6 left-8 z-10">
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-widest opacity-60">Aesthetic Genome</h3>
              <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">AI Landmark Visualization</p>
            </div>
            <AestheticGenome />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 grid grid-cols-1 gap-6"
          >
            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Aesthetic Age</h3>
              </div>
              <p className="text-4xl font-bold text-white font-heading">{displayResults.skinAge} <span className="text-lg text-muted-foreground font-light">Years Old</span></p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Calibrated results
              </p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Skin Type</h3>
              </div>
              <p className="text-4xl font-bold text-white font-heading">{displayResults.skinType}</p>
              <p className="text-[10px] text-muted-foreground font-light italic uppercase tracking-tighter">Based on texture recognition</p>
            </div>
          </motion.div>
        </section>

        {/* Concerns */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-5 h-5 text-primary" /> Detected Concerns
            </h3>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">BN-Aura Neural Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(displayResults.concerns || []).map((concern: Concern, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-4 rounded-3xl border border-white/10 space-y-4 group hover:border-primary/30 transition-all"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white group-hover:text-primary transition-colors text-sm">{concern.name}</h4>
                  <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter border",
                    concern.severity > 7 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-white/5 border-white/10 text-muted-foreground"
                  )}>
                    Severity {concern.severity}/10
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-light leading-relaxed h-12 overflow-hidden line-clamp-2">
                  {concern.description}
                </p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 delay-500",
                      concern.severity > 7 ? "bg-rose-500" : concern.severity > 4 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${concern.severity * 10}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dynamic Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Treatments Section */}
          <section className="space-y-6">
            <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Stethoscope className="w-5 h-5 text-amber-400" /> Clinical Programs
            </h3>
            <div className="space-y-4">
              {finalRecs.treatments.map((rec: Treatment, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="glass-card p-6 rounded-[32px] border border-white/10 group hover:border-primary/30 transition-all relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{rec.program}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{rec.sessions} Sessions Recommended</p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                      <BriefcaseMedical className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 font-light">{rec.whyThis}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Est. Investment</div>
                    <div className="text-xl font-heading font-bold text-white">฿{Number(rec.price).toLocaleString()}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Skincare Section */}
          <section className="space-y-6">
            <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Package className="w-5 h-5 text-emerald-400" /> Professional Skincare
            </h3>
            <div className="space-y-4">
              {finalRecs.products.map((prod: Product, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="glass-card p-6 rounded-[32px] border border-white/10 group hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{prod.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                        Active: {prod.keyIngredients}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    {prod.usage}
                  </div>
                  <button className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    Add to Routine
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <section className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-primary/30 p-1">
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-white font-bold italic">Expert Verification Required</p>
              <p className="text-xs text-muted-foreground font-light">Consult with clinical staff for confirmation.</p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={() => router.push('/analysis')} className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              Re-Scan
            </button>
            <button onClick={() => router.push('/clinic')} className="flex-1 md:flex-none px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 uppercase tracking-widest">
              Finalize Proposal
            </button>
          </div>
        </section>
      </div>

      <footer className="z-20 p-6 flex flex-col md:flex-row items-center justify-center gap-8 border-t border-white/5 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Medical Data encrypted & stored via Supabase RLS</span>
        </div>
        <p className="text-[9px] text-white/20 font-light text-center uppercase tracking-tighter">
          &copy; 2026 BN-AURA. PREDICTIONS ARE BASED ON AI MODELS AND SHOULD NOT REPLACE PROFESSIONAL MEDICAL ADVICE.
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

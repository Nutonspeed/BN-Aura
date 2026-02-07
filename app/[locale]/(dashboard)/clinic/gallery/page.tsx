'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon,
  Plus,
  SquaresFour,
  List,
  Funnel,
  Eye,
  ShareNetwork,
  Trash,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  User,
  CaretRight,
  Sparkle,
  SpinnerGap
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  photo_url: string;
  thumbnail_url?: string;
  type: 'before' | 'after' | 'progress';
  taken_at: string;
  notes?: string;
  customer?: { id: string; full_name: string };
  treatment?: { id: string; names: { th: string; en: string } };
  customer_consent: boolean;
  public_gallery_consent: boolean;
}

interface Comparison {
  id: string;
  title?: string;
  description?: string;
  treatment_name?: string;
  is_public: boolean;
  featured: boolean;
  view_count: number;
  before_photo: Photo;
  after_photo: Photo;
}

export default function GalleryPage() {
  const { goBack } = useBackNavigation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'comparisons'>('comparisons');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<'all' | 'before' | 'after' | 'progress'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('clinic_staff').select('clinic_id')
        .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
      if (!staffData?.clinic_id) return;

      const { data: photoData } = await supabase
        .from('gallery_photos')
        .select('*, customer:customers(id, full_name), treatment:treatments(id, names)')
        .eq('clinic_id', staffData.clinic_id)
        .order('taken_at', { ascending: false });
      setPhotos(photoData || []);

      const { data: compData } = await supabase
        .from('gallery_comparisons')
        .select('*, before_photo:gallery_photos!gallery_comparisons_before_photo_id_fkey(*,customer:customers(full_name)), after_photo:gallery_photos!gallery_comparisons_after_photo_id_fkey(*)')
        .eq('clinic_id', staffData.clinic_id)
        .order('created_at', { ascending: false });
      setComparisons(compData || []);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredPhotos = typeFilter === 'all' 
    ? photos 
    : photos.filter(p => p.type === typeFilter);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <ImageIcon weight="duotone" className="w-4 h-4" />
            Visual Evidence Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Clinical <span className="text-primary">Gallery</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Managing transformation benchmarks, evolution comparisons, and clinical visual records.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Media
          </Button>
          <Button className="gap-2 shadow-premium px-8">
            <Plus weight="bold" className="w-4 h-4" />
            Upload Evidence
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Media Units"
          value={photos.length}
          icon={ImageIcon}
          trend="neutral"
        />
        <StatCard
          title="Transformation Pairs"
          value={comparisons.length}
          icon={SquaresFour}
          trend="up"
          change={5}
          iconColor="text-primary"
        />
        <StatCard
          title="Public Portfolios"
          value={comparisons.filter(c => c.is_public).length}
          icon={CheckCircle}
          trend="neutral"
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Global Visual Reach"
          value={comparisons.reduce((sum, c) => sum + c.view_count, 0)}
          icon={Eye}
          trend="up"
          change={12}
          iconColor="text-purple-500"
        />
      </div>

      {/* Navigation Tabs & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex bg-secondary/50 border border-border p-1 rounded-2xl w-fit shadow-inner">
          {[
            { id: 'comparisons', label: 'Evolution Pairs', icon: SquaresFour },
            { id: 'photos', label: 'Identity Registry', icon: ImageIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                activeTab === tab.id
                  ? "bg-card text-primary border-border/50 shadow-sm"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <tab.icon weight={activeTab === tab.id ? "fill" : "duotone"} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {activeTab === 'photos' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 bg-secondary/50 border border-border p-1 rounded-2xl shadow-inner"
              >
                {(['all', 'before', 'after', 'progress'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      typeFilter === type
                        ? "bg-card text-primary border-border/50 shadow-sm"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {type === 'all' ? 'Universal' : type}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex bg-secondary/50 border border-border p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'grid' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SquaresFour weight="bold" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'list' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 flex flex-col items-center gap-4"
          >
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Decoding Media Matrix...</p>
          </motion.div>
        ) : activeTab === 'comparisons' ? (
          <motion.div 
            key="comparisons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {comparisons.length === 0 ? (
              <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40">
                <SquaresFour weight="duotone" className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-widest">Zero Evolution Benchmark Detected</p>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-4'
              )}>
                {comparisons.map((comparison, i) => (
                  <motion.div
                    key={comparison.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col">
                      <div className="relative aspect-[16/9] bg-secondary/50 overflow-hidden">
                        <div className="grid grid-cols-2 h-full gap-0.5">
                          <div className="relative group/before">
                            <img
                              src={comparison.before_photo?.thumbnail_url || comparison.before_photo?.photo_url || '/placeholder.jpg'}
                              alt="Before"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/before:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                            <Badge variant="secondary" size="sm" className="absolute top-3 left-3 font-black uppercase text-[8px] bg-black/60 text-white border-none">Node: Before</Badge>
                          </div>
                          <div className="relative group/after">
                            <img
                              src={comparison.after_photo?.thumbnail_url || comparison.after_photo?.photo_url || '/placeholder.jpg'}
                              alt="After"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/after:scale-110"
                            />
                            <div className="absolute inset-0 bg-primary/10" />
                            <Badge variant="default" size="sm" className="absolute top-3 left-3 font-black uppercase text-[8px] border-none">Node: After</Badge>
                          </div>
                        </div>

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                          <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0 border-white/20 text-white hover:bg-white/10">
                            <Eye weight="bold" className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0 border-white/20 text-white hover:bg-white/10">
                            <ShareNetwork weight="bold" className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0 border-white/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30">
                            <Trash weight="bold" className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <CardContent className="p-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                              {comparison.title || comparison.treatment_name || 'Protocol Node'}
                            </h3>
                            <Badge variant={comparison.is_public ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-2">
                              {comparison.is_public ? 'Public' : 'Encrypted'}
                            </Badge>
                          </div>
                          {comparison.description && (
                            <p className="text-xs text-muted-foreground font-medium line-clamp-2 italic leading-relaxed">
                              "{comparison.description}"
                            </p>
                          )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <Eye weight="bold" className="w-3.5 h-3.5 opacity-60" />
                            {comparison.view_count} Interactions
                          </div>
                          {comparison.featured && (
                            <Badge variant="warning" size="sm" className="font-black uppercase text-[8px] tracking-widest gap-1.5 px-3">
                              <Sparkle weight="fill" className="w-3 h-3" />
                              Showcase
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="photos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {filteredPhotos.length === 0 ? (
              <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40">
                <ImageIcon weight="duotone" className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-widest">Media Registry Nominal</p>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' 
                  : 'space-y-3'
              )}>
                {filteredPhotos.map((photo, i) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    {viewMode === 'grid' ? (
                      <div className="relative aspect-square rounded-[20px] overflow-hidden group cursor-pointer border border-border/50 hover:border-primary/40 transition-all shadow-sm">
                        <img
                          src={photo.thumbnail_url || photo.photo_url}
                          alt={photo.type}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                          <Eye weight="bold" className="w-6 h-6 text-white" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">Analyze Node</span>
                        </div>
                        <Badge 
                          variant={photo.type === 'before' ? 'secondary' : photo.type === 'after' ? 'default' : 'warning'} 
                          size="sm" 
                          className="absolute top-2 left-2 font-black uppercase text-[7px] tracking-widest px-2 opacity-90 border-none"
                        >
                          {photo.type}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5 p-4 bg-secondary/30 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-all group/list">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-border/50 flex-shrink-0 group-hover/list:border-primary/30 transition-all">
                          <img
                            src={photo.thumbnail_url || photo.photo_url}
                            alt={photo.type}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate tracking-tight">{photo.customer?.full_name || 'Identity Unknown'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest truncate">{photo.treatment?.names?.th || 'Registry Unlinked'}</p>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[9px] text-muted-foreground font-bold tabular-nums uppercase">{formatDate(photo.taken_at)}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={photo.type === 'before' ? 'secondary' : photo.type === 'after' ? 'default' : 'warning'} 
                          size="sm" 
                          className="font-black uppercase text-[8px] tracking-widest px-3 border-none"
                        >
                          {photo.type}
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

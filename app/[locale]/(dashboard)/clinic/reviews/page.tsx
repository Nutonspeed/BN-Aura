'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star,
  ChatCircle,
  ThumbsUp,
  Funnel,
  ArrowLeft,
  ArrowsClockwise,
  ChatCircleText,
  CheckCircle,
  X,
  User,
  Smiley,
  SmileySad,
  ChartLineUp,
  SpinnerGap
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  customer?: { full_name: string };
  rating: number;
  review_text: string;
  response_text?: string;
  platform: string;
  created_at: string;
}

export default function ReviewsPage() {
  const { goBack } = useBackNavigation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [responding, setResponding] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('rating', filter);
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats({ totalReviews: data.totalReviews, avgRating: data.avgRating, ratingCounts: data.ratingCounts });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const submitResponse = async (reviewId: string) => {
    if (!response.trim()) return;
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, responseText: response })
    });
    setResponding(null);
    setResponse('');
    fetchData();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

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
            <ChatCircleText weight="duotone" className="w-4 h-4" />
            Brand Reputation Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Reviews & <span className="text-primary">Reputation</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Monitoring client sentiment and clinical service validation.
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
            Sync Sentiment
          </Button>
        </div>
      </div>

      {/* Sentiment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatCard
          title="Consolidated Rating"
          value={stats.avgRating}
          decimals={1}
          suffix="/5.0"
          icon={Star}
          trend={stats.avgRating >= 4.5 ? "up" : "neutral"}
          iconColor="text-yellow-500"
        />
        
        <Card className="lg:col-span-3 border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
            <ChartLineUp className="w-48 h-48 text-primary" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 w-12 shrink-0">
                    <span className="text-xs font-black text-foreground w-3">{rating}</span>
                    <Star weight="fill" className="w-3.5 h-3.5 text-yellow-500" />
                  </div>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden border border-border/50 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.totalReviews ? (stats.ratingCounts[rating as keyof typeof stats.ratingCounts] / stats.totalReviews) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: (5-rating) * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        rating >= 4 ? "bg-emerald-500" : rating === 3 ? "bg-amber-500" : "bg-rose-500"
                      )}
                    />
                  </div>
                  <span className="w-10 text-[10px] font-black text-muted-foreground text-right tabular-nums">
                    {stats.ratingCounts[rating as keyof typeof stats.ratingCounts]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-secondary/30 p-2 rounded-[24px] border border-border/50 w-fit">
        <button 
          onClick={() => setFilter('')} 
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
            !filter 
              ? "bg-card text-primary border-border/50 shadow-sm" 
              : "text-muted-foreground border-transparent hover:text-foreground"
          )}
        >
          All Feedback
        </button>
        <div className="flex gap-1">
          {[5, 4, 3, 2, 1].map(r => (
            <button 
              key={r} 
              onClick={() => setFilter(r.toString())} 
              className={cn(
                "px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border flex items-center gap-1.5",
                filter === r.toString()
                  ? "bg-card text-primary border-border/50 shadow-sm"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-card/50"
              )}
            >
              {r} <Star weight="fill" className="w-3 h-3 text-yellow-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Decoding Sentiment Matrix...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40">
            <ChatCircleText weight="duotone" className="w-16 h-16" />
            <p className="text-xs font-black uppercase tracking-widest">No Client Nodes Detected</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                    {review.rating >= 4 ? <Smiley className="w-12 h-12 text-emerald-500" /> : <SmileySad className="w-12 h-12 text-rose-500" />}
                  </div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500">
                          <User weight="duotone" className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground tracking-tight">{review.customer?.full_name || 'Incognito Node'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {renderStars(review.rating)}
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <Badge variant="ghost" size="sm" className="text-[8px] font-black uppercase tracking-widest">{review.platform}</Badge>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground italic">{formatDate(review.created_at)}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {review.review_text && (
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium bg-secondary/30 p-4 rounded-2xl border border-border/50">
                        "{review.review_text}"
                      </p>
                    )}
                    
                    {review.response_text ? (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 relative">
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary/20 rounded-full" />
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" size="sm" className="text-[8px] font-black uppercase">Official Response</Badge>
                        </div>
                        <p className="text-sm text-foreground/70 font-medium italic pl-2">
                          {review.response_text}
                        </p>
                      </div>
                    ) : responding === review.id ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 pt-4 border-t border-border/50"
                      >
                        <textarea
                          value={response}
                          onChange={e => setResponse(e.target.value)}
                          className="w-full bg-secondary/50 border border-border rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all min-h-[100px]"
                          placeholder="Input clinical response node..."
                        />
                        <div className="flex gap-3">
                          <Button 
                            size="sm"
                            onClick={() => submitResponse(review.id)} 
                            className="bg-primary text-white shadow-premium flex-1"
                          >
                            Transmit Response
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setResponding(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setResponding(review.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 gap-2"
                      >
                        <ChatCircle weight="bold" className="w-3.5 h-3.5" />
                        Initiate Response
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

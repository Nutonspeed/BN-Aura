'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Sparkle, TrendUp, TrendDown, Clock, User, Eye } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface RecentAnalysis {
  id: string;
  customer_name: string;
  overall_score: number;
  skin_health_grade: string;
  analyzed_at: string;
  recommendations?: string[];
}

export function RecentAnalysesWidget({ clinicId }: { clinicId: string }) {
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!clinicId) return;
    
    const fetchRecentAnalyses = async () => {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('skin_analyses')
          .select(`
            id,
            overall_score,
            skin_health_grade,
            analyzed_at,
            recommendations,
            customers!inner(
              full_name
            )
          `)
          .eq('clinic_id', clinicId)
          .order('analyzed_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        const formattedData = (data || []).map(item => ({
          id: item.id,
          customer_name: (item.customers as any)?.full_name,
          overall_score: item.overall_score,
          skin_health_grade: item.skin_health_grade,
          analyzed_at: item.analyzed_at,
          recommendations: item.recommendations
        }));
        
        setAnalyses(formattedData);
      } catch (error) {
        console.error('Error fetching recent analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnalyses();
  }, [clinicId]);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      'B': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'C': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      'D': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'F': 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return colors[grade] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getScoreTrend = (score: number) => {
    if (score >= 80) return { icon: TrendUp, color: 'text-emerald-500', label: 'ดีเยี่ยม' };
    if (score >= 60) return { icon: TrendUp, color: 'text-blue-500', label: 'ดี' };
    if (score >= 40) return { icon: TrendDown, color: 'text-amber-500', label: 'ปานกลาง' };
    return { icon: TrendDown, color: 'text-red-500', label: 'ต้องปรับปรุง' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted"></div>
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-3 w-16 bg-muted rounded"></div>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="h-4 w-8 bg-muted rounded"></div>
                <div className="h-3 w-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="py-12 text-center opacity-40">
        <Sparkle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">ยังไม่มีการวิเคราะห์</p>
        <p className="text-xs text-muted-foreground mb-4">เริ่มวิเคราะห์ผิวลูกค้าเพื่อดูผลลัพธ์ที่นี่</p>
        <Button 
          size="sm" 
          className="rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs tracking-widest"
          onClick={() => router.push('/sales/skin-analysis')}
        >
          <Sparkle className="w-4 h-4 mr-2" />
          First Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis, index) => {
        const trend = getScoreTrend(analysis.overall_score);
        const TrendIcon = trend.icon;
        
        return (
          <motion.div
            key={analysis.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
            onClick={() => router.push(`/sales/skin-analysis?analysis=${analysis.id}`)}
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 border border-border/50 group-hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {analysis.customer_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[8px] font-black tracking-widest px-2 py-0.5 ${getGradeColor(analysis.skin_health_grade)}`}>
                      เกรด {analysis.skin_health_grade}
                    </Badge>
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(analysis.analyzed_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-foreground">{analysis.overall_score}</span>
                  <TrendIcon className={`w-4 h-4 ${trend.color}`} />
                </div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${trend.color}`}>
                  {trend.label}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {analyses.length > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-xl font-black text-xs tracking-widest border-primary/20 text-primary hover:bg-primary/10"
          onClick={() => router.push('/sales/skin-analysis')}
        >
          <Eye className="w-4 h-4 mr-2" />
          View All Analyses
        </Button>
      )}
    </div>
  );
}

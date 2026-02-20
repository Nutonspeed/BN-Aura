'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkle,
  TrendUp,
  Target,
  Lightning,
  ChartBar,
  ArrowRight
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

interface CoachInsight {
  totalSessions: number;
  sessionsWithCoach: number;
  avgDealProbability: number;
  conversionWithCoach: number;
  conversionWithoutCoach: number;
  topObjections: string[];
  topProducts: string[];
}

export default function AICoachInsights() {
  const [insights, setInsights] = useState<CoachInsight>({
    totalSessions: 0,
    sessionsWithCoach: 0,
    avgDealProbability: 0,
    conversionWithCoach: 0,
    conversionWithoutCoach: 0,
    topObjections: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch conversation stats for this sales staff
      const { data: conversations } = await supabase
        .from('customer_conversations')
        .select('id, conversation_type, deal_probability, objections_handled, products_discussed, status')
        .eq('sales_staff_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!conversations || conversations.length === 0) {
        setLoading(false);
        return;
      }

      const coachSessions = conversations.filter(c => c.conversation_type === 'ai_coach');
      const completedSessions = conversations.filter(c => c.status === 'completed');
      const completedWithCoach = completedSessions.filter(c => c.conversation_type === 'ai_coach');
      const completedWithout = completedSessions.filter(c => c.conversation_type !== 'ai_coach');

      // Aggregate objections
      const objectionCounts: Record<string, number> = {};
      conversations.forEach(c => {
        (c.objections_handled || []).forEach((o: string) => {
          objectionCounts[o] = (objectionCounts[o] || 0) + 1;
        });
      });
      const topObjections = Object.entries(objectionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([obj]) => obj);

      // Aggregate products
      const productCounts: Record<string, number> = {};
      conversations.forEach(c => {
        (c.products_discussed || []).forEach((p: string) => {
          productCounts[p] = (productCounts[p] || 0) + 1;
        });
      });
      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([prod]) => prod);

      // Calculate average deal probability
      const probabilities = conversations
        .filter(c => c.deal_probability != null)
        .map(c => c.deal_probability as number);
      const avgProb = probabilities.length > 0
        ? Math.round(probabilities.reduce((a, b) => a + b, 0) / probabilities.length)
        : 0;

      setInsights({
        totalSessions: conversations.length,
        sessionsWithCoach: coachSessions.length,
        avgDealProbability: avgProb,
        conversionWithCoach: completedWithCoach.length,
        conversionWithoutCoach: completedWithout.length,
        topObjections,
        topProducts,
      });
    } catch (e) {
      console.error('Failed to fetch AI Coach insights:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const coachUsageRate = insights.totalSessions > 0
    ? Math.round((insights.sessionsWithCoach / insights.totalSessions) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Sparkle className="w-4 h-4 text-purple-400" />}
          label="เซสชัน AI Coach"
          value={insights.sessionsWithCoach.toString()}
          sub={`${coachUsageRate}% ของรายการสนทนา`}
          color="purple"
        />
        <StatCard
          icon={<Target className="w-4 h-4 text-emerald-400" />}
          label="โอกาสปิดการขายเฉลี่ย"
          value={`${insights.avgDealProbability}%`}
          sub="จากทุกเซสชัน"
          color="emerald"
        />
        <StatCard
          icon={<TrendUp className="w-4 h-4 text-blue-400" />}
          label="ปิดการขาย (ใช้ AI)"
          value={insights.conversionWithCoach.toString()}
          sub="ดีลที่ปิดสำเร็จ"
          color="blue"
        />
        <StatCard
          icon={<ChartBar className="w-4 h-4 text-amber-400" />}
          label="ไม่ใช้ AI Coach"
          value={insights.conversionWithoutCoach.toString()}
          sub="ดีลที่ปิดสำเร็จ"
          color="amber"
        />
      </div>

      {/* Conversion Comparison */}
      {(insights.conversionWithCoach > 0 || insights.conversionWithoutCoach > 0) && (
        <div className="p-4 bg-gradient-to-r from-purple-500/5 to-emerald-500/5 border border-purple-500/20 rounded-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Lightning className="w-3.5 h-3.5 text-purple-400" />
            ผลลัพธ์จากการใช้ AI Coach
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-purple-400 font-bold">ใช้ AI Coach</span>
                <span className="text-foreground font-bold">{insights.conversionWithCoach}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (insights.conversionWithCoach / Math.max(1, insights.totalSessions)) * 100)}%` }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400 font-bold">ไม่ใช้</span>
                <span className="text-foreground font-bold">{insights.conversionWithoutCoach}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (insights.conversionWithoutCoach / Math.max(1, insights.totalSessions)) * 100)}%` }}
                  className="h-full bg-gray-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ข้อต่อต้านยอดนิยม & Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.topObjections.length > 0 && (
          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              การจัดการข้อโต้แย้งหลัก
            </h4>
            <div className="space-y-1">
              {insights.topObjections.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 font-bold">{i + 1}.</span>
                  <span className="text-foreground/80 truncate">{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {insights.topProducts.length > 0 && (
          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              ผลิตภัณฑ์ที่ถูกพูดถึงมากที่สุด
            </h4>
            <div className="space-y-1">
              {insights.topProducts.map((prod, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-purple-400 font-bold">{i + 1}.</span>
                  <span className="text-foreground/80 truncate">{prod}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {insights.totalSessions === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Sparkle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">ยังไม่มีข้อมูลเซสชัน AI Coach</p>
          <p className="text-xs mt-1">ใช้ AI Coach ระหว่างการปรึกษาเพื่อเริ่มเก็บข้อมูลเชิงลึก</p>
        </div>
      )}
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  purple: 'bg-purple-500/5 border-purple-500/20',
  emerald: 'bg-emerald-500/5 border-emerald-500/20',
  blue: 'bg-blue-500/5 border-blue-500/20',
  amber: 'bg-amber-500/5 border-amber-500/20',
  rose: 'bg-rose-500/5 border-rose-500/20',
  gray: 'bg-gray-500/5 border-gray-500/20',
};

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorClasses = COLOR_MAP[color] || COLOR_MAP.gray;
  return (
    <div className={`p-3 border rounded-xl ${colorClasses}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-black text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

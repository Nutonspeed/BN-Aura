'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Medal, 
  TrendUp, 
  Star, 
  CaretRight,
  Target
} from '@phosphor-icons/react';

interface StaffMetric {
  id: string;
  name: string;
  role: string;
  totalSales: number;
  totalCommission: number;
  dealCount: number;
}

export default function StaffIntelligence({ clinicId }: { clinicId: string }) {
  const [staffData, setStaffData] = useState<StaffMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaffPerformance() {
      try {
        const res = await fetch(`/api/analytics/bi?clinicId=${clinicId}&type=staff`);
        const result = await res.json();
        if (result.success) {
          // Sort by sales amount descending
          const sorted = (result.data.staff || []).sort((a: StaffMetric, b: StaffMetric) => b.totalSales - a.totalSales);
          setStaffData(sorted);
        }
      } catch (error) {
        console.error('Error fetching staff performance:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStaffPerformance();
  }, [clinicId]);

  return (
    <div className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group h-full">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Staff Intelligence</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Performance Leaderboard</p>
          </div>
        </div>
        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:gap-2 transition-all flex items-center gap-1">
          Full Report <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : staffData.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm italic font-light">
            No performance data recorded for this period.
          </div>
        ) : (
          staffData.map((staff, idx) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group/item flex items-center gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 font-black">
                  {idx + 1}
                </div>
                {idx === 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border-2 border-[#121212] shadow-lg">
                    <Star className="w-3 h-3 text-[#121212] fill-[#121212]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{staff.name}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{staff.role.replace('_', ' ')}</p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-xs font-black text-emerald-400">฿{staff.totalSales.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                  <Target className="w-3 h-3" />
                  {staff.dealCount} Deals
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] border border-primary/10 space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Growth Opportunity</span>
        </div>
        <p className="text-xs text-muted-foreground font-light leading-relaxed">
          Top performers are converting <span className="text-primary font-bold">24% higher</span> using the AI Scan protocol. Consider scheduling a knowledge-sharing session.
        </p>
      </div>
    </div>
  );
}

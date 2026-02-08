'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Sparkle,
  TrendUp,
  Target,
  Medal
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

interface StaffCoachStats {
  userId: string;
  name: string;
  totalSessions: number;
  completedDeals: number;
  avgProbability: number;
  objectionsHandled: number;
}

export default function AICoachLeaderboard() {
  const [staff, setStaff] = useState<StaffCoachStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!staffData?.clinic_id) return;

      // Get all conversations with AI coach for this clinic
      const { data: conversations } = await supabase
        .from('customer_conversations')
        .select('sales_staff_id, conversation_type, deal_probability, objections_handled, status')
        .eq('clinic_id', staffData.clinic_id)
        .eq('conversation_type', 'ai_coach');

      if (!conversations || conversations.length === 0) {
        setLoading(false);
        return;
      }

      // Aggregate per staff
      const staffMap: Record<string, {
        sessions: number;
        completed: number;
        probSum: number;
        probCount: number;
        objections: number;
      }> = {};

      conversations.forEach(c => {
        const sid = c.sales_staff_id;
        if (!staffMap[sid]) {
          staffMap[sid] = { sessions: 0, completed: 0, probSum: 0, probCount: 0, objections: 0 };
        }
        staffMap[sid].sessions++;
        if (c.status === 'completed') staffMap[sid].completed++;
        if (c.deal_probability != null) {
          staffMap[sid].probSum += c.deal_probability;
          staffMap[sid].probCount++;
        }
        staffMap[sid].objections += (c.objections_handled || []).length;
      });

      // Fetch staff names
      const staffIds = Object.keys(staffMap);
      const { data: staffProfiles } = await supabase
        .from('clinic_staff')
        .select('user_id, display_name')
        .in('user_id', staffIds);

      const nameMap: Record<string, string> = {};
      (staffProfiles || []).forEach(s => {
        nameMap[s.user_id] = s.display_name || 'Staff';
      });

      const leaderboard: StaffCoachStats[] = staffIds
        .map(sid => ({
          userId: sid,
          name: nameMap[sid] || 'Staff ' + sid.slice(0, 6),
          totalSessions: staffMap[sid].sessions,
          completedDeals: staffMap[sid].completed,
          avgProbability: staffMap[sid].probCount > 0
            ? Math.round(staffMap[sid].probSum / staffMap[sid].probCount)
            : 0,
          objectionsHandled: staffMap[sid].objections,
        }))
        .sort((a, b) => b.completedDeals - a.completedDeals || b.totalSessions - a.totalSessions);

      setStaff(leaderboard);
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">ยังไม่มีข้อมูลการใช้งาน AI Coach</p>
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-3">
      {staff.map((s, i) => (
        <motion.div
          key={s.userId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`flex items-center gap-4 p-4 rounded-xl border transition ${
            i === 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/20 border-border/50'
          }`}
        >
          <div className="text-2xl w-8 text-center flex-shrink-0">
            {i < 3 ? medals[i] : <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{s.name}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkle className="w-3 h-3 text-purple-400" />
                {s.totalSessions} sessions
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" />
                {s.completedDeals} closed
              </span>
              <span className="flex items-center gap-1">
                <TrendUp className="w-3 h-3 text-blue-400" />
                {s.avgProbability}% avg
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black text-foreground tabular-nums">{s.objectionsHandled}</p>
            <p className="text-[9px] text-muted-foreground">objections</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

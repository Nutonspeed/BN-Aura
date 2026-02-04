'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  Crown, 
  Star, 
  Gift, 
  TrendUp, 
  CalendarDots, 
  Users, 
  Medal,
  Sparkle,
  CaretRight,
  Trophy,
  Lightning,
  Copy,
  Check
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { LoyaltyProfile, LoyaltyTier, Achievement, PointTransaction } from '@/lib/customer/loyaltySystem';

interface LoyaltyDashboardProps {
  customerId: string;
  clinicId: string;
}

export default function LoyaltyDashboard({ customerId, clinicId }: LoyaltyDashboardProps) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId, clinicId]);

  const fetchLoyaltyData = async () => {
    try {
      const supabase = createClient();

      const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BN';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // Load or create loyalty profile
      const { data: profileRow, error: profileError } = await supabase
        .from('loyalty_profiles')
        .select('*')
        .eq('customer_id', customerId)
        .eq('clinic_id', clinicId)
        .single();

      let ensuredProfileRow = profileRow;

      if (!ensuredProfileRow && profileError?.code === 'PGRST116') {
        const { data: createdProfile, error: createError } = await supabase
          .from('loyalty_profiles')
          .insert({
            customer_id: customerId,
            clinic_id: clinicId,
            referral_code: generateReferralCode()
          })
          .select('*')
          .single();

        if (createError) throw createError;
        ensuredProfileRow = createdProfile;
      } else if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!ensuredProfileRow) {
        setProfile(null);
        setAchievements([]);
        setTransactions([]);
        return;
      }

      const mappedProfile: LoyaltyProfile = {
        customerId: ensuredProfileRow.customer_id,
        clinicId: ensuredProfileRow.clinic_id,
        totalPoints: ensuredProfileRow.total_points ?? 0,
        availablePoints: ensuredProfileRow.available_points ?? 0,
        currentTier: (ensuredProfileRow.current_tier ?? 'bronze') as LoyaltyTier,
        tierProgress: Number(ensuredProfileRow.tier_progress ?? 0),
        totalSpent: Number(ensuredProfileRow.total_spent ?? 0),
        totalVisits: ensuredProfileRow.total_visits ?? 0,
        averageSpend: Number(ensuredProfileRow.average_spend ?? 0),
        lastVisit: ensuredProfileRow.last_visit ? new Date(ensuredProfileRow.last_visit) : new Date(),
        unlockedAchievements: ensuredProfileRow.unlocked_achievements ?? [],
        totalAchievements: ensuredProfileRow.total_achievements ?? 0,
        successfulReferrals: ensuredProfileRow.successful_referrals ?? 0,
        referralCode: ensuredProfileRow.referral_code,
        joinedAt: ensuredProfileRow.joined_at ? new Date(ensuredProfileRow.joined_at) : new Date(),
        lastUpdated: ensuredProfileRow.updated_at ? new Date(ensuredProfileRow.updated_at) : new Date()
      };

      // Load achievements
      const { data: achievementRows, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      const unlockedSet = new Set(mappedProfile.unlockedAchievements);
      const mappedAchievements: Achievement[] = (achievementRows || [])
        .filter((a: any) => !a.is_secret || unlockedSet.has(a.id))
        .map((a: any) => ({
          id: a.id,
          clinicId: a.clinic_id,
          name: a.name,
          description: a.description,
          category: a.category,
          conditions: a.conditions,
          pointsReward: a.points_reward,
          badgeIcon: a.badge_icon,
          specialReward: a.special_reward,
          isActive: a.is_active,
          isSecret: a.is_secret,
          createdAt: new Date(a.created_at)
        }));

      // Load recent point transactions
      const { data: transactionRows, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      const mappedTransactions: PointTransaction[] = (transactionRows || []).map((t: any) => ({
        id: t.id,
        customerId: t.customer_id,
        clinicId: t.clinic_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        workflowId: t.workflow_id,
        achievementId: t.achievement_id,
        rewardId: t.reward_id,
        createdAt: new Date(t.created_at),
        expiresAt: t.expires_at ? new Date(t.expires_at) : undefined
      }));

      setProfile(mappedProfile);
      setAchievements(mappedAchievements);
      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสมาชิกได้');
    } finally {
      setLoading(false);
    }
  };

  const getTierConfig = (tier: LoyaltyTier) => {
    const configs = {
      bronze: { color: '#CD7F32', icon: '🥉', name: 'Bronze', nextTier: 'Silver' },
      silver: { color: '#C0C0C0', icon: '🥈', name: 'Silver', nextTier: 'Gold' },
      gold: { color: '#FFD700', icon: '🥇', name: 'Gold', nextTier: 'Platinum' },
      platinum: { color: '#E5E4E2', icon: '💎', name: 'Platinum', nextTier: 'Diamond' },
      diamond: { color: '#B9F2FF', icon: '💠', name: 'Diamond', nextTier: null }
    };
    return configs[tier];
  };

  const getTierPoints = (tier: LoyaltyTier) => {
    const thresholds = {
      bronze: 0,
      silver: 10000,
      gold: 30000,
      platinum: 60000,
      diamond: 100000
    };
    return thresholds[tier];
  };

  const copyReferralCode = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      toast.success('คัดลอกรหัสแนะนำแล้ว!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูลสมาชิก...</p>
        </div>
      </div>
    );
  }

  const tierConfig = getTierConfig(profile.currentTier);
  const currentTierPoints = getTierPoints(profile.currentTier);
  const nextTierPoints = tierConfig.nextTier ? getTierPoints(tierConfig.nextTier as LoyaltyTier) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 text-primary text-sm font-bold uppercase tracking-wider"
        >
          <Crown className="w-5 h-5" />
          BN-Aura Loyalty Program
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-heading font-bold text-white"
        >
          สมาชิก <span className="text-primary">{tierConfig.name}</span> {tierConfig.icon}
        </motion.h1>
      </div>

      {/* Main Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Available Points */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {profile.availablePoints.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            แต้มที่ใช้ได้
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-2">
            ฿{profile.totalSpent.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            ยอดใช้จ่ายรวม
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            เฉลี่ย ฿{profile.averageSpend.toLocaleString()}/ครั้ง
          </div>
        </div>

        {/* Total Visits */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-2">
            {profile.totalVisits}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            ครั้งที่มาใช้บริการ
          </div>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <CalendarDots className="w-3 h-3" />
            ล่าสุด {profile.lastVisit.toLocaleDateString('th-TH')}
          </div>
        </div>

        {/* Referrals */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-2">
            {profile.successfulReferrals}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            เพื่อนที่แนะนำ
          </div>
          <div className="mt-3 text-xs text-primary font-medium">
            โค้ด: {profile.referralCode}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tier Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                ระดับสมาชิก
              </h3>
              {nextTierPoints && (
                <div className="text-sm text-muted-foreground">
                  อีก ฿{(nextTierPoints - profile.totalSpent).toLocaleString()} → {tierConfig.nextTier}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {nextTierPoints && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{tierConfig.name}</span>
                  <span>{profile.tierProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.tierProgress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>฿{currentTierPoints.toLocaleString()}</span>
                  <span>฿{nextTierPoints.toLocaleString()}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightning className="w-5 h-5 text-primary" />
              กิจกรรมล่าสุด
            </h3>
            
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  ยังไม่มีประวัติการใช้แต้ม
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        tx.type === 'earned' ? 'bg-green-500/20 text-green-500' :
                        tx.type === 'redeemed' ? 'bg-red-500/20 text-red-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {tx.type === 'earned' ? '+' : tx.type === 'redeemed' ? '-' : '🎁'}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{tx.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.createdAt.toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold ${
                      tx.type === 'earned' ? 'text-green-500' :
                      tx.type === 'redeemed' ? 'text-red-500' :
                      'text-blue-500'
                    }`}>
                      {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Achievements
              <span className="ml-auto text-sm bg-primary/20 text-primary px-2 py-1 rounded-full">
                {profile.totalAchievements}
              </span>
            </h3>

            <div className="space-y-3">
              {achievements.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  ยังไม่มี achievements
                </div>
              ) : (
                achievements.slice(0, 3).map((achievement, index) => {
                  const unlocked = profile.unlockedAchievements.includes(achievement.id);
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`p-3 rounded-lg flex items-center gap-3 ${
                        unlocked 
                          ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20' 
                          : 'bg-muted/20 border border-border opacity-60'
                      }`}
                    >
                      <div className="text-2xl">{achievement.badgeIcon || '🏆'}</div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                        <div className="text-xs text-primary font-medium">+{achievement.pointsReward} แต้ม</div>
                      </div>
                      {unlocked && (
                        <div className="text-green-500">
                          <Medal className="w-4 h-4" />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Referral Code */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <h4 className="font-semibold text-foreground mb-2">แนะนำเพื่อน รับแต้มฟรี!</h4>
            <p className="text-sm text-muted-foreground mb-4">
              แนะนำเพื่อนมาใช้บริการ รับ 500 แต้ม ทันที!
            </p>
            <div className="bg-background/50 border border-primary/20 rounded-lg p-3 mb-4">
              <div className="text-xs text-muted-foreground mb-1">รหัสแนะนำของคุณ</div>
              <div className="text-lg font-bold text-primary font-mono">{profile.referralCode}</div>
            </div>
            <button 
              onClick={copyReferralCode}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  คัดลอกรหัส
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

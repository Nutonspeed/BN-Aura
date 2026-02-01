'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Star, 
  Gift, 
  TrendingUp, 
  Calendar, 
  Users, 
  Award,
  Sparkles,
  ChevronRight,
  Trophy,
  Zap
} from 'lucide-react';
import { LoyaltyProfile, LoyaltyTier, Achievement } from '@/lib/customer/loyaltySystem';

interface LoyaltyDashboardProps {
  customerId: string;
  clinicId: string;
}

export default function LoyaltyDashboard({ customerId, clinicId }: LoyaltyDashboardProps) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId, clinicId]);

  const fetchLoyaltyData = async () => {
    try {
      // TODO: Replace with actual API calls
      const mockProfile: LoyaltyProfile = {
        customerId,
        clinicId,
        totalPoints: 2850,
        availablePoints: 2100,
        currentTier: 'gold',
        tierProgress: 65,
        totalSpent: 28500,
        totalVisits: 12,
        averageSpend: 2375,
        lastVisit: new Date('2024-01-15'),
        unlockedAchievements: ['first-visit', 'big-spender', 'loyal-customer'],
        totalAchievements: 3,
        successfulReferrals: 2,
        referralCode: 'BNAU2850',
        joinedAt: new Date('2023-06-15'),
        lastUpdated: new Date()
      };

      const mockAchievements: Achievement[] = [
        {
          id: 'first-visit',
          clinicId,
          name: 'First Steps',
          description: 'ครั้งแรกที่มาใช้บริการ',
          category: 'milestone',
          conditions: { visitCount: 1 },
          pointsReward: 100,
          badgeIcon: '🎉',
          isActive: true,
          isSecret: false,
          createdAt: new Date()
        }
      ];

      setProfile(mockProfile);
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
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
      silver: 1000,
      gold: 3000,
      platinum: 7000,
      diamond: 15000
    };
    return thresholds[tier];
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
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-green-500">
            <TrendingUp className="w-3 h-3" />
            +150 แต้มเดือนนี้
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
            <Calendar className="w-3 h-3" />
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
                  อีก {(nextTierPoints - profile.totalPoints).toLocaleString()} แต้ม → {tierConfig.nextTier}
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
                  <span>{currentTierPoints.toLocaleString()} แต้ม</span>
                  <span>{nextTierPoints.toLocaleString()} แต้ม</span>
                </div>
              </div>
            )}

            {/* Tier Benefits */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <div className="text-sm font-medium text-foreground mb-2">สิทธิพิเศษปัจจุบัน</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• ส่วนลด 10% ทุก Treatment</li>
                  <li>• รับแต้ม 2 เท่าทุกวันอังคาร</li>
                  <li>• ฟรี Consultation</li>
                </ul>
              </div>
              {nextTierPoints && (
                <div className="p-4 bg-muted/20 rounded-xl">
                  <div className="text-sm font-medium text-foreground mb-2">สิทธิ์ {tierConfig.nextTier}</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• ส่วนลด 15% ทุก Treatment</li>
                    <li>• รับแต้ม 3 เท่าทุกวันอังคาร</li>
                    <li>• ฟรี Premium Mask</li>
                  </ul>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              กิจกรรมล่าสุด
            </h3>
            
            <div className="space-y-4">
              {[
                { action: 'รับแต้ม', amount: '+150 แต้ม', description: 'HydraFacial Treatment', date: '15 ม.ค. 2567', type: 'earned' },
                { action: 'ใช้แต้ม', amount: '-500 แต้ม', description: 'แลกส่วนลด 10%', date: '10 ม.ค. 2567', type: 'redeemed' },
                { action: 'โบนัส', amount: '+100 แต้ม', description: 'แนะนำเพื่อนใหม่', date: '5 ม.ค. 2567', type: 'bonus' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      activity.type === 'earned' ? 'bg-green-500/20 text-green-500' :
                      activity.type === 'redeemed' ? 'bg-red-500/20 text-red-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {activity.type === 'earned' ? '+' : activity.type === 'redeemed' ? '-' : '🎁'}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">{activity.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      activity.type === 'earned' ? 'text-green-500' :
                      activity.type === 'redeemed' ? 'text-red-500' :
                      'text-blue-500'
                    }`}>
                      {activity.amount}
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.date}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors">
              ดูประวัติทั้งหมด
            </button>
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
                {profile.totalAchievements}/15
              </span>
            </h3>

            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg flex items-center gap-3"
                >
                  <div className="text-2xl">{achievement.badgeIcon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                    <div className="text-xs text-primary font-medium">+{achievement.pointsReward} แต้ม</div>
                  </div>
                  <div className="text-green-500">
                    <Award className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}

              {/* Locked Achievement Preview */}
              <div className="p-3 bg-muted/20 border border-border rounded-lg flex items-center gap-3 opacity-60">
                <div className="text-2xl">🔒</div>
                <div className="flex-1">
                  <div className="font-medium text-muted-foreground">VIP Member</div>
                  <div className="text-xs text-muted-foreground">ใช้จ่าย ฿50,000</div>
                  <div className="text-xs text-muted-foreground">+500 แต้ม</div>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors">
              ดู Achievements ทั้งหมด
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>

            <div className="space-y-3">
              <button className="w-full p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">แลกรางวัล</span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="w-full p-3 bg-muted/20 hover:bg-muted/30 border border-border rounded-lg flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-foreground" />
                  <span className="font-medium text-foreground">แนะนำเพื่อน</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="w-full p-3 bg-muted/20 hover:bg-muted/30 border border-border rounded-lg flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-foreground" />
                  <span className="font-medium text-foreground">จองนัดหมาย</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
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
              แนะนำเพื่อนมาใช้บริการ รับ 200 แต้ม ทันที!
            </p>
            <div className="bg-background/50 border border-primary/20 rounded-lg p-3 mb-4">
              <div className="text-xs text-muted-foreground mb-1">รหัสแนะนำของคุณ</div>
              <div className="text-lg font-bold text-primary font-mono">{profile.referralCode}</div>
            </div>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all">
              แชร์รหัสแนะนำ
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

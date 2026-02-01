import { createClient } from '@/lib/supabase/client';

/**
 * Loyalty & Gamification System
 * ระบบสะสมแต้มและเกมมิฟิเคชั่นสำหรับลูกค้า
 */

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type RewardType = 
  | 'discount_percentage'  // ส่วนลดเปอร์เซ็นต์
  | 'discount_amount'      // ส่วนลดจำนวนเงิน
  | 'free_service'         // บริการฟรี
  | 'upgrade_service'      // อัพเกรดบริการ
  | 'birthday_special'     // โปรโมชั่นวันเกิด
  | 'referral_bonus';      // โบนัสแนะนำเพื่อน

export type AchievementCategory = 
  | 'spending'       // ใช้จ่าย
  | 'frequency'      // ความถี่การมา
  | 'referral'       // การแนะนำเพื่อน
  | 'engagement'     // การมีส่วนร่วม
  | 'milestone'      // เป้าหมายสำคัญ
  | 'special';       // พิเศษ

export interface LoyaltyProfile {
  customerId: string;
  clinicId: string;
  
  // Points & Tier
  totalPoints: number;
  availablePoints: number;
  currentTier: LoyaltyTier;
  tierProgress: number; // เปอร์เซ็นต์ไปยัง tier ถัดไป
  
  // Spending History
  totalSpent: number;
  totalVisits: number;
  averageSpend: number;
  lastVisit: Date;
  
  // Achievements
  unlockedAchievements: string[];
  totalAchievements: number;
  
  // Referrals
  successfulReferrals: number;
  referralCode: string;
  
  // Metadata
  joinedAt: Date;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  clinicId: string;
  name: string;
  description: string;
  category: AchievementCategory;
  
  // Unlock Conditions
  conditions: {
    totalSpent?: number;
    visitCount?: number;
    referralCount?: number;
    pointsEarned?: number;
    consecutiveVisits?: number;
    treatmentTypes?: string[];
  };
  
  // Rewards
  pointsReward: number;
  badgeIcon: string;
  specialReward?: {
    type: RewardType;
    value: number;
    description: string;
  };
  
  // Settings
  isActive: boolean;
  isSecret: boolean; // ซ่อนจนกว่าจะปลดล็อก
  
  createdAt: Date;
}

export interface PointTransaction {
  id: string;
  customerId: string;
  clinicId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'refund';
  amount: number;
  description: string;
  
  // Related Data
  workflowId?: string;
  achievementId?: string;
  rewardId?: string;
  
  // Metadata
  createdAt: Date;
  expiresAt?: Date;
}

export interface LoyaltyReward {
  id: string;
  clinicId: string;
  name: string;
  description: string;
  type: RewardType;
  
  // Cost & Value
  pointsCost: number;
  monetaryValue: number;
  
  // Availability
  isActive: boolean;
  maxRedemptions?: number;
  currentRedemptions: number;
  tierRequirement?: LoyaltyTier;
  
  // Validity
  validFrom: Date;
  validUntil?: Date;
  
  // Settings
  autoApply: boolean; // ใช้อัตโนมัติเมื่อเงื่อนไขครบ
  stackable: boolean; // ใช้ร่วมกับโปรอื่นได้
  
  createdAt: Date;
}

/**
 * Loyalty System Engine
 */
export class LoyaltySystemEngine {
  private supabase = createClient();

  // Tier thresholds (points required)
  private readonly TIER_THRESHOLDS = {
    bronze: 0,
    silver: 1000,
    gold: 3000,
    platinum: 7000,
    diamond: 15000
  };

  /**
   * ดึงข้อมูล Loyalty Profile
   */
  async getLoyaltyProfile(customerId: string, clinicId: string): Promise<LoyaltyProfile | null> {
    const { data } = await this.supabase
      .from('loyalty_profiles')
      .select('*')
      .eq('customer_id', customerId)
      .eq('clinic_id', clinicId)
      .single();

    return data ? this.mapDatabaseToLoyaltyProfile(data) : null;
  }

  /**
   * สร้าง Loyalty Profile ใหม่
   */
  async createLoyaltyProfile(customerId: string, clinicId: string): Promise<LoyaltyProfile> {
    const profile: LoyaltyProfile = {
      customerId,
      clinicId,
      totalPoints: 0,
      availablePoints: 0,
      currentTier: 'bronze',
      tierProgress: 0,
      totalSpent: 0,
      totalVisits: 0,
      averageSpend: 0,
      lastVisit: new Date(),
      unlockedAchievements: [],
      totalAchievements: 0,
      successfulReferrals: 0,
      referralCode: this.generateReferralCode(),
      joinedAt: new Date(),
      lastUpdated: new Date()
    };

    await this.saveLoyaltyProfile(profile);

    // ให้แต้มเริ่มต้น
    await this.awardPoints(customerId, clinicId, 100, 'สมัครสมาชิก', 'bonus');

    return profile;
  }

  /**
   * มอบแต้มให้ลูกค้า
   */
  async awardPoints(
    customerId: string,
    clinicId: string,
    points: number,
    description: string,
    type: 'earned' | 'bonus' = 'earned',
    workflowId?: string
  ): Promise<void> {
    // สร้าง Transaction
    const transaction: PointTransaction = {
      id: crypto.randomUUID(),
      customerId,
      clinicId,
      type,
      amount: points,
      description,
      workflowId,
      createdAt: new Date(),
      expiresAt: this.calculatePointExpiry()
    };

    await this.savePointTransaction(transaction);

    // อัพเดท Profile
    let profile = await this.getLoyaltyProfile(customerId, clinicId);
    if (!profile) {
      profile = await this.createLoyaltyProfile(customerId, clinicId);
    }

    profile.totalPoints += points;
    profile.availablePoints += points;
    profile.lastUpdated = new Date();

    // ตรวจสอบ Tier อัพเกรด
    const newTier = this.calculateTier(profile.totalPoints);
    const oldTier = profile.currentTier;
    profile.currentTier = newTier;
    profile.tierProgress = this.calculateTierProgress(profile.totalPoints);

    await this.saveLoyaltyProfile(profile);

    // ส่ง Notification ถ้า Tier อัพเกรด
    if (newTier !== oldTier) {
      await this.notifyTierUpgrade(profile, oldTier, newTier);
    }

    // ตรวจสอบ Achievements
    await this.checkAndUnlockAchievements(profile);
  }

  /**
   * ใช้แต้มแลกรางวัล
   */
  async redeemReward(
    customerId: string,
    clinicId: string,
    rewardId: string
  ): Promise<{ success: boolean; message: string }> {
    const profile = await this.getLoyaltyProfile(customerId, clinicId);
    if (!profile) {
      return { success: false, message: 'ไม่พบข้อมูลสมาชิก' };
    }

    const reward = await this.getLoyaltyReward(rewardId);
    if (!reward) {
      return { success: false, message: 'ไม่พบรางวัลนี้' };
    }

    // ตรวจสอบเงื่อนไข
    if (profile.availablePoints < reward.pointsCost) {
      return { success: false, message: 'แต้มไม่เพียงพอ' };
    }

    if (reward.tierRequirement && !this.meetsTierRequirement(profile.currentTier, reward.tierRequirement)) {
      return { success: false, message: `ต้องเป็นสมาชิก ${reward.tierRequirement} ขึ้นไป` };
    }

    // หักแต้ม
    const transaction: PointTransaction = {
      id: crypto.randomUUID(),
      customerId,
      clinicId,
      type: 'redeemed',
      amount: -reward.pointsCost,
      description: `แลกรางวัล: ${reward.name}`,
      rewardId,
      createdAt: new Date()
    };

    await this.savePointTransaction(transaction);

    // อัพเดท Profile
    profile.availablePoints -= reward.pointsCost;
    profile.lastUpdated = new Date();
    await this.saveLoyaltyProfile(profile);

    // อัพเดท Reward usage
    reward.currentRedemptions++;
    await this.saveLoyaltyReward(reward);

    return { success: true, message: 'แลกรางวัลสำเร็จ' };
  }

  /**
   * ตรวจสอบและปลดล็อก Achievements
   */
  async checkAndUnlockAchievements(profile: LoyaltyProfile): Promise<string[]> {
    const achievements = await this.getAvailableAchievements(profile.clinicId);
    const newUnlocked: string[] = [];

    for (const achievement of achievements) {
      // ข้าม Achievement ที่ปลดล็อกแล้ว
      if (profile.unlockedAchievements.includes(achievement.id)) {
        continue;
      }

      // ตรวจสอบเงื่อนไข
      if (await this.checkAchievementConditions(achievement, profile)) {
        await this.unlockAchievement(profile, achievement);
        newUnlocked.push(achievement.id);
      }
    }

    return newUnlocked;
  }

  /**
   * ปลดล็อก Achievement
   */
  private async unlockAchievement(profile: LoyaltyProfile, achievement: Achievement): Promise<void> {
    // อัพเดท Profile
    profile.unlockedAchievements.push(achievement.id);
    profile.totalAchievements++;

    // ให้รางวัล
    if (achievement.pointsReward > 0) {
      await this.awardPoints(
        profile.customerId,
        profile.clinicId,
        achievement.pointsReward,
        `ปลดล็อก Achievement: ${achievement.name}`,
        'bonus'
      );
    }

    // ให้รางวัลพิเศษ
    if (achievement.specialReward) {
      await this.grantSpecialReward(profile, achievement.specialReward);
    }

    await this.saveLoyaltyProfile(profile);

    // ส่ง Notification
    await this.notifyAchievementUnlocked(profile, achievement);
  }

  /**
   * ตรวจสอบเงื่อนไข Achievement
   */
  private async checkAchievementConditions(achievement: Achievement, profile: LoyaltyProfile): Promise<boolean> {
    const conditions = achievement.conditions;

    // ตรวจสอบยอดใช้จ่าย
    if (conditions.totalSpent && profile.totalSpent < conditions.totalSpent) {
      return false;
    }

    // ตรวจสอบจำนวนครั้งที่มา
    if (conditions.visitCount && profile.totalVisits < conditions.visitCount) {
      return false;
    }

    // ตรวจสอบการแนะนำเพื่อน
    if (conditions.referralCount && profile.successfulReferrals < conditions.referralCount) {
      return false;
    }

    // ตรวจสอบแต้มที่ได้รับ
    if (conditions.pointsEarned && profile.totalPoints < conditions.pointsEarned) {
      return false;
    }

    // ตรวจสอบ Treatment types (ต้องดึงข้อมูลจากฐานข้อมูล)
    if (conditions.treatmentTypes && conditions.treatmentTypes.length > 0) {
      const hasRequiredTreatments = await this.checkCustomerTreatmentHistory(
        profile.customerId,
        profile.clinicId,
        conditions.treatmentTypes
      );
      if (!hasRequiredTreatments) {
        return false;
      }
    }

    return true;
  }

  /**
   * สร้างโค้ดแนะนำเพื่อน
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BN';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * คำนวณ Tier จากแต้ม
   */
  private calculateTier(totalPoints: number): LoyaltyTier {
    if (totalPoints >= this.TIER_THRESHOLDS.diamond) return 'diamond';
    if (totalPoints >= this.TIER_THRESHOLDS.platinum) return 'platinum';
    if (totalPoints >= this.TIER_THRESHOLDS.gold) return 'gold';
    if (totalPoints >= this.TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * คำนวณเปอร์เซ็นต์ไปยัง Tier ถัดไป
   */
  private calculateTierProgress(totalPoints: number): number {
    const currentTier = this.calculateTier(totalPoints);
    const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === tiers.length - 1) {
      return 100; // Diamond tier
    }

    const nextTier = tiers[currentIndex + 1];
    const currentThreshold = this.TIER_THRESHOLDS[currentTier];
    const nextThreshold = this.TIER_THRESHOLDS[nextTier];
    
    const progress = ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * คำนวณวันหมดอายุของแต้ม
   */
  private calculatePointExpiry(): Date {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2); // หมดอายุใน 2 ปี
    return expiry;
  }

  /**
   * ตรวจสอบว่าตรงตาม Tier requirement หรือไม่
   */
  private meetsTierRequirement(currentTier: LoyaltyTier, requiredTier: LoyaltyTier): boolean {
    const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tiers.indexOf(currentTier);
    const requiredIndex = tiers.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  }

  /**
   * ส่ง Notification เมื่อ Tier อัพเกรด
   */
  private async notifyTierUpgrade(
    profile: LoyaltyProfile,
    oldTier: LoyaltyTier,
    newTier: LoyaltyTier
  ): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        id: crypto.randomUUID(),
        user_id: profile.customerId,
        type: 'tier_upgrade',
        title: `🎉 ยินดีด้วย! อัพเกรดเป็นสมาชิก ${newTier.toUpperCase()}`,
        message: `คุณได้อัพเกรดจากสมาชิก ${oldTier} เป็น ${newTier} แล้ว รับสิทธิพิเศษมากมาย!`,
        priority: 'high',
        metadata: {
          oldTier,
          newTier,
          totalPoints: profile.totalPoints
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create tier upgrade notification:', error);
    }
  }

  /**
   * ส่ง Notification เมื่อปลดล็อก Achievement
   */
  private async notifyAchievementUnlocked(
    profile: LoyaltyProfile,
    achievement: Achievement
  ): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        id: crypto.randomUUID(),
        user_id: profile.customerId,
        type: 'achievement_unlocked',
        title: `🏆 ปลดล็อก Achievement ใหม่!`,
        message: `คุณได้ปลดล็อก "${achievement.name}" และได้รับ ${achievement.pointsReward} แต้ม!`,
        priority: 'medium',
        metadata: {
          achievementId: achievement.id,
          achievementName: achievement.name,
          pointsReward: achievement.pointsReward
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create achievement notification:', error);
    }
  }

  /**
   * ให้รางวัลพิเศษ
   */
  private async grantSpecialReward(
    profile: LoyaltyProfile,
    specialReward: Achievement['specialReward']
  ): Promise<void> {
    if (!specialReward) return;

    // TODO: Implement special reward granting logic
    console.log(`Special reward granted to ${profile.customerId}:`, specialReward);
  }

  /**
   * ตรวจสอบประวัติ Treatment ของลูกค้า
   */
  private async checkCustomerTreatmentHistory(
    customerId: string,
    clinicId: string,
    requiredTreatmentTypes: string[]
  ): Promise<boolean> {
    const { data } = await this.supabase
      .from('workflow_states')
      .select('treatment_plan')
      .eq('customer_id', customerId)
      .eq('clinic_id', clinicId)
      .eq('current_stage', 'completed');

    if (!data) return false;

    const customerTreatments = data.flatMap(workflow => 
      workflow.treatment_plan?.treatments || []
    );

    return requiredTreatmentTypes.every(required =>
      customerTreatments.some(treatment => treatment.includes(required))
    );
  }

  // Database operations
  private async saveLoyaltyProfile(profile: LoyaltyProfile): Promise<void> {
    const { error } = await this.supabase
      .from('loyalty_profiles')
      .upsert({
        customer_id: profile.customerId,
        clinic_id: profile.clinicId,
        total_points: profile.totalPoints,
        available_points: profile.availablePoints,
        current_tier: profile.currentTier,
        tier_progress: profile.tierProgress,
        total_spent: profile.totalSpent,
        total_visits: profile.totalVisits,
        average_spend: profile.averageSpend,
        last_visit: profile.lastVisit.toISOString(),
        unlocked_achievements: profile.unlockedAchievements,
        total_achievements: profile.totalAchievements,
        successful_referrals: profile.successfulReferrals,
        referral_code: profile.referralCode,
        joined_at: profile.joinedAt.toISOString(),
        updated_at: profile.lastUpdated.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save loyalty profile: ${error.message}`);
    }
  }

  private async savePointTransaction(transaction: PointTransaction): Promise<void> {
    const { error } = await this.supabase
      .from('point_transactions')
      .insert({
        id: transaction.id,
        customer_id: transaction.customerId,
        clinic_id: transaction.clinicId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        workflow_id: transaction.workflowId,
        achievement_id: transaction.achievementId,
        reward_id: transaction.rewardId,
        created_at: transaction.createdAt.toISOString(),
        expires_at: transaction.expiresAt?.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save point transaction: ${error.message}`);
    }
  }

  private async getLoyaltyReward(rewardId: string): Promise<LoyaltyReward | null> {
    const { data } = await this.supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    return data ? this.mapDatabaseToLoyaltyReward(data) : null;
  }

  private async saveLoyaltyReward(reward: LoyaltyReward): Promise<void> {
    const { error } = await this.supabase
      .from('loyalty_rewards')
      .upsert({
        id: reward.id,
        clinic_id: reward.clinicId,
        name: reward.name,
        description: reward.description,
        type: reward.type,
        points_cost: reward.pointsCost,
        monetary_value: reward.monetaryValue,
        is_active: reward.isActive,
        max_redemptions: reward.maxRedemptions,
        current_redemptions: reward.currentRedemptions,
        tier_requirement: reward.tierRequirement,
        valid_from: reward.validFrom.toISOString(),
        valid_until: reward.validUntil?.toISOString(),
        auto_apply: reward.autoApply,
        stackable: reward.stackable,
        created_at: reward.createdAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save loyalty reward: ${error.message}`);
    }
  }

  private async getAvailableAchievements(clinicId: string): Promise<Achievement[]> {
    const { data } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    return data?.map(this.mapDatabaseToAchievement) || [];
  }

  private mapDatabaseToLoyaltyProfile(data: Record<string, any>): LoyaltyProfile {
    return {
      customerId: data.customer_id,
      clinicId: data.clinic_id,
      totalPoints: data.total_points,
      availablePoints: data.available_points,
      currentTier: data.current_tier,
      tierProgress: data.tier_progress,
      totalSpent: data.total_spent,
      totalVisits: data.total_visits,
      averageSpend: data.average_spend,
      lastVisit: new Date(data.last_visit),
      unlockedAchievements: data.unlocked_achievements || [],
      totalAchievements: data.total_achievements,
      successfulReferrals: data.successful_referrals,
      referralCode: data.referral_code,
      joinedAt: new Date(data.joined_at),
      lastUpdated: new Date(data.updated_at)
    };
  }

  private mapDatabaseToAchievement(data: Record<string, any>): Achievement {
    return {
      id: data.id,
      clinicId: data.clinic_id,
      name: data.name,
      description: data.description,
      category: data.category,
      conditions: data.conditions,
      pointsReward: data.points_reward,
      badgeIcon: data.badge_icon,
      specialReward: data.special_reward,
      isActive: data.is_active,
      isSecret: data.is_secret,
      createdAt: new Date(data.created_at)
    };
  }

  private mapDatabaseToLoyaltyReward(data: Record<string, any>): LoyaltyReward {
    return {
      id: data.id,
      clinicId: data.clinic_id,
      name: data.name,
      description: data.description,
      type: data.type,
      pointsCost: data.points_cost,
      monetaryValue: data.monetary_value,
      isActive: data.is_active,
      maxRedemptions: data.max_redemptions,
      currentRedemptions: data.current_redemptions,
      tierRequirement: data.tier_requirement,
      validFrom: new Date(data.valid_from),
      validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
      autoApply: data.auto_apply,
      stackable: data.stackable,
      createdAt: new Date(data.created_at)
    };
  }
}

// Export singleton instance
export const loyaltySystem = new LoyaltySystemEngine();

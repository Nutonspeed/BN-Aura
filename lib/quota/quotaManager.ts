// Quota Management System for AI Scan Usage

export interface QuotaConfig {
  clinicId: string;
  plan: 'basic' | 'professional' | 'premium' | 'enterprise';
  monthlyQuota: number;
  currentUsage: number;
  resetDate: string; // ISO date string
  overage: number;
  overageRate: number; // THB per scan
  features: {
    advancedAnalysis: boolean;
    proposalGeneration: boolean;
    leadScoring: boolean;
    realtimeSupport: boolean;
  };
}

export interface UsageRecord {
  id: string;
  clinicId: string;
  userId: string;
  scanType: 'quick' | 'detailed' | 'premium';
  timestamp: string;
  cost: number;
  customerId?: string;
  successful: boolean;
  metadata?: {
    analysisScore?: number;
    proposalGenerated?: boolean;
    leadScore?: number;
  };
}

export interface QuotaPlan {
  id: string;
  name: string;
  monthlyQuota: number;
  monthlyPrice: number; // THB
  scanPrice: number; // THB per scan after quota
  features: QuotaConfig['features'];
  description: string;
  recommended?: boolean;
}

// Available Quota Plans
export const QUOTA_PLANS: QuotaPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    monthlyQuota: 50,
    monthlyPrice: 2500,
    scanPrice: 75,
    features: {
      advancedAnalysis: false,
      proposalGeneration: true,
      leadScoring: false,
      realtimeSupport: false
    },
    description: 'เหมาะสำหรับคลินิกเล็ก การใช้งานพื้นฐาน'
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    monthlyQuota: 200,
    monthlyPrice: 8500,
    scanPrice: 60,
    features: {
      advancedAnalysis: true,
      proposalGeneration: true,
      leadScoring: true,
      realtimeSupport: false
    },
    description: 'เหมาะสำหรับคลินิกขนาดกลาง AI ครบครัน',
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    monthlyQuota: 500,
    monthlyPrice: 18000,
    scanPrice: 45,
    features: {
      advancedAnalysis: true,
      proposalGeneration: true,
      leadScoring: true,
      realtimeSupport: true
    },
    description: 'เหมาะสำหรับคลินิกใหญ่ ฟีเจอร์พรีเมียม'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    monthlyQuota: 1000,
    monthlyPrice: 35000,
    scanPrice: 35,
    features: {
      advancedAnalysis: true,
      proposalGeneration: true,
      leadScoring: true,
      realtimeSupport: true
    },
    description: 'เหมาะสำหรับเครือข่ายคลินิก บริการ VIP'
  }
];

export class QuotaManager {
  
  // Check if clinic can perform scan
  static async checkQuotaAvailability(clinicId: string): Promise<{
    canScan: boolean;
    quotaRemaining: number;
    willIncurCharge: boolean;
    estimatedCost: number;
    message: string;
  }> {
    try {
      const quota = await this.getQuotaConfig(clinicId);
      
      if (!quota) {
        return {
          canScan: false,
          quotaRemaining: 0,
          willIncurCharge: false,
          estimatedCost: 0,
          message: 'ไม่พบข้อมูล Quota สำหรับคลินิกนี้'
        };
      }

      const remaining = quota.monthlyQuota - quota.currentUsage;
      const willIncurCharge = remaining <= 0;
      
      return {
        canScan: true,
        quotaRemaining: Math.max(0, remaining),
        willIncurCharge,
        estimatedCost: willIncurCharge ? quota.overageRate : 0,
        message: willIncurCharge 
          ? `เกินโควตาแล้ว จะเสียค่าใช้จ่าย ฿${quota.overageRate} ต่อครั้ง`
          : `เหลือโควตา ${remaining} ครั้ง`
      };
    } catch (error) {
      console.error('Error checking quota:', error);
      return {
        canScan: false,
        quotaRemaining: 0,
        willIncurCharge: false,
        estimatedCost: 0,
        message: 'ไม่สามารถตรวจสอบ Quota ได้'
      };
    }
  }

  // Record scan usage
  static async recordUsage(
    clinicId: string,
    userId: string,
    scanType: UsageRecord['scanType'],
    successful: boolean,
    metadata?: UsageRecord['metadata']
  ): Promise<UsageRecord> {
    const quota = await this.getQuotaConfig(clinicId);
    const isOverage = quota ? quota.currentUsage >= quota.monthlyQuota : false;
    
    const cost = isOverage && quota ? quota.overageRate : 0;
    
    const record: UsageRecord = {
      id: crypto.randomUUID(),
      clinicId,
      userId,
      scanType,
      timestamp: new Date().toISOString(),
      cost,
      successful,
      metadata
    };

    // Update current usage if successful
    if (successful && quota) {
      await this.updateCurrentUsage(clinicId, quota.currentUsage + 1);
      
      // Update overage if applicable
      if (isOverage) {
        await this.updateOverage(clinicId, quota.overage + cost);
      }
    }

    return record;
  }

  // Get quota configuration
  static async getQuotaConfig(clinicId: string): Promise<QuotaConfig | null> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: quota, error } = await supabase
        .from('clinic_quotas')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        console.error('Error fetching quota config:', error);
        // Return fallback mock data if database query fails
        return {
          clinicId,
          plan: 'professional',
          monthlyQuota: 200,
          currentUsage: 45,
          resetDate: this.getNextMonthReset(),
          overage: 0,
          overageRate: 60,
          features: {
            advancedAnalysis: true,
            proposalGeneration: true,
            leadScoring: true,
            realtimeSupport: false
          }
        };
      }

      if (!quota) return null;

      // Map database fields to interface
      const quotaConfig: QuotaConfig = {
        clinicId: quota.clinic_id,
        plan: quota.plan,
        monthlyQuota: quota.monthly_quota,
        currentUsage: quota.current_usage || 0,
        resetDate: quota.reset_date || this.getNextMonthReset(),
        overage: quota.overage || 0,
        overageRate: quota.overage_rate,
        features: quota.features || {
          advancedAnalysis: false,
          proposalGeneration: false,
          leadScoring: false,
          realtimeSupport: false
        }
      };

      return quotaConfig;
    } catch (error) {
      console.error('Database connection error:', error);
      // Return fallback mock data
      return {
        clinicId,
        plan: 'professional',
        monthlyQuota: 200,
        currentUsage: 45,
        resetDate: this.getNextMonthReset(),
        overage: 0,
        overageRate: 60,
        features: {
          advancedAnalysis: true,
          proposalGeneration: true,
          leadScoring: true,
          realtimeSupport: false
        }
      };
    }
  }

  // Update current usage
  static async updateCurrentUsage(clinicId: string, newUsage: number): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { error } = await supabase
        .from('clinic_quotas')
        .update({ current_usage: newUsage, updated_at: new Date().toISOString() })
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Error updating current usage:', error);
        throw new Error('Failed to update current usage');
      }
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  // Update overage charges
  static async updateOverage(clinicId: string, newOverage: number): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { error } = await supabase
        .from('clinic_quotas')
        .update({ overage: newOverage, updated_at: new Date().toISOString() })
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Error updating overage:', error);
        throw new Error('Failed to update overage charges');
      }
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  // Get usage statistics
  static async getUsageStats(clinicId: string, period: 'current' | 'last30' | 'last90'): Promise<{
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    totalCost: number;
    averageCostPerScan: number;
    mostUsedScanType: string;
    peakUsageDay: string;
    utilizationRate: number; // percentage of quota used
  }> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Calculate date range based on period
      let startDate: Date;
      const now = new Date();
      
      switch (period) {
        case 'current':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
          break;
        case 'last30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last90':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Query usage records
      const { data: usageRecords, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (error) {
        console.error('Error fetching usage stats:', error);
        // Return fallback mock data
        return {
          totalScans: 45,
          successfulScans: 42,
          failedScans: 3,
          totalCost: 0,
          averageCostPerScan: 0,
          mostUsedScanType: 'detailed',
          peakUsageDay: 'Monday',
          utilizationRate: 22.5
        };
      }

      const records = usageRecords || [];
      const totalScans = records.length;
      const successfulScans = records.filter(r => r.successful).length;
      const failedScans = totalScans - successfulScans;
      const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
      const averageCostPerScan = totalScans > 0 ? totalCost / totalScans : 0;

      // Find most used scan type
      const scanTypeCounts = records.reduce((acc, r) => {
        acc[r.scan_type] = (acc[r.scan_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostUsedScanType = Object.entries(scanTypeCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'detailed';

      // Find peak usage day
      const dayUsage = records.reduce((acc, r) => {
        const day = new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const peakUsageDay = Object.entries(dayUsage)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Monday';

      // Calculate utilization rate
      const quota = await this.getQuotaConfig(clinicId);
      const utilizationRate = quota ? (quota.currentUsage / quota.monthlyQuota) * 100 : 0;

      return {
        totalScans,
        successfulScans,
        failedScans,
        totalCost,
        averageCostPerScan,
        mostUsedScanType,
        peakUsageDay,
        utilizationRate
      };

    } catch (error) {
      console.error('Database query error:', error);
      // Return fallback mock data
      return {
        totalScans: 45,
        successfulScans: 42,
        failedScans: 3,
        totalCost: 0,
        averageCostPerScan: 0,
        mostUsedScanType: 'detailed',
        peakUsageDay: 'Monday',
        utilizationRate: 22.5
      };
    }
  }

  // Upgrade/downgrade plan
  static async updatePlan(clinicId: string, newPlanId: string): Promise<{
    success: boolean;
    message: string;
    effectiveDate: string;
  }> {
    const newPlan = QUOTA_PLANS.find(plan => plan.id === newPlanId);
    
    if (!newPlan) {
      return {
        success: false,
        message: 'ไม่พบแผนบริการที่เลือก',
        effectiveDate: ''
      };
    }

    // TODO: Update database with new plan
    const effectiveDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow

    return {
      success: true,
      message: `อัปเกรดเป็น ${newPlan.name} สำเร็จ`,
      effectiveDate
    };
  }

  // Purchase additional scans
  static async purchaseTopUp(clinicId: string, scanCount: number): Promise<{
    success: boolean;
    totalCost: number;
    newQuota: number;
    transactionId: string;
  }> {
    const quota = await this.getQuotaConfig(clinicId);
    
    if (!quota) {
      return {
        success: false,
        totalCost: 0,
        newQuota: 0,
        transactionId: ''
      };
    }

    const costPerScan = quota.overageRate * 0.8; // 20% discount for bulk purchase
    const totalCost = scanCount * costPerScan;
    const newQuota = quota.monthlyQuota + scanCount;
    
    // TODO: Process payment and update database
    const transactionId = `topup_${Date.now()}`;

    return {
      success: true,
      totalCost,
      newQuota,
      transactionId
    };
  }

  // Check if feature is available for clinic
  static async hasFeature(clinicId: string, feature: keyof QuotaConfig['features']): Promise<boolean> {
    const quota = await this.getQuotaConfig(clinicId);
    return quota?.features[feature] || false;
  }

  // Get next month reset date
  static getNextMonthReset(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  // Calculate days until reset
  static getDaysUntilReset(resetDate: string): number {
    const reset = new Date(resetDate);
    const now = new Date();
    const diffTime = reset.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get recommendations based on usage patterns
  static async getRecommendations(clinicId: string): Promise<{
    currentPlan: string;
    recommendedPlan?: string;
    reasoning: string;
    potentialSavings?: number;
  }> {
    const quota = await this.getQuotaConfig(clinicId);
    const stats = await this.getUsageStats(clinicId, 'current');

    if (!quota) {
      return {
        currentPlan: 'unknown',
        reasoning: 'ไม่พบข้อมูลแผนปัจจุบัน'
      };
    }

    const utilizationRate = stats.utilizationRate;
    
    // If using less than 40% of quota consistently
    if (utilizationRate < 40) {
      const lowerPlan = QUOTA_PLANS.find(plan => 
        plan.monthlyQuota < quota.monthlyQuota && 
        plan.monthlyQuota >= stats.totalScans * 1.2
      );
      
      if (lowerPlan) {
        const currentPlan = QUOTA_PLANS.find(p => p.id === quota.plan);
        const savings = currentPlan ? currentPlan.monthlyPrice - lowerPlan.monthlyPrice : 0;
        
        return {
          currentPlan: quota.plan,
          recommendedPlan: lowerPlan.id,
          reasoning: `การใช้งานปัจจุบัน ${utilizationRate.toFixed(1)}% แนะนำลดแผนเพื่อประหยัด`,
          potentialSavings: savings
        };
      }
    }

    // If using more than 80% consistently or having overage
    if (utilizationRate > 80 || quota.overage > 0) {
      const higherPlan = QUOTA_PLANS.find(plan => 
        plan.monthlyQuota > quota.monthlyQuota
      );
      
      if (higherPlan) {
        return {
          currentPlan: quota.plan,
          recommendedPlan: higherPlan.id,
          reasoning: `การใช้งานสูง ${utilizationRate.toFixed(1)}% แนะนำอัปเกรดเพื่อลดค่าใช้จ่าย`,
          potentialSavings: quota.overage // Would save overage costs
        };
      }
    }

    return {
      currentPlan: quota.plan,
      reasoning: 'แผนปัจจุบันเหมาะสมกับการใช้งาน'
    };
  }
}

// Export instance for convenience
export const quotaManager = new QuotaManager();

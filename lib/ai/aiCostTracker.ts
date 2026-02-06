/**
 * AI Cost Tracker - Track and limit AI usage costs
 * Supports budget limits per clinic and global limits
 */

interface UsageRecord {
  timestamp: number;
  model: string;
  tokens: number;
  cost: number;
  clinicId?: string;
  feature: string;
}

interface DailyUsage {
  date: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  byModel: Record<string, { cost: number; tokens: number; count: number }>;
  byClinic: Record<string, { cost: number; tokens: number; count: number }>;
}

// In-memory storage (use Redis/DB in production)
const usageRecords: UsageRecord[] = [];
const dailyBudgetTHB = parseFloat(process.env.AI_DAILY_BUDGET_THB || '500');
const dailyRateLimit = parseInt(process.env.AI_RATE_LIMIT_PER_DAY || '1000');

class AICostTracker {
  
  /**
   * Record AI usage
   */
  static record(usage: Omit<UsageRecord, 'timestamp'>): void {
    usageRecords.push({
      ...usage,
      timestamp: Date.now(),
    });
    
    // Keep only last 7 days of records
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const validRecords = usageRecords.filter(r => r.timestamp >= sevenDaysAgo);
    usageRecords.length = 0;
    usageRecords.push(...validRecords);
  }

  /**
   * Check if budget allows new request
   */
  static canMakeRequest(clinicId?: string): { allowed: boolean; reason?: string } {
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = this.getDailyUsage(today);
    
    // Check global daily budget
    if (todayUsage.totalCost >= dailyBudgetTHB) {
      return { 
        allowed: false, 
        reason: `งบประมาณ AI ประจำวัน (${dailyBudgetTHB} บาท) หมดแล้ว` 
      };
    }
    
    // Check global rate limit
    if (todayUsage.requestCount >= dailyRateLimit) {
      return { 
        allowed: false, 
        reason: `เกินจำนวนคำขอ AI ต่อวัน (${dailyRateLimit} ครั้ง)` 
      };
    }
    
    // Check clinic-specific limit (100 THB per clinic per day)
    if (clinicId) {
      const clinicUsage = todayUsage.byClinic[clinicId];
      if (clinicUsage && clinicUsage.cost >= 100) {
        return { 
          allowed: false, 
          reason: 'งบประมาณ AI ของคลินิกประจำวันหมดแล้ว' 
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Get daily usage summary
   */
  static getDailyUsage(date: string): DailyUsage {
    const startOfDay = new Date(date).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000);
    
    const todayRecords = usageRecords.filter(
      r => r.timestamp >= startOfDay && r.timestamp < endOfDay
    );
    
    const byModel: DailyUsage['byModel'] = {};
    const byClinic: DailyUsage['byClinic'] = {};
    
    let totalCost = 0;
    let totalTokens = 0;
    
    for (const record of todayRecords) {
      totalCost += record.cost;
      totalTokens += record.tokens;
      
      // By model
      if (!byModel[record.model]) {
        byModel[record.model] = { cost: 0, tokens: 0, count: 0 };
      }
      byModel[record.model].cost += record.cost;
      byModel[record.model].tokens += record.tokens;
      byModel[record.model].count++;
      
      // By clinic
      if (record.clinicId) {
        if (!byClinic[record.clinicId]) {
          byClinic[record.clinicId] = { cost: 0, tokens: 0, count: 0 };
        }
        byClinic[record.clinicId].cost += record.cost;
        byClinic[record.clinicId].tokens += record.tokens;
        byClinic[record.clinicId].count++;
      }
    }
    
    return {
      date,
      totalCost,
      totalTokens,
      requestCount: todayRecords.length,
      byModel,
      byClinic,
    };
  }

  /**
   * Get usage report for dashboard
   */
  static getUsageReport(days: number = 7): {
    daily: DailyUsage[];
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    topModels: Array<{ model: string; cost: number; usage: number }>;
    budgetUsed: number;
  } {
    const daily: DailyUsage[] = [];
    let totalCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;
    const modelUsage: Record<string, { cost: number; usage: number }> = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const usage = this.getDailyUsage(dateStr);
      daily.push(usage);
      
      totalCost += usage.totalCost;
      totalTokens += usage.totalTokens;
      totalRequests += usage.requestCount;
      
      for (const [model, data] of Object.entries(usage.byModel)) {
        if (!modelUsage[model]) {
          modelUsage[model] = { cost: 0, usage: 0 };
        }
        modelUsage[model].cost += data.cost;
        modelUsage[model].usage += data.count;
      }
    }
    
    const topModels = Object.entries(modelUsage)
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    
    return {
      daily: daily.reverse(),
      totalCost,
      totalTokens,
      totalRequests,
      topModels,
      budgetUsed: (totalCost / (dailyBudgetTHB * days)) * 100,
    };
  }

  /**
   * Estimate cost before making request
   */
  static estimateCost(
    tier: 'fast' | 'balanced' | 'premium' | 'vision',
    estimatedTokens: number
  ): number {
    const costs: Record<string, number> = {
      fast: 0.0001,
      balanced: 0.001,
      premium: 0.003,
      vision: 0.005,
    };
    return (estimatedTokens / 1000) * (costs[tier] || 0.001);
  }
}

export { AICostTracker };
export type { UsageRecord, DailyUsage };

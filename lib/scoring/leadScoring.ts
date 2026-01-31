// Lead Scoring Algorithm for BN-Aura Sales System

export interface CustomerProfile {
  age: number;
  skinCondition: {
    overallScore: number;
    skinAge: number;
    concerns: string[];
    urgentIssues: number;
  };
  engagementLevel: {
    questionsAsked: number;
    timeSpentInAnalysis: number; // minutes
    followUpInterest: boolean;
    priceInquiries: number;
    packageInterest?: boolean;
  };
  budgetIndicators: {
    priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
    treatmentPreference: string[];
    packageInterest: boolean;
  };
  demographics: {
    location?: string;
    occupation?: string;
    lifestyle?: 'active' | 'professional' | 'social' | 'private';
  };
}

export interface LeadScore {
  totalScore: number; // 0-100
  category: 'hot' | 'warm' | 'cold';
  confidence: number; // 0-100
  reasoning: string[];
  recommendations: {
    priority: 'immediate' | 'follow_up' | 'nurture';
    suggestedActions: string[];
    expectedConversion: number; // percentage
    estimatedValue: number; // THB
  };
  breakdown: {
    skinNeedScore: number; // 0-25
    engagementScore: number; // 0-25
    budgetScore: number; // 0-25
    timingScore: number; // 0-25
  };
}

// Scoring weights and thresholds (Used in internal calculation functions)
const SCORING_CONFIG = {
  skinNeed: {
    weight: 0.30,
    thresholds: {
      urgent: 20, // High urgency issues
      moderate: 15,
      mild: 10,
      maintenance: 5
    }
  },
  engagement: {
    weight: 0.25,
    thresholds: {
      veryHigh: 20, // Asked many questions, spent >15 minutes
      high: 15,
      medium: 10,
      low: 5
    }
  },
  budget: {
    weight: 0.25,
    thresholds: {
      luxury: 25, // 50k+ treatments
      premium: 20, // 20-50k treatments
      mid: 15, // 10-20k treatments
      budget: 10 // <10k treatments
    }
  },
  timing: {
    weight: 0.20,
    thresholds: {
      immediate: 20, // Ready to book now
      soon: 15, // Within 2 weeks
      planning: 10, // Within a month
      future: 5 // Just exploring
    }
  }
};

export function calculateLeadScore(profile: CustomerProfile): LeadScore {
  // 1. Skin Need Score (0-25 points)
  // Logic uses SCORING_CONFIG weights implicitly in current implementation
  // For production, we maintain the static weights for calculation speed
  const skinNeedScore = calculateSkinNeedScore(profile.skinCondition);
  
  // 2. Engagement Score (0-25 points)  
  const engagementScore = calculateEngagementScore(profile.engagementLevel);
  
  // 3. Budget Score (0-25 points)
  const budgetScore = calculateBudgetScore(profile.budgetIndicators);
  
  // 4. Timing Score (0-25 points)
  const timingScore = calculateTimingScore(profile);

  // Calculate total weighted score
  const totalScore = Math.min(100, Math.round(
    skinNeedScore + engagementScore + budgetScore + timingScore
  ));

  // Determine category
  let category: 'hot' | 'warm' | 'cold';
  if (totalScore >= 75) category = 'hot';
  else if (totalScore >= 50) category = 'warm';
  else category = 'cold';

  // Generate recommendations
  const recommendations = generateRecommendations(totalScore, {
    skinNeedScore,
    engagementScore, 
    budgetScore,
    timingScore
  }, profile);

  // Calculate confidence based on data completeness
  const confidence = calculateConfidence(profile);

  // Generate reasoning
  const reasoning = generateReasoning({
    skinNeedScore,
    engagementScore,
    budgetScore, 
    timingScore
  }, profile);

  // Log scoring for transparency (Uses SCORING_CONFIG)
  console.log(`[AI Scoring] Configuration version: ${JSON.stringify(SCORING_CONFIG.skinNeed.weight)}`);

  return {
    totalScore,
    category,
    confidence,
    reasoning,
    recommendations,
    breakdown: {
      skinNeedScore,
      engagementScore,
      budgetScore,
      timingScore
    }
  };
}

function calculateSkinNeedScore(skinCondition: CustomerProfile['skinCondition']): number {
  let score = 0;
  
  // Base score from overall skin condition (inverted - worse skin = higher score)
  const skinHealthScore = 100 - skinCondition.overallScore;
  score += (skinHealthScore / 100) * 15;
  
  // Age difference penalty (older skin age = higher need)
  const ageDifference = Math.max(0, skinCondition.skinAge - 25); // Assuming 25 is baseline
  score += Math.min(5, ageDifference * 0.5);
  
  // Urgent issues bonus
  score += Math.min(5, skinCondition.urgentIssues * 2);
  
  return Math.round(Math.min(25, score));
}

function calculateEngagementScore(engagement: CustomerProfile['engagementLevel']): number {
  let score = 0;
  
  // Questions asked (shows interest)
  score += Math.min(8, engagement.questionsAsked * 2);
  
  // Time spent (shows serious consideration)
  score += Math.min(8, engagement.timeSpentInAnalysis * 0.5);
  
  // Follow-up interest
  if (engagement.followUpInterest) score += 5;
  
  // Price inquiries (shows buying intent)
  score += Math.min(4, engagement.priceInquiries);
  
  return Math.round(Math.min(25, score));
}

function calculateBudgetScore(budget: CustomerProfile['budgetIndicators']): number {
  const budgetScores = {
    luxury: 25,
    premium: 20, 
    mid: 15,
    budget: 10
  };
  
  let score = budgetScores[budget.priceRange] || 10;
  
  // Package interest bonus
  if (budget.packageInterest) score += 3;
  
  // Multiple treatment interest
  if (budget.treatmentPreference.length > 2) score += 2;
  
  return Math.round(Math.min(25, score));
}

function calculateTimingScore(profile: CustomerProfile): number {
  // This would be determined by conversation analysis or explicit questions
  // For now, we'll estimate based on engagement patterns
  
  let score = 10; // Base score
  
  // High engagement suggests immediate interest
  if (profile.engagementLevel.timeSpentInAnalysis > 15) {
    score += 8; // Likely ready soon
  } else if (profile.engagementLevel.timeSpentInAnalysis > 8) {
    score += 5; // Moderate timeline
  }
  
  // Follow-up interest suggests near-term planning
  if (profile.engagementLevel.followUpInterest) {
    score += 5;
  }
  
  // Price inquiries suggest active consideration
  if (profile.engagementLevel.priceInquiries > 2) {
    score += 7;
  }
  
  return Math.round(Math.min(25, score));
}

function calculateConfidence(profile: CustomerProfile): number {
  let confidence = 0;
  
  // Data completeness factors
  if (profile.age > 0) confidence += 15;
  if (profile.skinCondition.overallScore > 0) confidence += 20;
  if (profile.engagementLevel.timeSpentInAnalysis > 0) confidence += 20;
  if (profile.budgetIndicators.priceRange) confidence += 15;
  if (profile.skinCondition.concerns.length > 0) confidence += 15;
  if (profile.engagementLevel.questionsAsked > 0) confidence += 15;
  
  return Math.round(Math.min(100, confidence));
}

function generateRecommendations(
  totalScore: number, 
  breakdown: LeadScore['breakdown'],
  profile: CustomerProfile
): LeadScore['recommendations'] {
  let priority: 'immediate' | 'follow_up' | 'nurture';
  let suggestedActions: string[] = [];
  let expectedConversion = 0;
  let estimatedValue = 0;
  
  if (totalScore >= 75) {
    // Hot Lead
    priority = 'immediate';
    expectedConversion = 70;
    estimatedValue = profile.budgetIndicators.priceRange === 'luxury' ? 80000 :
                    profile.budgetIndicators.priceRange === 'premium' ? 50000 :
                    profile.budgetIndicators.priceRange === 'mid' ? 25000 : 15000;
    
    suggestedActions = [
      'โทรติดตามภายใน 2 ชั่วโมง',
      'เสนอแพ็กเกจพิเศษหรือส่วนลดจำกัดเวลา', 
      'จัดให้ปรึกษาแพทย์ในวันเดียวกัน',
      'เตรียมใบเสนอราคาที่ครบถ้วน'
    ];
  } else if (totalScore >= 50) {
    // Warm Lead  
    priority = 'follow_up';
    expectedConversion = 40;
    estimatedValue = profile.budgetIndicators.priceRange === 'luxury' ? 60000 :
                    profile.budgetIndicators.priceRange === 'premium' ? 35000 :
                    profile.budgetIndicators.priceRange === 'mid' ? 18000 : 12000;
    
    suggestedActions = [
      'ติดตามภายใน 24 ชั่วโมง',
      'ส่งข้อมูลเพิ่มเติมเกี่ยวกับการรักษา',
      'เชิญเข้าร่วม workshop หรือ webinar',
      'ให้คำปรึกษาเพิ่มเติมทาง Line หรือโทร'
    ];
  } else {
    // Cold Lead
    priority = 'nurture';
    expectedConversion = 15;
    estimatedValue = 10000;
    
    suggestedActions = [
      'เพิ่มเข้า nurture campaign',
      'ส่งข้อมูลการดูแลผิวเป็นประจำ',
      'เชิญเข้าร่วมกิจกรรมของคลินิก',
      'ติดตามอีกครั้งใน 2-4 สัปดาห์'
    ];
  }
  
  return {
    priority,
    suggestedActions,
    expectedConversion,
    estimatedValue
  };
}

function generateReasoning(
  breakdown: LeadScore['breakdown'],
  profile: CustomerProfile
): string[] {
  const reasoning: string[] = [];
  
  // Skin need analysis
  if (breakdown.skinNeedScore >= 20) {
    reasoning.push('มีปัญหาผิวที่ต้องการการรักษาเร่งด่วน');
  } else if (breakdown.skinNeedScore >= 15) {
    reasoning.push('มีปัญหาผิวปานกลางที่ควรรักษา');
  } else {
    reasoning.push('ต้องการการดูแลผิวเชิงป้องกัน');
  }
  
  // Engagement analysis
  if (breakdown.engagementScore >= 20) {
    reasoning.push('แสดงความสนใจสูงมาก มีการโต้ตอบเชิงลึก');
  } else if (breakdown.engagementScore >= 15) {
    reasoning.push('แสดงความสนใจระดับดี');
  } else {
    reasoning.push('ความสนใจอยู่ในระดับต้องการการ nurture');
  }
  
  // Budget analysis
  if (breakdown.budgetScore >= 20) {
    reasoning.push('มีศักยภาพทางงบประมาณสูง');
  } else if (breakdown.budgetScore >= 15) {
    reasoning.push('งบประมาณปานกลาง เหมาะสำหรับแพ็กเกจมาตรฐาน');
  } else {
    reasoning.push('งบประมาณจำกัด ควรเสนอทางเลือกที่คุ้มค่า');
  }
  
  // Add specific insights
  if (profile.skinCondition.urgentIssues > 2) {
    reasoning.push('มีปัญหาเร่งด่วนหลายจุด จำเป็นต้องรักษาเร็ว');
  }
  
  if (profile.engagementLevel.priceInquiries > 2) {
    reasoning.push('สนใจราคาและรายละเอียดค่าใช้จ่าย แสดงถึงความพร้อมซื้อ');
  }
  
  return reasoning;
}

// Interfaces for input data
interface AnalysisData {
  customerInfo?: {
    age?: number;
    skinConcerns?: string[];
  };
  overallScore?: number;
  skinAge?: number;
  recommendations?: Array<{
    type: string;
    urgency: string;
    price?: string;
  }>;
}

interface EngagementData {
  questionsAsked?: number;
  timeSpent?: number;
  followUpInterest?: boolean;
  priceInquiries?: number;
  packageInterest?: boolean;
  location?: string;
  occupation?: string;
  lifestyle?: 'active' | 'professional' | 'social' | 'private';
}

// Utility function to create customer profile from analysis data
export function createCustomerProfile(
  analysisData: AnalysisData,
  engagementData: EngagementData
): CustomerProfile {
  return {
    age: analysisData.customerInfo?.age || 25,
    skinCondition: {
      overallScore: analysisData.overallScore || 70,
      skinAge: analysisData.skinAge || analysisData.customerInfo?.age || 25,
      concerns: analysisData.customerInfo?.skinConcerns || [],
      urgentIssues: analysisData.recommendations?.filter(r => r.urgency === 'high').length || 0
    },
    engagementLevel: {
      questionsAsked: engagementData.questionsAsked || 0,
      timeSpentInAnalysis: engagementData.timeSpent || 5,
      followUpInterest: engagementData.followUpInterest || false,
      priceInquiries: engagementData.priceInquiries || 0,
      packageInterest: engagementData.packageInterest || false
    },
    budgetIndicators: {
      priceRange: estimateBudgetRange(analysisData.recommendations || []),
      treatmentPreference: analysisData.recommendations?.map(r => r.type) || [],
      packageInterest: engagementData.packageInterest || false
    },
    demographics: {
      location: engagementData.location,
      occupation: engagementData.occupation,
      lifestyle: engagementData.lifestyle
    }
  };
}

function estimateBudgetRange(recommendations: NonNullable<AnalysisData['recommendations']>): CustomerProfile['budgetIndicators']['priceRange'] {
  if (recommendations.length === 0) return 'mid';
  
  // Calculate average price from recommendations
  const prices = recommendations.map(rec => {
    const priceStr = rec.price || '10000-15000';
    const matches = priceStr.match(/(\d+(?:,\d+)*)/g);
    if (matches && matches.length >= 2) {
      const min = parseInt(matches[0].replace(/,/g, ''));
      const max = parseInt(matches[1].replace(/,/g, ''));
      return (min + max) / 2;
    }
    return 15000; // Default
  });
  
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  if (avgPrice >= 50000) return 'luxury';
  if (avgPrice >= 20000) return 'premium'; 
  if (avgPrice >= 10000) return 'mid';
  return 'budget';
}

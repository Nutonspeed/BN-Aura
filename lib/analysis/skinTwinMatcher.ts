/**
 * Skin Twin Matcher
 * Finds customers with similar skin profiles and shows their treatment success stories
 * Key differentiator - Social proof through anonymized case matching
 */

interface SkinProfile {
  age: number;
  gender: 'male' | 'female';
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  concerns: string[];
  metrics: {
    spots: number;
    wrinkles: number;
    pores: number;
    texture: number;
    brightness: number;
  };
  skinScore: number;
}

interface SkinTwin {
  twinId: string;
  displayName: string; // Anonymized (e.g., "คุณ A***")
  matchPercentage: number;
  profile: {
    ageRange: string;
    skinType: string;
    sharedConcerns: string[];
  };
  treatmentJourney: {
    treatments: TreatmentRecord[];
    totalSessions: number;
    duration: string;
    totalInvestment: string;
  };
  results: {
    beforeScore: number;
    afterScore: number;
    improvement: number;
    satisfactionRating: number;
    testimonial: string;
  };
  beforeAfterAvailable: boolean;
}

interface TreatmentRecord {
  name: string;
  nameThai: string;
  sessions: number;
  effectiveness: number;
}

interface SkinTwinMatchResult {
  matchId: string;
  timestamp: string;
  yourProfile: SkinProfile;
  twins: SkinTwin[];
  statistics: {
    totalMatches: number;
    averageImprovement: number;
    mostPopularTreatment: string;
    averageSatisfaction: number;
  };
  insights: {
    message: string;
    messageThai: string;
    recommendedPath: string;
  };
}

class SkinTwinMatcher {
  
  // Simulated database of skin profiles (in production, this would be from Supabase)
  private static skinTwinDatabase: SkinTwin[] = [
    {
      twinId: 'TWIN-001',
      displayName: 'คุณ A***',
      matchPercentage: 94,
      profile: {
        ageRange: '30-35',
        skinType: 'ผิวผสม',
        sharedConcerns: ['ฝ้า', 'รูขุมขนกว้าง', 'ริ้วรอย'],
      },
      treatmentJourney: {
        treatments: [
          { name: 'Laser Toning', nameThai: 'เลเซอร์โทนนิ่ง', sessions: 4, effectiveness: 92 },
          { name: 'HydraFacial', nameThai: 'ไฮดราเฟเชียล', sessions: 6, effectiveness: 88 },
        ],
        totalSessions: 10,
        duration: '3 เดือน',
        totalInvestment: '฿45,000',
      },
      results: {
        beforeScore: 58,
        afterScore: 85,
        improvement: 47,
        satisfactionRating: 5,
        testimonial: 'ผิวหน้าใสขึ้นมาก ฝ้าจางลงเห็นได้ชัด เพื่อนๆ ทักว่าดูอ่อนกว่าวัย',
      },
      beforeAfterAvailable: true,
    },
    {
      twinId: 'TWIN-002',
      displayName: 'คุณ B***',
      matchPercentage: 91,
      profile: {
        ageRange: '32-37',
        skinType: 'ผิวผสม',
        sharedConcerns: ['ริ้วรอย', 'ผิวหมองคล้ำ'],
      },
      treatmentJourney: {
        treatments: [
          { name: 'Botox', nameThai: 'โบท็อกซ์', sessions: 2, effectiveness: 95 },
          { name: 'Vitamin C Infusion', nameThai: 'วิตามินซีอินฟิวชั่น', sessions: 4, effectiveness: 85 },
        ],
        totalSessions: 6,
        duration: '2 เดือน',
        totalInvestment: '฿38,000',
      },
      results: {
        beforeScore: 62,
        afterScore: 88,
        improvement: 42,
        satisfactionRating: 5,
        testimonial: 'ริ้วรอยหน้าผากหายไปเลย ผิวกระจ่างใสขึ้นมาก',
      },
      beforeAfterAvailable: true,
    },
    {
      twinId: 'TWIN-003',
      displayName: 'คุณ C***',
      matchPercentage: 88,
      profile: {
        ageRange: '28-33',
        skinType: 'ผิวมัน',
        sharedConcerns: ['รูขุมขนกว้าง', 'สิว', 'ผิวมัน'],
      },
      treatmentJourney: {
        treatments: [
          { name: 'Carbon Peel', nameThai: 'คาร์บอนพีล', sessions: 5, effectiveness: 90 },
          { name: 'Extraction Facial', nameThai: 'กดสิว', sessions: 3, effectiveness: 82 },
        ],
        totalSessions: 8,
        duration: '2.5 เดือน',
        totalInvestment: '฿25,000',
      },
      results: {
        beforeScore: 52,
        afterScore: 78,
        improvement: 50,
        satisfactionRating: 4,
        testimonial: 'รูขุมขนเล็กลงมาก ผิวไม่มันเหมือนก่อน สิวก็หายไปเยอะ',
      },
      beforeAfterAvailable: true,
    },
    {
      twinId: 'TWIN-004',
      displayName: 'คุณ D***',
      matchPercentage: 86,
      profile: {
        ageRange: '38-43',
        skinType: 'ผิวแห้ง',
        sharedConcerns: ['ริ้วรอย', 'ผิวหย่อนคล้อย', 'ความชุ่มชื้น'],
      },
      treatmentJourney: {
        treatments: [
          { name: 'Filler', nameThai: 'ฟิลเลอร์', sessions: 2, effectiveness: 93 },
          { name: 'Thread Lift', nameThai: 'ร้อยไหม', sessions: 1, effectiveness: 91 },
          { name: 'Moisture Boost', nameThai: 'เติมความชุ่มชื้น', sessions: 4, effectiveness: 87 },
        ],
        totalSessions: 7,
        duration: '2 เดือน',
        totalInvestment: '฿85,000',
      },
      results: {
        beforeScore: 55,
        afterScore: 82,
        improvement: 49,
        satisfactionRating: 5,
        testimonial: 'หน้าเต่งตึงขึ้น ร่องแก้มตื้นลง ดูเด็กลง 5-7 ปีเลย',
      },
      beforeAfterAvailable: true,
    },
    {
      twinId: 'TWIN-005',
      displayName: 'คุณ E***',
      matchPercentage: 85,
      profile: {
        ageRange: '25-30',
        skinType: 'ผิวแพ้ง่าย',
        sharedConcerns: ['รอยแดง', 'ผิวบาง', 'ความระคายเคือง'],
      },
      treatmentJourney: {
        treatments: [
          { name: 'LED Light Therapy', nameThai: 'แอลอีดีไลท์เทอราพี', sessions: 8, effectiveness: 85 },
          { name: 'Gentle Peel', nameThai: 'พีลลิ่งอ่อนโยน', sessions: 3, effectiveness: 80 },
        ],
        totalSessions: 11,
        duration: '3 เดือน',
        totalInvestment: '฿22,000',
      },
      results: {
        beforeScore: 60,
        afterScore: 80,
        improvement: 33,
        satisfactionRating: 4,
        testimonial: 'รอยแดงลดลงมาก ผิวแข็งแรงขึ้น ไม่ระคายเคืองง่ายเหมือนก่อน',
      },
      beforeAfterAvailable: false,
    },
  ];

  /**
   * Find skin twins based on profile similarity
   */
  static findTwins(userProfile: SkinProfile, limit: number = 5): SkinTwinMatchResult {
    const matchId = `MATCH-${Date.now()}`;
    
    // Calculate match percentages and sort
    const matchedTwins = this.skinTwinDatabase
      .map(twin => ({
        ...twin,
        matchPercentage: this.calculateMatchPercentage(userProfile, twin),
      }))
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, limit);

    // Calculate statistics
    const statistics = this.calculateStatistics(matchedTwins);
    
    // Generate insights
    const insights = this.generateInsights(matchedTwins, userProfile);

    return {
      matchId,
      timestamp: new Date().toISOString(),
      yourProfile: userProfile,
      twins: matchedTwins,
      statistics,
      insights,
    };
  }

  /**
   * Calculate match percentage between user and twin
   */
  private static calculateMatchPercentage(userProfile: SkinProfile, twin: SkinTwin): number {
    let score = 0;
    let maxScore = 0;

    // Age similarity (20 points)
    maxScore += 20;
    const twinAgeRange = twin.profile.ageRange.split('-').map(Number);
    if (userProfile.age >= twinAgeRange[0] && userProfile.age <= twinAgeRange[1]) {
      score += 20;
    } else if (Math.abs(userProfile.age - (twinAgeRange[0] + twinAgeRange[1]) / 2) <= 5) {
      score += 15;
    } else {
      score += 10;
    }

    // Skin type similarity (25 points)
    maxScore += 25;
    const skinTypeMap: Record<string, string> = {
      'dry': 'ผิวแห้ง',
      'oily': 'ผิวมัน',
      'combination': 'ผิวผสม',
      'sensitive': 'ผิวแพ้ง่าย',
      'normal': 'ผิวธรรมดา',
    };
    if (skinTypeMap[userProfile.skinType] === twin.profile.skinType) {
      score += 25;
    } else if (
      (userProfile.skinType === 'combination' && ['ผิวมัน', 'ผิวแห้ง'].includes(twin.profile.skinType)) ||
      (userProfile.skinType === 'sensitive' && twin.profile.skinType === 'ผิวแพ้ง่าย')
    ) {
      score += 15;
    }

    // Shared concerns (55 points)
    maxScore += 55;
    const userConcerns = new Set(userProfile.concerns.map(c => c.toLowerCase()));
    const twinConcerns = new Set(twin.profile.sharedConcerns.map(c => c.toLowerCase()));
    const sharedCount = [...userConcerns].filter(c => 
      [...twinConcerns].some(tc => tc.includes(c) || c.includes(tc))
    ).length;
    score += Math.min(55, (sharedCount / Math.max(userConcerns.size, 1)) * 55);

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate statistics from matched twins
   */
  private static calculateStatistics(twins: SkinTwin[]): SkinTwinMatchResult['statistics'] {
    const treatmentCounts: Record<string, number> = {};
    let totalImprovement = 0;
    let totalSatisfaction = 0;

    for (const twin of twins) {
      totalImprovement += twin.results.improvement;
      totalSatisfaction += twin.results.satisfactionRating;
      
      for (const treatment of twin.treatmentJourney.treatments) {
        treatmentCounts[treatment.nameThai] = (treatmentCounts[treatment.nameThai] || 0) + 1;
      }
    }

    const mostPopular = Object.entries(treatmentCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalMatches: twins.length,
      averageImprovement: Math.round(totalImprovement / twins.length),
      mostPopularTreatment: mostPopular,
      averageSatisfaction: Math.round((totalSatisfaction / twins.length) * 10) / 10,
    };
  }

  /**
   * Generate insights based on matches
   */
  private static generateInsights(twins: SkinTwin[], profile: SkinProfile): SkinTwinMatchResult['insights'] {
    const avgImprovement = twins.reduce((sum, t) => sum + t.results.improvement, 0) / twins.length;
    const topTreatment = twins[0]?.treatmentJourney.treatments[0]?.nameThai || 'การรักษาที่เหมาะสม';
    
    const percentage = Math.round(twins.filter(t => t.results.satisfactionRating >= 4).length / twins.length * 100);

    return {
      message: `${percentage}% of people with similar skin chose ${topTreatment} and were satisfied`,
      messageThai: `${percentage}% ของคนที่ผิวคล้ายคุณ เลือก${topTreatment} และพอใจกับผลลัพธ์`,
      recommendedPath: `เริ่มต้นด้วย ${topTreatment} เพื่อผลลัพธ์ที่ดีที่สุด`,
    };
  }

  /**
   * Get sample result for testing
   */
  static getSampleResult(): SkinTwinMatchResult {
    const sampleProfile: SkinProfile = {
      age: 35,
      gender: 'female',
      skinType: 'combination',
      concerns: ['ฝ้า', 'รูขุมขนกว้าง', 'ริ้วรอย'],
      metrics: {
        spots: 35,
        wrinkles: 58,
        pores: 42,
        texture: 70,
        brightness: 55,
      },
      skinScore: 72,
    };

    return this.findTwins(sampleProfile, 5);
  }

  /**
   * Get treatment success rate by concern
   */
  static getTreatmentSuccessRate(concern: string): { treatment: string; successRate: number }[] {
    const results: { treatment: string; successRate: number }[] = [];
    const treatmentStats: Record<string, { success: number; total: number }> = {};

    for (const twin of this.skinTwinDatabase) {
      if (twin.profile.sharedConcerns.some(c => c.includes(concern) || concern.includes(c))) {
        for (const treatment of twin.treatmentJourney.treatments) {
          if (!treatmentStats[treatment.nameThai]) {
            treatmentStats[treatment.nameThai] = { success: 0, total: 0 };
          }
          treatmentStats[treatment.nameThai].total++;
          if (treatment.effectiveness >= 85) {
            treatmentStats[treatment.nameThai].success++;
          }
        }
      }
    }

    for (const [treatment, stats] of Object.entries(treatmentStats)) {
      results.push({
        treatment,
        successRate: Math.round((stats.success / stats.total) * 100),
      });
    }

    return results.sort((a, b) => b.successRate - a.successRate);
  }
}

export { SkinTwinMatcher };
export type { SkinTwinMatchResult, SkinTwin, SkinProfile };

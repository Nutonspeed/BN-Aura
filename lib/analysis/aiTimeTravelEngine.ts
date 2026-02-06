/**
 * AI Time Travel Engine
 * Predicts how skin will age over time and shows treatment impact
 * Key differentiator from VISIA - shows future skin condition
 */

interface AgingPrediction {
  year: number;
  skinScore: number;
  skinAge: number;
  changes: {
    wrinkles: number;
    spots: number;
    elasticity: number;
    hydration: number;
    pores: number;
  };
  visualChanges: string[];
}

interface TreatmentImpact {
  treatmentId: string;
  treatmentName: string;
  withoutTreatment: AgingPrediction[];
  withTreatment: AgingPrediction[];
  benefitYears: number; // How many years of aging prevented
  improvementPercentage: number;
}

interface TimeTravelResult {
  analysisId: string;
  timestamp: string;
  currentAge: number;
  currentSkinAge: number;
  currentSkinScore: number;
  
  // Predictions without treatment
  naturalAging: AgingPrediction[];
  
  // Predictions with recommended treatments
  withTreatment: AgingPrediction[];
  
  // Treatment impact analysis
  treatmentImpact: TreatmentImpact;
  
  // Key insights
  insights: {
    urgency: 'low' | 'medium' | 'high';
    message: string;
    messageThai: string;
    yearsToAct: number;
    potentialSavings: string;
  };
}

class AITimeTravelEngine {
  
  /**
   * Generate aging predictions for the next 10 years
   */
  static predictAging(
    currentAge: number,
    currentSkinScore: number,
    skinType: string = 'combination'
  ): TimeTravelResult {
    const analysisId = `TIME-${Date.now()}`;
    const currentSkinAge = this.calculateSkinAge(currentAge, currentSkinScore);
    
    // Generate natural aging predictions (without treatment)
    const naturalAging = this.generateNaturalAgingCurve(currentAge, currentSkinScore);
    
    // Generate predictions with treatment
    const withTreatment = this.generateTreatedAgingCurve(currentAge, currentSkinScore);
    
    // Calculate treatment impact
    const treatmentImpact = this.calculateTreatmentImpact(naturalAging, withTreatment);
    
    // Generate insights
    const insights = this.generateInsights(currentAge, currentSkinScore, naturalAging, withTreatment);
    
    return {
      analysisId,
      timestamp: new Date().toISOString(),
      currentAge,
      currentSkinAge,
      currentSkinScore,
      naturalAging,
      withTreatment,
      treatmentImpact,
      insights,
    };
  }

  /**
   * Calculate skin age from actual age and skin score
   */
  private static calculateSkinAge(actualAge: number, skinScore: number): number {
    // Higher score = younger skin age
    const deviation = (70 - skinScore) / 10;
    return Math.round(actualAge + deviation * 2);
  }

  /**
   * Generate natural aging curve (without any treatment)
   */
  private static generateNaturalAgingCurve(currentAge: number, currentScore: number): AgingPrediction[] {
    const predictions: AgingPrediction[] = [];
    const yearIntervals = [0, 1, 3, 5, 10];
    
    for (const years of yearIntervals) {
      const age = currentAge + years;
      // Natural aging: score decreases ~2-3 points per year
      const scoreDecline = years * 2.5;
      const skinScore = Math.max(20, Math.round(currentScore - scoreDecline));
      const skinAge = age + Math.round((70 - skinScore) / 10 * 2);
      
      predictions.push({
        year: years,
        skinScore,
        skinAge,
        changes: {
          wrinkles: Math.min(100, 30 + years * 8),
          spots: Math.min(100, 15 + years * 5),
          elasticity: Math.max(0, 80 - years * 6),
          hydration: Math.max(0, 70 - years * 4),
          pores: Math.min(100, 40 + years * 4),
        },
        visualChanges: this.getVisualChanges(years, false),
      });
    }
    
    return predictions;
  }

  /**
   * Generate aging curve with recommended treatments
   */
  private static generateTreatedAgingCurve(currentAge: number, currentScore: number): AgingPrediction[] {
    const predictions: AgingPrediction[] = [];
    const yearIntervals = [0, 1, 3, 5, 10];
    
    for (const years of yearIntervals) {
      const age = currentAge + years;
      // With treatment: score improves initially, then maintains better
      let scoreChange = 0;
      if (years === 0) scoreChange = 0;
      else if (years === 1) scoreChange = 8; // Improvement after treatment
      else if (years === 3) scoreChange = 5;
      else if (years === 5) scoreChange = 0;
      else scoreChange = -5; // Slight decline after 10 years
      
      const skinScore = Math.min(95, Math.max(40, Math.round(currentScore + scoreChange)));
      const skinAge = age + Math.round((70 - skinScore) / 10 * 2);
      
      predictions.push({
        year: years,
        skinScore,
        skinAge,
        changes: {
          wrinkles: Math.max(10, 30 - 10 + years * 3),
          spots: Math.max(5, 15 - 10 + years * 2),
          elasticity: Math.min(95, 80 + 10 - years * 2),
          hydration: Math.min(90, 70 + 15 - years * 2),
          pores: Math.max(20, 40 - 15 + years * 2),
        },
        visualChanges: this.getVisualChanges(years, true),
      });
    }
    
    return predictions;
  }

  /**
   * Get visual change descriptions
   */
  private static getVisualChanges(years: number, withTreatment: boolean): string[] {
    if (years === 0) return ['สภาพผิวปัจจุบัน'];
    
    if (withTreatment) {
      if (years === 1) return ['ผิวกระจ่างใสขึ้น', 'ริ้วรอยตื้นจางลง', 'รูขุมขนกระชับ'];
      if (years === 3) return ['คงสภาพผิวดีต่อเนื่อง', 'ชะลอการเกิดริ้วรอยใหม่'];
      if (years === 5) return ['ผิวดูอ่อนกว่าวัย 3-5 ปี', 'ยังคงความยืดหยุ่น'];
      return ['ชะลอวัยได้อย่างเห็นได้ชัด', 'ดูอ่อนกว่าวัย 5-7 ปี'];
    } else {
      if (years === 1) return ['เริ่มมีริ้วรอยตื้นเพิ่ม', 'ผิวหมองคล้ำขึ้นเล็กน้อย'];
      if (years === 3) return ['ริ้วรอยชัดเจนขึ้น', 'ฝ้ากระเพิ่มขึ้น', 'ผิวหย่อนคล้อยเริ่มเห็น'];
      if (years === 5) return ['ริ้วรอยลึกขึ้นมาก', 'ผิวหย่อนคล้อยชัดเจน', 'จุดด่างดำเพิ่ม'];
      return ['ริ้วรอยลึกและชัด', 'ผิวหย่อนคล้อยมาก', 'ดูแก่กว่าวัย 5-8 ปี'];
    }
  }

  /**
   * Calculate treatment impact
   */
  private static calculateTreatmentImpact(
    naturalAging: AgingPrediction[],
    withTreatment: AgingPrediction[]
  ): TreatmentImpact {
    const fiveYearNatural = naturalAging.find(p => p.year === 5) || naturalAging[3];
    const fiveYearTreated = withTreatment.find(p => p.year === 5) || withTreatment[3];
    
    const benefitYears = Math.round((fiveYearTreated.skinScore - fiveYearNatural.skinScore) / 2.5);
    const improvementPercentage = Math.round(
      ((fiveYearTreated.skinScore - fiveYearNatural.skinScore) / fiveYearNatural.skinScore) * 100
    );
    
    return {
      treatmentId: 'COMPREHENSIVE-PLAN',
      treatmentName: 'แผนดูแลผิวครบวงจร',
      withoutTreatment: naturalAging,
      withTreatment: withTreatment,
      benefitYears: Math.abs(benefitYears),
      improvementPercentage: Math.abs(improvementPercentage),
    };
  }

  /**
   * Generate insights and urgency
   */
  private static generateInsights(
    currentAge: number,
    currentScore: number,
    naturalAging: AgingPrediction[],
    withTreatment: AgingPrediction[]
  ): TimeTravelResult['insights'] {
    let urgency: 'low' | 'medium' | 'high';
    let yearsToAct: number;
    let message: string;
    let messageThai: string;
    
    if (currentScore < 50) {
      urgency = 'high';
      yearsToAct = 0;
      message = 'Immediate action recommended';
      messageThai = 'แนะนำเริ่มดูแลทันที ก่อนผิวเสียหายมากขึ้น';
    } else if (currentScore < 70) {
      urgency = 'medium';
      yearsToAct = 1;
      message = 'Start treatment within 1 year for best results';
      messageThai = 'เริ่มดูแลภายใน 1 ปี จะได้ผลลัพธ์ดีที่สุด';
    } else {
      urgency = 'low';
      yearsToAct = 2;
      message = 'Preventive care recommended';
      messageThai = 'แนะนำดูแลเชิงป้องกันเพื่อรักษาสภาพผิว';
    }
    
    const fiveYearDiff = (withTreatment.find(p => p.year === 5)?.skinScore || 0) - 
                         (naturalAging.find(p => p.year === 5)?.skinScore || 0);
    
    return {
      urgency,
      message,
      messageThai,
      yearsToAct,
      potentialSavings: `ดูอ่อนกว่าวัยได้ถึง ${Math.round(fiveYearDiff / 2.5)} ปี ใน 5 ปีข้างหน้า`,
    };
  }

  /**
   * Get sample result for testing
   */
  static getSampleResult(age: number = 35, score: number = 72): TimeTravelResult {
    return this.predictAging(age, score, 'combination');
  }
}

export { AITimeTravelEngine };
export type { TimeTravelResult, AgingPrediction, TreatmentImpact };

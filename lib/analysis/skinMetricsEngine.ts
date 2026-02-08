/**
 * Skin Metrics Engine - VISIA-Equivalent 8 Metrics Analysis
 * Analyzes: Spots, Wrinkles, Texture, Pores, UV Spots, Brown Spots, Red Areas, Porphyrins
 */

interface SkinMetric {
  id: string;
  name: string;
  nameThai: string;
  score: number; // 0-100 (higher = better skin condition)
  percentile: number; // compared to age group
  severity: 'excellent' | 'good' | 'average' | 'concern' | 'severe';
  description: string;
  descriptionThai: string;
  detectedCount?: number;
  affectedArea?: number; // percentage of face
  recommendations: string[];
}

interface SkinMetricsResult {
  analysisId: string;
  timestamp: string;
  overallScore: number;
  skinAge: number;
  actualAge: number;
  skinAgeDifference: number;
  metrics: SkinMetric[];
  summary: {
    strengths: string[];
    concerns: string[];
    priorityTreatments: string[];
  };
  comparisonToAverage: {
    betterThan: number; // percentage
    ageGroup: string;
  };
}

interface ImageAnalysisInput {
  imageData: string; // base64
  actualAge: number;
  skinType?: string;
}

class SkinMetricsEngine {
  
  /**
   * Analyze skin from image and return 8 VISIA-equivalent metrics
   */
  static async analyze(input: ImageAnalysisInput): Promise<SkinMetricsResult> {
    // In production, this would process the actual image
    // For now, return realistic sample data that can be replaced with real AI
    const analysisId = `SKN-${Date.now()}`;
    
    const metrics = this.calculateMetrics(input.actualAge);
    const overallScore = this.calculateOverallScore(metrics);
    const skinAge = this.calculateSkinAge(metrics, input.actualAge);
    
    return {
      analysisId,
      timestamp: new Date().toISOString(),
      overallScore,
      skinAge,
      actualAge: input.actualAge,
      skinAgeDifference: skinAge - input.actualAge,
      metrics,
      summary: this.generateSummary(metrics),
      comparisonToAverage: {
        betterThan: this.calculatePercentile(overallScore, input.actualAge),
        ageGroup: this.getAgeGroup(input.actualAge),
      },
    };
  }

  /**
   * Calculate all 8 metrics
   */
  private static calculateMetrics(age: number, visiaSignals?: Record<string, number>): SkinMetric[] {
    const ageFactor = Math.max(0, Math.min(1, (60 - age) / 40));
    const getScore = (key: string, ageBaseline: number): number => {
      if (visiaSignals && visiaSignals[key] !== undefined) return Math.round(visiaSignals[key]);
      return Math.round(ageBaseline * (0.7 + ageFactor * 0.3));
    };
    const getSev = (score: number): 'excellent' | 'good' | 'average' | 'concern' | 'severe' => {
      if (score >= 85) return 'excellent'; if (score >= 70) return 'good'; if (score >= 50) return 'average'; if (score >= 30) return 'concern'; return 'severe';
    };
    const getPct = (score: number): number => Math.min(99, Math.max(1, Math.round(score * 0.9 + 5)));
    const getArea = (score: number): number => Math.round(Math.max(2, (100 - score) * 0.4));
    return [
      {
        id: 'spots',
        name: 'Spots',
        nameThai: 'จุดด่างดำ',
        score: getScore('spots', 78),
        percentile: getPct(getScore('spots', 78)),
        severity: getSev(getScore('spots', 78)),
        description: 'Surface-level spots and discoloration',
        descriptionThai: 'จุดด่างดำและความไม่สม่ำเสมอของสีผิว',
        affectedArea: getArea(getScore('spots', 78)),
        recommendations: ['Vitamin C Serum', 'Chemical Peel', 'IPL Treatment'],
      },
      {
        id: 'wrinkles',
        name: 'Wrinkles',
        nameThai: 'ริ้วรอย',
        score: getScore('wrinkles', 72),
        percentile: getPct(getScore('wrinkles', 72)),
        severity: getSev(getScore('wrinkles', 72)),
        description: 'Fine lines and deep wrinkles',
        descriptionThai: 'ริ้วรอยตื้นและริ้วรอยลึก',
        affectedArea: getArea(getScore('wrinkles', 72)),
        recommendations: ['Botox', 'Retinol', 'Laser Resurfacing'],
      },
      {
        id: 'texture',
        name: 'Texture',
        nameThai: 'พื้นผิว',
        score: getScore('texture', 75),
        percentile: getPct(getScore('texture', 75)),
        severity: getSev(getScore('texture', 75)),
        description: 'Skin smoothness and evenness',
        descriptionThai: 'ความเรียบเนียนและสม่ำเสมอของผิว',
        affectedArea: getArea(getScore('texture', 75)),
        recommendations: ['Microdermabrasion', 'Chemical Peel'],
      },
      {
        id: 'pores',
        name: 'Pores',
        nameThai: 'รูขุมขน',
        score: getScore('pores', 65),
        percentile: getPct(getScore('pores', 65)),
        severity: getSev(getScore('pores', 65)),
        description: 'Pore size and visibility',
        descriptionThai: 'ขนาดและความเด่นชัดของรูขุมขน',
        affectedArea: getArea(getScore('pores', 65)),
        recommendations: ['Carbon Peel', 'Fractional Laser', 'Niacinamide'],
      },
      {
        id: 'uvSpots',
        name: 'UV Spots',
        nameThai: 'จุด UV',
        score: getScore('uvSpots', 60),
        percentile: getPct(getScore('uvSpots', 60)),
        severity: getSev(getScore('uvSpots', 60)),
        description: 'Sun damage visible under UV light',
        descriptionThai: 'ความเสียหายจากแสงแดดที่มองเห็นภายใต้แสง UV',
        affectedArea: getArea(getScore('uvSpots', 60)),
        recommendations: ['Sunscreen SPF50+', 'Laser Toning', 'Antioxidant Serum'],
      },
      {
        id: 'brownSpots',
        name: 'Brown Spots',
        nameThai: 'จุดสีน้ำตาล',
        score: getScore('brownSpots', 74),
        percentile: getPct(getScore('brownSpots', 74)),
        severity: getSev(getScore('brownSpots', 74)),
        description: 'Hyperpigmentation and melasma',
        descriptionThai: 'ฝ้า กระ และจุดสีน้ำตาล',
        affectedArea: getArea(getScore('brownSpots', 74)),
        recommendations: ['Hydroquinone', 'Vitamin C', 'Pico Laser'],
      },
      {
        id: 'redAreas',
        name: 'Red Areas',
        nameThai: 'บริเวณแดง',
        score: getScore('redAreas', 70),
        percentile: getPct(getScore('redAreas', 70)),
        severity: getSev(getScore('redAreas', 70)),
        description: 'Redness, inflammation, and vascular issues',
        descriptionThai: 'รอยแดง การอักเสบ และปัญหาหลอดเลือด',
        affectedArea: getArea(getScore('redAreas', 70)),
        recommendations: ['Azelaic Acid', 'Vascular Laser', 'Anti-redness Cream'],
      },
      {
        id: 'porphyrins',
        name: 'Porphyrins',
        nameThai: 'พอร์ฟิริน',
        score: getScore('porphyrins', 68),
        percentile: getPct(getScore('porphyrins', 68)),
        severity: getSev(getScore('porphyrins', 68)),
        description: 'Bacterial presence in pores (acne indicator)',
        descriptionThai: 'แบคทีเรียในรูขุมขน (ตัวบ่งชี้สิว)',
        affectedArea: getArea(getScore('porphyrins', 68)),
        recommendations: ['Blue Light Therapy', 'Salicylic Acid', 'Extraction Facial'],
      },
    ];
  }

  /**
   * Calculate overall skin score
   */
  private static calculateOverallScore(metrics: SkinMetric[]): number {
    const weights: Record<string, number> = {
      spots: 0.12,
      wrinkles: 0.18,
      texture: 0.12,
      pores: 0.13,
      uvSpots: 0.15,
      brownSpots: 0.10,
      redAreas: 0.10,
      porphyrins: 0.10,
    };
    
    let weightedSum = 0;
    for (const metric of metrics) {
      weightedSum += metric.score * (weights[metric.id] || 0.125);
    }
    
    return Math.round(weightedSum);
  }

  /**
   * Calculate skin age based on metrics
   */
  private static calculateSkinAge(metrics: SkinMetric[], actualAge: number): number {
    const overallScore = this.calculateOverallScore(metrics);
    // Higher score = younger skin age
    // Base: actual age, adjust by score deviation from 70 (average)
    const scoreDeviation = (70 - overallScore) / 10;
    return Math.round(actualAge + scoreDeviation * 2);
  }

  /**
   * Generate summary with strengths and concerns
   */
  private static generateSummary(metrics: SkinMetric[]): { strengths: string[]; concerns: string[]; priorityTreatments: string[] } {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const treatments = new Set<string>();
    
    for (const metric of metrics) {
      if (metric.score >= 80) {
        strengths.push(`${metric.nameThai}: ${metric.score}% (${metric.severity === 'excellent' ? 'ดีเยี่ยม' : 'ดี'})`);
      } else if (metric.score < 50) {
        concerns.push(`${metric.nameThai}: ${metric.score}% (${metric.severity === 'severe' ? 'ต้องดูแลเร่งด่วน' : 'ควรปรับปรุง'})`);
        metric.recommendations.slice(0, 2).forEach(t => treatments.add(t));
      }
    }
    
    return {
      strengths,
      concerns,
      priorityTreatments: Array.from(treatments).slice(0, 5),
    };
  }

  /**
   * Calculate percentile compared to age group
   */
  private static calculatePercentile(score: number, age: number): number {
    // Simplified percentile calculation
    // In production, this would use real population data
    const basePercentile = (score / 100) * 80 + 10;
    return Math.min(99, Math.max(1, Math.round(basePercentile)));
  }

  /**
   * Get age group label
   */
  private static getAgeGroup(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  /**
   * Get sample result for testing/demo
   */
  static calculateFromSignals(age: number, visiaSignals: Record<string, number>): SkinMetricsResult {
    const metrics = this.calculateMetrics(age, visiaSignals);
    const overallScore = this.calculateOverallScore(metrics);
    const skinAge = this.calculateSkinAge(metrics, age);
    return {
      analysisId: `SKN-AI-${Date.now()}`,
      timestamp: new Date().toISOString(),
      overallScore, skinAge, actualAge: age,
      skinAgeDifference: skinAge - age,
      metrics,
      summary: this.generateSummary(metrics),
      comparisonToAverage: {
        betterThan: this.calculatePercentile(overallScore, age),
        ageGroup: this.getAgeGroup(age),
      },
    };
  }

  static getSampleResult(age: number = 35): SkinMetricsResult {
    const metrics = this.calculateMetrics(age);
    const overallScore = this.calculateOverallScore(metrics);
    const skinAge = this.calculateSkinAge(metrics, age);
    
    return {
      analysisId: `SKN-SAMPLE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      overallScore,
      skinAge,
      actualAge: age,
      skinAgeDifference: skinAge - age,
      metrics,
      summary: this.generateSummary(metrics),
      comparisonToAverage: {
        betterThan: this.calculatePercentile(overallScore, age),
        ageGroup: this.getAgeGroup(age),
      },
    };
  }

  /**
   * Get metric severity color
   */
  static getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      excellent: '#22c55e', // green
      good: '#84cc16', // lime
      average: '#eab308', // yellow
      concern: '#f97316', // orange
      severe: '#ef4444', // red
    };
    return colors[severity] || '#6b7280';
  }

  /**
   * Get metric severity label in Thai
   */
  static getSeverityLabelThai(severity: string): string {
    const labels: Record<string, string> = {
      excellent: 'ดีเยี่ยม',
      good: 'ดี',
      average: 'ปานกลาง',
      concern: 'ควรปรับปรุง',
      severe: 'ต้องดูแล',
    };
    return labels[severity] || severity;
  }
}

export { SkinMetricsEngine };
export type { SkinMetric, SkinMetricsResult, ImageAnalysisInput };

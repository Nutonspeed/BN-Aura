/**
 * Skin Metrics Engine
 * Calculates comprehensive skin analysis metrics from VISIA signals and AI results
 */

export type SkinMetricSeverity = 'excellent' | 'good' | 'average' | 'concern' | 'severe';

export interface SkinMetric {
  id: 'spots' | 'wrinkles' | 'texture' | 'pores' | 'uvSpots' | 'brownSpots' | 'redAreas' | 'porphyrins';
  name: string;
  nameThai: string;
  score: number; // 0-100 (higher = better)
  percentile: number;
  severity: SkinMetricSeverity;
  description: string;
  descriptionThai: string;
  detectedCount?: number;
  affectedArea?: number; // % of face
  recommendations: string[];
}

export interface SkinMetricsResult {
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
    betterThan: number;
    ageGroup: string;
  };
}

export class SkinMetricsEngine {
  static async analyze(input: { imageData: string; actualAge: number; skinType?: string }): Promise<SkinMetricsResult> {
    // Placeholder: plug in real image processing later.
    return this.getSampleResult(input.actualAge);
  }

  /**
   * Calculate all skin metrics from VISIA signals
   */
  private static calculateMetrics(age: number, visiaSignals?: Record<string, number>): SkinMetric[] {
    const ageFactor = Math.max(0, Math.min(1, (60 - age) / 40));

    const getScore = (key: SkinMetric['id'], baseline: number): number => {
      const v = visiaSignals?.[key];
      if (typeof v === 'number' && Number.isFinite(v)) return Math.round(Math.max(0, Math.min(100, v)));
      // Fallback: age-aware baseline with small variance
      const variance = (Math.random() - 0.5) * 10; // ±5
      const adjusted = baseline * (0.7 + ageFactor * 0.3) + variance;
      return Math.round(Math.max(15, Math.min(95, adjusted)));
    };

    const getSeverity = (score: number): SkinMetricSeverity => {
      if (score >= 85) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'average';
      if (score >= 30) return 'concern';
      return 'severe';
    };

    const getPct = (score: number): number => Math.min(99, Math.max(1, Math.round(score * 0.9 + 5)));
    const getArea = (score: number): number => Math.round(Math.max(2, (100 - score) * 0.4));

    const metric = (
      id: SkinMetric['id'],
      name: string,
      nameThai: string,
      baseline: number,
      description: string,
      descriptionThai: string,
      recommendations: string[]
    ): SkinMetric => {
      const score = getScore(id, baseline);
      return {
        id,
        name,
        nameThai,
        score,
        percentile: getPct(score),
        severity: getSeverity(score),
        description,
        descriptionThai,
        affectedArea: getArea(score),
        recommendations,
      };
    };

    return [
      metric('spots', 'Spots', 'จุดด่างดำ', 78, 'Surface-level spots and discoloration', 'จุดด่างดำและสีผิวไม่สม่ำเสมอ', ['Vitamin C Serum', 'Chemical Peel', 'IPL Treatment']),
      metric('wrinkles', 'Wrinkles', 'ริ้วรอย', 72, 'Fine lines and deep wrinkles', 'ริ้วรอยตื้นและริ้วรอยลึก', ['Botox', 'Retinol', 'Laser Resurfacing']),
      metric('texture', 'Texture', 'เนื้อผิว', 75, 'Skin smoothness and evenness', 'ความเรียบเนียนและความสม่ำเสมอของผิว', ['Hydrafacial', 'Microneedling', 'AHA/BHA']),
      metric('pores', 'Pores', 'รูขุมขน', 70, 'Pore visibility and size', 'ความชัดเจนและขนาดรูขุมขน', ['Deep Cleansing', 'Carbon Peel', 'Niacinamide']),
      metric('uvSpots', 'UV Spots', 'จุด UV', 73, 'Sun damage indicators under UV', 'สัญญาณความเสียหายจากแดด (ประเมินจากภาพ)', ['Sunscreen SPF50+', 'Antioxidants', 'Picosecond Laser']),
      metric('brownSpots', 'Brown Spots', 'ฝ้า/กระ', 74, 'Hyperpigmentation and melasma', 'ฝ้า กระ และจุดสีน้ำตาล', ['Hydroquinone', 'Vitamin C', 'Pico Laser']),
      metric('redAreas', 'Red Areas', 'จุดแดง', 70, 'Redness, inflammation, and vascular issues', 'รอยแดง การอักเสบ และปัญหาหลอดเลือด', ['Azelaic Acid', 'Vascular Laser', 'Anti-redness Cream']),
      metric('porphyrins', 'Porphyrins', 'แบคทีเรีย', 68, 'Bacterial presence in pores (acne indicator)', 'แบคทีเรียในรูขุมขน (ตัวบ่งชี้สิว)', ['Blue Light Therapy', 'Salicylic Acid', 'Extraction Facial']),
    ];
  }

  /**
   * Calculate overall skin score from individual metrics
   */
  private static calculateOverallScore(metrics: SkinMetric[]): number {
    const weights: Record<SkinMetric['id'], number> = {
      spots: 0.12,
      wrinkles: 0.18,
      texture: 0.12,
      pores: 0.13,
      uvSpots: 0.15,
      brownSpots: 0.10,
      redAreas: 0.10,
      porphyrins: 0.10
    };

    const weightedScore = metrics.reduce((sum, metric) => {
      const weight = weights[metric.id] || 0.125;
      return sum + (metric.score * weight);
    }, 0);

    return Math.round(weightedScore);
  }

  /**
   * Estimate skin age based on metrics and actual age
   */
  private static calculateSkinAge(metrics: SkinMetric[], actualAge: number): number {
    const overallScore = this.calculateOverallScore(metrics);
    // Higher score = younger skin age
    // Base: actual age, adjust by score deviation from 70 (average)
    const scoreDeviation = (overallScore - 70) / 10;
    const skinAge = Math.max(18, Math.min(80, actualAge - (scoreDeviation * 3)));
    return Math.round(skinAge);
  }

  /**
   * Calculate percentile for a given score and age
   */
  private static calculatePercentile(score: number, age: number): number {
    // Simplified percentile calculation
    // In production, this would use real population data
    const basePercentile = (score / 100) * 80 + 10;
    const ageAdjustment = Math.max(-20, Math.min(20, (35 - age) * 0.5));
    return Math.round(Math.max(5, Math.min(95, basePercentile + ageAdjustment)));
  }

  /**
   * Generate summary insights from metrics
   */
  private static generateSummary(metrics: SkinMetric[]): {
    strengths: string[];
    concerns: string[];
    priorityTreatments: string[];
  } {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const priorityTreatments: string[] = [];

    metrics.forEach(metric => {
      if (metric.score >= 80) {
        strengths.push(`${metric.nameThai}: ${metric.score}%`);
      } else if (metric.score < 60) {
        concerns.push(`${metric.nameThai}: ${metric.score}%`);
        priorityTreatments.push(...metric.recommendations.slice(0, 2));
      }
    });

    // Add general insights
    if (strengths.length === 0) strengths.push('จุดแข็ง: ควรเริ่มดูแลอย่างสม่ำเสมอ');
    if (concerns.length === 0) concerns.push('จุดที่ควรปรับปรุง: รักษารูทีนเดิมและป้องกันแดด');

    return { strengths, concerns, priorityTreatments };
  }

  /**
   * Get age group classification
   */
  private static getAgeGroup(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  /**
   * Calculate skin metrics from VISIA signals
   */
  static calculateFromSignals(age: number, visiaSignals: Record<string, number>): SkinMetricsResult {
    const metrics = this.calculateMetrics(age, visiaSignals);
    const overallScore = this.calculateOverallScore(metrics);
    const skinAge = this.calculateSkinAge(metrics, age);
    
    return {
      analysisId: `SKN-${Date.now()}`,
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
   * Calculate basic metrics for demo/testing
   */
  static calculateBasicMetrics(age: number = 35): SkinMetricsResult {
    // Use sample result as basic metrics for demo/testing
    return this.getSampleResult(age);
  }

  /**
   * Get sample result for demo purposes
   */
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
   * Get severity color for UI display
   */
  static getSeverityColor(severity: SkinMetricSeverity | 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'average': return '#eab308';
      case 'concern': return '#f97316';
      case 'severe': return '#ef4444';
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  }

  /**
   * Get severity label in Thai
   */
  static getSeverityLabelThai(severity: SkinMetricSeverity | 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'excellent': return 'ดีเยี่ยม';
      case 'good': return 'ดี';
      case 'average': return 'ปานกลาง';
      case 'concern': return 'ควรปรับปรุง';
      case 'severe': return 'ต้องดูแล';
      case 'low': return 'เล็กน้อย';
      case 'medium': return 'ปานกลาง';
      case 'high': return 'รุนแรง';
      default: return 'ไม่ทราบ';
    }
  }
}

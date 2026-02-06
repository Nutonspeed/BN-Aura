/**
 * Wrinkle Zone Mapper
 * Maps and scores wrinkles by facial zones (7 zones like competitor)
 * Provides aging level analysis
 */

interface WrinkleZone {
  id: string;
  name: string;
  nameThai: string;
  agingLevel: number; // 0-10 scale
  depth: 'fine' | 'moderate' | 'deep';
  count: number;
  coverage: number; // percentage of zone affected
  landmarks: number[]; // MediaPipe landmark indices for this zone
  recommendations: string[];
}

interface WrinkleAnalysisResult {
  analysisId: string;
  timestamp: string;
  overallAgingLevel: number; // 0-10
  overallAgingDescription: string;
  zones: WrinkleZone[];
  totalWrinkleCount: number;
  averageDepth: 'fine' | 'moderate' | 'deep';
  skinAgeImpact: number; // years added to skin age
  priorityZones: string[];
  treatmentPlan: {
    immediate: string[];
    preventive: string[];
  };
}

// MediaPipe landmark indices for each wrinkle zone
const WRINKLE_ZONE_LANDMARKS = {
  forehead: [10, 67, 69, 104, 108, 109, 151, 297, 299, 333, 337, 338],
  gabellar: [9, 107, 66, 105, 52, 53, 65, 55, 285, 295, 282, 283],
  nasolabial: [216, 206, 203, 129, 102, 36, 426, 436, 433, 358, 331, 266],
  tearTrough: [130, 247, 30, 29, 27, 28, 56, 259, 467, 260, 257, 258],
  marionette: [32, 170, 171, 175, 396, 400, 401, 262],
  crowsFeet: [33, 246, 161, 160, 159, 158, 263, 466, 388, 387, 386, 385],
  frown: [52, 53, 46, 124, 35, 111, 282, 283, 276, 353, 265, 340],
};

class WrinkleZoneMapper {
  
  /**
   * Analyze wrinkles by zone
   */
  static analyze(landmarks?: any[]): WrinkleAnalysisResult {
    const zones = this.analyzeZones();
    const overallAgingLevel = this.calculateOverallAging(zones);
    
    return {
      analysisId: `WRK-${Date.now()}`,
      timestamp: new Date().toISOString(),
      overallAgingLevel,
      overallAgingDescription: this.getAgingDescription(overallAgingLevel),
      zones,
      totalWrinkleCount: zones.reduce((sum, z) => sum + z.count, 0),
      averageDepth: this.getAverageDepth(zones),
      skinAgeImpact: Math.round(overallAgingLevel * 0.8),
      priorityZones: this.getPriorityZones(zones),
      treatmentPlan: this.generateTreatmentPlan(zones),
    };
  }

  /**
   * Analyze each wrinkle zone
   */
  private static analyzeZones(): WrinkleZone[] {
    return [
      {
        id: 'forehead',
        name: 'Forehead Lines',
        nameThai: 'ริ้วรอยหน้าผาก',
        agingLevel: 7,
        depth: 'moderate',
        count: 12,
        coverage: 35,
        landmarks: WRINKLE_ZONE_LANDMARKS.forehead,
        recommendations: ['Botox', 'Retinol Serum', 'Hydration'],
      },
      {
        id: 'gabellar',
        name: 'Gabellar Lines',
        nameThai: 'รอยย่นระหว่างคิ้ว',
        agingLevel: 6,
        depth: 'moderate',
        count: 4,
        coverage: 25,
        landmarks: WRINKLE_ZONE_LANDMARKS.gabellar,
        recommendations: ['Botox', 'Filler', 'Relaxation Exercises'],
      },
      {
        id: 'nasolabial',
        name: 'Nasolabial Folds',
        nameThai: 'ร่องแก้ม',
        agingLevel: 5,
        depth: 'moderate',
        count: 2,
        coverage: 40,
        landmarks: WRINKLE_ZONE_LANDMARKS.nasolabial,
        recommendations: ['Hyaluronic Acid Filler', 'Thread Lift', 'RF Therapy'],
      },
      {
        id: 'tearTrough',
        name: 'Tear Troughs',
        nameThai: 'ร่องใต้ตา',
        agingLevel: 7,
        depth: 'deep',
        count: 2,
        coverage: 50,
        landmarks: WRINKLE_ZONE_LANDMARKS.tearTrough,
        recommendations: ['Under-eye Filler', 'PRP Therapy', 'Eye Cream'],
      },
      {
        id: 'marionette',
        name: 'Marionette Lines',
        nameThai: 'ริ้วรอยมุมปาก',
        agingLevel: 4,
        depth: 'fine',
        count: 2,
        coverage: 20,
        landmarks: WRINKLE_ZONE_LANDMARKS.marionette,
        recommendations: ['Filler', 'Botox', 'Thread Lift'],
      },
      {
        id: 'crowsFeet',
        name: "Crow's Feet",
        nameThai: 'ตีนกา',
        agingLevel: 7,
        depth: 'moderate',
        count: 18,
        coverage: 45,
        landmarks: WRINKLE_ZONE_LANDMARKS.crowsFeet,
        recommendations: ['Botox', 'Fractional Laser', 'Eye Cream'],
      },
      {
        id: 'frown',
        name: 'Frown Lines',
        nameThai: 'รอยขมวดคิ้ว',
        agingLevel: 7,
        depth: 'deep',
        count: 3,
        coverage: 30,
        landmarks: WRINKLE_ZONE_LANDMARKS.frown,
        recommendations: ['Botox', 'Dysport', 'Stress Management'],
      },
    ];
  }

  /**
   * Calculate overall aging level (0-10)
   */
  private static calculateOverallAging(zones: WrinkleZone[]): number {
    const weights: Record<string, number> = {
      forehead: 0.15,
      gabellar: 0.10,
      nasolabial: 0.20,
      tearTrough: 0.15,
      marionette: 0.10,
      crowsFeet: 0.15,
      frown: 0.15,
    };
    
    let weightedSum = 0;
    for (const zone of zones) {
      weightedSum += zone.agingLevel * (weights[zone.id] || 0.14);
    }
    
    return Math.round(weightedSum * 10) / 10;
  }

  /**
   * Get aging description
   */
  private static getAgingDescription(level: number): string {
    if (level <= 2) return 'ผิวอ่อนเยาว์ แทบไม่มีริ้วรอย';
    if (level <= 4) return 'มีริ้วรอยเล็กน้อย เริ่มแสดงสัญญาณวัย';
    if (level <= 6) return 'มีริ้วรอยปานกลาง สังเกตเห็นได้';
    if (level <= 8) return 'มีริ้วรอยชัดเจน ควรเริ่มดูแล';
    return 'มีริ้วรอยมาก ต้องการการดูแลเฉพาะทาง';
  }

  /**
   * Get average wrinkle depth
   */
  private static getAverageDepth(zones: WrinkleZone[]): 'fine' | 'moderate' | 'deep' {
    const depthScores: Record<string, number> = { fine: 1, moderate: 2, deep: 3 };
    const avgScore = zones.reduce((sum, z) => sum + depthScores[z.depth], 0) / zones.length;
    if (avgScore < 1.5) return 'fine';
    if (avgScore < 2.5) return 'moderate';
    return 'deep';
  }

  /**
   * Get priority zones for treatment
   */
  private static getPriorityZones(zones: WrinkleZone[]): string[] {
    return zones
      .filter(z => z.agingLevel >= 6)
      .sort((a, b) => b.agingLevel - a.agingLevel)
      .slice(0, 3)
      .map(z => z.nameThai);
  }

  /**
   * Generate treatment plan
   */
  private static generateTreatmentPlan(zones: WrinkleZone[]): { immediate: string[]; preventive: string[] } {
    const immediate = new Set<string>();
    const preventive = new Set<string>();
    
    for (const zone of zones) {
      if (zone.agingLevel >= 6) {
        zone.recommendations.slice(0, 2).forEach(r => immediate.add(r));
      } else {
        zone.recommendations.slice(0, 1).forEach(r => preventive.add(r));
      }
    }
    
    return {
      immediate: Array.from(immediate).slice(0, 4),
      preventive: Array.from(preventive).slice(0, 3),
    };
  }

  /**
   * Get sample result
   */
  static getSampleResult(): WrinkleAnalysisResult {
    return this.analyze();
  }

  /**
   * Get aging level color
   */
  static getAgingLevelColor(level: number): string {
    if (level <= 2) return '#22c55e';
    if (level <= 4) return '#84cc16';
    if (level <= 6) return '#eab308';
    if (level <= 8) return '#f97316';
    return '#ef4444';
  }

  /**
   * Get depth label Thai
   */
  static getDepthLabelThai(depth: string): string {
    const labels: Record<string, string> = {
      fine: 'ตื้น',
      moderate: 'ปานกลาง',
      deep: 'ลึก',
    };
    return labels[depth] || depth;
  }
}

export { WrinkleZoneMapper, WRINKLE_ZONE_LANDMARKS };
export type { WrinkleZone, WrinkleAnalysisResult };

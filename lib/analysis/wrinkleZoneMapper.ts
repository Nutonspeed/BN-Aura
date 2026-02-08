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
  private static analyzeZones(age: number = 35, wrinkleScore: number = 60): WrinkleZone[] {
    const baseAging = Math.max(1, Math.min(9, Math.round((age - 15) / 6)));
    const scoreAdj = Math.round((50 - wrinkleScore) / 20);
    const zoneConfigs: Array<{ id: string; name: string; nameThai: string; sensitivity: number; landmarks: number[]; recommendations: string[] }> = [
      { id: 'forehead', name: 'Forehead Lines', nameThai: 'ริ้วรอยหน้าผาก', sensitivity: 1.1, landmarks: WRINKLE_ZONE_LANDMARKS.forehead, recommendations: ['Botox', 'Retinol Serum', 'Hydration'] },
      { id: 'gabellar', name: 'Gabellar Lines', nameThai: 'รอยย่นระหว่างคิ้ว', sensitivity: 0.9, landmarks: WRINKLE_ZONE_LANDMARKS.gabellar, recommendations: ['Botox', 'Filler', 'Relaxation Exercises'] },
      { id: 'nasolabial', name: 'Nasolabial Folds', nameThai: 'ร่องแก้ม', sensitivity: 0.85, landmarks: WRINKLE_ZONE_LANDMARKS.nasolabial, recommendations: ['Hyaluronic Acid Filler', 'Thread Lift', 'RF Therapy'] },
      { id: 'tearTrough', name: 'Tear Troughs', nameThai: 'ร่องใต้ตา', sensitivity: 1.15, landmarks: WRINKLE_ZONE_LANDMARKS.tearTrough, recommendations: ['Under-eye Filler', 'PRP Therapy', 'Eye Cream'] },
      { id: 'marionette', name: 'Marionette Lines', nameThai: 'ริ้วรอยมุมปาก', sensitivity: 0.7, landmarks: WRINKLE_ZONE_LANDMARKS.marionette, recommendations: ['Filler', 'Botox', 'Thread Lift'] },
      { id: 'crowsFeet', name: "Crow's Feet", nameThai: 'ตีนกา', sensitivity: 1.1, landmarks: WRINKLE_ZONE_LANDMARKS.crowsFeet, recommendations: ['Botox', 'Fractional Laser', 'Eye Cream'] },
      { id: 'frown', name: 'Frown Lines', nameThai: 'รอยขมวดคิ้ว', sensitivity: 1.0, landmarks: WRINKLE_ZONE_LANDMARKS.frown, recommendations: ['Botox', 'Dysport', 'Stress Management'] },
    ];
    return zoneConfigs.map(zone => {
      const agingLevel = Math.max(1, Math.min(10, Math.round((baseAging + scoreAdj) * zone.sensitivity)));
      const depth: 'fine' | 'moderate' | 'deep' = agingLevel <= 3 ? 'fine' : agingLevel <= 6 ? 'moderate' : 'deep';
      const coverage = Math.round(Math.min(60, agingLevel * 7));
      const count = Math.max(1, Math.round(agingLevel * (zone.id === 'crowsFeet' ? 3 : zone.id === 'forehead' ? 2 : 0.5)));
      return { id: zone.id, name: zone.name, nameThai: zone.nameThai, agingLevel, depth, count, coverage, landmarks: zone.landmarks, recommendations: zone.recommendations };
    });
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
  static analyzeFromData(age: number, wrinkleScore: number): WrinkleAnalysisResult {
    const zones = this.analyzeZones(age, wrinkleScore);
    const overallAgingLevel = this.calculateOverallAging(zones);
    return {
      analysisId: `WRK-AI-${Date.now()}`,
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

  static getSampleResult(age: number = 35): WrinkleAnalysisResult {
    return this.analyzeFromData(age, 60);
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

/**
 * AR Treatment Preview Engine
 * Shows simulated before/after results for different treatments
 * Key differentiator - customers see results BEFORE committing
 */

interface TreatmentSimulation {
  treatmentId: string;
  name: string;
  nameThai: string;
  category: 'laser' | 'injection' | 'facial' | 'skincare';
  targetAreas: string[];
  expectedResults: SimulatedResult;
  confidence: number;
  sessions: number;
  timeToResults: string;
}

interface SimulatedResult {
  overallImprovement: number; // percentage
  metrics: {
    spots: { before: number; after: number; improvement: number };
    wrinkles: { before: number; after: number; improvement: number };
    pores: { before: number; after: number; improvement: number };
    texture: { before: number; after: number; improvement: number };
    brightness: { before: number; after: number; improvement: number };
    firmness: { before: number; after: number; improvement: number };
  };
  visualChanges: string[];
}

interface ARPreviewResult {
  previewId: string;
  timestamp: string;
  currentSkinScore: number;
  projectedSkinScore: number;
  selectedTreatments: TreatmentSimulation[];
  combinedResults: SimulatedResult;
  beforeAfterComparison: {
    skinScoreBefore: number;
    skinScoreAfter: number;
    skinAgeBefore: number;
    skinAgeAfter: number;
    improvementPercentage: number;
  };
  recommendation: {
    bestValue: string;
    quickestResults: string;
    mostEffective: string;
  };
}

class ARTreatmentPreview {
  
  /**
   * Get available treatments with simulated results
   */
  static getAvailableTreatments(currentMetrics: any): TreatmentSimulation[] {
    return [
      {
        treatmentId: 'laser-toning',
        name: 'Laser Toning',
        nameThai: 'เลเซอร์โทนนิ่ง',
        category: 'laser',
        targetAreas: ['ฝ้า', 'กระ', 'จุดด่างดำ'],
        expectedResults: {
          overallImprovement: 65,
          metrics: {
            spots: { before: 35, after: 75, improvement: 114 },
            wrinkles: { before: 58, after: 65, improvement: 12 },
            pores: { before: 42, after: 55, improvement: 31 },
            texture: { before: 70, after: 82, improvement: 17 },
            brightness: { before: 55, after: 80, improvement: 45 },
            firmness: { before: 65, after: 70, improvement: 8 },
          },
          visualChanges: ['ผิวกระจ่างใสขึ้น 45%', 'ฝ้าจางลง 60%', 'สีผิวสม่ำเสมอขึ้น'],
        },
        confidence: 92,
        sessions: 4,
        timeToResults: '4-6 สัปดาห์',
      },
      {
        treatmentId: 'botox',
        name: 'Botox',
        nameThai: 'โบท็อกซ์',
        category: 'injection',
        targetAreas: ['ริ้วรอยหน้าผาก', 'ตีนกา', 'รอยขมวดคิ้ว'],
        expectedResults: {
          overallImprovement: 70,
          metrics: {
            spots: { before: 35, after: 35, improvement: 0 },
            wrinkles: { before: 58, after: 88, improvement: 52 },
            pores: { before: 42, after: 42, improvement: 0 },
            texture: { before: 70, after: 75, improvement: 7 },
            brightness: { before: 55, after: 55, improvement: 0 },
            firmness: { before: 65, after: 80, improvement: 23 },
          },
          visualChanges: ['ริ้วรอยลดลง 70%', 'หน้าผากเรียบขึ้น', 'ดูอ่อนเยาว์ขึ้น 3-5 ปี'],
        },
        confidence: 95,
        sessions: 1,
        timeToResults: '3-7 วัน',
      },
      {
        treatmentId: 'hydrafacial',
        name: 'HydraFacial',
        nameThai: 'ไฮดราเฟเชียล',
        category: 'facial',
        targetAreas: ['ความชุ่มชื้น', 'รูขุมขน', 'สิวอุดตัน'],
        expectedResults: {
          overallImprovement: 45,
          metrics: {
            spots: { before: 35, after: 45, improvement: 29 },
            wrinkles: { before: 58, after: 62, improvement: 7 },
            pores: { before: 42, after: 65, improvement: 55 },
            texture: { before: 70, after: 88, improvement: 26 },
            brightness: { before: 55, after: 75, improvement: 36 },
            firmness: { before: 65, after: 68, improvement: 5 },
          },
          visualChanges: ['ผิวชุ่มชื้นทันที', 'รูขุมขนสะอาดขึ้น 55%', 'ผิวนุ่มเนียน'],
        },
        confidence: 98,
        sessions: 1,
        timeToResults: 'ทันที',
      },
      {
        treatmentId: 'carbon-peel',
        name: 'Carbon Peel Laser',
        nameThai: 'คาร์บอนพีล',
        category: 'laser',
        targetAreas: ['รูขุมขนกว้าง', 'ผิวมัน', 'สิว'],
        expectedResults: {
          overallImprovement: 50,
          metrics: {
            spots: { before: 35, after: 50, improvement: 43 },
            wrinkles: { before: 58, after: 60, improvement: 3 },
            pores: { before: 42, after: 72, improvement: 71 },
            texture: { before: 70, after: 85, improvement: 21 },
            brightness: { before: 55, after: 70, improvement: 27 },
            firmness: { before: 65, after: 68, improvement: 5 },
          },
          visualChanges: ['รูขุมขนกระชับ 40%', 'ควบคุมความมัน', 'ผิวเรียบเนียน'],
        },
        confidence: 90,
        sessions: 3,
        timeToResults: '2-3 สัปดาห์',
      },
      {
        treatmentId: 'filler',
        name: 'Dermal Filler',
        nameThai: 'ฟิลเลอร์',
        category: 'injection',
        targetAreas: ['ร่องแก้ม', 'ใต้ตา', 'ริมฝีปาก'],
        expectedResults: {
          overallImprovement: 60,
          metrics: {
            spots: { before: 35, after: 35, improvement: 0 },
            wrinkles: { before: 58, after: 78, improvement: 34 },
            pores: { before: 42, after: 42, improvement: 0 },
            texture: { before: 70, after: 72, improvement: 3 },
            brightness: { before: 55, after: 55, improvement: 0 },
            firmness: { before: 65, after: 85, improvement: 31 },
          },
          visualChanges: ['เติมเต็มร่องลึก', 'หน้าอิ่มเด้ง', 'ดูอ่อนเยาว์ขึ้น'],
        },
        confidence: 93,
        sessions: 1,
        timeToResults: 'ทันที',
      },
    ];
  }

  /**
   * Generate AR preview for selected treatments
   */
  static generatePreview(
    currentSkinScore: number,
    currentSkinAge: number,
    selectedTreatmentIds: string[]
  ): ARPreviewResult {
    const allTreatments = this.getAvailableTreatments({});
    const selectedTreatments = allTreatments.filter(t => 
      selectedTreatmentIds.includes(t.treatmentId)
    );

    // Calculate combined results
    const combinedResults = this.combineResults(selectedTreatments);
    
    // Calculate projected scores
    const avgImprovement = selectedTreatments.reduce((sum, t) => 
      sum + t.expectedResults.overallImprovement, 0) / selectedTreatments.length;
    
    const projectedSkinScore = Math.min(98, Math.round(currentSkinScore + avgImprovement * 0.3));
    const projectedSkinAge = Math.max(currentSkinAge - 5, currentSkinAge - Math.round(avgImprovement / 15));

    return {
      previewId: `AR-${Date.now()}`,
      timestamp: new Date().toISOString(),
      currentSkinScore,
      projectedSkinScore,
      selectedTreatments,
      combinedResults,
      beforeAfterComparison: {
        skinScoreBefore: currentSkinScore,
        skinScoreAfter: projectedSkinScore,
        skinAgeBefore: currentSkinAge,
        skinAgeAfter: projectedSkinAge,
        improvementPercentage: Math.round(((projectedSkinScore - currentSkinScore) / currentSkinScore) * 100),
      },
      recommendation: {
        bestValue: 'HydraFacial',
        quickestResults: 'Botox',
        mostEffective: 'Laser Toning + Botox',
      },
    };
  }

  /**
   * Combine results from multiple treatments
   */
  private static combineResults(treatments: TreatmentSimulation[]): SimulatedResult {
    if (treatments.length === 0) {
      return {
        overallImprovement: 0,
        metrics: {
          spots: { before: 35, after: 35, improvement: 0 },
          wrinkles: { before: 58, after: 58, improvement: 0 },
          pores: { before: 42, after: 42, improvement: 0 },
          texture: { before: 70, after: 70, improvement: 0 },
          brightness: { before: 55, after: 55, improvement: 0 },
          firmness: { before: 65, after: 65, improvement: 0 },
        },
        visualChanges: [],
      };
    }

    // Take the best improvement for each metric
    const metrics = {
      spots: { before: 35, after: 35, improvement: 0 },
      wrinkles: { before: 58, after: 58, improvement: 0 },
      pores: { before: 42, after: 42, improvement: 0 },
      texture: { before: 70, after: 70, improvement: 0 },
      brightness: { before: 55, after: 55, improvement: 0 },
      firmness: { before: 65, after: 65, improvement: 0 },
    };

    const visualChanges: string[] = [];

    for (const treatment of treatments) {
      const r = treatment.expectedResults.metrics;
      if (r.spots.after > metrics.spots.after) metrics.spots = r.spots;
      if (r.wrinkles.after > metrics.wrinkles.after) metrics.wrinkles = r.wrinkles;
      if (r.pores.after > metrics.pores.after) metrics.pores = r.pores;
      if (r.texture.after > metrics.texture.after) metrics.texture = r.texture;
      if (r.brightness.after > metrics.brightness.after) metrics.brightness = r.brightness;
      if (r.firmness.after > metrics.firmness.after) metrics.firmness = r.firmness;
      
      visualChanges.push(...treatment.expectedResults.visualChanges);
    }

    const avgImprovement = treatments.reduce((sum, t) => 
      sum + t.expectedResults.overallImprovement, 0) / treatments.length;

    return {
      overallImprovement: Math.round(avgImprovement),
      metrics,
      visualChanges: [...new Set(visualChanges)].slice(0, 5),
    };
  }

  /**
   * Get sample preview result
   */
  static getSampleResult(): ARPreviewResult {
    return this.generatePreview(72, 38, ['laser-toning', 'hydrafacial']);
  }
}

export { ARTreatmentPreview };
export type { ARPreviewResult, TreatmentSimulation, SimulatedResult };

/**
 * Facial Symmetry Analyzer
 * Calculates facial symmetry, golden ratio, and facial measurements
 * Using MediaPipe 468 landmarks
 */

// MediaPipe Face Mesh landmark indices for key facial points
const LANDMARK_INDICES = {
  // Facial outline
  leftCheek: 234,
  rightCheek: 454,
  chin: 152,
  foreheadTop: 10,
  
  // Eyes
  leftEyeInner: 133,
  leftEyeOuter: 33,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  leftEyeTop: 159,
  leftEyeBottom: 145,
  rightEyeTop: 386,
  rightEyeBottom: 374,
  
  // Eyebrows
  leftEyebrowInner: 107,
  leftEyebrowOuter: 66,
  rightEyebrowInner: 336,
  rightEyebrowOuter: 296,
  
  // Nose
  noseTip: 1,
  noseBottom: 2,
  noseLeft: 129,
  noseRight: 358,
  noseBridge: 6,
  
  // Mouth
  upperLipTop: 13,
  lowerLipBottom: 14,
  mouthLeft: 61,
  mouthRight: 291,
  
  // Jawline
  leftJaw: 172,
  rightJaw: 397,
  
  // Cheekbones
  leftCheekbone: 123,
  rightCheekbone: 352,
};

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface FacialMeasurement {
  name: string;
  nameThai: string;
  value: number;
  idealRange: { min: number; max: number };
  score: number; // 0-100
  status: 'excellent' | 'good' | 'average' | 'below_average';
}

interface SymmetryResult {
  overallSymmetry: number; // 0-100%
  goldenRatio: number; // ideally 1.618
  goldenRatioScore: number; // how close to 1.618
  measurements: FacialMeasurement[];
  keyInsights: string[];
  facialThirds: {
    upper: number;
    middle: number;
    lower: number;
    balance: number;
  };
  leftRightComparison: {
    eyeSymmetry: number;
    cheekboneSymmetry: number;
    jawlineSymmetry: number;
    overallBalance: number;
  };
}

class FacialSymmetryAnalyzer {
  
  /**
   * Calculate distance between two 3D points
   */
  private static distance(p1: Point3D, p2: Point3D): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2) + 
      Math.pow(p2.z - p1.z, 2)
    );
  }

  /**
   * Calculate 2D distance (ignoring depth)
   */
  private static distance2D(p1: Point3D, p2: Point3D): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2)
    );
  }

  /**
   * Get midpoint between two points
   */
  private static midpoint(p1: Point3D, p2: Point3D): Point3D {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      z: (p1.z + p2.z) / 2,
    };
  }

  /**
   * Analyze facial symmetry from MediaPipe landmarks
   */
  static analyze(landmarks: Point3D[]): SymmetryResult {
    if (landmarks.length < 468) {
      throw new Error('Invalid landmarks: expected 468 points from MediaPipe Face Mesh');
    }

    // Extract key points
    const points = {
      leftCheek: landmarks[LANDMARK_INDICES.leftCheek],
      rightCheek: landmarks[LANDMARK_INDICES.rightCheek],
      chin: landmarks[LANDMARK_INDICES.chin],
      foreheadTop: landmarks[LANDMARK_INDICES.foreheadTop],
      leftEyeInner: landmarks[LANDMARK_INDICES.leftEyeInner],
      leftEyeOuter: landmarks[LANDMARK_INDICES.leftEyeOuter],
      rightEyeInner: landmarks[LANDMARK_INDICES.rightEyeInner],
      rightEyeOuter: landmarks[LANDMARK_INDICES.rightEyeOuter],
      noseTip: landmarks[LANDMARK_INDICES.noseTip],
      noseBottom: landmarks[LANDMARK_INDICES.noseBottom],
      noseBridge: landmarks[LANDMARK_INDICES.noseBridge],
      upperLipTop: landmarks[LANDMARK_INDICES.upperLipTop],
      lowerLipBottom: landmarks[LANDMARK_INDICES.lowerLipBottom],
      mouthLeft: landmarks[LANDMARK_INDICES.mouthLeft],
      mouthRight: landmarks[LANDMARK_INDICES.mouthRight],
      leftJaw: landmarks[LANDMARK_INDICES.leftJaw],
      rightJaw: landmarks[LANDMARK_INDICES.rightJaw],
      leftCheekbone: landmarks[LANDMARK_INDICES.leftCheekbone],
      rightCheekbone: landmarks[LANDMARK_INDICES.rightCheekbone],
      leftEyebrowInner: landmarks[LANDMARK_INDICES.leftEyebrowInner],
      rightEyebrowInner: landmarks[LANDMARK_INDICES.rightEyebrowInner],
    };

    // Calculate facial center line
    const facialCenter = this.midpoint(points.leftCheek, points.rightCheek);

    // 1. Calculate Golden Ratio (face length / face width)
    const faceLength = this.distance2D(points.foreheadTop, points.chin);
    const faceWidth = this.distance2D(points.leftCheek, points.rightCheek);
    const goldenRatio = faceLength / faceWidth;
    const goldenRatioScore = Math.max(0, 100 - Math.abs(goldenRatio - 1.618) * 100);

    // 2. Calculate Facial Thirds
    const upperThird = this.distance2D(points.foreheadTop, points.noseBridge);
    const middleThird = this.distance2D(points.noseBridge, points.noseBottom);
    const lowerThird = this.distance2D(points.noseBottom, points.chin);
    const totalFace = upperThird + middleThird + lowerThird;
    const facialThirds = {
      upper: (upperThird / totalFace) * 100,
      middle: (middleThird / totalFace) * 100,
      lower: (lowerThird / totalFace) * 100,
      balance: this.calculateThirdsBalance(upperThird, middleThird, lowerThird),
    };

    // 3. Calculate Left-Right Symmetry
    const leftEyeWidth = this.distance2D(points.leftEyeInner, points.leftEyeOuter);
    const rightEyeWidth = this.distance2D(points.rightEyeInner, points.rightEyeOuter);
    const eyeSymmetry = Math.min(leftEyeWidth, rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth) * 100;

    const leftCheekboneDist = this.distance2D(facialCenter, points.leftCheekbone);
    const rightCheekboneDist = this.distance2D(facialCenter, points.rightCheekbone);
    const cheekboneSymmetry = Math.min(leftCheekboneDist, rightCheekboneDist) / Math.max(leftCheekboneDist, rightCheekboneDist) * 100;

    const leftJawDist = this.distance2D(facialCenter, points.leftJaw);
    const rightJawDist = this.distance2D(facialCenter, points.rightJaw);
    const jawlineSymmetry = Math.min(leftJawDist, rightJawDist) / Math.max(leftJawDist, rightJawDist) * 100;

    const leftRightComparison = {
      eyeSymmetry,
      cheekboneSymmetry,
      jawlineSymmetry,
      overallBalance: (eyeSymmetry + cheekboneSymmetry + jawlineSymmetry) / 3,
    };

    // 4. Calculate Overall Symmetry
    const overallSymmetry = (
      goldenRatioScore * 0.25 +
      facialThirds.balance * 0.25 +
      leftRightComparison.overallBalance * 0.5
    );

    // 5. Calculate Detailed Measurements
    const measurements = this.calculateMeasurements(points, faceWidth, faceLength);

    // 6. Generate Key Insights
    const keyInsights = this.generateInsights(overallSymmetry, goldenRatio, facialThirds, leftRightComparison);

    return {
      overallSymmetry: Math.round(overallSymmetry * 10) / 10,
      goldenRatio: Math.round(goldenRatio * 1000) / 1000,
      goldenRatioScore: Math.round(goldenRatioScore * 10) / 10,
      measurements,
      keyInsights,
      facialThirds: {
        upper: Math.round(facialThirds.upper * 10) / 10,
        middle: Math.round(facialThirds.middle * 10) / 10,
        lower: Math.round(facialThirds.lower * 10) / 10,
        balance: Math.round(facialThirds.balance * 10) / 10,
      },
      leftRightComparison: {
        eyeSymmetry: Math.round(eyeSymmetry * 10) / 10,
        cheekboneSymmetry: Math.round(cheekboneSymmetry * 10) / 10,
        jawlineSymmetry: Math.round(jawlineSymmetry * 10) / 10,
        overallBalance: Math.round(leftRightComparison.overallBalance * 10) / 10,
      },
    };
  }

  /**
   * Calculate balance of facial thirds (ideal is 33.3% each)
   */
  private static calculateThirdsBalance(upper: number, middle: number, lower: number): number {
    const total = upper + middle + lower;
    const ideal = total / 3;
    const deviation = (
      Math.abs(upper - ideal) +
      Math.abs(middle - ideal) +
      Math.abs(lower - ideal)
    ) / total;
    return Math.max(0, 100 - deviation * 200);
  }

  /**
   * Calculate detailed facial measurements
   */
  private static calculateMeasurements(points: any, faceWidth: number, faceLength: number): FacialMeasurement[] {
    // Eye distance ratio (interpupillary distance / face width)
    const eyeCenter = this.midpoint(
      this.midpoint(points.leftEyeInner, points.leftEyeOuter),
      this.midpoint(points.rightEyeInner, points.rightEyeOuter)
    );
    const leftEyeCenter = this.midpoint(points.leftEyeInner, points.leftEyeOuter);
    const rightEyeCenter = this.midpoint(points.rightEyeInner, points.rightEyeOuter);
    const interpupillaryDist = this.distance2D(leftEyeCenter, rightEyeCenter);
    const eyeDistanceRatio = interpupillaryDist / faceWidth;

    // Nose-mouth proportion
    const noseLength = this.distance2D(points.noseBridge, points.noseBottom);
    const mouthWidth = this.distance2D(points.mouthLeft, points.mouthRight);
    const noseMouthRatio = noseLength / mouthWidth;

    return [
      {
        name: 'Eye Distance Ratio',
        nameThai: 'สัดส่วนระยะห่างตา',
        value: Math.round(eyeDistanceRatio * 100) / 100,
        idealRange: { min: 0.43, max: 0.47 },
        score: this.calculateMeasurementScore(eyeDistanceRatio, 0.43, 0.47, 0.45),
        status: this.getMeasurementStatus(eyeDistanceRatio, 0.43, 0.47),
      },
      {
        name: 'Nose-Mouth Proportion',
        nameThai: 'สัดส่วนจมูก-ปาก',
        value: Math.round(noseMouthRatio * 100) / 100,
        idealRange: { min: 0.9, max: 1.1 },
        score: this.calculateMeasurementScore(noseMouthRatio, 0.9, 1.1, 1.0),
        status: this.getMeasurementStatus(noseMouthRatio, 0.9, 1.1),
      },
      {
        name: 'Face Width-Length Ratio',
        nameThai: 'สัดส่วนความกว้าง-ยาวใบหน้า',
        value: Math.round((faceWidth / faceLength) * 100) / 100,
        idealRange: { min: 0.58, max: 0.68 },
        score: this.calculateMeasurementScore(faceWidth / faceLength, 0.58, 0.68, 0.618),
        status: this.getMeasurementStatus(faceWidth / faceLength, 0.58, 0.68),
      },
    ];
  }

  /**
   * Calculate measurement score based on ideal range
   */
  private static calculateMeasurementScore(value: number, min: number, max: number, ideal: number): number {
    if (value >= min && value <= max) {
      const distFromIdeal = Math.abs(value - ideal);
      const range = (max - min) / 2;
      return Math.round(100 - (distFromIdeal / range) * 20);
    }
    const distFromRange = value < min ? min - value : value - max;
    return Math.max(0, Math.round(80 - distFromRange * 100));
  }

  /**
   * Get measurement status
   */
  private static getMeasurementStatus(value: number, min: number, max: number): 'excellent' | 'good' | 'average' | 'below_average' {
    const mid = (min + max) / 2;
    const range = (max - min) / 2;
    const dist = Math.abs(value - mid);
    
    if (dist <= range * 0.3) return 'excellent';
    if (dist <= range * 0.6) return 'good';
    if (dist <= range * 1.2) return 'average';
    return 'below_average';
  }

  /**
   * Generate insights based on analysis
   */
  private static generateInsights(
    overallSymmetry: number,
    goldenRatio: number,
    facialThirds: any,
    leftRight: any
  ): string[] {
    const insights: string[] = [];

    // Overall symmetry insight
    if (overallSymmetry >= 90) {
      insights.push(`ค่าความสมมาตรใบหน้า ${overallSymmetry.toFixed(1)}% อยู่ในระดับดีเยี่ยม`);
    } else if (overallSymmetry >= 80) {
      insights.push(`ค่าความสมมาตรใบหน้า ${overallSymmetry.toFixed(1)}% อยู่ในระดับดี`);
    } else {
      insights.push(`ค่าความสมมาตรใบหน้า ${overallSymmetry.toFixed(1)}% มีความไม่สมมาตรเล็กน้อย`);
    }

    // Golden ratio insight
    if (Math.abs(goldenRatio - 1.618) < 0.1) {
      insights.push(`สัดส่วน Golden Ratio ${goldenRatio.toFixed(3)} ใกล้เคียงค่าในอุดมคติ (1.618)`);
    }

    // Eye symmetry
    if (leftRight.eyeSymmetry >= 95) {
      insights.push('ตำแหน่งและขนาดดวงตาทั้งสองข้างสมดุลดีมาก');
    } else if (leftRight.eyeSymmetry < 85) {
      insights.push('ดวงตาทั้งสองข้างมีความไม่สมมาตรเล็กน้อย ซึ่งเป็นเรื่องปกติ');
    }

    // Facial thirds
    if (facialThirds.balance >= 90) {
      insights.push('สัดส่วนใบหน้าแบ่ง 3 ส่วนได้สมดุลดี');
    }

    return insights;
  }

  /**
   * Get sample analysis result (for testing)
   */
  static getSampleResult(): SymmetryResult {
    return {
      overallSymmetry: 94.2,
      goldenRatio: 1.618,
      goldenRatioScore: 98.5,
      measurements: [
        { name: 'Eye Distance Ratio', nameThai: 'สัดส่วนระยะห่างตา', value: 0.45, idealRange: { min: 0.43, max: 0.47 }, score: 96, status: 'excellent' },
        { name: 'Nose-Mouth Proportion', nameThai: 'สัดส่วนจมูก-ปาก', value: 1.02, idealRange: { min: 0.9, max: 1.1 }, score: 98, status: 'excellent' },
        { name: 'Facial Thirds Balance', nameThai: 'สัดส่วนใบหน้า 3 ส่วน', value: 0.97, idealRange: { min: 0.95, max: 1.05 }, score: 97, status: 'excellent' },
        { name: 'Cheekbone Symmetry', nameThai: 'ความสมมาตรโหนกแก้ม', value: 0.95, idealRange: { min: 0.92, max: 1.0 }, score: 95, status: 'excellent' },
        { name: 'Jawline Balance', nameThai: 'ความสมดุลกราม', value: 0.94, idealRange: { min: 0.9, max: 1.0 }, score: 96, status: 'excellent' },
      ],
      keyInsights: [
        'ค่าความสมมาตรใบหน้า 94.2% อยู่ในระดับดีเยี่ยม',
        'สัดส่วน Golden Ratio 1.618 ใกล้เคียงค่าในอุดมคติ',
        'ตำแหน่งและขนาดดวงตาทั้งสองข้างสมดุลดีมาก',
        'สัดส่วนใบหน้าแบ่ง 3 ส่วนได้สมดุลดี',
      ],
      facialThirds: {
        upper: 33.2,
        middle: 33.5,
        lower: 33.3,
        balance: 98.5,
      },
      leftRightComparison: {
        eyeSymmetry: 96.8,
        cheekboneSymmetry: 94.5,
        jawlineSymmetry: 93.2,
        overallBalance: 94.8,
      },
    };
  }
}

export { FacialSymmetryAnalyzer, LANDMARK_INDICES };
export type { SymmetryResult, FacialMeasurement, Point3D };

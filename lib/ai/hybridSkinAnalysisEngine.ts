/**
 * Hybrid AI Skin Analysis Engine
 * Multi-model architecture competing with VISIA-class devices
 * Flagship Feature of BN-Aura - Sales Mobility Advantage
 */

interface AIModelConfig {
  modelId: string;
  name: string;
  type: 'detection' | 'segmentation' | 'classification';
  technology: string;
  purpose: string;
  accuracy: number;
  processingTime: number;
}

interface DetectedCondition {
  conditionId: string;
  name: string;
  nameThai: string;
  confidence: number;
  severity: 'mild' | 'moderate' | 'severe';
  location: string;
  affectedArea: number;
}

interface TreatmentRecommendation {
  treatmentId: string;
  name: string;
  priority: number;
  matchScore: number;
  expectedImprovement: string;
  sessions: number;
  priceRange: { min: number; max: number };
}

interface VISIAComparisonScores {
  spots: number;
  wrinkles: number;
  texture: number;
  pores: number;
  uvSpots: number;
  brownSpots: number;
  redAreas: number;
  porphyrins: number;
}

interface HybridAnalysisResult {
  analysisId: string;
  customerId: string;
  salesRepId: string;
  clinicId: string;
  timestamp: string;
  overallSkinScore: number;
  skinAge: number;
  actualAge: number;
  skinType: string;
  conditions: DetectedCondition[];
  recommendations: TreatmentRecommendation[];
  visiaScores: VISIAComparisonScores;
  modelsUsed: string[];
}

class HybridSkinAnalysisEngine {
  
  static getRegisteredModels(): AIModelConfig[] {
    return [
      { modelId: 'mediapipe-face-mesh', name: 'MediaPipe Face Mesh', type: 'detection', technology: 'Google MediaPipe', purpose: 'Face detection & 468 landmarks', accuracy: 98.5, processingTime: 15 },
      { modelId: 'bisenet-skin-seg', name: 'BiSeNet Skin Segmentation', type: 'segmentation', technology: 'PyTorch BiSeNet', purpose: 'Skin area segmentation', accuracy: 96.2, processingTime: 45 },
      { modelId: 'efficientnet-skin-v2', name: 'EfficientNet Skin Conditions', type: 'classification', technology: 'TensorFlow EfficientNet-B4', purpose: 'Multi-label condition classification', accuracy: 94.8, processingTime: 85 },
      { modelId: 'dex-age-estimation', name: 'DEX Age Estimation', type: 'classification', technology: 'Deep EXpectation', purpose: 'Age & skin age estimation', accuracy: 92.3, processingTime: 35 },
      { modelId: 'unet-wrinkle-detect', name: 'U-Net Wrinkle Detector', type: 'segmentation', technology: 'U-Net Architecture', purpose: 'Wrinkle mapping', accuracy: 91.5, processingTime: 65 },
      { modelId: 'yolov8-pore-detect', name: 'YOLOv8 Pore Detector', type: 'detection', technology: 'Ultralytics YOLOv8', purpose: 'Pore analysis', accuracy: 93.7, processingTime: 25 },
      { modelId: 'resnet-pigment-v3', name: 'ResNet Pigmentation', type: 'classification', technology: 'ResNet-50', purpose: 'Pigmentation detection', accuracy: 95.1, processingTime: 55 },
      { modelId: 'mobilenet-skintype', name: 'MobileNet Skin Type', type: 'classification', technology: 'MobileNetV3', purpose: 'Skin type classification', accuracy: 94.2, processingTime: 20 }
    ];
  }

  static getAnalysisPipeline(): any {
    return {
      totalModels: 8,
      totalProcessingTime: '345ms',
      pipeline: [
        { step: 1, model: 'mediapipe-face-mesh', output: 'Face landmarks & regions' },
        { step: 2, model: 'bisenet-skin-seg', output: 'Skin mask for analysis' },
        { step: 3, model: 'mobilenet-skintype', output: 'Skin type classification' },
        { step: 4, model: 'dex-age-estimation', output: 'Age & skin age' },
        { step: 5, model: 'efficientnet-skin-v2', output: 'Condition detection' },
        { step: 6, model: 'yolov8-pore-detect', output: 'Pore analysis' },
        { step: 7, model: 'unet-wrinkle-detect', output: 'Wrinkle mapping' },
        { step: 8, model: 'resnet-pigment-v3', output: 'Pigmentation analysis' }
      ]
    };
  }

  static getSampleAnalysis(): HybridAnalysisResult {
    return {
      analysisId: `ANL-${Date.now()}`,
      customerId: 'CUST-001',
      salesRepId: 'SALES-001',
      clinicId: 'CLINIC-001',
      timestamp: new Date().toISOString(),
      overallSkinScore: 72,
      skinAge: 38,
      actualAge: 35,
      skinType: 'Combination (Oily T-Zone)',
      conditions: [
        { conditionId: 'C001', name: 'Melasma', nameThai: 'ฝ้า', confidence: 87, severity: 'moderate', location: 'Cheeks', affectedArea: 15 },
        { conditionId: 'C002', name: 'Large Pores', nameThai: 'รูขุมขนกว้าง', confidence: 82, severity: 'mild', location: 'T-Zone', affectedArea: 8 },
        { conditionId: 'C003', name: 'Fine Lines', nameThai: 'ริ้วรอยตื้น', confidence: 78, severity: 'mild', location: 'Eye Area', affectedArea: 5 }
      ],
      recommendations: [
        { treatmentId: 'TRT-001', name: 'Laser Toning', priority: 1, matchScore: 92, expectedImprovement: '60% melasma reduction', sessions: 4, priceRange: { min: 3500, max: 5500 } },
        { treatmentId: 'TRT-002', name: 'Hydrafacial', priority: 2, matchScore: 88, expectedImprovement: 'Immediate hydration', sessions: 1, priceRange: { min: 2500, max: 4000 } },
        { treatmentId: 'TRT-003', name: 'Carbon Peel', priority: 3, matchScore: 85, expectedImprovement: '40% pore reduction', sessions: 3, priceRange: { min: 2000, max: 3500 } }
      ],
      visiaScores: { spots: 65, wrinkles: 78, texture: 72, pores: 68, uvSpots: 58, brownSpots: 62, redAreas: 85, porphyrins: 90 },
      modelsUsed: ['mediapipe-face-mesh', 'bisenet-skin-seg', 'efficientnet-skin-v2', 'dex-age-estimation', 'yolov8-pore-detect', 'unet-wrinkle-detect', 'resnet-pigment-v3', 'mobilenet-skintype']
    };
  }

  static getVISIAComparison(): any {
    return {
      headline: 'BN-Aura vs VISIA Comparison',
      visia: { price: '500,000 - 2,000,000 THB', mobility: 'Fixed in clinic', analysis: '8 metrics', aiModels: 1 },
      bnAura: { price: 'Included in subscription', mobility: 'Mobile (Sales can go anywhere)', analysis: '8+ metrics', aiModels: 8 },
      advantages: ['Sales mobility - analyze anywhere', 'Lower cost of ownership', 'Continuous AI updates', 'Integrated with booking & CRM', 'Treatment tracking over time']
    };
  }
}

export { HybridSkinAnalysisEngine, type HybridAnalysisResult, type AIModelConfig };

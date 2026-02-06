/**
 * MediaPipe Face Detection Integration
 * Real-time face detection and 468 landmark mapping
 * Powers BN-Aura AI Skin Analysis
 */

import { FaceMesh, Results as FaceMeshResults } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

// Face landmark indices for key facial features
const FACIAL_LANDMARKS = {
  // Face outline
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  
  // Eyes
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  
  // Nose
  noseBridge: [6, 197, 195, 5, 4, 1, 19, 94, 2],
  noseTip: [1, 2, 98, 327],
  nostrils: [129, 209, 49, 279, 429, 358],
  
  // Lips
  upperLip: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  lowerLip: [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  lipOutline: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
  
  // Forehead (approximate using hairline landmarks)
  forehead: [10, 338, 297, 332, 284, 251, 21, 54, 103, 67, 109],
  
  // Cheeks
  leftCheek: [116, 117, 118, 119, 120, 121, 128, 245, 193, 55],
  rightCheek: [345, 346, 347, 348, 349, 350, 357, 465, 417, 285],
  
  // Jaw
  jawline: [152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  
  // Wrinkle zones
  foreheadWrinkles: [10, 151, 9, 8, 168, 6, 197, 195, 5],
  glabellarLines: [9, 8, 168, 6, 197, 195, 5, 4],
  crowsFeet: [33, 246, 161, 160, 159, 158, 157, 173, 133, 362, 398, 384, 385, 386, 387, 388, 466, 263],
  nasolabialFolds: [205, 50, 101, 36, 206, 425, 280, 330, 266, 426],
};

// Golden ratio reference points
const GOLDEN_RATIO_POINTS = {
  faceWidth: [234, 454],
  faceHeight: [10, 152],
  eyeDistance: [33, 263],
  noseWidth: [129, 358],
  mouthWidth: [61, 291],
  foreheadToEyes: [10, 168],
  eyesToNose: [168, 1],
  noseToLips: [1, 17],
  lipsToChin: [17, 152],
};

interface FaceDetectionResult {
  detected: boolean;
  landmarks: { x: number; y: number; z: number }[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  measurements: {
    faceWidth: number;
    faceHeight: number;
    eyeDistance: number;
    noseWidth: number;
    mouthWidth: number;
    goldenRatio: number;
    symmetryScore: number;
  };
  zones: {
    forehead: { x: number; y: number; width: number; height: number };
    leftEye: { x: number; y: number; width: number; height: number };
    rightEye: { x: number; y: number; width: number; height: number };
    nose: { x: number; y: number; width: number; height: number };
    leftCheek: { x: number; y: number; width: number; height: number };
    rightCheek: { x: number; y: number; width: number; height: number };
    mouth: { x: number; y: number; width: number; height: number };
    chin: { x: number; y: number; width: number; height: number };
  };
}

class MediaPipeFaceDetection {
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private isInitialized = false;
  private onResultCallback: ((result: FaceDetectionResult) => void) | null = null;

  /**
   * Initialize MediaPipe Face Mesh
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(this.handleResults.bind(this));

    this.isInitialized = true;
  }

  /**
   * Start camera and face detection
   */
  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.faceMesh) {
          await this.faceMesh.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480,
    });

    await this.camera.start();
  }

  /**
   * Stop camera
   */
  stopCamera(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }

  /**
   * Process single image
   */
  async processImage(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      this.onResultCallback = resolve;
      this.faceMesh?.send({ image: imageElement });
    });
  }

  /**
   * Set callback for results
   */
  onResult(callback: (result: FaceDetectionResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Handle MediaPipe results
   */
  private handleResults(results: FaceMeshResults): void {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      const emptyResult: FaceDetectionResult = {
        detected: false,
        landmarks: [],
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        measurements: {
          faceWidth: 0,
          faceHeight: 0,
          eyeDistance: 0,
          noseWidth: 0,
          mouthWidth: 0,
          goldenRatio: 0,
          symmetryScore: 0,
        },
        zones: this.getEmptyZones(),
      };
      
      if (this.onResultCallback) {
        this.onResultCallback(emptyResult);
      }
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const result = this.processLandmarks(landmarks);
    
    if (this.onResultCallback) {
      this.onResultCallback(result);
    }
  }

  /**
   * Process landmarks and extract measurements
   */
  private processLandmarks(landmarks: { x: number; y: number; z: number }[]): FaceDetectionResult {
    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(landmarks);
    
    // Calculate measurements
    const measurements = this.calculateMeasurements(landmarks);
    
    // Extract facial zones
    const zones = this.extractZones(landmarks);

    return {
      detected: true,
      landmarks,
      boundingBox,
      measurements,
      zones,
    };
  }

  /**
   * Calculate face bounding box
   */
  private calculateBoundingBox(landmarks: { x: number; y: number; z: number }[]): FaceDetectionResult['boundingBox'] {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    
    for (const landmark of landmarks) {
      minX = Math.min(minX, landmark.x);
      maxX = Math.max(maxX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxY = Math.max(maxY, landmark.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Calculate facial measurements
   */
  private calculateMeasurements(landmarks: { x: number; y: number; z: number }[]): FaceDetectionResult['measurements'] {
    const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Face dimensions
    const faceWidth = distance(
      landmarks[GOLDEN_RATIO_POINTS.faceWidth[0]],
      landmarks[GOLDEN_RATIO_POINTS.faceWidth[1]]
    );
    
    const faceHeight = distance(
      landmarks[GOLDEN_RATIO_POINTS.faceHeight[0]],
      landmarks[GOLDEN_RATIO_POINTS.faceHeight[1]]
    );

    // Eye distance
    const eyeDistance = distance(
      landmarks[GOLDEN_RATIO_POINTS.eyeDistance[0]],
      landmarks[GOLDEN_RATIO_POINTS.eyeDistance[1]]
    );

    // Nose width
    const noseWidth = distance(
      landmarks[GOLDEN_RATIO_POINTS.noseWidth[0]],
      landmarks[GOLDEN_RATIO_POINTS.noseWidth[1]]
    );

    // Mouth width
    const mouthWidth = distance(
      landmarks[GOLDEN_RATIO_POINTS.mouthWidth[0]],
      landmarks[GOLDEN_RATIO_POINTS.mouthWidth[1]]
    );

    // Golden ratio calculation
    const goldenRatio = faceHeight / faceWidth;

    // Symmetry calculation (compare left and right sides)
    const symmetryScore = this.calculateSymmetry(landmarks);

    return {
      faceWidth,
      faceHeight,
      eyeDistance,
      noseWidth,
      mouthWidth,
      goldenRatio: Math.round(goldenRatio * 1000) / 1000,
      symmetryScore: Math.round(symmetryScore * 10) / 10,
    };
  }

  /**
   * Calculate facial symmetry score
   */
  private calculateSymmetry(landmarks: { x: number; y: number; z: number }[]): number {
    // Get face center (nose tip)
    const centerX = landmarks[1].x;
    
    // Compare corresponding left and right points
    const pairs = [
      [FACIAL_LANDMARKS.leftEye[0], FACIAL_LANDMARKS.rightEye[0]],
      [FACIAL_LANDMARKS.leftEyebrow[0], FACIAL_LANDMARKS.rightEyebrow[0]],
      [FACIAL_LANDMARKS.leftCheek[0], FACIAL_LANDMARKS.rightCheek[0]],
    ];

    let totalDiff = 0;
    let count = 0;

    for (const [leftIdx, rightIdx] of pairs) {
      const leftDist = Math.abs(landmarks[leftIdx].x - centerX);
      const rightDist = Math.abs(landmarks[rightIdx].x - centerX);
      const diff = Math.abs(leftDist - rightDist);
      totalDiff += diff;
      count++;
    }

    const avgDiff = totalDiff / count;
    const symmetryScore = Math.max(0, 100 - (avgDiff * 1000));
    
    return symmetryScore;
  }

  /**
   * Extract facial zones for analysis
   */
  private extractZones(landmarks: { x: number; y: number; z: number }[]): FaceDetectionResult['zones'] {
    const getZoneBounds = (indices: number[]) => {
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const idx of indices) {
        if (landmarks[idx]) {
          minX = Math.min(minX, landmarks[idx].x);
          maxX = Math.max(maxX, landmarks[idx].x);
          minY = Math.min(minY, landmarks[idx].y);
          maxY = Math.max(maxY, landmarks[idx].y);
        }
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    };

    return {
      forehead: getZoneBounds(FACIAL_LANDMARKS.forehead),
      leftEye: getZoneBounds(FACIAL_LANDMARKS.leftEye),
      rightEye: getZoneBounds(FACIAL_LANDMARKS.rightEye),
      nose: getZoneBounds(FACIAL_LANDMARKS.noseBridge),
      leftCheek: getZoneBounds(FACIAL_LANDMARKS.leftCheek),
      rightCheek: getZoneBounds(FACIAL_LANDMARKS.rightCheek),
      mouth: getZoneBounds(FACIAL_LANDMARKS.lipOutline),
      chin: getZoneBounds([152, 377, 400, 378, 379, 365, 397, 288, 361, 323]),
    };
  }

  /**
   * Get empty zones object
   */
  private getEmptyZones(): FaceDetectionResult['zones'] {
    const empty = { x: 0, y: 0, width: 0, height: 0 };
    return {
      forehead: empty,
      leftEye: empty,
      rightEye: empty,
      nose: empty,
      leftCheek: empty,
      rightCheek: empty,
      mouth: empty,
      chin: empty,
    };
  }

  /**
   * Get wrinkle zone landmarks
   */
  static getWrinkleZoneLandmarks(): typeof FACIAL_LANDMARKS {
    return FACIAL_LANDMARKS;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopCamera();
    this.faceMesh = null;
    this.isInitialized = false;
    this.onResultCallback = null;
  }
}

export { MediaPipeFaceDetection, FACIAL_LANDMARKS, GOLDEN_RATIO_POINTS };
export type { FaceDetectionResult };

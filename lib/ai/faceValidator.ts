/**
 * Face Validator - Lightweight face detection for uploaded images
 * Uses MediaPipe FaceMesh to verify a face exists before sending to AI pipeline
 * Prevents wasting AI quota on non-face images
 */

import { MediaPipeFaceDetection } from './mediaPipeFaceDetection';

let detector: MediaPipeFaceDetection | null = null;
let initPromise: Promise<void> | null = null;

async function getDetector(): Promise<MediaPipeFaceDetection> {
  if (!detector) {
    detector = new MediaPipeFaceDetection();
    initPromise = detector.initialize();
  }
  if (initPromise) await initPromise;
  return detector;
}

export interface FaceValidationResult {
  hasFace: boolean;
  confidence: number;
  faceArea: number; // percentage of image covered by face
  message: string;
}

/**
 * Validate that a base64 image contains a detectable face
 * @param imageDataUrl - base64 data URL of the image
 * @returns FaceValidationResult
 */
export async function validateFaceInImage(imageDataUrl: string): Promise<FaceValidationResult> {
  try {
    const det = await getDetector();

    // Create an HTMLImageElement from base64
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = imageDataUrl;
    });

    const result = await det.processImage(img);

    if (!result.detected) {
      return {
        hasFace: false,
        confidence: 0,
        faceArea: 0,
        message: 'ไม่พบใบหน้าในรูปภาพ กรุณาอัพโหลดรูปที่เห็นใบหน้าชัดเจน',
      };
    }

    // Calculate face area as percentage of image
    const imgArea = img.width * img.height;
    const faceArea = result.boundingBox.width * result.boundingBox.height;
    const facePercent = imgArea > 0 ? (faceArea / imgArea) * 100 : 0;

    // Face too small (< 5% of image) — likely too far away
    if (facePercent < 5) {
      return {
        hasFace: true,
        confidence: 0.3,
        faceArea: facePercent,
        message: 'ใบหน้าเล็กเกินไป กรุณาถ่ายใกล้ขึ้นหรือครอปรูปให้เห็นใบหน้าชัดเจน',
      };
    }

    // Good face detection
    const confidence = Math.min(1, facePercent / 30); // normalize to 0-1
    return {
      hasFace: true,
      confidence,
      faceArea: facePercent,
      message: 'ตรวจพบใบหน้า พร้อมวิเคราะห์',
    };
  } catch (error) {
    console.warn('Face validation failed, allowing upload:', error);
    // If MediaPipe fails to load, allow the upload anyway (graceful degradation)
    return {
      hasFace: true,
      confidence: 0.5,
      faceArea: 0,
      message: 'ไม่สามารถตรวจสอบใบหน้าได้ (ดำเนินการต่อ)',
    };
  }
}

/**
 * Cleanup the face detector instance
 */
export function destroyFaceValidator(): void {
  if (detector) {
    detector.destroy();
    detector = null;
    initPromise = null;
  }
}

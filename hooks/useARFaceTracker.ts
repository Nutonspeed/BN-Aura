import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMeshService, type FaceMeshResults, type Landmark } from '@/lib/mediapipe';

export interface ARFaceTrackingResult {
  landmarks: Landmark[] | null;
  isTracking: boolean;
  confidence: number;
}

export const useARFaceTracker = (
  videoElement: HTMLVideoElement | null,
  onTrackingUpdate?: (result: ARFaceTrackingResult) => void
) => {
  const faceMeshServiceRef = useRef<FaceMeshService | null>(null);
  const [trackingResult, setTrackingResult] = useState<ARFaceTrackingResult>({
    landmarks: null,
    isTracking: false,
    confidence: 0,
  });
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  // Debounced update function (30Hz)
  const debouncedUpdate = useCallback((landmarks: Landmark[] | null, confidence: number) => {
    const now = performance.now();
    if (now - lastUpdateTimeRef.current < 33.33) return; // ~30fps
    
    lastUpdateTimeRef.current = now;
    const result: ARFaceTrackingResult = {
      landmarks,
      isTracking: !!landmarks,
      confidence,
    };
    
    setTrackingResult(result);
    onTrackingUpdate?.(result);
  }, [onTrackingUpdate]);

  // Initialize FaceMesh service
  useEffect(() => {
    if (!videoElement) return;

    const service = new FaceMeshService();
    faceMeshServiceRef.current = service;

    service.onResults((results: FaceMeshResults) => {
      const landmarks = results.multiFaceLandmarks?.[0] || null;
      const confidence = landmarks ? 0.9 : 0; // Simplified confidence calculation
      debouncedUpdate(landmarks, confidence);
    });

    return () => {
      service.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoElement, debouncedUpdate]);

  // Process video frames
  const processFrame = useCallback(async () => {
    if (!faceMeshServiceRef.current || !videoElement) return;

    try {
      await faceMeshServiceRef.current.send(videoElement);
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }, [videoElement]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!videoElement) return;
    processFrame();
  }, [videoElement, processFrame]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setTrackingResult({
      landmarks: null,
      isTracking: false,
      confidence: 0,
    });
  }, []);

  return {
    ...trackingResult,
    startTracking,
    stopTracking,
  };
};

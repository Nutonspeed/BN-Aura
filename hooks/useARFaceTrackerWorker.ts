import { useEffect, useRef, useState, useCallback } from 'react';
import { type Landmark } from '@/lib/mediapipe';

export interface ARFaceTrackingResult {
  landmarks: Landmark[] | null;
  isTracking: boolean;
  confidence: number;
}

export const useARFaceTrackerWorker = (
  videoElement: HTMLVideoElement | null,
  onTrackingUpdate?: (result: ARFaceTrackingResult) => void
) => {
  const workerRef = useRef<Worker | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const [trackingResult, setTrackingResult] = useState<ARFaceTrackingResult>({
    landmarks: null,
    isTracking: false,
    confidence: 0,
  });
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  // Initialize worker
  useEffect(() => {
    if (!window.Worker) {
      console.error('Web Workers are not supported in this browser');
      return;
    }

    const worker = new Worker(new URL('../workers/faceMeshWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'ready':
          setIsWorkerReady(true);
          break;
          
        case 'results':
          if (data.landmarks) {
            const now = performance.now();
            if (now - lastUpdateTimeRef.current >= 33.33) { // ~30fps
              lastUpdateTimeRef.current = now;
              const result: ARFaceTrackingResult = {
                landmarks: data.landmarks,
                isTracking: true,
                confidence: 0.9,
              };
              setTrackingResult(result);
              onTrackingUpdate?.(result);
            }
          } else {
            setTrackingResult({
              landmarks: null,
              isTracking: false,
              confidence: 0,
            });
          }
          break;
          
        case 'error':
          console.error('Worker error:', data.error);
          break;
      }
    };

    // Initialize FaceMesh in worker
    worker.postMessage({ type: 'init' });

    return () => {
      worker.postMessage({ type: 'close' });
      worker.terminate();
    };
  }, [onTrackingUpdate]);

  // Process video frames
  const processFrame = useCallback(() => {
    if (!workerRef.current || !isWorkerReady || !videoElement) return;

    try {
      // Create canvas to capture video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0);
      
      // Get image data and send to worker
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      workerRef.current.postMessage({
        type: 'process',
        data: { imageData }
      }, [imageData.data.buffer]); // Transfer buffer for performance

      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }, [videoElement, isWorkerReady]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!isWorkerReady) return;
    processFrame();
  }, [isWorkerReady, processFrame]);

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
    isWorkerReady,
    startTracking,
    stopTracking,
  };
};

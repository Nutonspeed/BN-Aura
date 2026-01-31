// Web Worker for MediaPipe Face Mesh Processing
// This worker runs MediaPipe in a separate thread to maintain 60fps UI performance

import * as FaceMeshModule from '@mediapipe/face_mesh';

interface WorkerMessage {
  type: 'init' | 'process' | 'close';
  data?: any;
}

interface WorkerResponse {
  type: 'results' | 'error' | 'ready';
  data?: any;
}

let faceMesh: any = null;

// Initialize FaceMesh in worker
const initializeFaceMesh = async () => {
  try {
    const FaceMesh = (FaceMeshModule as any).FaceMesh;
    
    if (!FaceMesh) {
      throw new Error('FaceMesh not found');
    }

    faceMesh = new FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    self.postMessage({ type: 'ready' } as WorkerResponse);
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      data: { error: error instanceof Error ? error.message : 'Unknown error' } 
    } as WorkerResponse);
  }
};

// Process frame in worker
const processFrame = async (imageData: ImageData) => {
  if (!faceMesh) {
    self.postMessage({ 
      type: 'error', 
      data: { error: 'FaceMesh not initialized' } 
    } as WorkerResponse);
    return;
  }

  try {
    // Create canvas from image data
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(imageData, 0, 0);
    
    // Process with MediaPipe
    await faceMesh.send({ image: canvas });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      data: { error: error instanceof Error ? error.message : 'Unknown error' } 
    } as WorkerResponse);
  }
};

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      await initializeFaceMesh();
      break;
      
    case 'process':
      if (data?.imageData) {
        await processFrame(data.imageData);
      }
      break;
      
    case 'close':
      if (faceMesh) {
        await faceMesh.close();
      }
      self.close();
      break;
  }
};

// Set up results callback
if (typeof self !== 'undefined') {
  // This will be called from within the FaceMesh instance
  (self as any).onFaceMeshResults = (results: any) => {
    self.postMessage({ 
      type: 'results', 
      data: { 
        landmarks: results.multiFaceLandmarks?.[0] || null 
      } 
    } as WorkerResponse);
  };
}

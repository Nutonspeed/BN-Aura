import * as FaceMeshModule from '@mediapipe/face_mesh';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface FaceMeshResults {
  multiFaceLandmarks: Landmark[][];
}

interface FaceMeshInstance {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: FaceMeshResults) => void) => void;
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  close: () => Promise<void>;
}

export class FaceMeshService {
  private faceMesh: FaceMeshInstance | null = null;

  constructor() {
    // Handle the fact that MediaPipe might be exported differently in different environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FaceMeshConstructor = (FaceMeshModule as any).FaceMesh || (window as any).FaceMesh;
    
    if (!FaceMeshConstructor) {
      console.error('FaceMesh not found in module or window');
      return;
    }

    this.faceMesh = new FaceMeshConstructor({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    if (this.faceMesh) {
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }
  }

  public onResults(callback: (results: FaceMeshResults) => void) {
    if (this.faceMesh) {
      this.faceMesh.onResults(callback);
    }
  }

  public async send(image: HTMLVideoElement | HTMLCanvasElement) {
    if (this.faceMesh) {
      await this.faceMesh.send({ image });
    }
  }

  public async close() {
    if (this.faceMesh) {
      await this.faceMesh.close();
    }
  }
}

export const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: Landmark[]) => {
  if (!landmarks) return;
  
  ctx.fillStyle = '#3b82f6'; // primary blue
  for (const landmark of landmarks) {
    const x = landmark.x * ctx.canvas.width;
    const y = landmark.y * ctx.canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, 2 * Math.PI);
    ctx.fill();
  }
};

import * as THREE from 'three';
import earcut from 'earcut';
import { type Landmark } from '@/lib/mediapipe';

export class FaceMeshGeometry {
  private static readonly FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 340, 346, 347, 348, 349, 350, 451, 452, 453, 464, 435, 410, 287, 273, 335, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  
  private static readonly LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  private static readonly RIGHT_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
  private static readonly LEFT_EYEBROW = [46, 53, 52, 51, 48, 115, 131, 134, 102, 49, 220, 305];
  private static readonly RIGHT_EYEBROW = [276, 283, 282, 295, 296, 334, 293, 300, 276, 283, 282, 295];
  private static readonly NOSE = [1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 237, 238, 239, 240, 241, 242];
  private static readonly MOUTH_OUTER = [61, 84, 17, 314, 405, 291, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
  private static readonly MOUTH_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];

  static createGeometry(landmarks: Landmark[]): THREE.BufferGeometry {
    if (!landmarks || landmarks.length < 468) {
      return new THREE.BufferGeometry();
    }

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Convert landmarks to 3D vertices
    landmarks.forEach((landmark) => {
      // Normalize to -1 to 1 space
      vertices.push(
        (landmark.x - 0.5) * 2,
        -(landmark.y - 0.5) * 2,
        landmark.z * 2
      );
      
      // Simple UV mapping based on position
      uvs.push(landmark.x, 1 - landmark.y);
    });

    // Create face mesh using Delaunay triangulation
    const faceIndices = this.triangulateFace(landmarks);
    indices.push(...faceIndices);

    // Add individual features (eyes, mouth, etc.)
    this.addFeatureGeometry(landmarks, this.LEFT_EYE, vertices.length, indices);
    this.addFeatureGeometry(landmarks, this.RIGHT_EYE, vertices.length, indices);
    this.addFeatureGeometry(landmarks, this.MOUTH_OUTER, vertices.length, indices);

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeTangents();

    return geometry;
  }

  private static triangulateFace(landmarks: Landmark[]): number[] {
    // Use face oval points for main face triangulation
    const facePoints: number[] = [];
    const pointMap: number[] = [];

    this.FACE_OVAL.forEach((index) => {
      if (landmarks[index]) {
        const point = landmarks[index];
        facePoints.push(point.x, point.y);
        pointMap.push(index);
      }
    });

    // Earcut triangulation
    const triangles = earcut(facePoints, undefined, 2);
    const indices: number[] = [];

    // Convert earcut result to face indices
    for (let i = 0; i < triangles.length; i += 3) {
      indices.push(
        pointMap[triangles[i]],
        pointMap[triangles[i + 1]],
        pointMap[triangles[i + 2]]
      );
    }

    return indices;
  }

  private static addFeatureGeometry(
    landmarks: Landmark[],
    featureIndices: number[],
    vertexOffset: number,
    indices: number[]
  ): void {
    const featurePoints: number[] = [];
    const featureMap: number[] = [];

    featureIndices.forEach((index) => {
      if (landmarks[index]) {
        const point = landmarks[index];
        featurePoints.push(point.x, point.y);
        featureMap.push(index);
      }
    });

    if (featurePoints.length < 6) return; // Need at least 3 points for triangulation

    const triangles = earcut(featurePoints, undefined, 2);

    for (let i = 0; i < triangles.length; i += 3) {
      indices.push(
        featureMap[triangles[i]],
        featureMap[triangles[i + 1]],
        featureMap[triangles[i + 2]]
      );
    }
  }

  static createMorphTargets(landmarks: Landmark[]): THREE.BufferGeometry {
    const baseGeometry = this.createGeometry(landmarks);
    
    // Create morph targets for different expressions
    const morphTargets = {
      smile: this.createSmileMorph(landmarks),
      frown: this.createFrownMorph(landmarks),
      eyesClosed: this.createEyesClosedMorph(landmarks),
    };

    Object.entries(morphTargets).forEach(([name, positions]) => {
      if (positions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (baseGeometry.morphAttributes as any)[name] = [
          new THREE.Float32BufferAttribute(positions, 3)
        ];
      }
    });

    return baseGeometry;
  }

  private static createSmileMorph(landmarks: Landmark[]): Float32Array | null {
    if (!landmarks) return null;

    const positions = new Float32Array(landmarks.length * 3);
    
    landmarks.forEach((landmark, index) => {
      positions[index * 3] = (landmark.x - 0.5) * 2;
      positions[index * 3 + 1] = -(landmark.y - 0.5) * 2;
      positions[index * 3 + 2] = landmark.z * 2;

      // Modify mouth corner positions for smile
      if (index === 61 || index === 291) { // Left and right mouth corners
        positions[index * 3 + 1] += 0.05; // Lift corners
        positions[index * 3] += index === 61 ? -0.02 : 0.02; // Slight outward movement
      }
    });

    return positions;
  }

  private static createFrownMorph(landmarks: Landmark[]): Float32Array | null {
    if (!landmarks) return null;

    const positions = new Float32Array(landmarks.length * 3);
    
    landmarks.forEach((landmark, index) => {
      positions[index * 3] = (landmark.x - 0.5) * 2;
      positions[index * 3 + 1] = -(landmark.y - 0.5) * 2;
      positions[index * 3 + 2] = landmark.z * 2;

      // Modify mouth and eyebrow positions for frown
      if (index === 61 || index === 291) { // Mouth corners
        positions[index * 3 + 1] -= 0.03; // Lower corners
      }
      
      // Lower eyebrows
      if (this.LEFT_EYEBROW.includes(index) || this.RIGHT_EYEBROW.includes(index)) {
        positions[index * 3 + 1] += 0.02;
      }
    });

    return positions;
  }

  private static createEyesClosedMorph(landmarks: Landmark[]): Float32Array | null {
    if (!landmarks) return null;

    const positions = new Float32Array(landmarks.length * 3);
    
    landmarks.forEach((landmark, index) => {
      positions[index * 3] = (landmark.x - 0.5) * 2;
      positions[index * 3 + 1] = -(landmark.y - 0.5) * 2;
      positions[index * 3 + 2] = landmark.z * 2;

      // Close eyes by moving upper eyelids down
      if (this.LEFT_EYE.includes(index) || this.RIGHT_EYE.includes(index)) {
        if (index % 2 === 0) { // Upper eyelid landmarks
          positions[index * 3 + 1] += 0.05;
        }
      }
    });

    return positions;
  }
}

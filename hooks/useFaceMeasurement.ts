import { useCallback, useRef } from 'react';
import * as THREE from 'three';

export interface FaceMeasurement {
  facialAsymmetry: number;
  skinTexture: number;
  volumeLoss: number[];
  wrinkleDepth: number;
  poreSize: number;
}

export const useFaceMeasurement = () => {
  const measurementsRef = useRef<FaceMeasurement>({
    facialAsymmetry: 0,
    skinTexture: 0,
    volumeLoss: [0, 0, 0], // Left, center, right
    wrinkleDepth: 0,
    poreSize: 0,
  });

  const calculateAsymmetry = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 468) return 0;

    // Key facial landmark pairs for symmetry analysis
    const symmetryPairs = [
      [234, 454], // Cheeks
      [127, 356], // Eyes corners
      [132, 361], // Eye corners (inner)
      [215, 435], // Jaw line
      [61, 291],  // Mouth corners
    ];

    let totalAsymmetry = 0;
    symmetryPairs.forEach(([left, right]) => {
      if (landmarks[left] && landmarks[right]) {
        const leftPoint = new THREE.Vector3(
          landmarks[left][0] - 0.5,
          landmarks[left][1] - 0.5,
          landmarks[left][2]
        );
        const rightPoint = new THREE.Vector3(
          landmarks[right][0] - 0.5,
          landmarks[right][1] - 0.5,
          landmarks[right][2]
        );
        
        // Mirror right point and calculate distance
        const mirroredRight = new THREE.Vector3(-rightPoint.x, rightPoint.y, rightPoint.z);
        const distance = leftPoint.distanceTo(mirroredRight);
        totalAsymmetry += distance;
      }
    });

    return Math.min(totalAsymmetry / symmetryPairs.length * 100, 100);
  }, []);

  const calculateVolumeLoss = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 468) return [0, 0, 0];

    // Regions for volume analysis
    const regions = {
      left: [50, 101, 116, 117, 118, 119, 120, 121, 200, 201], // Left cheek
      center: [6, 19, 20, 94, 125, 141, 235, 236, 237, 238],   // Center
      right: [280, 330, 331, 332, 333, 334, 335, 336, 421, 422], // Right cheek
    };

    const volumes = Object.entries(regions).map(([_, indices]) => {
      let totalZ = 0;
      indices.forEach(index => {
        if (landmarks[index]) {
          totalZ += landmarks[index][2];
        }
      });
      return totalZ / indices.length;
    });

    // Normalize to 0-100 scale (lower = more volume loss)
    const maxVolume = Math.max(...volumes);
    return volumes.map(v => Math.max(0, (1 - v / maxVolume) * 100));
  }, []);

  const calculateWrinkleDepth = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 468) return 0;

    // Key wrinkle areas
    const wrinkleAreas = {
      forehead: [69, 70, 71, 107, 108, 109],
      crowFeet: [33, 133, 157, 158, 159, 173, 263, 362, 387, 388, 389],
      nasolabial: [13, 14, 15, 16, 17, 18, 82, 83, 84, 85, 86, 87],
    };

    let totalDepth = 0;
    let count = 0;

    Object.values(wrinkleAreas).forEach(indices => {
      indices.forEach(index => {
        if (landmarks[index]) {
          // Z-depth indicates wrinkle depth
          totalDepth += Math.abs(landmarks[index][2]);
          count++;
        }
      });
    });

    return count > 0 ? Math.min((totalDepth / count) * 500, 100) : 0;
  }, []);

  const measureFace = useCallback((landmarks: number[][]): FaceMeasurement => {
    const measurements: FaceMeasurement = {
      facialAsymmetry: calculateAsymmetry(landmarks),
      skinTexture: Math.random() * 30 + 10, // Simplified - would need texture analysis
      volumeLoss: calculateVolumeLoss(landmarks),
      wrinkleDepth: calculateWrinkleDepth(landmarks),
      poreSize: Math.random() * 20 + 5, // Simplified - would need high-res analysis
    };

    measurementsRef.current = measurements;
    return measurements;
  }, [calculateAsymmetry, calculateVolumeLoss, calculateWrinkleDepth]);

  const compareMeasurements = useCallback(
    (before: FaceMeasurement, after: FaceMeasurement) => {
      return {
        asymmetryImprovement: before.facialAsymmetry - after.facialAsymmetry,
        volumeImprovement: before.volumeLoss.map((b, i) => b - after.volumeLoss[i]),
        wrinkleImprovement: before.wrinkleDepth - after.wrinkleDepth,
        overallImprovement: 
          (before.facialAsymmetry - after.facialAsymmetry) * 0.3 +
          before.volumeLoss.reduce((acc, b, i) => acc + (b - after.volumeLoss[i]), 0) * 0.4 / 3 +
          (before.wrinkleDepth - after.wrinkleDepth) * 0.3,
      };
    },
    []
  );

  return {
    measureFace,
    compareMeasurements,
    currentMeasurements: measurementsRef.current,
  };
};

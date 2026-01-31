'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { type Landmark } from '@/lib/mediapipe';
import { FaceMeshGeometry } from '@/lib/faceMeshGeometry';
import { createTreatmentMaterial, type TreatmentShaderUniforms } from '@/lib/treatmentShaders';

interface FaceMeshProps {
  landmarks: Landmark[] | null;
  treatmentType?: 'filler' | 'laser' | 'none';
  treatmentIntensity?: number;
}

function FaceMesh({ landmarks, treatmentType = 'none', treatmentIntensity = 0 }: FaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  // Create face geometry from landmarks using improved triangulation
  const geometry = useMemo(() => {
    if (!landmarks || landmarks.length === 0) return null;
    return FaceMeshGeometry.createGeometry(landmarks);
  }, [landmarks]);

  // Create treatment material
  const material = useMemo(() => {
    if (treatmentType === 'none') {
      return new THREE.MeshStandardMaterial({
        color: '#fdbcb4',
        transparent: true,
        opacity: 0.9,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
    }

    const uniforms: TreatmentShaderUniforms = {
      uIntensity: treatmentIntensity,
      uTime: 0,
    };

    if (treatmentType === 'filler') {
      uniforms.uTargetRegion = new THREE.Vector2(0.5, 0.4); // Cheek area
      uniforms.uTargetRadius = 0.3;
    } else if (treatmentType === 'laser') {
      uniforms.uLaserPosition = new THREE.Vector2(0.5, 0.3); // Forehead
      uniforms.uLaserRadius = 0.15;
    }

    return createTreatmentMaterial(treatmentType, uniforms);
  }, [treatmentType, treatmentIntensity]);

  // Update shader uniforms
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Only update uniforms if it's a shader material
    if ('uniforms' in material && material.uniforms) {
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.getElapsedTime();
      }
      
      if (material.uniforms.uIntensity) {
        material.uniforms.uIntensity.value = treatmentIntensity;
      }
    }
  });

  // Update mesh to match video aspect ratio
  useFrame(() => {
    if (!meshRef.current) return;
    
    const aspect = size.width / size.height;
    meshRef.current.scale.set(aspect, 1, 1);
  });

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

function TreatmentOverlay({ type, intensity }: { type: string; intensity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime()) * 0.1;
  });

  if (type === 'laser') {
    return (
      <mesh ref={meshRef}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={intensity * 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    );
  }

  return null;
}

interface AR3DSimulatorProps {
  landmarks: Landmark[] | null;
  treatmentType?: 'filler' | 'laser' | 'none';
  treatmentIntensity?: number;
  onTreatmentChange?: (type: 'filler' | 'laser' | 'none', intensity: number) => void;
}

export default function AR3DSimulator({
  landmarks,
  treatmentType = 'none',
  treatmentIntensity = 0,
  onTreatmentChange,
}: AR3DSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] overflow-hidden">
      <Canvas
        ref={canvasRef}
        shadows
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        className="absolute inset-0"
      >
        <PerspectiveCamera makeDefault position={[0, 0, 2]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[0, 0, 1]} intensity={0.8} />
        <pointLight position={[-1, 1, 1]} color="#60a5fa" intensity={0.3} />
        
        {/* Face Mesh */}
        <FaceMesh
          landmarks={landmarks}
          treatmentType={treatmentType}
          treatmentIntensity={treatmentIntensity}
        />
        
        {/* Treatment Effects */}
        {treatmentType !== 'none' && (
          <TreatmentOverlay type={treatmentType} intensity={treatmentIntensity} />
        )}
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 left-6 right-6 bg-black/50 backdrop-blur-md rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onTreatmentChange?.('none', 0)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                treatmentType === 'none'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              None
            </button>
            <button
              onClick={() => onTreatmentChange?.('filler', 0.5)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                treatmentType === 'filler'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Filler
            </button>
            <button
              onClick={() => onTreatmentChange?.('laser', 0.5)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                treatmentType === 'laser'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Laser
            </button>
          </div>
          
          {treatmentType !== 'none' && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={treatmentIntensity}
              onChange={(e) => onTreatmentChange?.(treatmentType as 'filler' | 'laser', parseFloat(e.target.value))}
              className="w-32"
            />
          )}
        </div>
      </div>

      {/* Tracking Status */}
      <div className="absolute top-6 left-6">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          landmarks ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {landmarks ? 'Tracking' : 'No Face Detected'}
        </div>
      </div>
    </div>
  );
}

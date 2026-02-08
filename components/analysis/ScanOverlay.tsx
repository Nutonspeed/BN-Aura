'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ScanOverlayProps {
  isScanning: boolean;
  faceDetected?: boolean;
  className?: string;
}

export default function ScanOverlay({ isScanning, faceDetected = false, className }: ScanOverlayProps) {
  const [scanLineY, setScanLineY] = useState(0);

  useEffect(() => {
    if (!isScanning) return;
    let frame: number;
    let start: number | null = null;
    const duration = 2000;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = (timestamp - start) % duration;
      setScanLineY((elapsed / duration) * 100);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isScanning]);

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {/* Corner Brackets */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="none">
        {/* Top-left */}
        <path d="M 60 40 L 60 80 M 60 40 L 100 40" stroke="rgba(168,85,247,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Top-right */}
        <path d="M 340 40 L 340 80 M 340 40 L 300 40" stroke="rgba(168,85,247,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Bottom-left */}
        <path d="M 60 460 L 60 420 M 60 460 L 100 460" stroke="rgba(168,85,247,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Bottom-right */}
        <path d="M 340 460 L 340 420 M 340 460 L 300 460" stroke="rgba(168,85,247,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>

      {/* Face Oval Guide — pulsing */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%]">
        <div className={cn(
          'w-48 h-64 rounded-[50%] border-2 transition-all duration-500',
          faceDetected
            ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)]'
            : 'border-purple-400/60 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.2)]'
        )} />
      </div>

      {/* Scanning Line */}
      {isScanning && (
        <div
          className="absolute left-[15%] right-[15%] h-[2px] transition-none"
          style={{
            top: `${10 + scanLineY * 0.8}%`,
            background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(236,72,153,0.8), transparent)',
            boxShadow: '0 0 15px rgba(168,85,247,0.5), 0 0 30px rgba(168,85,247,0.2)',
          }}
        />
      )}

      {/* Grid Lines (subtle) */}
      {isScanning && (
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 500" preserveAspectRatio="none">
          {/* Horizontal grid */}
          {[100, 167, 233, 300, 367].map(y => (
            <line key={`h${y}`} x1="80" y1={y} x2="320" y2={y} stroke="rgba(168,85,247,0.5)" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          {/* Vertical grid */}
          {[120, 160, 200, 240, 280].map(x => (
            <line key={`v${x}`} x1={x} y1="60" x2={x} y2="440" stroke="rgba(168,85,247,0.5)" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
        </svg>
      )}

      {/* Face Detected Indicator */}
      {faceDetected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-500/40 px-4 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-300 text-xs font-medium">ตรวจพบใบหน้า</span>
        </div>
      )}

      {/* Crosshair center */}
      {isScanning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
          <div className="w-6 h-[1px] bg-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2" />
          <div className="w-[1px] h-6 bg-purple-400 absolute top-1/2 left-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Data readout overlay */}
      {isScanning && faceDetected && (
        <div className="absolute bottom-16 left-4 text-[10px] font-mono text-purple-400/70 space-y-0.5">
          <p>FACE_MESH: 468 landmarks</p>
          <p>SYMMETRY: analyzing...</p>
          <p>SKIN_TYPE: detecting...</p>
        </div>
      )}
    </div>
  );
}

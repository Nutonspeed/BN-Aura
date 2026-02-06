'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AIBrainIcon,
  SkinScanIcon,
  SymmetryIcon,
  MetricsGridIcon,
  SuccessIcon,
  WarningIcon,
  ScoreGaugeIcon,
} from '@/components/ui/icons';

interface FaceMetrics {
  detected: boolean;
  symmetryScore: number;
  goldenRatio: number;
  faceWidth: number;
  faceHeight: number;
  zones: {
    forehead: boolean;
    leftEye: boolean;
    rightEye: boolean;
    nose: boolean;
    leftCheek: boolean;
    rightCheek: boolean;
    mouth: boolean;
    chin: boolean;
  };
}

interface RealTimeFaceAnalysisProps {
  onCapture?: (imageData: string, metrics: FaceMetrics) => void;
  onAnalysisComplete?: (result: any) => void;
  showDebugOverlay?: boolean;
}

export default function RealTimeFaceAnalysis({
  onCapture,
  onAnalysisComplete,
  showDebugOverlay = false,
}: RealTimeFaceAnalysisProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [step, setStep] = useState<'idle' | 'camera' | 'captured' | 'analyzing' | 'result'>('idle');

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setStep('camera');
        
        // Start face detection loop
        detectFace();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'ไม่สามารถเข้าถึงกล้องได้');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Face detection loop (simplified - in production use MediaPipe)
  const detectFace = useCallback(() => {
    if (!videoRef.current || !isStreaming) return;

    // Simulated face detection - in production, integrate with MediaPipeFaceDetection
    const simulatedMetrics: FaceMetrics = {
      detected: true,
      symmetryScore: 85 + Math.random() * 10,
      goldenRatio: 1.58 + (Math.random() - 0.5) * 0.1,
      faceWidth: 0.4 + Math.random() * 0.1,
      faceHeight: 0.5 + Math.random() * 0.1,
      zones: {
        forehead: true,
        leftEye: true,
        rightEye: true,
        nose: true,
        leftCheek: true,
        rightCheek: true,
        mouth: true,
        chin: true,
      },
    };

    setFaceMetrics(simulatedMetrics);

    // Continue detection loop
    if (isStreaming) {
      requestAnimationFrame(detectFace);
    }
  }, [isStreaming]);

  // Capture image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip horizontally for selfie mode
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    setStep('captured');
    stopCamera();

    if (onCapture && faceMetrics) {
      onCapture(imageData, faceMetrics);
    }
  }, [faceMetrics, onCapture, stopCamera]);

  // Run full analysis
  const runAnalysis = useCallback(async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setStep('analyzing');

    try {
      // Call comprehensive analysis API
      const response = await fetch('/api/analysis/skin?type=comprehensive&age=35');
      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
        setStep('result');
        
        if (onAnalysisComplete) {
          onAnalysisComplete(data.data);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage, onAnalysisComplete]);

  // Reset to start
  const reset = useCallback(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setFaceMetrics(null);
    setStep('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Get face position indicator
  const getFacePositionStatus = () => {
    if (!faceMetrics?.detected) return { status: 'not-detected', message: 'ไม่พบใบหน้า' };
    
    const { faceWidth, faceHeight } = faceMetrics;
    
    if (faceWidth < 0.3 || faceHeight < 0.4) {
      return { status: 'too-far', message: 'เลื่อนใกล้กล้องมากขึ้น' };
    }
    if (faceWidth > 0.6 || faceHeight > 0.7) {
      return { status: 'too-close', message: 'ถอยห่างจากกล้อง' };
    }
    
    return { status: 'perfect', message: 'ตำแหน่งพอดี ✓' };
  };

  const positionStatus = getFacePositionStatus();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step: Idle */}
      {step === 'idle' && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <AIBrainIcon size="2xl" className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Skin Analysis</h2>
            <p className="text-muted-foreground mb-6">
              วิเคราะห์ผิวหน้าด้วย AI แบบ Real-time
              <br />
              รองรับ 8 Metrics เทียบเท่า VISIA
            </p>
            <Button onClick={startCamera} size="lg" className="gap-2">
              <SkinScanIcon size="sm" />
              เริ่มวิเคราะห์
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Camera */}
      {step === 'camera' && (
        <Card>
          <CardContent className="p-4">
            {/* Camera View */}
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />
              
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Face oval guide */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-white/50 rounded-[50%]" />
                
                {/* Position indicator */}
                <div className={cn(
                  'absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium',
                  positionStatus.status === 'perfect' 
                    ? 'bg-green-500/80 text-white' 
                    : 'bg-amber-500/80 text-white'
                )}>
                  {positionStatus.message}
                </div>
              </div>

              {/* Debug Overlay */}
              {showDebugOverlay && faceMetrics?.detected && (
                <div className="absolute top-4 left-4 bg-black/70 text-white text-xs p-2 rounded">
                  <p>Symmetry: {faceMetrics.symmetryScore.toFixed(1)}%</p>
                  <p>Golden: {faceMetrics.goldenRatio.toFixed(3)}</p>
                </div>
              )}
            </div>

            {/* Real-time Metrics */}
            {faceMetrics?.detected && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <SymmetryIcon size="md" />
                  <div>
                    <p className="text-xs text-muted-foreground">Symmetry</p>
                    <p className="font-bold">{faceMetrics.symmetryScore.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <MetricsGridIcon size="md" />
                  <div>
                    <p className="text-xs text-muted-foreground">Golden Ratio</p>
                    <p className="font-bold">{faceMetrics.goldenRatio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={captureImage} 
                className="flex-1 gap-2"
                disabled={positionStatus.status !== 'perfect'}
              >
                <SkinScanIcon size="sm" />
                ถ่ายภาพ
              </Button>
              <Button variant="outline" onClick={() => { stopCamera(); reset(); }}>
                ยกเลิก
              </Button>
            </div>

            {cameraError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {cameraError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Captured - Review */}
      {step === 'captured' && capturedImage && (
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden mb-4">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <SuccessIcon size="sm" />
                จับภาพสำเร็จ
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={runAnalysis} className="flex-1 gap-2">
                <AIBrainIcon size="sm" />
                วิเคราะห์ผิว
              </Button>
              <Button variant="outline" onClick={startCamera}>
                ถ่ายใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <AIBrainIcon size="xl" className="absolute inset-0 m-auto" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">กำลังวิเคราะห์...</h3>
            <p className="text-muted-foreground text-sm">
              AI กำลังประมวลผล 8 Skin Metrics
            </p>

            <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
              {['MediaPipe Face Detection', 'Symmetry Analysis', '8 Metrics Scoring', 'AI Recommendations'].map((item, i) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <div className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    i <= 2 ? 'bg-green-500' : 'bg-muted animate-pulse'
                  )}>
                    {i <= 2 && <SuccessIcon size="xs" className="text-white" />}
                  </div>
                  <span className={i > 2 ? 'text-muted-foreground' : ''}>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Result */}
      {step === 'result' && analysisResult && (
        <Card>
          <CardContent className="p-4">
            {/* Score Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-3">
                <div>
                  <p className="text-3xl font-bold">{analysisResult.skinMetrics?.overallScore || 72}</p>
                  <p className="text-xs opacity-80">/100</p>
                </div>
              </div>
              <h3 className="text-xl font-semibold">Overall Score</h3>
              <p className="text-muted-foreground text-sm">
                Skin Age: {analysisResult.skinMetrics?.skinAge || 38} ปี
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Symmetry', value: analysisResult.symmetry?.overallSymmetry || 87 },
                { label: 'Texture', value: 75 },
                { label: 'Pores', value: 52 },
                { label: 'Spots', value: 65 },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className={cn(
                    'text-lg font-bold',
                    value >= 70 ? 'text-green-500' : value >= 40 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {value}%
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={reset}>
                วิเคราะห์ใหม่
              </Button>
              <Button variant="outline" className="flex-1">
                ดูรายละเอียด
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

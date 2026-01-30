'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Scan,
  CheckCircle2,
  Focus,
  Layers,
  Activity,
  Cpu
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaceMeshService, drawLandmarks } from '@/lib/mediapipe';
import { simulateUVImaging, highlightRedness } from '@/lib/image-processing';

type ScanPhase = 'IDLE' | 'CAPTURED' | 'CALIBRATING' | 'UV_SCAN' | 'REDNESS_SCAN' | 'NEURAL_SYNTHESIS' | 'COMPLETED';

function SkinAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const leadId = searchParams.get('leadId');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshService = useRef<FaceMeshService | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAnalyzing, setIsAnalysis] = useState(false);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uvImage, setUvImage] = useState<string | null>(null);
  const [rednessImage, setRednessImage] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState(0); 
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  // Enable mock mode if query param is present or if camera fails
  useEffect(() => {
    if (searchParams.get('mock') === 'true') {
      setIsMockMode(true);
      setQualityScore(100);
      setIsFaceDetected(true);
    }
  }, [searchParams]);

  // Initialize MediaPipe
  useEffect(() => {
    faceMeshService.current = new FaceMeshService();
    faceMeshService.current.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setIsFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];
        
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
        const faceHeight = Math.abs(landmarks[152].y - landmarks[10].y);
        const centerX = (landmarks[454].x + landmarks[234].x) / 2;
        const centerY = (landmarks[152].y + landmarks[10].y) / 2;
        
        const isCentered = Math.abs(centerX - 0.5) < 0.15 && Math.abs(centerY - 0.5) < 0.2;
        const isCorrectSize = faceWidth > 0.25 && faceHeight > 0.3;
        
        let score = 0;
        if (isFaceDetected) score += 40;
        if (isCentered) score += 30;
        if (isCorrectSize) score += 30;
        setQualityScore(score);

        if (overlayCanvasRef.current) {
          const ctx = overlayCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            drawLandmarks(ctx, landmarks);
          }
        }
      } else {
        setIsFaceDetected(false);
        setQualityScore(0);
        if (overlayCanvasRef.current) {
          const ctx = overlayCanvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      }
    });

    return () => {
      faceMeshService.current?.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isFaceDetected]);

  const detectFrame = useCallback(async () => {
    if (isCameraActive && videoRef.current && faceMeshService.current) {
      await faceMeshService.current.send(videoRef.current);
    }
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [isCameraActive]);

  useEffect(() => {
    if (isCameraActive) {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraActive, detectFrame]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (overlayCanvasRef.current && videoRef.current) {
            overlayCanvasRef.current.width = videoRef.current.videoWidth;
            overlayCanvasRef.current.height = videoRef.current.videoHeight;
          }
          setIsCameraActive(true);
        };
        setError(null);
      }
    } catch (err) {
      console.error('Camera Access Error:', err);
      setError('Cannot access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const runAnalysis = async (imageData: string) => {
    setIsAnalysis(true);
    setError(null);
    setScanProgress(0);
    setScanPhase('CALIBRATING');

    try {
      // Phase 1: Calibrating
      await new Promise(resolve => setTimeout(resolve, 1000));
      setScanProgress(20);
      setScanPhase('UV_SCAN');

      // Phase 2: UV Scan Simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setScanProgress(40);
      setScanPhase('REDNESS_SCAN');

      // Phase 3: Redness Scan Simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setScanProgress(60);
      setScanPhase('NEURAL_SYNTHESIS');

      // Phase 4: Neural Synthesis (Call AI API)
      const response = await fetch(`/${locale}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          clinicId: 'demo-clinic', 
          userId: 'demo-user',
          tier: 'professional',
          leadId: leadId
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      setScanProgress(80);
      const result = await response.json();
      
      setScanProgress(100);
      setScanPhase('COMPLETED');

      setTimeout(() => {
        setIsAnalysis(false);
        router.push(`/${locale}/analysis/results?id=${result.id}${leadId ? `&leadId=${leadId}` : ''}`); 
      }, 800);

    } catch (err) {
      console.error('Analysis Error:', err);
      setError('AI Analysis failed. Please try again.');
      setIsAnalysis(false);
      setCapturedImage(null);
      setScanPhase('IDLE');
    }
  };

  const captureImage = () => {
    if (isMockMode) {
      // Use a placeholder image for mock mode
      const mockImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000';
      setCapturedImage(mockImage);
      
      // Generate processed images for ritualistic scan (mocked)
      simulateUVImaging(mockImage).then(setUvImage).catch(console.error);
      highlightRedness(mockImage).then(setRednessImage).catch(console.error);

      runAnalysis(mockImage);
      return;
    }

    if (qualityScore < 70) {
      setError('Please center your face and look directly at the camera.');
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(dataUrl);
        stopCamera();

        // Generate processed images for ritualistic scan
        simulateUVImaging(dataUrl).then(setUvImage).catch(console.error);
        highlightRedness(dataUrl).then(setRednessImage).catch(console.error);

        runAnalysis(dataUrl);
      }
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setScanProgress(0);
    setQualityScore(0);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden relative flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <header className="z-20 h-20 flex items-center justify-between px-6 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-heading font-bold text-xl tracking-tight text-white uppercase">BN-Aura AI</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          <div className={cn(
            "w-2 h-2 rounded-full",
            qualityScore > 70 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
          )} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {qualityScore > 70 ? 'Ready to scan' : 'Positioning...'}
          </span>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!capturedImage ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative w-full max-w-2xl aspect-[3/4] md:aspect-video bg-white/5 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
            >
              {isCameraActive ? (
                <div className="relative w-full h-full">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover grayscale-[20%]"
                  />
                  <canvas 
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-50"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground font-light italic">Initializing AI Vision...</p>
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className={cn(
                  "w-64 h-80 md:w-80 md:h-96 border-2 rounded-[60px] transition-all duration-500 relative",
                  qualityScore > 70 ? "border-primary/60 scale-105" : "border-white/10 border-dashed"
                )}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-4">
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full backdrop-blur-md border transition-all",
                      qualityScore > 70 ? "bg-primary text-primary-foreground border-primary" : "bg-background/80 text-muted-foreground border-white/10"
                    )}>
                      {qualityScore > 70 ? 'Hold Still' : 'Position Face'}
                    </p>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Focus className={cn(
                      "w-12 h-12 transition-all duration-500",
                      qualityScore > 70 ? "text-primary opacity-40 scale-150" : "text-white/5 opacity-0 scale-50"
                    )} />
                  </div>

                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl opacity-40" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl opacity-40" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl opacity-40" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-40" />
                </div>
              </div>

              {error && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500/90 backdrop-blur-md p-6 rounded-3xl text-white flex flex-col items-center gap-3 text-center max-w-xs shadow-2xl z-30">
                  <AlertCircle className="w-10 h-10" />
                  <p className="text-sm font-medium">{error}</p>
                  <button onClick={() => { setError(null); startCamera(); }} className="px-4 py-2 bg-white text-rose-500 rounded-xl font-bold text-xs uppercase tracking-wider">Got it</button>
                </div>
              )}

              <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 pointer-events-auto">
                <button 
                  onClick={resetCapture}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button 
                  onClick={captureImage}
                  disabled={(!isCameraActive && !isMockMode) || (!!error && !isMockMode)} 
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center text-primary-foreground shadow-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50",
                    (qualityScore > 70 || isMockMode) ? "bg-primary shadow-[0_0_40px_rgba(59,130,246,0.5)]" : "bg-white/20 grayscale"
                  )}
                >
                  <Camera className="w-8 h-8 fill-current" />
                </button>
                <div className="w-12 h-12" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              {/* Captured Frame with Ritualistic Overlays */}
              <div className="relative aspect-[3/4] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl glass-card bg-black">
                <AnimatePresence mode="wait">
                  {scanPhase === 'UV_SCAN' && uvImage ? (
                    <motion.img 
                      key="uv"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={uvImage} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      alt="UV Scan" 
                    />
                  ) : scanPhase === 'REDNESS_SCAN' && rednessImage ? (
                    <motion.img 
                      key="redness"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={rednessImage} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      alt="Redness Scan" 
                    />
                  ) : (
                    <motion.img 
                      key="normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                      src={capturedImage || ''} 
                      className="absolute inset-0 w-full h-full object-cover grayscale-[30%]" 
                      alt="Captured" 
                    />
                  )}
                </AnimatePresence>
                
                {/* Scan Line Animation */}
                {(scanPhase === 'UV_SCAN' || scanPhase === 'REDNESS_SCAN' || scanPhase === 'NEURAL_SYNTHESIS') && (
                  <motion.div 
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(59,130,246,1)] z-10"
                  />
                )}

                {/* Aesthetic Genome Constellation Overlay (Synthesis phase) */}
                {scanPhase === 'NEURAL_SYNTHESIS' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-64 h-64 border border-primary/30 rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                    </motion.div>
                  </div>
                )}

                <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
              </div>

              {/* Analysis Status & Ritual Details */}
              <div className="space-y-8 p-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    {scanPhase === 'CALIBRATING' && <Cpu className="w-3 h-3 animate-spin" />}
                    {scanPhase === 'UV_SCAN' && <Layers className="w-3 h-3 animate-pulse" />}
                    {scanPhase === 'REDNESS_SCAN' && <Activity className="w-3 h-3 animate-bounce" />}
                    {scanPhase === 'NEURAL_SYNTHESIS' && <Scan className="w-3 h-3 animate-pulse" />}
                    {scanPhase === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    
                    {scanPhase === 'CALIBRATING' && 'Calibrating Sensors...'}
                    {scanPhase === 'UV_SCAN' && 'Deep Tissue Scan (UV Mode)...'}
                    {scanPhase === 'REDNESS_SCAN' && 'Inflammation Scan (Redness Mode)...'}
                    {scanPhase === 'NEURAL_SYNTHESIS' && 'Aura Neural Synthesis...'}
                    {scanPhase === 'COMPLETED' && 'Analysis Complete'}
                  </div>
                  
                  <h2 className="text-4xl font-display font-bold text-white">
                    {scanPhase === 'CALIBRATING' && 'Optimizing for Precision'}
                    {scanPhase === 'UV_SCAN' && 'Unveiling Hidden Pigmentation'}
                    {scanPhase === 'REDNESS_SCAN' && 'Mapping Inflammation Zones'}
                    {scanPhase === 'NEURAL_SYNTHESIS' && 'Synthesizing Aesthetic Genome'}
                    {scanPhase === 'COMPLETED' && 'Your Personalized Aura Report'}
                  </h2>
                  
                  <p className="text-muted-foreground font-light leading-relaxed">
                    {scanPhase === 'CALIBRATING' && 'Adjusting AI vision for optimal clarity and depth perception.'}
                    {scanPhase === 'UV_SCAN' && 'Scanning for sun damage, dark spots, and melanin distribution beneath the surface.'}
                    {scanPhase === 'REDNESS_SCAN' && 'Detecting areas of sensitivity, redness, and potential inflammation.'}
                    {scanPhase === 'NEURAL_SYNTHESIS' && 'Connecting 468 facial landmarks with deep tissue data for a holistic view.'}
                    {scanPhase === 'COMPLETED' && 'Clinical report generated. Recommendations calibrated to your unique features.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-light tracking-wide uppercase text-[10px] font-bold">Overall Progress</span>
                      <span className="text-primary font-bold">{scanProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        className="h-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[ 
                      { label: 'Sensor Calibration', status: scanProgress >= 20 },
                      { label: 'Deep Tissue Analysis', status: scanProgress >= 40 },
                      { label: 'Inflammation Mapping', status: scanProgress >= 60 },
                      { label: 'Neural Network Processing', status: scanProgress >= 80 },
                      { label: 'Aesthetic Recommendations', status: scanProgress === 100 }
                    ].map((step, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                          step.status ? "bg-primary/5 border-primary/20" : "bg-white/[0.02] border-white/5"
                        )}
                      >
                        {step.status ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
                        )}
                        <span className={cn(
                          "text-sm transition-colors",
                          step.status ? "text-white font-medium" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={scanPhase !== 'COMPLETED'} 
                  onClick={() => {/* Final push is handled by timeout in runAnalysis */}} 
                  className="w-full py-4 bg-white text-background rounded-2xl font-bold shadow-premium hover:bg-white/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {scanPhase !== 'COMPLETED' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Finalizing Aura Insights...</span>
                    </>
                  ) : (
                    <span>Access My Aura Report</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <footer className="z-20 p-6 flex items-center justify-center gap-8 border-t border-white/5 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Enterprise RLS Encryption</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Low Latency AI Gateway</span>
        </div>
      </footer>
    </main>
  );
}

export default function SkinAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-display uppercase tracking-widest text-xs">Initializing AI Scan...</p>
      </div>
    }>
      <SkinAnalysisContent />
    </Suspense>
  );
}

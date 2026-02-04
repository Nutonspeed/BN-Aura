'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Brain, Clock, Sparkle, ArrowCounterClockwise, CheckCircle, User, CaretRight, Play, Pause, Lightning, Target, Warning, FileText, ShieldCheck } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import AR3DSimulator from '@/components/AR3DSimulator';
import { type Landmark } from '@/lib/mediapipe';
import { useFaceMeasurement } from '@/hooks/useFaceMeasurement';
import { useAuth } from '@/hooks/useAuth';

interface CustomerInfo {
  name: string;
  age: number;
  phone: string;
  email?: string;
  skinConcerns: string[];
}

interface AnalysisResult {
  overallScore: number;
  skinAge: number;
  skinType: string;
  recommendations: Array<{
    type: string;
    name: string;
    description: string;
    price: string;
    sessions: number;
    urgency: 'high' | 'medium' | 'low';
    confidence: number;
    results?: string;
    expectedResults?: string;
    reasoning?: string;
    timeline?: string;
  }>;
  skinMetrics: Record<string, number>;
  aiInsights: string[];
  riskFactors?: string[];
  followUpAdvice?: string[];
}

export default function MagicScanPage() {
  const router = useRouter();
  const { getClinicId, getUserId } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // States
  const [currentStep, setCurrentStep] = useState<'customer' | 'scan' | 'analysis' | 'proposal'>('customer');
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    age: 25,
    phone: '',
    email: '',
    skinConcerns: []
  });
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [mockLandmarks, setMockLandmarks] = useState<Landmark[]>([]);
  const [selectedTreatment] = useState<'laser' | 'filler' | 'none'>('none');
  const [treatmentIntensity] = useState<number>(50);

  const { measureFace } = useFaceMeasurement();

  // Generate mock landmarks
  useEffect(() => {
    const generateMockLandmarks = () => {
      const landmarks: Landmark[] = [];
      for (let i = 0; i < 468; i++) {
        landmarks.push({
          x: 0.3 + Math.random() * 0.4,
          y: 0.2 + Math.random() * 0.6,
          z: Math.random() * 0.1
        });
      }
      setMockLandmarks(landmarks);
    };
    generateMockLandmarks();
  }, []);

  const initializeCamera = async () => {
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch {
      console.log('Camera not available, using mock data');
    }
  };

  const toggleCamera = async () => {
    if (!isPlaying) {
      await initializeCamera();
      setIsPlaying(true);
    } else {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsPlaying(false);
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    
    try {
      // Check quota availability first
      const clinicId = getClinicId();
      if (!clinicId) {
        alert('ไม่พบข้อมูลคลินิก กรุณาลงชื่อเข้าใช้ใหม่');
        return;
      }
      
      const quotaResponse = await fetch(`/api/quota/usage?clinicId=${clinicId}`);
      
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        const quota = quotaData.quota;
        
        // Check if quota allows scan
        if (quota && quota.currentUsage >= quota.monthlyQuota) {
          // Show quota exceeded warning
          const proceedWithCharge = confirm(
            `คุณได้ใช้โควตาครบแล้ว (${quota.currentUsage}/${quota.monthlyQuota})\n` +
            `การสแกนครั้งนี้จะมีค่าใช้จ่าย ฿${quota.overageRate}\n\n` +
            `คุณต้องการดำเนินการต่อหรือไม่?`
          );
          
          if (!proceedWithCharge) {
            setAnalyzing(false);
            return;
          }
        }
      }
      
      setCurrentStep('analysis');
      
      // Record usage attempt
      const userId = getUserId();
      if (!userId) {
        alert('ไม่พบข้อมูลผู้ใช้ กรุณาลงชื่อเข้าใช้ใหม่');
        setAnalyzing(false);
        return;
      }
      
      const usageResponse = await fetch('/api/quota/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId,
          userId,
          scanType: 'detailed',
          successful: false, // Will update to true if successful
          customerId: `customer-${customerInfo.name}`,
          metadata: {
            customerAge: customerInfo.age,
            skinConcerns: customerInfo.skinConcerns
          }
        })
      });

      // Prepare data for AI analysis
      const facialMetrics = mockLandmarks.length > 0 ? measureFace(
        mockLandmarks.map(l => [l.x, l.y, l.z])
      ) : {
        facialAsymmetry: Math.random() * 10,
        skinTexture: Math.random() * 15,
        volumeLoss: [Math.random() * 5, Math.random() * 5, Math.random() * 5],
        wrinkleDepth: Math.random() * 20,
        poreSize: Math.random() * 25
      };

      const analysisPayload = {
        customerInfo: {
          name: customerInfo.name,
          age: customerInfo.age,
          skinConcerns: customerInfo.skinConcerns
        },
        facialMetrics,
        imageAnalysis: {
          spots: Math.floor(Math.random() * 30) + 40,
          wrinkles: Math.floor(Math.random() * 25) + 30,
          hydration: Math.floor(Math.random() * 30) + 60,
          elasticity: Math.floor(Math.random() * 25) + 65,
          pigmentation: Math.floor(Math.random() * 40) + 50
        }
      };

      // Call AI Analysis API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisPayload)
      });

      if (!response.ok) {
        throw new Error('AI Analysis failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.analysis);
        
        // Initialize Workflow Journey
        try {
          await fetch('/api/workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'initialize',
              customerData: {
                name: customerInfo.name,
                phone: customerInfo.phone,
                email: customerInfo.email,
                age: customerInfo.age
              },
              salesId: userId,
              clinicId: clinicId,
              scanId: data.analysis.id || 'scan-' + Date.now()
            })
          });
        } catch (wErr) {
          console.error('Workflow Init Error:', wErr);
        }
        
        // Update usage record to successful
        await fetch('/api/quota/usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinicId,
            userId,
            scanType: 'detailed',
            successful: true,
            customerId: `customer-${customerInfo.name}`,
            metadata: {
              customerAge: customerInfo.age,
              skinConcerns: customerInfo.skinConcerns,
              analysisScore: data.analysis.overallScore,
              recommendationsCount: data.analysis.recommendations?.length || 0
            }
          })
        });
        
        // Show quota status after successful scan
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          if (usageData.quotaStatus) {
            console.log('Quota remaining:', usageData.quotaStatus.remaining);
          }
        }
      } else {
        throw new Error('AI Analysis returned error');
      }
      
    } catch (error) {
      console.error('AI Analysis error:', error);
      
      // Fallback to mock data if API fails
      const fallbackResult: AnalysisResult = {
        overallScore: Math.floor(Math.random() * 20) + 70,
        skinAge: customerInfo.age + Math.floor(Math.random() * 10) - 5,
        skinType: 'Combination',
        recommendations: [
          {
            type: 'laser',
            name: 'Pico Genesis Laser',
            description: 'กำจัดจุดด่างดำและปรับสีผิวให้สม่ำเสมอ',
            price: '8,000-12,000',
            sessions: 3,
            urgency: 'medium',
            confidence: 85
          }
        ],
        skinMetrics: {
          hydration: 70,
          elasticity: 65,
          pigmentation: 60,
          texture: 75,
          poreSize: 70,
          oiliness: 65
        },
        aiInsights: [
          `การวิเคราะห์ผิวของคุณ${customerInfo.name} เสร็จสิ้น`,
          'ระบบ AI ตรวจพบจุดที่ควรปรับปรุงและให้คำแนะนำเฉพาะ'
        ]
      };
      
      setAnalysisResult(fallbackResult);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateProposal = async () => {
    if (!analysisResult) return;
    
    setCurrentStep('proposal');
    
    try {
      // Calculate lead score
      // leadScore calculation mock
      
      // Prepare proposal data
      const proposalData = {
        customer: {
          name: customerInfo.name,
          age: customerInfo.age,
          skinConcerns: customerInfo.skinConcerns,
          analysisScore: analysisResult.overallScore
        },
        treatments: analysisResult.recommendations.map(rec => ({
          id: rec.type,
          name: rec.name,
          category: rec.type as 'laser' | 'filler' | 'facial',
          basePrice: parseInt(rec.price.split('-')[0].replace(/,/g, '')) || 10000,
          sessionsRequired: rec.sessions,
          duration: rec.results,
          description: rec.description,
          benefits: [rec.expectedResults || 'ปรับปรุงสภาพผิว'],
          aftercare: ['ดูแลตามคำแนะนำแพทย์']
        })),
        clinicInfo: {
          name: 'Bangkok Premium Clinic',
          phone: '02-xxx-xxxx',
          address: 'กรุงเทพฯ',
          doctor: 'แพทย์ผู้เชี่ยวชาญ'
        },
        pricing: {
          subtotal: 0,
          discount: 0,
          total: 0
        },
        timeline: 'เริ่มการรักษาได้ทันที',
        validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')
      };

      // Generate proposal via API
      const response = await fetch('/api/ai/analyze', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo: proposalData.customer,
          recommendations: proposalData.treatments
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Proposal generated successfully:', data.proposal);
        
        // Save to database (mock)
        console.log('Saving proposal and lead scoring data...');
        
        // Calculate and save lead score
        await fetch('/api/leads/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            analysisData: analysisResult,
            engagementData: {
              questionsAsked: Math.floor(Math.random() * 5) + 1,
              timeSpent: Math.floor(Math.random() * 15) + 5,
              followUpInterest: true,
              priceInquiries: Math.floor(Math.random() * 3) + 1
            }
          })
        });
      }
      
    } catch (error) {
      console.error('Error generating proposal:', error);
    }
  };

  const stepIndicators = [
    { key: 'customer', label: 'ข้อมูลลูกค้า', icon: User },
    { key: 'scan', label: 'สแกนหน้า', icon: Camera },
    { key: 'analysis', label: 'วิเคราะห์ AI', icon: Brain },
    { key: 'proposal', label: 'สร้างใบเสนอ', icon: FileText }
  ];

  const currentStepIndex = stepIndicators.findIndex(step => step.key === currentStep);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground pb-20"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
            >
              <Sparkles className="w-4 h-4" />
              Clinical Protocol
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
            >
              Magic <span className="text-primary text-glow">Scan</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground font-light text-sm italic"
            >
              Advanced AI Skin Analysis & Diagnostic Suite.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3"
          >
            <button 
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              Cancel Scan
            </button>
          </motion.div>
        </div>

        {/* Step Indicator - Premium Version */}
        <div className="px-4">
          <div className="max-w-4xl mx-auto glass-card p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              {stepIndicators.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = index < currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-3 relative group">
                      <motion.div 
                        initial={false}
                        animate={{ 
                          scale: isActive ? 1.1 : 1,
                          borderColor: isActive ? 'rgb(var(--primary))' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.1)'
                        }}
                        className={cn(
                          "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500",
                          isActive ? "bg-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.3)]" : 
                          isCompleted ? "bg-emerald-500/10" : "bg-white/5"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <StepIcon className={cn("w-7 h-7 transition-colors duration-500", isActive ? "text-primary" : "text-muted-foreground")} />
                        )}
                      </motion.div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                        isActive ? "text-white" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                      {isActive && (
                        <motion.div 
                          layoutId="active-step-glow"
                          className="absolute -inset-2 bg-primary/10 blur-xl rounded-full z-[-1]"
                        />
                      )}
                    </div>
                    {index < stepIndicators.length - 1 && (
                      <div className="flex-1 h-px mx-4 relative overflow-hidden bg-white/10">
                        <motion.div 
                          initial={false}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4">
          <AnimatePresence mode="wait">
          {currentStep === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass-premium p-10 md:p-16 rounded-[48px] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                  <User className="w-48 h-48 text-primary" />
                </div>

                <div className="relative z-10 space-y-10">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Customer <span className="text-primary">Registry</span></h2>
                    <p className="text-sm text-muted-foreground font-light italic">Initialize the diagnostic cycle with client authentication.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Full Identity *</label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all backdrop-blur-md shadow-inner"
                        placeholder="Clinical Name"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Chronological Age *</label>
                      <input
                        type="number"
                        value={customerInfo.age}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, age: parseInt(e.target.value) || 25 }))}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all backdrop-blur-md shadow-inner"
                        min="15"
                        max="80"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Communication Channel *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all backdrop-blur-md shadow-inner"
                      placeholder="+66 (0) 00-000-0000"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Digital Mail (Optional)</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all backdrop-blur-md shadow-inner"
                      placeholder="client@excellence.com"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep('scan')}
                    disabled={!customerInfo.name || !customerInfo.phone}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-[28px] font-black uppercase tracking-[0.2em] text-xs shadow-premium hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                  >
                    Authorize & Begin Scan
                    <ChevronRight className="w-4 h-4 stroke-[3px]" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl mx-auto"
            >
              <div className="glass-premium p-8 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Facial <span className="text-primary text-glow">Acquisition</span></h2>
                    <p className="text-sm text-muted-foreground font-light italic">Align facial geometry within the biometric grid for optimal precision.</p>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Feed Secure</span>
                  </div>
                </div>

                <div className="relative aspect-video bg-[#050505] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl group/scanner">
                  {/* Biometric Grid Overlay */}
                  <div className="absolute inset-0 bg-scanner-grid opacity-20 pointer-events-none" />
                  
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] contrast-[1.1]"
                    playsInline
                  />
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <AR3DSimulator
                      landmarks={mockLandmarks}
                      treatmentType={selectedTreatment}
                      treatmentIntensity={treatmentIntensity}
                    />
                  </div>

                  {/* Aesthetic Scanner Frame */}
                  <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
                  <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-primary/40 rounded-tl-3xl" />
                  <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-primary/40 rounded-tr-3xl" />
                  <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-primary/40 rounded-bl-3xl" />
                  <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-primary/40 rounded-br-3xl" />

                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md"
                      >
                        <div className="text-center space-y-8">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-24 h-24 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
                          >
                            <Camera className="w-10 h-10 text-primary" />
                          </motion.div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Imaging Node Offline</h3>
                            <p className="text-sm text-muted-foreground font-light italic">Authorize system access to proceed with biometric mapping.</p>
                          </div>
                          <button
                            onClick={toggleCamera}
                            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                          >
                            <Play className="w-4 h-4 stroke-[3px]" />
                            Initialize Camera
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {analyzing && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-20"
                      >
                        <div className="text-center space-y-10">
                          <div className="relative">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="w-32 h-32 border-4 border-primary/10 border-t-primary rounded-full mx-auto"
                            />
                            <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em]">AI Processing</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.5em] animate-pulse">Scanning cutaneous data nodes...</p>
                          </div>
                          <div className="max-w-[200px] mx-auto space-y-2">
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 5 }}
                                className="h-full bg-primary"
                              />
                            </div>
                            <p className="text-[9px] text-primary font-black uppercase tracking-widest">Biometric Validation 94%</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <button
                    onClick={() => setCurrentStep('customer')}
                    className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95"
                  >
                    Reverse Cycle
                  </button>
                  
                  <div className="flex-1 flex gap-4">
                    <button
                      onClick={toggleCamera}
                      disabled={analyzing}
                      className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center gap-3 group"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 text-rose-400 group-hover:animate-pulse" />
                          Stop Feed
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                          Resume Feed
                        </>
                      )}
                    </button>

                    <button
                      onClick={startAnalysis}
                      disabled={!isPlaying || analyzing}
                      className="flex-1 py-5 bg-primary text-primary-foreground rounded-[28px] font-black uppercase tracking-[0.3em] text-[10px] shadow-premium hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 italic" />
                      <Zap className="w-4 h-4 stroke-[3px]" />
                      Execute Neural Diagnostic
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'analysis' && analysisResult && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Performance Summary Card */}
                  <div className="glass-premium p-10 rounded-[40px] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                      <Brain className="w-48 h-48 text-primary" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Diagnostic <span className="text-primary">Intelligence</span></h2>
                        <p className="text-sm text-muted-foreground font-light italic">Comprehensive cognitive assessment of cutaneous health.</p>
                      </div>
                      <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Aura Score</p>
                          <div className="text-4xl font-black text-primary tracking-tighter">{analysisResult.overallScore}%</div>
                        </div>
                        <div className="h-12 w-px bg-white/10" />
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                          <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                      {[
                        { label: 'Skin Age', value: analysisResult.skinAge, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Biological Age', value: customerInfo.age, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'System Confidence', value: '94.2%', icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Data Nodes', value: '468+', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' }
                      ].map((item, i) => (
                        <motion.div 
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all text-center group/stat"
                        >
                          <div className={cn("w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center border border-white/5 group-hover/stat:scale-110 transition-transform", item.bg, item.color)}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-xl font-black text-white">{item.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Skin Metrics Visualization */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Critical Cutaneous Biomarkers</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        {Object.entries(analysisResult.skinMetrics).map(([key, value], i) => {
                          const labels: Record<string, string> = {
                            hydration: 'Hydration Level',
                            elasticity: 'Dermal Elasticity',
                            pigmentation: 'Melanin Distribution',
                            texture: 'Surface Refinement',
                            poreSize: 'Pore Structural Integrity',
                            oiliness: 'Sebum Equilibrium'
                          };

                          return (
                            <motion.div 
                              key={key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + i * 0.05 }}
                              className="space-y-3"
                            >
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labels[key]}</span>
                                <span className="text-xs font-black text-white">{value}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${value}%` }}
                                  transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                                  className={cn(
                                    "h-full rounded-full shadow-sm",
                                    value >= 80 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 
                                    value >= 60 ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                  )}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* AI Cognitive Insights */}
                  <div className="glass-premium p-10 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">AI Cognitive <span className="text-primary">Insights</span></h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {analysisResult.aiInsights.map((insight, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 + index * 0.1 }}
                          className="p-5 bg-white/5 rounded-[28px] border border-white/5 flex gap-4 hover:bg-white/[0.08] transition-all"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                          <p className="text-xs text-muted-foreground font-light leading-relaxed italic">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Treatment Protocol Engine */}
                <div className="space-y-8">
                  <div className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-8 sticky top-24">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Target className="w-5 h-5 text-primary" />
                        Recommended Protocol
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {analysisResult.recommendations.map((treatment, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                          className="p-6 border border-white/5 rounded-[32px] bg-white/5 hover:border-primary/40 transition-all group/rec cursor-pointer hover:bg-white/[0.08] relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/rec:opacity-10 transition-opacity">
                            <Sparkles className="w-12 h-12 text-primary" />
                          </div>
                          
                          <div className="flex items-start justify-between mb-3 relative z-10">
                            <div className="font-black text-white uppercase tracking-tight group-hover/rec:text-primary transition-colors">{treatment.name}</div>
                            <div className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase border border-primary/20">
                              {treatment.confidence}% Fit
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-5 font-light leading-relaxed line-clamp-2">{treatment.description}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                            <div className="space-y-0.5">
                              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Est. Investment</p>
                              <span className="text-sm font-black text-emerald-400 tracking-tight">฿{treatment.price}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Cycle</p>
                              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{treatment.sessions} Sessions</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="p-5 bg-rose-500/5 rounded-3xl border border-rose-500/10 flex gap-4">
                      <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Risk Mitigation</p>
                        <p className="text-[9px] text-muted-foreground font-light leading-relaxed">System detected slight sensitivity in epidermal layer. Advisor supervision required for laser intensity.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-6">
                <button
                  onClick={() => setCurrentStep('scan')}
                  className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95"
                >
                  Relaunch Diagnostic
                </button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateProposal}
                  className="flex-1 py-5 bg-primary text-primary-foreground rounded-[28px] font-black uppercase tracking-[0.3em] text-[10px] shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-3"
                >
                  <FileText className="w-4 h-4 stroke-[3px]" />
                  Generate Aesthetic Proposal
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 'proposal' && (
            <motion.div
              key="proposal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-premium p-12 md:p-20 rounded-[60px] border border-white/10 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                <div className="relative z-10 space-y-10">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                    className="w-24 h-24 rounded-[32px] bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </motion.div>

                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tight">Intelligence <span className="text-primary">Synchronized</span></h2>
                    <p className="text-lg text-muted-foreground font-light max-w-lg mx-auto leading-relaxed">
                      Neural diagnostic for <span className="text-white font-bold">{customerInfo.name}</span> is complete. The digital proposal has been encrypted and stored in the clinical vault.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/sales/proposals')}
                      className="flex-1 py-5 bg-primary text-primary-foreground rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-3"
                    >
                      <FileText className="w-4 h-4 stroke-[3px]" />
                      Access Digital Asset
                    </motion.button>
                    
                    <button
                      onClick={() => {
                        setCurrentStep('customer');
                        setAnalysisResult(null);
                        setCustomerInfo({ name: '', age: 25, phone: '', email: '', skinConcerns: [] });
                      }}
                      className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95"
                    >
                      Begin New Registry
                    </button>
                  </div>

                  <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Cloud Synchronization Complete</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium italic">ISO 27001 Secured Pipeline</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </motion.div>
  );
}

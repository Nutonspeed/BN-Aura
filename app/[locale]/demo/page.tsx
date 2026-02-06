'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, ArrowCounterClockwise, Pulse, Sparkle, SpinnerGap, WarningCircle } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import AR3DSimulator from '@/components/AR3DSimulator';
import { type Landmark } from '@/lib/mediapipe';
import { useFaceMeasurement } from '@/hooks/useFaceMeasurement';
import BeforeAfterReport from '@/components/BeforeAfterReport';

interface FaceMeasurement {
  facialAsymmetry: number;
  skinTexture: number;
  volumeLoss: number[];
  wrinkleDepth: number;
  poreSize: number;
}

// Enhanced mock data with realistic skin analysis simulation
const mockAnalysisData = {
  overallScore: 78,
  skinAge: 28,
  actualAge: 32,
  skinType: "Combination",
  concerns: ["Fine Lines", "Dark Spots", "Large Pores"],
  recommendations: [
    { 
      type: 'filler', 
      name: 'Hyaluronic Acid Filler', 
      description: 'เติมเต็มร่องลึกใต้ตา และร่องแก้ม', 
      icon: '💉', 
      sessions: 2,
      price: '12,000-18,000',
      urgency: 'medium',
      results: '2-3 weeks'
    },
    { 
      type: 'laser', 
      name: 'CO2 Fractional Laser', 
      description: 'ลดริ้วรอยและรูขุมขนใหญ่', 
      icon: '✨', 
      sessions: 3,
      price: '8,000-12,000',
      urgency: 'high',
      results: '4-6 weeks'
    },
    { 
      type: 'facial', 
      name: 'HydraFacial MD', 
      description: 'ทำความสะอาดลึก ฟื้นฟูผิว', 
      icon: '�', 
      sessions: 4,
      price: '3,500-4,500',
      urgency: 'low',
      results: 'Immediate'
    }
  ],
  skinMetrics: {
    hydration: 72,
    elasticity: 68,
    pigmentation: 58,
    texture: 75,
    poreSize: 65,
    sebumProduction: 82
  },
  aiInsights: [
    "ผิวมีสภาพดีโดยรวม แต่มีจุดด่างดำจากแสงแดดบางส่วน",
    "รูขุมขนบริเวณโซน T ใหญ่กว่าปกติ แนะนำให้ทำ Deep Cleansing",
    "ริ้วรอยรอบดวงตาเริ่มชัดเจน เหมาะสำหรับการรักษาด้วย Filler",
    "ระดับความชุ่มชื้นต่ำกว่าเกณฑ์ ควรใช้ผลิตภัณฑ์บำรุงเข้มข้น"
  ]
};

export default function DemoPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<'filler' | 'laser' | 'facial' | 'none'>('none');
  const [treatmentIntensity, setTreatmentIntensity] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [mockLandmarks, setMockLandmarks] = useState<Landmark[]>([]);
  
  const { measureFace } = useFaceMeasurement();
  const [beforeMeasurements, setBeforeMeasurements] = useState<FaceMeasurement | null>(null);
  const [afterMeasurements, setAfterMeasurements] = useState<FaceMeasurement | null>(null);

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
      console.log('Camera not available in demo mode, using mock data');
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

  const resetSimulation = () => {
    setSelectedTreatment('none');
    setTreatmentIntensity(0);
    setBeforeMeasurements(null);
    setAfterMeasurements(null);
    setShowComparison(false);
  };

  const generateComparison = () => {
    setLoading(true);
    setTimeout(() => {
      if (mockLandmarks) {
        const beforeArray = mockLandmarks.map(l => [l.x, l.y, l.z]);
        const afterArray = mockLandmarks.map(l => [
          l.x + (Math.random() - 0.5) * 0.02,
          l.y + (Math.random() - 0.5) * 0.02,
          l.z
        ]);
        const before = measureFace(beforeArray);
        const after = measureFace(afterArray);
        setBeforeMeasurements(before);
        setAfterMeasurements(after);
        setShowComparison(true);
      }
      setLoading(false);
    }, 2000);
  };

  const simulateTreatment = React.useCallback(() => {
    if (selectedTreatment !== 'none') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    }
  }, [selectedTreatment, setLoading]);

  useEffect(() => {
    simulateTreatment();
  }, [selectedTreatment, simulateTreatment]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2 flex items-center gap-2">
                <Sparkle className="w-8 h-8 text-primary" />
                Demo Mode - ทดลองใช้งาน AR Simulator
              </h1>
              <p className="text-muted-foreground">
                ทดสอบระบบ AR Simulator โดยไม่ต้องเข้าสู่ระบบ (ใช้ข้อมูลจำลอง)
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition-all"
            >
              เข้าสู่ระบบ
            </button>
          </div>
          
          <div className="glass-card p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <WarningCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-200 font-medium">โหมด Demo สำหรับทดลอง</p>
                <p className="text-xs text-yellow-300/70 mt-1">
                  นี่คือเวอร์ชันทดลองที่ใช้ข้อมูลจำลอง ไม่มีการบันทึกข้อมูลจริง ไม่ต้องเข้าสู่ระบบ 
                  และไม่มีการวิเคราะห์ผิวจากรูปภาพจริง
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Enhanced Analysis Results */}
          <div className="glass-card p-6 rounded-[40px] border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">ผลวิเคราะห์ผิวด้วย AI (ข้อมูลจำลอง)</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Real-time Analysis
              </div>
            </div>

            {/* Overall Score & Skin Age */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <div className="text-3xl font-bold text-primary">{mockAnalysisData.overallScore}</div>
                <div className="text-sm text-muted-foreground mt-1">คะแนนรวม</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20">
                <div className="text-3xl font-bold text-emerald-400">{mockAnalysisData.skinAge}</div>
                <div className="text-sm text-muted-foreground mt-1">อายุผิว</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-400">{mockAnalysisData.actualAge}</div>
                <div className="text-sm text-muted-foreground mt-1">อายุจริง</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl border border-purple-500/20">
                <div className="text-lg font-bold text-purple-400">{mockAnalysisData.skinType}</div>
                <div className="text-sm text-muted-foreground mt-1">ประเภทผิว</div>
              </div>
            </div>

            {/* Detailed Skin Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">รายละเอียดการวิเคราะห์</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(mockAnalysisData.skinMetrics).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    hydration: 'ความชุ่มชื้น',
                    elasticity: 'ความยืดหยุ่น', 
                    pigmentation: 'รองค์ผิว',
                    texture: 'เนื้อผิว',
                    poreSize: 'รูขุมขน',
                    sebumProduction: 'ความมัน'
                  };
                  
                  const getColor = (score: number) => {
                    if (score >= 80) return 'text-green-400';
                    if (score >= 60) return 'text-yellow-400';
                    return 'text-red-400';
                  };

                  return (
                    <div key={key} className="p-3 bg-white/5 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">{labels[key]}</span>
                        <span className={`text-sm font-bold ${getColor(value)}`}>{value}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            value >= 80 ? 'bg-green-400' : 
                            value >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Insights */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10">
              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Sparkle className="w-4 h-4" />
                AI Insights & Recommendations
              </h4>
              <div className="space-y-2">
                {mockAnalysisData.aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 rounded-[40px] border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">AR 3D Simulator</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleCamera}
                      className={`p-3 rounded-xl transition-all ${
                        isPlaying ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={resetSimulation}
                      className="p-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all"
                    >
                      <ArrowCounterClockwise className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video bg-black/20 rounded-3xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                  />
                  
                  <AR3DSimulator
                    landmarks={mockLandmarks}
                    treatmentType={selectedTreatment === 'facial' ? 'none' : selectedTreatment}
                    treatmentIntensity={treatmentIntensity}
                  />

                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="text-center">
                        <Camera className="w-16 h-16 text-white/50 mx-auto mb-4" />
                        <p className="text-white/70">กดปุ่ม Play เพื่อเริ่มต้น</p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    ความเข้มของการรักษา: {Math.round(treatmentIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={treatmentIntensity}
                    onChange={(e) => setTreatmentIntensity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {showComparison && beforeMeasurements && afterMeasurements && (
                <BeforeAfterReport
                  before={beforeMeasurements}
                  after={afterMeasurements}
                  treatmentType={selectedTreatment}
                />
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-[40px] border border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Pulse className="w-4 h-4 text-primary" />
                    แนะนำการรักษาจาก AI
                  </h3>
                  <div className="space-y-3">
                    {mockAnalysisData.recommendations.map((treatment, index) => {
                      const urgencyColors = {
                        high: 'border-red-500/30 bg-red-500/5',
                        medium: 'border-yellow-500/30 bg-yellow-500/5', 
                        low: 'border-green-500/30 bg-green-500/5'
                      };
                      
                      const urgencyLabels = {
                        high: 'เร่งด่วน',
                        medium: 'ปานกลาง',
                        low: 'ไม่เร่งด่วน'
                      };

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedTreatment(treatment.type as 'filler' | 'laser' | 'facial');
                            setTreatmentIntensity(0.7);
                          }}
                          className={`w-full p-4 text-white rounded-2xl text-left hover:bg-white/10 transition-all border ${urgencyColors[treatment.urgency as keyof typeof urgencyColors]} group`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">{treatment.icon}</div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                                  {treatment.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ฿{treatment.price}
                                </div>
                              </div>
                              
                              <p className="text-sm text-white/70 leading-relaxed">
                                {treatment.description}
                              </p>
                              
                              <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span className="font-medium">Sessions:</span>
                                  <span className="px-2 py-1 bg-white/10 rounded-md">{treatment.sessions}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span className="font-medium">Results:</span>
                                  <span>{treatment.results}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="font-medium text-muted-foreground">Priority:</span>
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    treatment.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
                                    treatment.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {urgencyLabels[treatment.urgency as keyof typeof urgencyLabels]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-[40px] border border-white/10">
                <button
                  onClick={generateComparison}
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-5 h-5 animate-spin" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <Sparkle className="w-5 h-5" />
                      สร้างรายงานเปรียบเทียบ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

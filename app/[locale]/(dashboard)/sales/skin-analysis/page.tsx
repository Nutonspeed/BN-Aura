'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { SpinnerGap, CheckCircle, Warning } from '@phosphor-icons/react';

type AnalysisStep = 'capture' | 'analyzing' | 'results';

interface CustomerOption { id: string; user_id: string; full_name: string; email: string; phone: string | null; metadata: any; }

interface AnalysisData {
  overallScore?: number; skinAge?: number; skinAgeDifference?: number;
  symmetry?: any; skinMetrics?: any; wrinkleAnalysis?: any;
  timeTravelData?: any; skinTwins?: any; summary?: any;
  recommendations?: any; aiPowered?: boolean; quotaInfo?: any; confidence?: number;
}

export default function SalesAISkinAnalysisPage() {
  const { getClinicId, getUserId } = useAuth();
  const [step, setStep] = useState<AnalysisStep>('capture');
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [customerAge, setCustomerAge] = useState(35);
  const [savedId, setSavedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const clinicId = getClinicId();
  const userId = getUserId();

  // Fetch customers assigned to this sales staff
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch('/api/sales/customers');
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } catch (e) { console.error('Failed to fetch customers:', e); }
    setLoadingCustomers(false);
  }, []);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Capture image from video to base64
  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const v = videoRef.current, cv = canvasRef.current;
    cv.width = v.videoWidth || 640; cv.height = v.videoHeight || 480;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.85);
  };


  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      alert('กรุณาอนุญาตการเข้าถึงกล้อง');
    }
  };

  // POST real image to AI analysis pipeline
  const captureAndAnalyze = async () => {
    if (!selectedCustomer) { alert('กรุณาเลือกลูกค้าก่อนวิเคราะห์'); return; }
    setIsCapturing(true); setStep('analyzing'); setSavedId(null);
    try {
      // Step 1: Capture real image from camera
      const imageData = captureImage();
      if (!imageData) throw new Error('ไม่สามารถถ่ายภาพได้');

      // Step 2: POST to AI Skin Analysis (real Gemini AI + quota)
      const skinRes = await fetch('/api/analysis/skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          customerInfo: {
            customerId: selectedCustomer.id,
            name: selectedCustomer.full_name,
            email: selectedCustomer.email,
            age: customerAge,
          },
          useAI: true,
          clinicId,
          userId,
        }),
      });
      const skinData = await skinRes.json();

      if (!skinData.success) {
        if (skinData.error === 'QUOTA_EXCEEDED') {
          alert('โควต้าหมด: ' + (skinData.message || 'กรุณาอัพเกรดแพ็คเกจ'));
          setStep('capture'); setIsCapturing(false); return;
        }
        throw new Error(skinData.error || 'Analysis failed');
      }

      if (skinData.data?.quotaInfo) {
        setQuotaRemaining(skinData.data.quotaInfo.remaining);
      }

      const score = skinData.data?.overallScore || 72;
      const concerns = skinData.data?.summary?.concerns || ['wrinkles', 'pores'];

      // Step 3: Time Travel prediction (POST with real score)
      const timeRes = await fetch('/api/analysis/time-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: customerAge, skinScore: score, skinType: 'combination' }),
      });
      const timeData = await timeRes.json();

      // Step 4: Skin Twin matching (POST with real metrics)
      const twinRes = await fetch('/api/analysis/skin-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: customerAge,
          gender: selectedCustomer.metadata?.gender || 'female',
          skinType: 'combination',
          concerns,
          skinScore: score,
        }),
      });
      const twinData = await twinRes.json();

      // Step 5: Save analysis results
      const saveRes = await fetch('/api/analysis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          clinicId,
          actualAge: customerAge,
          analysisData: {
            symmetry: skinData.data?.symmetry,
            skinMetrics: skinData.data?.skinMetrics,
            wrinkleAnalysis: skinData.data?.wrinkleAnalysis,
            timeTravelData: timeData.data,
            skinTwins: twinData.data,
          },
        }),
      });
      const saveResult = await saveRes.json();
      if (saveResult.success) setSavedId(saveResult.data?.analysisId);

      // Store all analysis results into state for rendering
      setAnalysisData({
        overallScore: skinData.data?.overallScore,
        skinAge: skinData.data?.skinAge,
        skinAgeDifference: skinData.data?.skinAgeDifference,
        symmetry: skinData.data?.symmetry,
        skinMetrics: skinData.data?.skinMetrics,
        wrinkleAnalysis: skinData.data?.wrinkleAnalysis,
        timeTravelData: timeData.data,
        skinTwins: twinData.data,
        summary: skinData.data?.summary,
        recommendations: skinData.data?.recommendations,
        aiPowered: skinData.data?.aiPowered,
        quotaInfo: skinData.data?.quotaInfo,
        confidence: skinData.data?.confidence,
      });

      setStep('results');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStep('capture');
    } finally {
      setIsCapturing(false);
    }
  };

  // Reset analysis
  const resetAnalysis = () => {
    setStep('capture');
    setAnalysisData({});
    setActiveTab('overview');
  };

  useEffect(() => {
    if (step === 'capture') {
      startCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🧠 BN-Aura AI Skin Analysis
              <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded-full">
                VISIA-Equivalent
              </span>
            </h1>
            <p className="text-gray-400 text-sm">
              ระบบวิเคราะห์ผิวหน้าด้วย AI ระดับมืออาชีพ
            </p>
          </div>
          {step !== 'capture' && (
            <Button variant="outline" onClick={resetAnalysis}>
              🔄 วิเคราะห์ใหม่
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Step 1: Capture */}
        {step === 'capture' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Camera View */}
            <Card className="bg-black/50 border-purple-500/30">
              <CardContent className="p-4">
                <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    autoPlay 
                    playsInline 
                    muted
                  />
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-dashed border-purple-400/50 rounded-full" />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-sm text-purple-300">จัดใบหน้าให้อยู่ในกรอบ</p>
                  </div>
                </div>

                {/* Age Input */}
                <div className="mt-4 flex items-center gap-4">
                  <label className="text-sm text-gray-400">อายุลูกค้า:</label>
                  <input
                    type="number"
                    value={customerAge}
                    onChange={(e) => setCustomerAge(parseInt(e.target.value) || 35)}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    min={18}
                    max={80}
                  />
                  <span className="text-gray-400">ปี</span>
                </div>

                {/* Customer Selection */}
                <div className="mt-4">
                  <label className="text-sm text-gray-400 block mb-2">เลือกลูกค้า:</label>
                  {loadingCustomers ? (
                    <div className="animate-pulse bg-gray-700 h-10 rounded-lg"></div>
                  ) : (
                    <select
                      value={selectedCustomer?.id || ''}
                      onChange={(e) => {
                        const cust = customers.find(c => c.id === e.target.value);
                        setSelectedCustomer(cust || null);
                        if (cust?.metadata?.date_of_birth) {
                          const birthYear = new Date(cust.metadata.date_of_birth).getFullYear();
                          const age = new Date().getFullYear() - birthYear;
                          setCustomerAge(Math.max(18, Math.min(80, age)));
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">-- เลือกลูกค้า --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.full_name} ({cust.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Quota Display */}
                {quotaRemaining !== null && (
                  <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-xs text-purple-300">
                      โควต้าคงเหลือ: <span className="font-bold">{quotaRemaining}</span> scans
                    </p>
                  </div>
                )}

                {/* Capture Button */}
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                  onClick={captureAndAnalyze}
                  disabled={!selectedCustomer || isCapturing}
                >
                  {isCapturing ? '⏳ กำลังวิเคราะห์...' : '📸 วิเคราะห์ผิวหน้า'}
                </Button>
              </CardContent>
            </Card>

            {/* Features Info */}
            <div className="space-y-4">
              <Card className="bg-purple-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    ✨ Features ที่จะวิเคราะห์
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      '📊 8 Skin Metrics (VISIA)',
                      '📐 Facial Symmetry',
                      '✨ Golden Ratio',
                      '〰️ 7 Wrinkle Zones',
                      '🔮 AI Time Travel',
                      '👥 Skin Twin Match',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-purple-200">
                        <span className="text-green-400">✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">💡 เคล็ดลับการถ่ายภาพ</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• อยู่ในที่แสงสว่างเพียงพอ</li>
                    <li>• หันหน้าตรงกับกล้อง</li>
                    <li>• เปิดตาและทำหน้าปกติ</li>
                    <li>• ไม่สวมแว่นหรือหมวก</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <Card className="bg-black/50 border-purple-500/30">
            <CardContent className="p-12 text-center">
              <SpinnerGap className="animate-spin w-16 h-16 text-purple-500 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-2">กำลังวิเคราะห์ผิวหน้า...</h2>
              <p className="text-gray-400 mb-6">ใช้เวลาประมาณ 3-5 วินาที</p>
              
              <div className="max-w-md mx-auto space-y-2">
                {[
                  { label: 'Face Detection', done: true },
                  { label: '468 Landmarks Mapping', done: true },
                  { label: '8 Skin Metrics Analysis', done: false },
                  { label: 'AI Recommendations', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {item.done ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="animate-pulse">⏳</span>
                    )}
                    <span className={item.done ? 'text-green-400' : 'text-gray-400'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results */}
        {step === 'results' && analysisData.skinMetrics && (
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-400">Overall Score</p>
                  <p className="text-4xl font-bold text-purple-400">
                    {analysisData.skinMetrics.overallScore}
                  </p>
                  <p className="text-xs text-gray-500">/100</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-400">Skin Age</p>
                  <p className="text-4xl font-bold text-blue-400">
                    {analysisData.skinMetrics.skinAge}
                  </p>
                  <p className={cn(
                    'text-xs',
                    analysisData.skinMetrics.skinAgeDifference > 0 ? 'text-red-400' : 'text-green-400'
                  )}>
                    {analysisData.skinMetrics.skinAgeDifference > 0 ? '+' : ''}
                    {analysisData.skinMetrics.skinAgeDifference} จากอายุจริง
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border-amber-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-400">Symmetry</p>
                  <p className="text-4xl font-bold text-amber-400">
                    {analysisData.symmetry?.overallSymmetry}%
                  </p>
                  <p className="text-xs text-gray-500">Golden: {analysisData.symmetry?.goldenRatio}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-rose-600/20 to-red-600/20 border-rose-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-400">Wrinkle Level</p>
                  <p className="text-4xl font-bold text-rose-400">
                    {analysisData.wrinkleAnalysis?.overallAgingLevel}
                  </p>
                  <p className="text-xs text-gray-500">/10</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: '📊 Overview', icon: '📊' },
                { id: 'metrics', label: '🔬 8 Metrics', icon: '🔬' },
                { id: 'wrinkles', label: '〰️ Wrinkles', icon: '〰️' },
                { id: 'timetravel', label: '🔮 Time Travel', icon: '🔮' },
                { id: 'twins', label: '👥 Skin Twins', icon: '👥' },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? 'bg-purple-600' : ''}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <Card className="bg-black/30 border-purple-500/20">
              <CardContent className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4 text-green-400">💪 จุดแข็ง</h3>
                      <ul className="space-y-2">
                        {analysisData.skinMetrics.summary?.strengths?.map((s: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-green-400">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4 text-orange-400">⚠️ ควรปรับปรุง</h3>
                      <ul className="space-y-2">
                        {analysisData.skinMetrics.summary?.concerns?.map((c: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-orange-400">!</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 8 Metrics Tab */}
                {activeTab === 'metrics' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysisData.skinMetrics.metrics?.map((m: any) => (
                      <div 
                        key={m.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          m.score >= 70 ? 'bg-green-500/10 border-green-500/30' :
                          m.score >= 40 ? 'bg-yellow-500/10 border-yellow-500/30' :
                          'bg-red-500/10 border-red-500/30'
                        )}
                      >
                        <p className="text-xs text-gray-400">{m.name}</p>
                        <p className="text-sm font-medium">{m.nameThai}</p>
                        <p className={cn(
                          'text-2xl font-bold mt-2',
                          m.score >= 70 ? 'text-green-400' :
                          m.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {m.score}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Wrinkles Tab */}
                {activeTab === 'wrinkles' && analysisData.wrinkleAnalysis && (
                  <div className="space-y-4">
                    {analysisData.wrinkleAnalysis.zones?.map((zone: any) => (
                      <div key={zone.id} className="flex items-center gap-4">
                        <div className="w-32 text-sm">
                          <p className="font-medium">{zone.name}</p>
                          <p className="text-xs text-gray-400">{zone.nameThai}</p>
                        </div>
                        <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              zone.agingLevel <= 3 ? 'bg-green-500' :
                              zone.agingLevel <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${zone.agingLevel * 10}%` }}
                          />
                        </div>
                        <div className="w-16 text-right">
                          <span className="font-bold">{zone.agingLevel}</span>
                          <span className="text-gray-400">/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Time Travel Tab */}
                {activeTab === 'timetravel' && analysisData.timeTravelData && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold">🔮 ดูอนาคตผิวหน้าของคุณ</h3>
                      <p className="text-sm text-gray-400">เปรียบเทียบระหว่างดูแลและไม่ดูแล</p>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {analysisData.timeTravelData.naturalAging?.map((pred: any, i: number) => (
                        <div key={i} className="text-center p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-400">
                            {pred.year === 0 ? 'ตอนนี้' : `+${pred.year} ปี`}
                          </p>
                          <div className="my-2">
                            <p className="text-lg font-bold text-red-400">{pred.skinScore}</p>
                            <p className="text-xs text-gray-500">ไม่ดูแล</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-400">
                              {analysisData.timeTravelData.withTreatment?.[i]?.skinScore}
                            </p>
                            <p className="text-xs text-gray-500">ดูแล</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Card className="bg-purple-500/10 border-purple-500/30">
                      <CardContent className="p-4">
                        <p className="font-semibold text-purple-300">
                          {analysisData.timeTravelData.insights?.messageThai}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {analysisData.timeTravelData.insights?.potentialSavings}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Skin Twins Tab */}
                {activeTab === 'twins' && analysisData.skinTwins && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">👥 คนที่มีผิวคล้ายคุณ</h3>
                      <p className="text-sm text-gray-400">
                        พบ {analysisData.skinTwins.twins?.length} คนที่มีสภาพผิวคล้ายกัน
                      </p>
                    </div>
                    
                    {analysisData.skinTwins.twins?.slice(0, 3).map((twin: any) => (
                      <Card key={twin.twinId} className="bg-gray-800/50 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{twin.displayName}</p>
                              <p className="text-sm text-gray-400">
                                อายุ {twin.profile.ageRange} ปี • {twin.profile.skinType}
                              </p>
                            </div>
                            <span className="text-green-400 font-bold">
                              {twin.matchPercentage}% Match
                            </span>
                          </div>
                          <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                            <p className="text-sm text-green-300">
                              ผลลัพธ์: {twin.results.beforeScore} → {twin.results.afterScore} 
                              (+{twin.results.improvement}%)
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              "{twin.results.testimonial}"
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="text-center text-sm text-purple-300">
                      💡 {analysisData.skinTwins.insights?.messageThai}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Powered Badge */}
            {analysisData.aiPowered && (
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-purple-300">
                    ✨ Powered by Gemini AI • Confidence: {analysisData.confidence}%
                  </p>
                  {savedId && (
                    <p className="text-xs text-gray-400 mt-1">
                      บันทึกแล้ว ID: {savedId}
                    </p>
                  )}
                </CardContent>
              </Card>

            )}

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                📅 นัดหมาย Treatment
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                💬 ปรึกษา AI
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                📄 ส่งรายงาน
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                🖨️ พิมพ์ผลวิเคราะห์
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-8 text-center text-xs text-gray-500">
        <p>Powered by BN-Aura AI • MediaPipe • TensorFlow • Gemini</p>
        <p>© 2026 BN-Aura - Advanced Skin Analysis Platform</p>
      </div>
    </div>
  );
}

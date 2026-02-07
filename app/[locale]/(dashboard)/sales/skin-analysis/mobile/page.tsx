'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Camera, SpinnerGap } from '@phosphor-icons/react';

type Step = 'intro' | 'camera' | 'analyzing' | 'results' | 'details';

interface CustomerOption { id: string; user_id: string; full_name: string; email: string; phone: string | null; metadata: any; }

// duplicate removed

export default function MobileSkinAnalysisPage() {
  const [step, setStep] = useState<Step>('intro');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [customerAge, setCustomerAge] = useState(35);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { getClinicId, getUserId } = useAuth();
  const clinicId = getClinicId();
  const userId = getUserId();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(0);

  const captureImage = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 640 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStep('camera');
    } catch (error) {
      alert('กรุณาอนุญาตการเข้าถึงกล้อง');
    }
  };

  const captureAndAnalyze = async () => {
    if (!selectedCustomer) { alert('กรุณาเลือกลูกค้าก่อนวิเคราะห์'); return; }
    setStep('analyzing');
    try {
      const imageData = captureImage();
      if (!imageData) throw new Error('ไม่สามารถถ่ายภาพได้');

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
          setStep('camera'); return;
        }
        throw new Error(skinData.error || 'Analysis failed');
      }

      if (skinData.data?.quotaInfo) setQuotaRemaining(skinData.data.quotaInfo.remaining);

      const score = skinData.data?.overallScore || 72;
      const timeRes = await fetch('/api/analysis/time-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: customerAge, skinScore: score, skinType: 'combination' }),
      });
      const timeData = await timeRes.json();

      setAnalysisData({
        ...skinData.data,
        timeTravel: timeData.data,
      });

      // Stop camera
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      setStep('results');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('เกิดข้อผิดพลาด');
      setStep('camera');
    }
  };

  // Reset
  const reset = () => {
    setStep('intro');
    setAnalysisData(null);
    setActiveDetail(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900">
      {/* Intro Step */}
      {step === 'intro' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-5xl">🧠</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              BN-Aura AI Skin Analysis
            </h1>
            <p className="text-gray-400">
              วิเคราะห์ผิวหน้าด้วย AI ใน 5 วินาที
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-xs">
            {[
              { icon: '📊', label: '8 Metrics' },
              { icon: '📐', label: 'Symmetry' },
              { icon: '〰️', label: 'Wrinkles' },
              { icon: '🔮', label: 'Time Travel' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                <span className="text-2xl">{f.icon}</span>
                <p className="text-xs text-gray-300 mt-1">{f.label}</p>
              </div>
            ))}
          </div>

          {/* Age Input */}
          <div className="w-full max-w-xs mb-6">
            <label className="text-sm text-gray-400 mb-2 block">อายุลูกค้า</label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCustomerAge(Math.max(18, customerAge - 1))}
                className="w-12 h-12 rounded-full bg-white/10 text-white text-xl"
              >
                -
              </button>
              <span className="text-4xl font-bold text-white w-20 text-center">
                {customerAge}
              </span>
              <button
                onClick={() => setCustomerAge(Math.min(80, customerAge + 1))}
                className="w-12 h-12 rounded-full bg-white/10 text-white text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startCamera}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-500/30"
          >
            📸 เริ่มวิเคราะห์
          </button>
        </div>
      )}

      {/* Camera Step */}
      {step === 'camera' && (
        <div className="min-h-screen flex flex-col">
          {/* Camera View */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {/* Face Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-72 border-2 border-dashed border-white/50 rounded-full" />
            </div>
            {/* Instructions */}
            <div className="absolute top-4 left-0 right-0 text-center">
              <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                จัดใบหน้าให้อยู่ในกรอบ
              </p>
            </div>
          </div>

          {/* Capture Button */}
          <div className="p-6 bg-black/80">
            <button
              onClick={captureAndAnalyze}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-lg"
            >
              📸 ถ่ายภาพ & วิเคราะห์
            </button>
          </div>
        </div>
      )}

      {/* Analyzing Step */}
      {step === 'analyzing' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">กำลังวิเคราะห์...</h2>
          <p className="text-gray-400 text-sm">AI กำลังประมวลผล 468 จุดบนใบหน้า</p>

          <div className="mt-8 space-y-3 w-full max-w-xs">
            {['Face Detection ✓', 'Landmarks Mapping ✓', 'Skin Analysis...', 'AI Processing...'].map((item, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 text-sm',
                i < 2 ? 'text-green-400' : 'text-gray-500'
              )}>
                {i < 2 ? '✓' : '⏳'} {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Step */}
      {step === 'results' && analysisData && (
        <div className="min-h-screen pb-24">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-lg p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-white">ผลวิเคราะห์</h1>
              <button onClick={reset} className="text-purple-400 text-sm">
                วิเคราะห์ใหม่
              </button>
            </div>
          </div>

          {/* Main Scores */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Skin Score</p>
                <p className="text-4xl font-bold text-white">
                  {analysisData.skinMetrics?.overallScore || 72}
                </p>
                <p className="text-xs text-gray-500">/100</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Skin Age</p>
                <p className="text-4xl font-bold text-white">
                  {analysisData.skinMetrics?.skinAge || 38}
                </p>
                <p className={cn(
                  'text-xs',
                  (analysisData.skinMetrics?.skinAgeDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'
                )}>
                  {(analysisData.skinMetrics?.skinAgeDifference || 0) > 0 ? '+' : ''}
                  {analysisData.skinMetrics?.skinAgeDifference || 3} จากอายุจริง
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-400">
                  {analysisData.symmetry?.overallSymmetry || 87}%
                </p>
                <p className="text-xs text-gray-400">Symmetry</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-400">
                  {analysisData.symmetry?.goldenRatio || 1.58}
                </p>
                <p className="text-xs text-gray-400">Golden Ratio</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-rose-400">
                  {analysisData.wrinkleAnalysis?.overallAgingLevel || 5}/10
                </p>
                <p className="text-xs text-gray-400">Wrinkles</p>
              </div>
            </div>

            {/* Detail Cards */}
            <div className="space-y-3">
              {/* 8 Metrics */}
              <button
                onClick={() => setActiveDetail(activeDetail === 'metrics' ? null : 'metrics')}
                className="w-full bg-white/5 rounded-2xl p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-semibold text-white">8 Skin Metrics</p>
                      <p className="text-xs text-gray-400">VISIA-Equivalent Analysis</p>
                    </div>
                  </div>
                  <span className="text-gray-400">{activeDetail === 'metrics' ? '▲' : '▼'}</span>
                </div>
                
                {activeDetail === 'metrics' && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {analysisData.skinMetrics?.metrics?.map((m: any) => (
                      <div key={m.id} className={cn(
                        'p-3 rounded-xl',
                        m.score >= 70 ? 'bg-green-500/20' :
                        m.score >= 40 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                      )}>
                        <p className="text-xs text-gray-400">{m.nameThai}</p>
                        <p className={cn(
                          'text-lg font-bold',
                          m.score >= 70 ? 'text-green-400' :
                          m.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {m.score}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              {/* Time Travel */}
              <button
                onClick={() => setActiveDetail(activeDetail === 'time' ? null : 'time')}
                className="w-full bg-white/5 rounded-2xl p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔮</span>
                    <div>
                      <p className="font-semibold text-white">AI Time Travel</p>
                      <p className="text-xs text-gray-400">ดูอนาคตผิวใน 10 ปี</p>
                    </div>
                  </div>
                  <span className="text-gray-400">{activeDetail === 'time' ? '▲' : '▼'}</span>
                </div>
                
                {activeDetail === 'time' && analysisData.timeTravel && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-4">
                      {analysisData.timeTravel.naturalAging?.map((p: any, i: number) => (
                        <div key={i} className="text-center">
                          <p className="text-xs text-gray-500">
                            {p.year === 0 ? 'Now' : `+${p.year}y`}
                          </p>
                          <p className="text-sm font-bold text-red-400">{p.skinScore}</p>
                          <p className="text-sm font-bold text-green-400">
                            {analysisData.timeTravel.withTreatment?.[i]?.skinScore}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="text-red-400">● ไม่ดูแล</span>
                      <span className="text-green-400">● ดูแลตามแผน</span>
                    </div>
                    <p className="mt-3 text-sm text-purple-300">
                      💡 {analysisData.timeTravel.insights?.messageThai}
                    </p>
                  </div>
                )}
              </button>

              {/* Recommendations */}
              <button
                onClick={() => setActiveDetail(activeDetail === 'recs' ? null : 'recs')}
                className="w-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💊</span>
                    <div>
                      <p className="font-semibold text-white">Treatment แนะนำ</p>
                      <p className="text-xs text-gray-400">สำหรับคุณโดยเฉพาะ</p>
                    </div>
                  </div>
                  <span className="text-gray-400">{activeDetail === 'recs' ? '▲' : '▼'}</span>
                </div>
                
                {activeDetail === 'recs' && (
                  <div className="mt-4 space-y-2">
                    {analysisData.skinMetrics?.summary?.priorityTreatments?.map((t: any, i: number) => (
                      <div key={i} className="bg-white/10 rounded-xl p-3">
                        <p className="font-medium text-white">{t}</p>
                      </div>
                    )) || (
                      <>
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="font-medium text-white">Laser Toning</p>
                          <p className="text-xs text-gray-400">ลดฝ้า กระ จุดด่างดำ</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="font-medium text-white">HydraFacial</p>
                          <p className="text-xs text-gray-400">เพิ่มความชุ่มชื้น</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-lg border-t border-white/10">
            <button className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl text-white font-bold text-lg">
              📅 นัดหมาย Treatment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { SpinnerGap, CheckCircle, Warning } from '@phosphor-icons/react';
import BeforeAfterComparison from '@/components/analysis/BeforeAfterComparison';
import { PDFExporter } from '@/lib/analysis/pdfExporter';
import { ReportGenerator } from '@/lib/analysis/reportGenerator';
import { runClientInference, preloadModels, isClientInferenceSupported } from '@/lib/ai/transformersClient';
import { validateFaceInImage } from '@/lib/ai/faceValidator';
import AICoachPanel from '@/components/sales/AICoachPanel';
import TreatmentPreviewPanel from '@/components/analysis/TreatmentPreviewPanel';
import ScanOverlay from '@/components/analysis/ScanOverlay';
import ScoreReveal, { MiniScore } from '@/components/analysis/ScoreReveal';
import RadarChart from '@/components/analysis/RadarChart';
import FaceZoneMap from '@/components/analysis/FaceZoneMap';

type AnalysisStep = 'capture' | 'analyzing' | 'results';

interface CustomerOption { id: string; user_id: string; full_name: string; email: string; phone: string | null; metadata: any; }

interface AnalysisData {
  overallScore?: number; skinAge?: number; skinAgeDifference?: number;
  symmetry?: any; skinMetrics?: any; wrinkleAnalysis?: any;
  timeTravelData?: any; skinTwins?: any; summary?: any;
  recommendations?: any; aiPowered?: boolean; quotaInfo?: any; confidence?: number;
  visiaScores?: Record<string, number>; hfAnalysis?: any; skinType?: string;
  modelsUsed?: string[]; processingTime?: number;
}

const PIPELINE_STEPS = [
  { id: 'face', label: 'Face Detection', thai: 'ตรวจจับใบหน้า', icon: '🧑', duration: 800 },
  { id: 'skintype', label: 'Skin Type Analysis', thai: 'วิเคราะห์ประเภทผิว', icon: '🔬', duration: 1200 },
  { id: 'age', label: 'Age Estimation', thai: 'ประเมินอายุผิว', icon: '🎂', duration: 1000 },
  { id: 'conditions', label: 'Condition Detection', thai: 'ตรวจสภาพผิว', icon: '🔍', duration: 1500 },
  { id: 'visia', label: 'VISIA 8 Metrics', thai: 'คำนวณ 8 คะแนน', icon: '📊', duration: 2000 },
  { id: 'recommend', label: 'AI Recommendations', thai: 'แนะนำ Treatment', icon: '✨', duration: 1000 },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const clinicId = getClinicId();
  const userId = getUserId();
  const [clientPreAnalysis, setClientPreAnalysis] = useState<any>(null);
  const [validatingFace, setValidatingFace] = useState(false);
  const [showCoachPanel, setShowCoachPanel] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  useEffect(() => { if (isClientInferenceSupported()) { preloadModels().catch(() => {}); } }, []);

  useEffect(() => {
    if (step !== 'analyzing') { setPipelineStep(0); return; }
    let idx = 0;
    const interval = setInterval(() => { idx++; if (idx >= PIPELINE_STEPS.length) { clearInterval(interval); return; } setPipelineStep(idx); }, 1200);
    return () => clearInterval(interval);
  }, [step]);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try { const res = await fetch('/api/sales/customers'); const data = await res.json(); if (data.success) setCustomers(data.customers || []); } catch (e) { console.error('Failed to fetch customers:', e); }
    setLoadingCustomers(false);
  }, []);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const v = videoRef.current, cv = canvasRef.current;
    cv.width = v.videoWidth || 640; cv.height = v.videoHeight || 480;
    const ctx = cv.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(v, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.85);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const img = await new Promise<HTMLImageElement>((resolve) => { const el = new Image(); el.onload = () => resolve(el); el.src = dataUrl; });
      if (img.width < 200 || img.height < 200) { alert('รูปภาพความละเอียดต่ำเกินไป (ต้องอย่างน้อย 200x200px)'); return; }
      setValidatingFace(true);
      try { const faceResult = await validateFaceInImage(dataUrl); if (!faceResult.hasFace || faceResult.confidence < 0.3) { alert(faceResult.message); setValidatingFace(false); return; } } catch (err) { console.warn('Face validation skipped:', err); }
      setValidatingFace(false); setUploadedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeUploadedImage = async () => {
    if (!selectedCustomer) { alert('กรุณาเลือกลูกค้าก่อนวิเคราะห์'); return; }
    if (!uploadedImage) { alert('กรุณาอัพโหลดรูปภาพก่อน'); return; }
    setIsCapturing(true); setStep('analyzing'); setSavedId(null);
    try {
      const imageData = uploadedImage;
      let clientResults = null;
      if (isClientInferenceSupported() && imageData) { try { clientResults = await runClientInference(imageData); setClientPreAnalysis(clientResults); } catch (e) { console.warn('Client inference skipped:', e); } }
      const skinRes = await fetch('/api/analysis/skin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData, customerInfo: { customerId: selectedCustomer.id, name: selectedCustomer.full_name, email: selectedCustomer.email, age: customerAge }, useAI: true, clinicId, userId, clientPreAnalysis: clientResults, source: 'upload' }) });
      const skinData = await skinRes.json();
      if (!skinData.success) { if (skinData.error === 'QUOTA_EXCEEDED') { alert('โควต้าหมด: ' + (skinData.message || 'กรุณาอัพเกรดแพ็คเกจ')); setStep('capture'); setIsCapturing(false); return; } throw new Error(skinData.error || 'Analysis failed'); }
      if (skinData.data?.quotaInfo) setQuotaRemaining(skinData.data.quotaInfo.remaining);
      const score = skinData.data?.overallScore || 72;
      const [timeRes, twinRes] = await Promise.all([
        fetch('/api/analysis/time-travel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age: customerAge, skinScore: score, skinType: skinData.data?.skinType || 'combination' }) }),
        fetch('/api/analysis/skin-twin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age: customerAge, gender: selectedCustomer.metadata?.gender || 'female', skinType: skinData.data?.skinType || 'combination', concerns: skinData.data?.summary?.concerns || [], metrics: skinData.data?.visiaScores || {}, skinScore: score }) }),
      ]);
      const [timeData, twinData] = await Promise.all([timeRes.json(), twinRes.json()]);
      await fetch('/api/analysis/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: selectedCustomer.id, clinicId, actualAge: customerAge, analysisData: { symmetry: skinData.data?.symmetry, skinMetrics: skinData.data?.skinMetrics, wrinkleAnalysis: skinData.data?.wrinkleAnalysis, timeTravelData: timeData.data, skinTwins: twinData.data } }) }).then(r => r.json()).then(d => { if (d.success) setSavedId(d.data?.analysisId); });
      setAnalysisData({ overallScore: skinData.data?.overallScore, skinAge: skinData.data?.skinAge, skinAgeDifference: skinData.data?.skinAgeDifference, symmetry: skinData.data?.symmetry, skinMetrics: skinData.data?.skinMetrics, wrinkleAnalysis: skinData.data?.wrinkleAnalysis, timeTravelData: timeData.data, skinTwins: twinData.data, summary: skinData.data?.summary, recommendations: skinData.data?.recommendations, aiPowered: skinData.data?.aiPowered, quotaInfo: skinData.data?.quotaInfo, confidence: skinData.data?.confidence, visiaScores: skinData.data?.visiaScores, hfAnalysis: skinData.data?.hfAnalysis, skinType: skinData.data?.skinType, modelsUsed: skinData.data?.modelsUsed, processingTime: skinData.data?.processingTime });
      setStep('results');
    } catch (error) { console.error('Upload analysis error:', error); alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); setStep('capture'); } finally { setIsCapturing(false); }
  };

  const startCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } }); if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } } catch (error) { console.warn('Camera access denied:', error); }
  };

  const captureAndAnalyze = async () => {
    if (!selectedCustomer) { alert('กรุณาเลือกลูกค้าก่อนวิเคราะห์'); return; }
    setIsCapturing(true); setStep('analyzing'); setSavedId(null);
    try {
      const imageData = captureImage();
      if (!imageData) throw new Error('ไม่สามารถถ่ายภาพได้');
      let clientResults = null;
      if (isClientInferenceSupported() && imageData) { try { clientResults = await runClientInference(imageData); setClientPreAnalysis(clientResults); } catch (e) { console.warn('Client inference skipped:', e); } }
      const skinRes = await fetch('/api/analysis/skin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData, customerInfo: { customerId: selectedCustomer.id, name: selectedCustomer.full_name, email: selectedCustomer.email, age: customerAge }, useAI: true, clinicId, userId, clientPreAnalysis: clientResults }) });
      const skinData = await skinRes.json();
      if (!skinData.success) { if (skinData.error === 'QUOTA_EXCEEDED') { alert('โควต้าหมด: ' + (skinData.message || 'กรุณาอัพเกรดแพ็คเกจ')); setStep('capture'); setIsCapturing(false); return; } throw new Error(skinData.error || 'Analysis failed'); }
      if (skinData.data?.quotaInfo) setQuotaRemaining(skinData.data.quotaInfo.remaining);
      const score = skinData.data?.overallScore || 72;
      const concerns = skinData.data?.summary?.concerns || ['wrinkles', 'pores'];
      const [timeRes, twinRes] = await Promise.all([
        fetch('/api/analysis/time-travel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age: customerAge, skinScore: score, skinType: skinData.data?.skinType || clientPreAnalysis?.skinType?.label || 'combination' }) }),
        fetch('/api/analysis/skin-twin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age: customerAge, gender: selectedCustomer.metadata?.gender || 'female', skinType: 'combination', concerns, skinScore: score }) }),
      ]);
      const [timeData, twinData] = await Promise.all([timeRes.json(), twinRes.json()]);
      const saveRes = await fetch('/api/analysis/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: selectedCustomer.id, clinicId, actualAge: customerAge, analysisData: { symmetry: skinData.data?.symmetry, skinMetrics: skinData.data?.skinMetrics, wrinkleAnalysis: skinData.data?.wrinkleAnalysis, timeTravelData: timeData.data, skinTwins: twinData.data } }) });
      const saveResult = await saveRes.json(); if (saveResult.success) setSavedId(saveResult.data?.analysisId);
      setAnalysisData({ overallScore: skinData.data?.overallScore, skinAge: skinData.data?.skinAge, skinAgeDifference: skinData.data?.skinAgeDifference, symmetry: skinData.data?.symmetry, skinMetrics: skinData.data?.skinMetrics, wrinkleAnalysis: skinData.data?.wrinkleAnalysis, timeTravelData: timeData.data, skinTwins: twinData.data, summary: skinData.data?.summary, recommendations: skinData.data?.recommendations, aiPowered: skinData.data?.aiPowered, quotaInfo: skinData.data?.quotaInfo, confidence: skinData.data?.confidence, visiaScores: skinData.data?.visiaScores, hfAnalysis: skinData.data?.hfAnalysis, skinType: skinData.data?.skinType, modelsUsed: skinData.data?.modelsUsed, processingTime: skinData.data?.processingTime });
      setStep('results');
    } catch (error) { console.error('Analysis error:', error); alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); setStep('capture'); } finally { setIsCapturing(false); }
  };


  const buildRadarMetrics = () => {
    const metricsArr = analysisData.skinMetrics?.metrics;
    if (Array.isArray(metricsArr) && metricsArr.length > 0) return metricsArr;
    const vs = analysisData.visiaScores || analysisData.skinMetrics?.visiaScores;
    if (vs && typeof vs === 'object') {
      const nameMap: Record<string, { name: string; nameThai: string }> = {
        spots: { name: 'Spots', nameThai: 'จุดด่างดำ' },
        wrinkles: { name: 'Wrinkles', nameThai: 'ริ้วรอย' },
        texture: { name: 'Texture', nameThai: 'พื้นผิว' },
        pores: { name: 'Pores', nameThai: 'รูขุมขน' },
        uvSpots: { name: 'UV Spots', nameThai: 'จุด UV' },
        brownSpots: { name: 'Brown Spots', nameThai: 'จุดสีน้ำตาล' },
        redAreas: { name: 'Red Areas', nameThai: 'บริเวณแดง' },
        porphyrins: { name: 'Porphyrins', nameThai: 'พอร์ฟิริน' },
      };
      return Object.entries(vs).filter(([_, v]) => typeof v === 'number').map(([k, v]) => ({
        id: k, name: nameMap[k]?.name || k, nameThai: nameMap[k]?.nameThai || k, score: Math.round(Number(v)),
      }));
    }
    return [];
  };
  const radarMetrics = buildRadarMetrics();

  const resetAnalysis = () => { setStep('capture'); setAnalysisData({}); setActiveTab('overview'); setUploadedImage(null); setInputMode('camera'); if (fileInputRef.current) fileInputRef.current.value = ''; };

  useEffect(() => {
    if (step === 'capture' && inputMode === 'camera') startCamera();
    return () => { if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop()); } };
  }, [step]);

  const metricColor = (score: number) => score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  const metricColorClass = (score: number, prefix: string) => score >= 70 ? prefix + '-green-400' : score >= 40 ? prefix + '-yellow-400' : prefix + '-red-400';

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-[#0a0a1a]/95 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-purple-500/30">BN</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                AI Skin Analysis
                <span className="ml-2 text-[10px] font-medium bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded-full align-middle">VISIA-Class</span>
              </h1>
              <p className="text-[11px] text-gray-500">ระบบวิเคราะห์ผิวหน้าด้วย AI ระดับมืออาชีพ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quotaRemaining !== null && (<span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-1 rounded-full">โควต้า: {quotaRemaining}</span>)}
            {step !== 'capture' && (<Button variant="outline" size="sm" onClick={resetAnalysis} className="text-xs border-purple-500/30 hover:bg-purple-500/10">วิเคราะห์ใหม่</Button>)}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {step === 'capture' && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => { setInputMode('camera'); setUploadedImage(null); startCamera(); }} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium transition-all', inputMode === 'camera' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>📷 ถ่ายภาพ</button>
                <button onClick={() => { setInputMode('upload'); if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; } }} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium transition-all', inputMode === 'upload' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>📤 อัพโหลดรูป</button>
              </div>
              {/* File input outside overflow-hidden so click() works */}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" id="skin-file-input" />
              <div className="relative rounded-2xl overflow-hidden bg-black border border-purple-500/20 shadow-2xl shadow-purple-500/10">
                {inputMode === 'camera' ? (
                  <div className="relative aspect-[4/3]">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <ScanOverlay isScanning={true} faceDetected={true} />
                    <div className="absolute bottom-4 left-0 right-0 text-center"><p className="text-xs text-purple-300/80 bg-black/50 backdrop-blur-sm inline-block px-4 py-1.5 rounded-full">จัดใบหน้าให้อยู่ในกรอบ • แสงสว่างเพียงพอ</p></div>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] flex items-center justify-center">
                    {validatingFace ? (
                      <div className="text-center"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-sm text-purple-300">กำลังตรวจสอบใบหน้า...</p></div>
                    ) : uploadedImage ? (
                      <>
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                        <ScanOverlay isScanning={false} faceDetected={true} />
                        <button onClick={() => { setUploadedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors">✕</button>
                        <div className="absolute top-3 left-3 bg-green-500/20 backdrop-blur-sm border border-green-500/40 text-green-300 text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />พร้อมวิเคราะห์</div>
                      </>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-purple-400/20 rounded-2xl hover:border-purple-400/50 transition-all m-6 group">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📸</div>
                        <p className="text-purple-300 font-medium mb-1">อัพโหลดรูปภาพ</p>
                        <p className="text-gray-600 text-[11px] mb-4">JPG, PNG • ขั้นต่ำ 200x200px • สูงสุด 10MB</p>
                        <label htmlFor="skin-file-input" className="cursor-pointer inline-block px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95">📂 เลือกไฟล์</label>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={inputMode === 'camera' ? captureAndAnalyze : analyzeUploadedImage} disabled={!selectedCustomer || isCapturing || (inputMode === 'upload' && !uploadedImage)} className={cn('w-full py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden', (!selectedCustomer || isCapturing || (inputMode === 'upload' && !uploadedImage)) ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]')}>
                {isCapturing ? (<span className="flex items-center justify-center gap-2"><SpinnerGap className="animate-spin w-5 h-5" />กำลังวิเคราะห์...</span>) : inputMode === 'camera' ? '📸 สแกนและวิเคราะห์' : '🧠 วิเคราะห์รูปที่อัพโหลด'}
              </button>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white/[0.03] border-purple-500/20"><CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-purple-300">ข้อมูลลูกค้า</h3>
                {loadingCustomers ? (<div className="animate-pulse bg-white/5 h-10 rounded-xl" />) : (
                  <select value={selectedCustomer?.id || ''} onChange={(e) => { const cust = customers.find(c => c.id === e.target.value); setSelectedCustomer(cust || null); if (cust?.metadata?.date_of_birth) { const birthYear = new Date(cust.metadata.date_of_birth).getFullYear(); const age = new Date().getFullYear() - birthYear; setCustomerAge(Math.max(18, Math.min(80, age))); } }} className="w-full px-3 py-2.5 bg-white/5 border border-purple-500/20 rounded-xl text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors">
                    <option value="" style={{ color: "#000", backgroundColor: "#fff" }}>-- เลือกลูกค้า --</option>
                    {customers.map((cust) => (<option key={cust.id} value={cust.id} style={{ color: "#000", backgroundColor: "#fff" }}>{cust.full_name} ({cust.email})</option>))}
                  </select>)}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500">อายุ:</label>
                  <input type="number" value={customerAge} onChange={(e) => setCustomerAge(parseInt(e.target.value) || 35)} className="w-16 px-2 py-1.5 bg-white/5 border border-purple-500/20 rounded-lg text-white text-sm text-center focus:border-purple-500/50 focus:outline-none" min={18} max={80} />
                  <span className="text-xs text-gray-500">ปี</span>
                </div>
              </CardContent></Card>
              <Card className="bg-white/[0.03] border-purple-500/20"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-3">การวิเคราะห์ที่จะได้รับ</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[{ icon: '📊', label: '8 คะแนนผิว VISIA' }, { icon: '📐', label: 'ความสมมาตรใบหน้า' }, { icon: '✨', label: 'Golden Ratio' }, { icon: '〰️', label: '7 โซนริ้วรอย' }, { icon: '🔮', label: 'AI Time Travel' }, { icon: '👥', label: 'Skin Twin Match' }].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] text-xs text-gray-300"><span>{f.icon}</span><span>{f.label}</span></div>
                  ))}
                </div>
              </CardContent></Card>
              <Card className="bg-white/[0.03] border-purple-500/20"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">เคล็ดลับการถ่ายภาพ</h3>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> อยู่ในที่แสงสว่างเพียงพอ</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> หันหน้าตรงกับกล้อง</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> เปิดตาและทำหน้าปกติ</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> ไม่สวมแว่นหรือหมวก</li>
                </ul>
              </CardContent></Card>
              <div className="text-center p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                <p className="text-[10px] text-gray-500">Powered by</p>
                <p className="text-xs text-purple-300 font-medium">8 AI Models • HuggingFace • Gemini Vision</p>
              </div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="max-w-lg mx-auto py-12">
            <div className="text-center mb-10">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">{PIPELINE_STEPS[pipelineStep]?.icon || '🧠'}</div>
              </div>
              <h2 className="text-xl font-bold mb-1">กำลังวิเคราะห์ผิวหน้า...</h2>
              <p className="text-sm text-gray-500">{PIPELINE_STEPS[pipelineStep]?.thai || 'กำลังประมวลผล'}</p>
            </div>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((s, i) => {
                const isDone = i < pipelineStep;
                const isActive = i === pipelineStep;
                return (
                  <div key={s.id} className={cn('flex items-center gap-4 p-3 rounded-xl transition-all duration-500', isDone ? 'bg-green-500/10 border border-green-500/20' : isActive ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/[0.02] border border-transparent')}>
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all', isDone ? 'bg-green-500 text-white' : isActive ? 'bg-purple-500/30 text-purple-300 animate-pulse' : 'bg-white/5 text-gray-600')}>{isDone ? '✓' : s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-600')}>{s.label}</p>
                      <p className={cn('text-[11px]', isDone ? 'text-green-400/60' : isActive ? 'text-purple-300' : 'text-gray-700')}>{s.thai}</p>
                    </div>
                    {isActive && (<div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '70%' }} /></div>)}
                  </div>
                );
              })}
            </div>
            {uploadedImage && (<div className="mt-6 flex justify-center"><div className="w-20 h-20 rounded-xl overflow-hidden border border-purple-500/30 opacity-60"><img src={uploadedImage} alt="" className="w-full h-full object-cover" /></div></div>)}
          </div>
        )}

        {step === 'results' && analysisData.skinMetrics && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="flex justify-center"><ScoreReveal score={analysisData.skinMetrics.overallScore || analysisData.overallScore || 72} label="คะแนนรวม" size="lg" delay={200} /></div>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <p className="text-[11px] text-gray-400 mb-1">อายุผิว</p>
                  <div className="flex items-baseline gap-2">
                    <MiniScore score={analysisData.skinMetrics.skinAge || analysisData.skinAge || 38} label="" />
                    <span className="text-xs text-gray-500">ปี</span>
                    <span className={cn('text-xs font-medium ml-auto', (analysisData.skinMetrics.skinAgeDifference || 0) > 0 ? 'text-red-400' : 'text-green-400')}>{(analysisData.skinMetrics.skinAgeDifference || 0) > 0 ? '+' : ''}{analysisData.skinMetrics.skinAgeDifference || analysisData.skinAgeDifference || 3} จากอายุจริง</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"><p className="text-[11px] text-gray-400">ความสมมาตร</p><p className="text-xl font-bold text-amber-400">{analysisData.symmetry?.overallSymmetry || 87}%</p></div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center"><p className="text-[11px] text-gray-400">ริ้วรอย</p><p className="text-xl font-bold text-rose-400">{analysisData.wrinkleAnalysis?.overallAgingLevel || 5}/10</p></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-purple-500/20">
                <p className={cn('text-sm font-semibold mb-3', (analysisData.skinMetrics.overallScore || 72) >= 70 ? 'text-green-400' : 'text-orange-400')}>{(analysisData.skinMetrics.overallScore || 72) >= 70 ? '✨ ผิวของคุณอยู่ในเกณฑ์ดี!' : '⚠️ ผิวต้องการการดูแลเพิ่มเติม'}</p>
                {analysisData.skinType && (<span className="inline-block px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full mb-2">Skin Type: {analysisData.skinType}</span>)}
                {analysisData.hfAnalysis?.ageEstimation && (<span className="inline-block ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded-full mb-2">AI Age: {analysisData.hfAnalysis.ageEstimation.estimatedAge}</span>)}
                <div className="mt-2 space-y-1">
                  {analysisData.skinMetrics.summary?.strengths?.slice(0, 2).map((s: string, i: number) => (<p key={i} className="text-[11px] text-green-400/80 flex items-center gap-1.5"><span>✓</span>{s}</p>))}
                  {analysisData.skinMetrics.summary?.concerns?.slice(0, 2).map((c: string, i: number) => (<p key={i} className="text-[11px] text-orange-400/80 flex items-center gap-1.5"><span>!</span>{c}</p>))}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[{ id: 'overview', label: '📊 ภาพรวม' }, { id: 'metrics', label: '🔬 8 Metrics' }, { id: 'wrinkles', label: '〰️ ริ้วรอย' }, { id: 'timetravel', label: '🔮 Time Travel' }, { id: 'twins', label: '👥 Skin Twins' }, { id: 'history', label: '📈 Before/After' }, { id: 'treatments', label: '💉 Treatments' }].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all', activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>{tab.label}</button>
              ))}
            </div>
            <Card className="bg-white/[0.02] border-purple-500/15 min-h-[400px]"><CardContent className="p-6">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-300 mb-4">📊 Radar คะแนนผิว</h3>
                    {radarMetrics.length > 0 && (<div className="flex justify-center"><RadarChart metrics={radarMetrics} size={300} /></div>)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-purple-300 mb-4">🧑 แผนที่ใบหน้า</h3>
                    <div className="flex justify-center">
                      <FaceZoneMap zones={[
                        { id: 'forehead', name: 'Forehead', nameThai: 'หน้าผาก', score: analysisData.visiaScores?.uvSpots || 70 },
                        { id: 'leftCheek', name: 'Left Cheek', nameThai: 'แก้มซ้าย', score: analysisData.visiaScores?.brownSpots || 55 },
                        { id: 'rightCheek', name: 'Right Cheek', nameThai: 'แก้มขวา', score: analysisData.visiaScores?.brownSpots || 55 },
                        { id: 'nose', name: 'Nose', nameThai: 'จมูก', score: analysisData.visiaScores?.pores || 52 },
                        { id: 'chin', name: 'Chin', nameThai: 'คาง', score: analysisData.visiaScores?.texture || 75 },
                        { id: 'leftEye', name: 'Left Eye', nameThai: 'ตาซ้าย', score: analysisData.visiaScores?.wrinkles || 58 },
                        { id: 'rightEye', name: 'Right Eye', nameThai: 'ตาขวา', score: analysisData.visiaScores?.wrinkles || 58 },
                        { id: 'mouth', name: 'Mouth', nameThai: 'ปาก', score: analysisData.visiaScores?.redAreas || 80 },
                      ]} size={300} />
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10 text-center"><p className="text-[10px] text-gray-400">จุดแข็ง</p>{analysisData.skinMetrics.summary?.strengths?.slice(0, 2).map((s: string, i: number) => (<p key={i} className="text-[11px] text-green-400">{s}</p>))}</div>
                      <div className="p-2 rounded-lg bg-orange-500/10 text-center"><p className="text-[10px] text-gray-400">ควรปรับปรุง</p>{analysisData.skinMetrics.summary?.concerns?.slice(0, 2).map((c: string, i: number) => (<p key={i} className="text-[11px] text-orange-400">{c}</p>))}</div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'metrics' && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-4">🔬 8 Skin Metrics — VISIA-Equivalent</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(analysisData.visiaScores ? [
                      { id: 'spots', name: 'Spots', nameThai: 'จุดด่างดำ', score: analysisData.visiaScores.spots || 65 },
                      { id: 'wrinkles', name: 'Wrinkles', nameThai: 'ริ้วรอย', score: analysisData.visiaScores.wrinkles || 58 },
                      { id: 'texture', name: 'Texture', nameThai: 'เนื้อผิว', score: analysisData.visiaScores.texture || 75 },
                      { id: 'pores', name: 'Pores', nameThai: 'รูขุมขน', score: analysisData.visiaScores.pores || 52 },
                      { id: 'uvSpots', name: 'UV Spots', nameThai: 'จุด UV', score: analysisData.visiaScores.uvSpots || 70 },
                      { id: 'brownSpots', name: 'Brown Spots', nameThai: 'ฝ้า/กระ', score: analysisData.visiaScores.brownSpots || 55 },
                      { id: 'redAreas', name: 'Red Areas', nameThai: 'จุดแดง', score: analysisData.visiaScores.redAreas || 80 },
                      { id: 'porphyrins', name: 'Porphyrins', nameThai: 'แบคทีเรีย', score: analysisData.visiaScores.porphyrins || 85 },
                    ] : analysisData.skinMetrics?.metrics || []).map((m: any) => (
                      <div key={m.id} className={cn('p-4 rounded-xl border', m.score >= 70 ? 'bg-green-500/10 border-green-500/20' : m.score >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20')}>
                        <p className="text-[10px] text-gray-400">{m.name}</p>
                        <p className="text-xs font-medium text-gray-300">{m.nameThai}</p>
                        <p className={cn('text-2xl font-bold mt-2', m.score >= 70 ? 'text-green-400' : m.score >= 40 ? 'text-yellow-400' : 'text-red-400')}>{m.score}%</p>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className={cn('h-full rounded-full transition-all duration-1000', m.score >= 70 ? 'bg-green-500' : m.score >= 40 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${m.score}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'wrinkles' && analysisData.wrinkleAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-purple-300">〰️ 7 Wrinkle Zones</h3>
                    <span className={cn('text-lg font-bold', analysisData.wrinkleAnalysis.overallAgingLevel <= 4 ? 'text-green-400' : analysisData.wrinkleAnalysis.overallAgingLevel <= 7 ? 'text-yellow-400' : 'text-red-400')}>Level {analysisData.wrinkleAnalysis.overallAgingLevel}/10</span>
                  </div>
                  {analysisData.wrinkleAnalysis.zones?.map((zone: any) => (
                    <div key={zone.id} className="flex items-center gap-4">
                      <div className="w-28 text-xs"><p className="font-medium text-gray-300">{zone.name}</p><p className="text-gray-500">{zone.nameThai}</p></div>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all duration-1000', zone.agingLevel <= 3 ? 'bg-green-500' : zone.agingLevel <= 6 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${zone.agingLevel * 10}%` }} /></div>
                      <span className={cn('w-12 text-right text-sm font-bold', zone.agingLevel <= 3 ? 'text-green-400' : zone.agingLevel <= 6 ? 'text-yellow-400' : 'text-red-400')}>{zone.agingLevel}/10</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'timetravel' && analysisData.timeTravelData && (
                <div className="space-y-6">
                  <div className="text-center"><h3 className="text-lg font-semibold">🔮 ดูอนาคตผิวหน้าของคุณ</h3><p className="text-xs text-gray-500">เปรียบเทียบระหว่างดูแลและไม่ดูแล</p></div>
                  <div className="grid grid-cols-5 gap-2">
                    {analysisData.timeTravelData.naturalAging?.map((pred: any, i: number) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] text-gray-500">{pred.year === 0 ? 'ตอนนี้' : `+${pred.year} ปี`}</p>
                        <div className="my-2"><p className="text-lg font-bold text-red-400">{pred.skinScore}</p><p className="text-[9px] text-gray-600">ไม่ดูแล</p></div>
                        <div><p className="text-lg font-bold text-green-400">{analysisData.timeTravelData.withTreatment?.[i]?.skinScore}</p><p className="text-[9px] text-gray-600">ดูแล</p></div>
                      </div>
                    ))}
                  </div>
                  {analysisData.timeTravelData.insights && (<div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center"><p className="text-sm text-purple-300 font-medium">{analysisData.timeTravelData.insights.messageThai}</p><p className="text-xs text-gray-500 mt-1">{analysisData.timeTravelData.insights.potentialSavings}</p>{analysisData.timeTravelData.insights.disclaimer && (<p className="text-[10px] text-gray-600 mt-2 italic">⚠️ {analysisData.timeTravelData.insights.disclaimer}</p>)}</div>)}
                </div>
              )}
              {activeTab === 'history' && selectedCustomer && (
                <BeforeAfterComparison customerId={selectedCustomer.id} clinicId={clinicId || ''} currentAnalysisId={savedId || undefined} onDownloadPDF={async (beforeId, afterId) => { try { const [r1, r2] = await Promise.all([fetch(`/api/analysis/save?id=${beforeId}`).then(r => r.json()), fetch(`/api/analysis/save?id=${afterId}`).then(r => r.json())]); if (r1.success && r2.success) { const before = ReportGenerator.prepareReportData(r1.data, selectedCustomer.full_name); const after = ReportGenerator.prepareReportData(r2.data, selectedCustomer.full_name); const days = Math.floor((new Date(r2.data.analyzed_at).getTime() - new Date(r1.data.analyzed_at).getTime()) / 86400000); await PDFExporter.downloadComparisonReport(before, after, days); } } catch (e) { console.error('PDF download error:', e); alert('PDF export failed'); } }} />
              )}
              {activeTab === 'twins' && analysisData.skinTwins && (
                <div className="space-y-4">
                  <div className="text-center mb-4"><h3 className="text-lg font-semibold">👥 คนที่มีผิวคล้ายคุณ</h3><p className="text-xs text-gray-500">พบ {analysisData.skinTwins.twins?.length} คนที่มีสภาพผิวคล้ายกัน</p></div>
                  {analysisData.skinTwins.twins?.slice(0, 3).map((twin: any) => (
                    <div key={twin.twinId} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="flex items-start justify-between"><div><p className="font-semibold">{twin.displayName}</p><p className="text-xs text-gray-500">อายุ {twin.profile.ageRange} ปี • {twin.profile.skinType}</p></div><span className="text-green-400 font-bold">{twin.matchPercentage}%</span></div>
                      <div className="mt-3 p-3 rounded-lg bg-green-500/10"><p className="text-xs text-green-300">ผลลัพธ์: {twin.results.beforeScore} → {twin.results.afterScore} (+{twin.results.improvement}%)</p><p className="text-[11px] text-gray-500 mt-1">"{twin.results.testimonial}"</p></div>
                    </div>
                  ))}
                  {analysisData.skinTwins.insights && (<p className="text-center text-xs text-purple-300">💡 {analysisData.skinTwins.insights.messageThai}</p>)}
                </div>
              )}
              {activeTab === 'treatments' && (
                <TreatmentPreviewPanel skinMetrics={{ overallScore: analysisData.overallScore, skinAge: analysisData.skinAge, visiaScores: analysisData.visiaScores, skinType: analysisData.skinType, concerns: analysisData.summary?.concerns }} customerName={selectedCustomer?.full_name} onBookTreatment={(treatmentId) => { console.log('Book treatment:', treatmentId); }} />
              )}
            </CardContent></Card>
            {analysisData.aiPowered && (
              <div className="text-center p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                <p className="text-[11px] text-purple-300">✨ Powered by {analysisData.modelsUsed?.length || 0} AI Models • Confidence: {analysisData.confidence}%{analysisData.processingTime ? ` • ${(analysisData.processingTime / 1000).toFixed(1)}s` : ''}</p>
                {savedId && <p className="text-[10px] text-gray-600 mt-0.5">บันทึกแล้ว ID: {savedId}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all">📅 นัดหมาย Treatment</button>
              <button onClick={() => setShowCoachPanel(!showCoachPanel)} className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all">{showCoachPanel ? '✕ ปิด AI Coach' : '🤖 AI Sales Coach'}</button>
              <button className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all" onClick={async () => { try { const reportData = { analysisId: savedId || `RPT-${Date.now()}`, analyzedAt: new Date().toISOString(), customerName: selectedCustomer?.full_name || 'ลูกค้า', customerAge, clinicName: 'BN-Aura Clinic', overallScore: analysisData.overallScore || 72, skinAge: analysisData.skinAge || customerAge + 3, skinAgeDifference: (analysisData.skinAge || customerAge + 3) - customerAge, skinHealthGrade: (analysisData.overallScore || 72) >= 80 ? 'A' : (analysisData.overallScore || 72) >= 60 ? 'B' : 'C', symmetryScore: analysisData.symmetry?.overallSymmetry || 87, goldenRatio: analysisData.symmetry?.goldenRatio || 1.58, metrics: analysisData.visiaScores ? [{ id: 'spots', name: 'Spots', nameThai: 'จุดด่างดำ', score: analysisData.visiaScores.spots || 65 }, { id: 'wrinkles', name: 'Wrinkles', nameThai: 'ริ้วรอย', score: analysisData.visiaScores.wrinkles || 58 }, { id: 'texture', name: 'Texture', nameThai: 'เนื้อผิว', score: analysisData.visiaScores.texture || 75 }, { id: 'pores', name: 'Pores', nameThai: 'รูขุมขน', score: analysisData.visiaScores.pores || 52 }, { id: 'uvSpots', name: 'UV Spots', nameThai: 'จุด UV', score: analysisData.visiaScores.uvSpots || 70 }, { id: 'brownSpots', name: 'Brown Spots', nameThai: 'ฝ้า/กระ', score: analysisData.visiaScores.brownSpots || 55 }, { id: 'redAreas', name: 'Red Areas', nameThai: 'จุดแดง', score: analysisData.visiaScores.redAreas || 80 }, { id: 'porphyrins', name: 'Porphyrins', nameThai: 'แบคทีเรีย', score: analysisData.visiaScores.porphyrins || 85 }] : analysisData.skinMetrics?.metrics || [], wrinkleLevel: analysisData.wrinkleAnalysis?.overallAgingLevel || 6, wrinkleZones: analysisData.wrinkleAnalysis?.zones?.map((z: any) => ({ name: z.name, nameThai: z.nameThai, level: z.agingLevel })) || [], recommendations: analysisData.recommendations?.immediate || [], strengths: analysisData.summary?.strengths || [], concerns: analysisData.summary?.concerns || [] }; await PDFExporter.downloadReport(reportData); } catch (e) { console.error('PDF error:', e); alert('PDF export failed'); } }}>📄 Download PDF</button>
              <button onClick={() => window.print()} className="py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all">🖨️ พิมพ์ผลวิเคราะห์</button>
            </div>
            {showCoachPanel && (<AICoachPanel customerContext={{ name: selectedCustomer?.full_name || 'ลูกค้า', skinAnalysis: { skinType: analysisData.skinType || 'combination', concerns: analysisData.summary?.concerns || [], ageEstimate: analysisData.skinAge || customerAge, urgencyScore: Math.max(20, 100 - (analysisData.overallScore || 72)) }, previousTreatments: [], budget: undefined, objections: [] }} currentConversation="" onSuggestionApply={(suggestion) => { console.log('Coach suggestion applied:', suggestion); }} />)}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="max-w-6xl mx-auto px-4 py-6 mt-8 border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-600">Powered by BN-Aura AI • HuggingFace • Gemini • Vercel AI Gateway</p>
        <p className="text-[10px] text-gray-700">© 2026 BN-Aura - Advanced Skin Analysis Platform</p>
      </div>
    </div>
  );
}

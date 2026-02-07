'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import RealTimeFaceAnalysis from '@/components/analysis/RealTimeFaceAnalysis';
import TreatmentBookingCard from '@/components/analysis/TreatmentBookingCard';
import {
  AIBrainIcon,
  SkinScanIcon,
  AnalyticsIcon,
  BookingIcon,
  ReportIcon,
  SuccessIcon,
  ImprovementIcon,
  TimeTravelIcon,
  SkinTwinIcon,
  ConsultantIcon,
  FeatureIcon,
} from '@/components/ui/icons';

type ViewMode = 'scan' | 'result' | 'booking' | 'report';

export default function SalesAIAnalysisPage() {
  const { getClinicId } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('scan');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [stats, setStats] = useState({ todayScans: 0, weekScans: 0, avgScore: 0, bookingRate: 0 });
  const clinicId = getClinicId();

  useEffect(() => {
    const fetchStats = async () => {
      if (!clinicId) return;
      try {
        const todayRes = await fetch('/api/analysis/save?type=stats&clinicId=' + clinicId + '&days=1');
        const todayData = await todayRes.json();
        const weekRes = await fetch('/api/analysis/save?type=stats&clinicId=' + clinicId + '&days=7');
        const weekData = await weekRes.json();
        if (todayData.success && weekData.success) {
          setStats({
            todayScans: todayData.data?.totalAnalyses || 0,
            weekScans: weekData.data?.totalAnalyses || 0,
            avgScore: Math.round(weekData.data?.averageScore || 0),
            bookingRate: Math.round((weekData.data?.bookingRate || 0) * 100),
          });
        }
      } catch (e) { console.error('Failed to fetch stats:', e); }
    };
    fetchStats();
  }, [clinicId]);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setViewMode('result');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AIBrainIcon size="xl" />
              <div>
                <h1 className="text-xl font-bold">AI Skin Analysis</h1>
                <p className="text-xs text-muted-foreground">Sales Tool - วิเคราะห์ผิวลูกค้าด้วย AI</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.todayScans}</p>
                <p className="text-xs text-muted-foreground">วันนี้</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.weekScans}</p>
                <p className="text-xs text-muted-foreground">สัปดาห์นี้</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.bookingRate}%</p>
                <p className="text-xs text-muted-foreground">Booking Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* View Mode Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { mode: 'scan' as const, icon: <SkinScanIcon size="sm" />, label: 'สแกนใบหน้า' },
                { mode: 'result' as const, icon: <AnalyticsIcon size="sm" />, label: 'ผลวิเคราะห์', disabled: !analysisResult },
                { mode: 'booking' as const, icon: <BookingIcon size="sm" />, label: 'จอง Treatment', disabled: !analysisResult },
                { mode: 'report' as const, icon: <ReportIcon size="sm" />, label: 'สร้างรายงาน', disabled: !analysisResult },
              ].map(({ mode, icon, label, disabled }) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  onClick={() => setViewMode(mode)}
                  disabled={disabled}
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>

            {/* Scan View */}
            {viewMode === 'scan' && (
              <div className="space-y-4">
                {/* Customer Name Input */}
                <Card>
                  <CardContent className="p-4">
                    <label className="block text-sm font-medium mb-2">ชื่อลูกค้า</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="กรอกชื่อลูกค้า..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </CardContent>
                </Card>

                {/* Real-time Face Analysis */}
                <RealTimeFaceAnalysis
                  onAnalysisComplete={handleAnalysisComplete}
                  showDebugOverlay={true}
                />
              </div>
            )}

            {/* Result View */}
            {viewMode === 'result' && analysisResult && (
              <div className="space-y-4">
                {/* Score Overview */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{analysisResult.skinMetrics?.overallScore || 72}</p>
                          <p className="text-xs opacity-80">/100</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold mb-1">
                          {customerName || 'ลูกค้า'} - ผลวิเคราะห์
                        </h2>
                        <p className="text-muted-foreground">
                          Skin Age: <span className="font-bold">{analysisResult.skinMetrics?.skinAge || 38}</span> ปี
                          <span className="text-amber-500 ml-2">(+3 จากอายุจริง)</span>
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => setViewMode('booking')}>
                            <BookingIcon size="sm" className="mr-1" />
                            จอง Treatment
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setViewMode('report')}>
                            <ReportIcon size="sm" className="mr-1" />
                            สร้างรายงาน
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 8 Metrics Grid */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AnalyticsIcon size="md" />
                      8 Skin Metrics
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { name: 'Spots', thai: 'จุดด่างดำ', score: 65 },
                        { name: 'Wrinkles', thai: 'ริ้วรอย', score: 58 },
                        { name: 'Texture', thai: 'เนื้อผิว', score: 75 },
                        { name: 'Pores', thai: 'รูขุมขน', score: 52 },
                        { name: 'UV Spots', thai: 'จุด UV', score: 70 },
                        { name: 'Brown Spots', thai: 'ฝ้า/กระ', score: 55 },
                        { name: 'Red Areas', thai: 'จุดแดง', score: 80 },
                        { name: 'Bacteria', thai: 'แบคทีเรีย', score: 85 },
                      ].map(({ name, thai, score }) => (
                        <div key={name} className={cn(
                          'p-3 rounded-lg text-center',
                          score >= 70 ? 'bg-green-500/10' : 
                          score >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'
                        )}>
                          <p className={cn(
                            'text-2xl font-bold',
                            score >= 70 ? 'text-green-500' : 
                            score >= 40 ? 'text-amber-500' : 'text-red-500'
                          )}>
                            {score}
                          </p>
                          <p className="text-xs text-muted-foreground">{thai}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Concerns & Recommendations */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 text-amber-500">⚠️ ปัญหาที่พบ</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          รูขุมขนกว้างกว่าปกติ
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          มีริ้วรอยบริเวณร่องแก้ม
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          ฝ้าและจุดด่างดำ
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 text-green-500">💊 Treatment แนะนำ</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <SuccessIcon size="sm" className="text-green-500" />
                          Pico Genesis - ลดฝ้า กระ
                        </li>
                        <li className="flex items-center gap-2">
                          <SuccessIcon size="sm" className="text-green-500" />
                          HydraFacial - กระชับรูขุมขน
                        </li>
                        <li className="flex items-center gap-2">
                          <SuccessIcon size="sm" className="text-green-500" />
                          Botox - ลดริ้วรอย
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Booking View */}
            {viewMode === 'booking' && analysisResult && (
              <TreatmentBookingCard
                treatments={[]}
                customerName={customerName}
                analysisScore={analysisResult.skinMetrics?.overallScore || 72}
                onBook={(treatment, date, time) => {
                  console.log('Booked:', treatment, date, time);
                }}
              />
            )}

            {/* Report View */}
            {viewMode === 'report' && analysisResult && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ReportIcon size="md" />
                    สร้างรายงาน
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Preview รายงาน</p>
                      <div className="aspect-[3/4] bg-white border rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Report Preview</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button className="gap-2">
                        <ReportIcon size="sm" />
                        ดาวน์โหลด PDF
                      </Button>
                      <Button variant="outline" className="gap-2">
                        📧 ส่ง Email
                      </Button>
                      <Button variant="outline" className="gap-2">
                        📱 ส่ง LINE
                      </Button>
                      <Button variant="outline" className="gap-2">
                        🖨️ พิมพ์
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Features */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">AI Features</h3>
                <div className="space-y-2">
                  {[
                    { feature: 'time-travel' as const, label: 'Time Travel', desc: 'ทำนายอนาคตผิว' },
                    { feature: 'skin-twin' as const, label: 'Skin Twin', desc: 'หาคนผิวคล้าย' },
                    { feature: 'consultant' as const, label: 'AI Consultant', desc: 'ปรึกษา AI' },
                  ].map(({ feature, label, desc }) => (
                    <button
                      key={feature}
                      className="w-full p-3 border rounded-lg flex items-center gap-3 hover:border-primary/50 transition-colors text-left"
                      disabled={!analysisResult}
                    >
                      <FeatureIcon feature={feature} size="md" variant="gradient" />
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    📋 ดูประวัติลูกค้า
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    📊 เปรียบเทียบผล
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    🏷️ เพิ่ม Tag
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Performance */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ImprovementIcon size="md" />
                  Performance วันนี้
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">สแกนแล้ว</span>
                    <span className="font-bold">{stats.todayScans} คน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">จอง Treatment</span>
                    <span className="font-bold text-green-500">8 คน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="font-bold text-green-500">{stats.bookingRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

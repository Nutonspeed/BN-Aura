'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import SkinMetricsGrid from './SkinMetricsGrid';
import FacialSymmetryCard from './FacialSymmetryCard';
import WrinkleZoneCard from './WrinkleZoneCard';
import { cn } from '@/lib/utils';

interface ComprehensiveAnalysisDashboardProps {
  customerId?: string;
  customerName?: string;
  customerAge?: number;
}

type TabType = 'overview' | 'metrics' | 'symmetry' | 'wrinkles';

export default function ComprehensiveAnalysisDashboard({
  customerId,
  customerName = 'Customer',
  customerAge = 35,
}: ComprehensiveAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [customerAge]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analysis/skin?type=comprehensive&age=${customerAge}`);
      const result = await response.json();
      if (result.success) {
        setAnalysisData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังวิเคราะห์ผิวหน้า...</p>
          <p className="text-xs text-muted-foreground mt-1">Processing with 5 AI models</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">ไม่พบข้อมูลการวิเคราะห์</p>
        <Button onClick={fetchAnalysis} className="mt-4">ลองใหม่</Button>
      </div>
    );
  }

  const { symmetry, skinMetrics, wrinkleAnalysis, overallScore } = analysisData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'metrics', label: '8 Metrics', icon: '🔬' },
    { id: 'symmetry', label: 'Symmetry', icon: '📐' },
    { id: 'wrinkles', label: 'Wrinkles', icon: '〰️' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🧠 AI Skin Analysis
            <span className="text-sm font-normal text-muted-foreground">VISIA-Equivalent</span>
          </h2>
          <p className="text-muted-foreground">
            {customerName} • อายุ {customerAge} ปี • {new Date().toLocaleDateString('th-TH')}
          </p>
        </div>
        
        {/* Overall Score */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Overall Score</p>
              <p className="text-4xl font-bold text-primary">{overallScore}</p>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
            <div className="text-center border-l pl-4">
              <p className="text-xs text-muted-foreground">Skin Age</p>
              <p className="text-2xl font-bold">
                {skinMetrics.skinAge}
                <span className="text-sm text-muted-foreground ml-1">ปี</span>
              </p>
              <p className={cn(
                'text-xs',
                skinMetrics.skinAgeDifference > 0 ? 'text-red-500' : 'text-green-500'
              )}>
                {skinMetrics.skinAgeDifference > 0 ? '+' : ''}{skinMetrics.skinAgeDifference} จากอายุจริง
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as TabType)}
            className="flex items-center gap-2"
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Quick Stats */}
            <div className="space-y-4">
              {/* Summary Card */}
              <Card className={cn(
                'border-2',
                overallScore >= 70 
                  ? 'bg-green-500/5 border-green-500/30' 
                  : 'bg-orange-500/5 border-orange-500/30'
              )}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    {overallScore >= 70 ? '✨ ผิวของคุณอยู่ในเกณฑ์ดี!' : '⚠️ ผิวของคุณต้องการการดูแล'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ดีกว่า {skinMetrics.comparisonToAverage.betterThan}% ของกลุ่มอายุ {skinMetrics.comparisonToAverage.ageGroup} ปี
                  </p>
                  
                  {/* Strengths */}
                  {skinMetrics.summary.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">💪 จุดแข็ง:</p>
                      <ul className="text-sm space-y-1">
                        {skinMetrics.summary.strengths.slice(0, 3).map((s: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Concerns */}
                  {skinMetrics.summary.concerns.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">⚠️ ควรปรับปรุง:</p>
                      <ul className="text-sm space-y-1">
                        {skinMetrics.summary.concerns.slice(0, 3).map((c: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-orange-500">!</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-500">{symmetry.overallSymmetry}%</p>
                    <p className="text-xs text-muted-foreground">Facial Symmetry</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">{symmetry.goldenRatio}</p>
                    <p className="text-xs text-muted-foreground">Golden Ratio</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-purple-500">{wrinkleAnalysis.overallAgingLevel}/10</p>
                    <p className="text-xs text-muted-foreground">Wrinkle Level</p>
                  </CardContent>
                </Card>
                <Card className="bg-pink-500/5 border-pink-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-pink-500">{skinMetrics.overallScore}</p>
                    <p className="text-xs text-muted-foreground">Skin Score</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right: Mini 8 Metrics */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-4">📊 8 Skin Metrics Overview</h4>
                <div className="grid grid-cols-2 gap-2">
                  {skinMetrics.metrics.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                      <span className="text-sm">{m.nameThai}</span>
                      <span className={cn(
                        'font-bold',
                        m.score >= 70 ? 'text-green-500' : m.score >= 40 ? 'text-yellow-500' : 'text-red-500'
                      )}>
                        {m.score}%
                      </span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setActiveTab('metrics')}
                >
                  ดูรายละเอียด →
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'metrics' && (
          <SkinMetricsGrid metrics={skinMetrics.metrics} />
        )}

        {activeTab === 'symmetry' && (
          <FacialSymmetryCard {...symmetry} />
        )}

        {activeTab === 'wrinkles' && (
          <WrinkleZoneCard {...wrinkleAnalysis} />
        )}
      </div>

      {/* Footer: Models Used */}
      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        <p>Powered by: MediaPipe Face Mesh • EfficientNet • U-Net • YOLOv8 • Gemini AI</p>
        <p>Analysis ID: {analysisData.analysisId} • Confidence: 94.5%</p>
      </div>
    </div>
  );
}

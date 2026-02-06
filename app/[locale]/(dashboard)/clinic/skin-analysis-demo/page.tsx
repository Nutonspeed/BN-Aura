'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import {
  AIBrainIcon,
  SkinScanIcon,
  AnalysisIcon,
  MetricsGridIcon,
  SymmetryIcon,
  WrinkleIcon,
  PoreIcon,
  TextureIcon,
  SpotsIcon,
  HydrationIcon,
  TimeTravelIcon,
  ARPreviewIcon,
  SkinTwinIcon,
  ConsultantIcon,
  ProductScanIcon,
  SunIcon,
  MoonIcon,
  UVIcon,
  PollutionIcon,
  TreatmentIcon,
  LaserIcon,
  InjectionIcon,
  SuccessIcon,
  WarningIcon,
  ImprovementIcon,
  ScoreGaugeIcon,
  StarIcon,
  AwardIcon,
  BookingIcon,
  ReportIcon,
  AnalyticsIcon,
  FeatureIcon,
  SkinConcernIcon,
} from '@/components/ui/icons';

export default function SkinAnalysisDemoPage() {
  const [activeTab, setActiveTab] = useState<'features' | 'metrics' | 'concerns'>('features');

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <AIBrainIcon size="2xl" />
          <div>
            <h1 className="text-3xl font-bold">BN-Aura AI Skin Analysis</h1>
            <p className="text-muted-foreground">Premium Icon System Demo</p>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <p className="text-sm">
              ระบบไอคอนระดับพรีเมียม ออกแบบมาเพื่อความน่าเชื่อถือและความเป็นมืออาชีพ
              แทนที่ Emoji ด้วย Lucide Icons คุณภาพสูง
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-2">
          {(['features', 'metrics', 'concerns'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'features' && 'AI Features'}
              {tab === 'metrics' && '8 Metrics'}
              {tab === 'concerns' && 'Skin Concerns'}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI Feature Icons</h2>
            
            {/* Feature Cards with Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { feature: 'ai-analysis' as const, label: 'AI Analysis', desc: 'วิเคราะห์ผิวด้วย AI' },
                { feature: 'time-travel' as const, label: 'Time Travel', desc: 'ทำนายอนาคตผิว' },
                { feature: 'ar-preview' as const, label: 'AR Preview', desc: 'ดูตัวอย่าง Treatment' },
                { feature: 'skin-twin' as const, label: 'Skin Twin', desc: 'หาคนผิวคล้าย' },
                { feature: 'consultant' as const, label: 'AI Consultant', desc: 'ปรึกษา AI 24/7' },
                { feature: 'product-scan' as const, label: 'Product Scan', desc: 'สแกนผลิตภัณฑ์' },
                { feature: 'environment' as const, label: 'Environment', desc: 'แนะนำตามสภาพอากาศ' },
                { feature: 'report' as const, label: 'Report', desc: 'สร้างรายงาน PDF' },
              ].map(({ feature, label, desc }) => (
                <Card key={feature} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <FeatureIcon feature={feature} variant="gradient" size="xl" className="mx-auto mb-3" />
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Individual Icons */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Individual Icons</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <AIBrainIcon size="lg" />
                    <span className="text-sm">AI Brain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SkinScanIcon size="lg" />
                    <span className="text-sm">Skin Scan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimeTravelIcon size="lg" />
                    <span className="text-sm">Time Travel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ARPreviewIcon size="lg" />
                    <span className="text-sm">AR Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SkinTwinIcon size="lg" />
                    <span className="text-sm">Skin Twin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConsultantIcon size="lg" />
                    <span className="text-sm">AI Consultant</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Icons */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Treatment Icons</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <TreatmentIcon size="lg" />
                    <span className="text-sm">Treatment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LaserIcon size="lg" />
                    <span className="text-sm">Laser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <InjectionIcon size="lg" />
                    <span className="text-sm">Injection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProductScanIcon size="lg" />
                    <span className="text-sm">Skincare</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environment Icons */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Environment Icons</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <SunIcon size="lg" />
                    <span className="text-sm">Morning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MoonIcon size="lg" />
                    <span className="text-sm">Evening</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UVIcon size="lg" />
                    <span className="text-sm">UV Index</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PollutionIcon size="lg" />
                    <span className="text-sm">Pollution</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">8 Skin Metrics Icons (VISIA-Equivalent)</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <SpotsIcon size="xl" />, label: 'Spots', thai: 'จุดด่างดำ', score: 65 },
                { icon: <WrinkleIcon size="xl" />, label: 'Wrinkles', thai: 'ริ้วรอย', score: 58 },
                { icon: <TextureIcon size="xl" />, label: 'Texture', thai: 'เนื้อผิว', score: 75 },
                { icon: <PoreIcon size="xl" />, label: 'Pores', thai: 'รูขุมขน', score: 52 },
                { icon: <UVIcon size="xl" />, label: 'UV Spots', thai: 'จุด UV', score: 70 },
                { icon: <SpotsIcon size="xl" />, label: 'Brown Spots', thai: 'ฝ้า/กระ', score: 55 },
                { icon: <WarningIcon size="xl" />, label: 'Red Areas', thai: 'จุดแดง', score: 80 },
                { icon: <AnalysisIcon size="xl" />, label: 'Porphyrins', thai: 'แบคทีเรีย', score: 85 },
              ].map(({ icon, label, thai, score }) => (
                <Card key={label} className={`
                  ${score >= 70 ? 'bg-green-500/10 border-green-500/30' : 
                    score >= 40 ? 'bg-yellow-500/10 border-yellow-500/30' : 
                    'bg-red-500/10 border-red-500/30'}
                `}>
                  <CardContent className="p-4 text-center">
                    <div className="mx-auto mb-2">{icon}</div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold">{thai}</p>
                    <p className={`text-2xl font-bold ${
                      score >= 70 ? 'text-green-500' : 
                      score >= 40 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {score}%
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Score Display */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Score & Status Icons</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <ScoreGaugeIcon size="lg" />
                    <span className="text-sm">Score Gauge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SuccessIcon size="lg" />
                    <span className="text-sm">Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <WarningIcon size="lg" />
                    <span className="text-sm">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImprovementIcon size="lg" />
                    <span className="text-sm">Improvement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarIcon size="lg" />
                    <span className="text-sm">Star Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AwardIcon size="lg" />
                    <span className="text-sm">Award</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Concerns Tab */}
        {activeTab === 'concerns' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Skin Concern Icons</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { concern: 'acne' as const, label: 'Acne', thai: 'สิว' },
                { concern: 'wrinkle' as const, label: 'Wrinkle', thai: 'ริ้วรอย' },
                { concern: 'pigmentation' as const, label: 'Pigmentation', thai: 'ฝ้า/กระ' },
                { concern: 'pore' as const, label: 'Pore', thai: 'รูขุมขน' },
                { concern: 'hydration' as const, label: 'Hydration', thai: 'ความชุ่มชื้น' },
                { concern: 'elasticity' as const, label: 'Elasticity', thai: 'ความยืดหยุ่น' },
                { concern: 'redness' as const, label: 'Redness', thai: 'ผิวแดง' },
                { concern: 'texture' as const, label: 'Texture', thai: 'เนื้อผิว' },
              ].map(({ concern, label, thai }) => (
                <Card key={concern} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <SkinConcernIcon concern={concern} size="xl" className="mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold">{thai}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Icons */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Action Icons</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <BookingIcon size="lg" />
                    <span className="text-sm">Booking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReportIcon size="lg" />
                    <span className="text-sm">Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AnalyticsIcon size="lg" />
                    <span className="text-sm">Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MetricsGridIcon size="lg" />
                    <span className="text-sm">Metrics Grid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SymmetryIcon size="lg" />
                    <span className="text-sm">Symmetry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HydrationIcon size="lg" />
                    <span className="text-sm">Hydration</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Comparison Section */}
      <div className="max-w-4xl mx-auto mt-8">
        <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <SuccessIcon size="md" />
              Before vs After: Emoji → Premium Icons
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                <p className="text-sm text-red-500 font-medium mb-2">❌ Before (Emoji)</p>
                <div className="space-y-2 text-sm">
                  <p>🧠 AI Analysis</p>
                  <p>🔮 Time Travel</p>
                  <p>👥 Skin Twin</p>
                  <p>🤖 AI Consultant</p>
                </div>
              </div>
              <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <p className="text-sm text-green-500 font-medium mb-2 flex items-center gap-1">
                  <SuccessIcon size="sm" /> After (Premium Icons)
                </p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2"><AIBrainIcon size="sm" /> AI Analysis</p>
                  <p className="flex items-center gap-2"><TimeTravelIcon size="sm" /> Time Travel</p>
                  <p className="flex items-center gap-2"><SkinTwinIcon size="sm" /> Skin Twin</p>
                  <p className="flex items-center gap-2"><ConsultantIcon size="sm" /> AI Consultant</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

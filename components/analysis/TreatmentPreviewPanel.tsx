'use client';

import { useState, useMemo } from 'react';
import { 
  Sparkle, 
  Lightning, 
  Drop, 
  Syringe, 
  Pill,
  ArrowRight,
  CheckCircle,
  Star,
  CaretDown,
  CaretUp,
  FloppyDisk,
  ShareNetwork
} from '@phosphor-icons/react';

interface Treatment {
  id: string;
  name: string;
  nameThai: string;
  category: 'laser' | 'injection' | 'topical' | 'device';
  icon: 'laser' | 'syringe' | 'drop' | 'device';
  description: string;
  targetMetrics: string[];
  expectedImprovement: Record<string, number>; // metric -> improvement percentage
  sessions: string;
  priceRange: string;
}

interface SkinMetrics {
  overallScore?: number;
  skinAge?: number;
  visiaScores?: Record<string, number>;
  skinType?: string;
  concerns?: string[];
}

interface TreatmentPreviewPanelProps {
  skinMetrics: SkinMetrics;
  customerName?: string;
  analysisId?: string;
  customerId?: string;
  clinicId?: string;
  onBookTreatment?: (treatmentId: string) => void;
  onSaveSession?: (sessionData: any) => void;
}

// Treatment database with expected improvements
const TREATMENTS: Treatment[] = [
  {
    id: 'laser_toning',
    name: 'Laser Toning',
    nameThai: 'เลเซอร์โทนนิ่ง',
    category: 'laser',
    icon: 'laser',
    description: 'ลดจุดด่างดำ ปรับผิวให้สม่ำเสมอ',
    targetMetrics: ['spots', 'brownSpots', 'uvSpots'],
    expectedImprovement: { spots: 25, brownSpots: 30, uvSpots: 20, overallScore: 8 },
    sessions: '3-5 ครั้ง',
    priceRange: '3,000-5,000 / ครั้ง',
  },
  {
    id: 'botox',
    name: 'Botox',
    nameThai: 'โบท็อกซ์',
    category: 'injection',
    icon: 'syringe',
    description: 'ลดริ้วรอย เส้นตื้น ทำให้ผิวเรียบ',
    targetMetrics: ['wrinkles', 'texture'],
    expectedImprovement: { wrinkles: 35, texture: 15, overallScore: 10 },
    sessions: '1 ครั้ง (ทุก 4-6 เดือน)',
    priceRange: '5,000-15,000',
  },
  {
    id: 'filler',
    name: 'Dermal Filler',
    nameThai: 'ฟิลเลอร์',
    category: 'injection',
    icon: 'syringe',
    description: 'เติมเต็มร่องลึก เพิ่มวอลลุ่ม',
    targetMetrics: ['wrinkles'],
    expectedImprovement: { wrinkles: 40, overallScore: 12 },
    sessions: '1 ครั้ง (ทุก 8-12 เดือน)',
    priceRange: '10,000-35,000',
  },
  {
    id: 'chemical_peel',
    name: 'Chemical Peel',
    nameThai: 'พีลผิว',
    category: 'topical',
    icon: 'drop',
    description: 'ผลัดเซลล์ผิว ลดรูขุมขน ปรับเนื้อผิว',
    targetMetrics: ['texture', 'pores', 'spots'],
    expectedImprovement: { texture: 20, pores: 25, spots: 15, overallScore: 7 },
    sessions: '4-6 ครั้ง',
    priceRange: '2,000-4,000 / ครั้ง',
  },
  {
    id: 'ipl',
    name: 'IPL Photofacial',
    nameThai: 'IPL ฟื้นฟูผิว',
    category: 'device',
    icon: 'device',
    description: 'ลดจุดแดง ผิวแดง กระตุ้นคอลลาเจน',
    targetMetrics: ['redAreas', 'porphyrins', 'texture'],
    expectedImprovement: { redAreas: 30, porphyrins: 20, texture: 10, overallScore: 6 },
    sessions: '3-5 ครั้ง',
    priceRange: '3,000-6,000 / ครั้ง',
  },
  {
    id: 'microneedling',
    name: 'Microneedling',
    nameThai: 'ไมโครนีดลิ่ง',
    category: 'device',
    icon: 'device',
    description: 'กระตุ้นคอลลาเจน ลดรูขุมขน ปรับผิว',
    targetMetrics: ['pores', 'texture', 'wrinkles'],
    expectedImprovement: { pores: 30, texture: 25, wrinkles: 15, overallScore: 9 },
    sessions: '3-4 ครั้ง',
    priceRange: '4,000-8,000 / ครั้ง',
  },
];

const METRIC_LABELS: Record<string, { name: string; nameThai: string }> = {
  spots: { name: 'Spots', nameThai: 'จุดด่างดำ' },
  wrinkles: { name: 'Wrinkles', nameThai: 'ริ้วรอย' },
  texture: { name: 'Texture', nameThai: 'เนื้อผิว' },
  pores: { name: 'Pores', nameThai: 'รูขุมขน' },
  uvSpots: { name: 'UV Spots', nameThai: 'จุด UV' },
  brownSpots: { name: 'Brown Spots', nameThai: 'ฝ้า/กระ' },
  redAreas: { name: 'Red Areas', nameThai: 'จุดแดง' },
  porphyrins: { name: 'Porphyrins', nameThai: 'แบคทีเรีย' },
};

const TreatmentIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'laser': return <Lightning weight="duotone" className={className} />;
    case 'syringe': return <Syringe weight="duotone" className={className} />;
    case 'drop': return <Drop weight="duotone" className={className} />;
    case 'device': return <Sparkle weight="duotone" className={className} />;
    default: return <Pill weight="duotone" className={className} />;
  }
};

export default function TreatmentPreviewPanel({
  skinMetrics,
  customerName,
  analysisId,
  customerId,
  clinicId,
  onBookTreatment,
  onSaveSession,
}: TreatmentPreviewPanelProps) {
  const [selectedTreatments, setSelectedTreatments] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState(0.7);
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);

  // Recommend treatments based on skin concerns
  const recommendedTreatments = useMemo(() => {
    if (!skinMetrics.visiaScores) return TREATMENTS;

    return TREATMENTS.map(t => {
      // Calculate relevance score based on which metrics need improvement
      let relevance = 0;
      t.targetMetrics.forEach(metric => {
        const score = skinMetrics.visiaScores?.[metric];
        if (score !== undefined && score < 70) {
          relevance += (70 - score); // Lower scores = more relevant
        }
      });
      return { ...t, relevance };
    }).sort((a, b) => b.relevance - a.relevance);
  }, [skinMetrics]);

  // Calculate projected scores after selected treatments
  const projectedScores = useMemo(() => {
    const current: Record<string, number> = skinMetrics.visiaScores ? { ...skinMetrics.visiaScores } : {};
    const currentOverall = skinMetrics.overallScore || 72;
    let overallBoost = 0;

    selectedTreatments.forEach(treatmentId => {
      const treatment = TREATMENTS.find(t => t.id === treatmentId);
      if (!treatment) return;

      Object.entries(treatment.expectedImprovement).forEach(([metric, improvement]) => {
        if (metric === 'overallScore') {
          overallBoost += improvement * intensity;
        } else if (current[metric] !== undefined) {
          current[metric] = Math.min(100, current[metric] + improvement * intensity);
        }
      });
    });

    return {
      metrics: current,
      overallScore: Math.min(100, Math.round(currentOverall + overallBoost)),
      overallImprovement: Math.round(overallBoost),
    };
  }, [selectedTreatments, intensity, skinMetrics]);

  const toggleTreatment = (id: string) => {
    setSelectedTreatments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSession = async () => {
    if (selectedTreatments.size === 0) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const sessionData = {
        analysisId,
        customerId,
        clinicId,
        selectedTreatments: Array.from(selectedTreatments),
        currentScores: skinMetrics.visiaScores || {},
        projectedScores: projectedScores.metrics,
        intensity,
      };

      const res = await fetch('/api/analysis/ar-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      const result = await res.json();
      if (result.success) {
        setSaveSuccess(true);
        onSaveSession?.(result.data);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save AR session:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkle weight="duotone" className="w-5 h-5 text-purple-400" />
            Treatment Preview
          </h3>
          <p className="text-sm text-gray-400">
            เลือกทรีทเมนต์เพื่อดูผลลัพธ์ที่คาดว่าจะได้รับ
          </p>
        </div>
        {selectedTreatments.size > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Projected Score</p>
              <p className="text-3xl font-black text-emerald-400 tabular-nums">
                {projectedScores.overallScore}
                <span className="text-sm text-emerald-400/60 ml-1">
                  +{projectedScores.overallImprovement}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className={`p-2 rounded-lg transition ${saveSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'}`}
                title="Save session"
              >
                <FloppyDisk className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const text = `Treatment Preview for ${customerName || 'Customer'}\nProjected Score: ${projectedScores.overallScore} (+${projectedScores.overallImprovement})\nTreatments: ${Array.from(selectedTreatments).join(', ')}`;
                  if (navigator.share) navigator.share({ title: 'Treatment Preview', text });
                  else navigator.clipboard.writeText(text);
                }}
                className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition"
                title="Share"
              >
                <ShareNetwork className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Before → After Score Bar */}
      {selectedTreatments.size > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-emerald-500/10 rounded-2xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Overall Score</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">{skinMetrics.overallScore || 72}</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-400">{projectedScores.overallScore}</span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gray-500 rounded-full absolute top-0 left-0 transition-all"
              style={{ width: `${skinMetrics.overallScore || 72}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full absolute top-0 left-0 transition-all duration-700"
              style={{ width: `${projectedScores.overallScore}%` }}
            />
          </div>

          {/* Per-metric improvements */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {Object.entries(projectedScores.metrics).map(([key, value]) => {
              const original = skinMetrics.visiaScores?.[key];
              if (original === undefined) return null;
              const diff = Math.round(value - original);
              if (diff <= 0) return null;
              const label = METRIC_LABELS[key];
              return (
                <div key={key} className="text-center p-2 bg-black/20 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label?.nameThai || key}</p>
                  <p className="text-sm font-bold text-white tabular-nums">{original} <ArrowRight className="w-3 h-3 inline text-emerald-400" /> {Math.round(value)}</p>
                  <p className="text-xs text-emerald-400">+{diff}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intensity Slider */}
      {selectedTreatments.size > 0 && (
        <div className="flex items-center gap-4 px-2">
          <span className="text-xs text-gray-400 w-20">Conservative</span>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={intensity}
            onChange={e => setIntensity(parseFloat(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <span className="text-xs text-gray-400 w-20 text-right">Aggressive</span>
        </div>
      )}

      {/* Treatment List */}
      <div className="space-y-3">
        {recommendedTreatments.map((treatment, index) => {
          const isSelected = selectedTreatments.has(treatment.id);
          const isExpanded = expandedTreatment === treatment.id;
          const isRecommended = index < 3 && (treatment as any).relevance > 20;

          return (
            <div
              key={treatment.id}
              className={`rounded-2xl border transition-all ${
                isSelected
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
              }`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => toggleTreatment(treatment.id)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-purple-500/20' : 'bg-gray-700/30'
                }`}>
                  <TreatmentIcon
                    type={treatment.icon}
                    className={`w-6 h-6 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                      {treatment.nameThai}
                    </p>
                    {isRecommended && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        <Star weight="fill" className="w-3 h-3 inline mr-0.5" />
                        แนะนำ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{treatment.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <CheckCircle weight="fill" className="w-5 h-5 text-purple-400" />
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setExpandedTreatment(isExpanded ? null : treatment.id);
                    }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-700/30">
                  <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                    <div className="p-2 bg-black/20 rounded-lg">
                      <p className="text-[10px] text-gray-400 uppercase">จำนวนครั้ง</p>
                      <p className="text-xs font-bold text-white">{treatment.sessions}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg">
                      <p className="text-[10px] text-gray-400 uppercase">ราคา (THB)</p>
                      <p className="text-xs font-bold text-white">{treatment.priceRange}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg">
                      <p className="text-[10px] text-gray-400 uppercase">ปรับปรุง</p>
                      <p className="text-xs font-bold text-emerald-400">
                        +{treatment.expectedImprovement.overallScore} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {treatment.targetMetrics.map(m => (
                      <span key={m} className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full">
                        {METRIC_LABELS[m]?.nameThai || m}
                      </span>
                    ))}
                  </div>
                  {onBookTreatment && (
                    <button
                      onClick={() => onBookTreatment(treatment.id)}
                      className="w-full mt-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition"
                    >
                      นัดหมาย {treatment.nameThai}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersThree,
  SpinnerGap,
  ChartPie,
  TrendUp,
  Warning,
  Crown,
  Star,
  UserPlus,
  Eye,
  Heart,
  ArrowRight,
  Pulse,
  CurrencyCircleDollar,
  ShieldWarning,
  Medal,
  Lightning
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SegmentData {
  segment: string;
  label: { th: string; en: string; color: string };
  count: number;
  customers: {
    customerId: string;
    fullName: string;
    totalSpent: number;
    visitCount: number;
    lastVisit: string | null;
  }[];
}

interface CRMAnalytics {
  totalCustomers: number;
  averageCLV: number;
  loyaltyDistribution: { bronze: number; silver: number; gold: number; platinum: number };
  churnRisk: { low: number; medium: number; high: number };
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const SEGMENT_ICONS: Record<string, any> = {
  champions: Crown,
  loyal_customers: Heart,
  new_customers: UserPlus,
  potential_loyalists: Star,
  at_risk: Warning,
  cant_lose_them: Pulse,
  lost: Eye,
  promising: TrendUp,
  need_attention: Warning,
};

export default function CRMPage() {
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'segments' | 'clv' | 'churn'>('segments');

  useEffect(() => { fetchSegmentation(); fetchCRMAnalytics(); }, []);

  const fetchCRMAnalytics = async () => {
    try {
      const res = await fetch('/api/crm/plus-integration?action=analytics');
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch (e) {
      console.error('Failed to fetch CRM analytics:', e);
    }
  };

  const fetchSegmentation = async () => {
    try {
      const res = await fetch('/api/crm/segmentation');
      const data = await res.json();
      if (data.success) {
        // API returns segments as Object { key: { label, count, customers } }
        const segs = data.data.segments;
        if (segs && !Array.isArray(segs)) {
          const arr = Object.entries(segs).map(([key, val]: [string, any]) => ({
            segment: key,
            label: val.label,
            count: val.count,
            customers: (val.customers || []).map((c: any) => ({
              customerId: c.customerId,
              fullName: c.fullName,
              totalSpent: c.totalSpent || 0,
              visitCount: c.visitCount || 0,
              lastVisit: c.lastVisit,
            })),
          }));
          setSegments(arr);
        } else {
          setSegments(segs || []);
        }
        setTotalCustomers(data.data.summary?.total || data.data.totalCustomers || 0);
      }
    } catch (e) {
      console.error('Failed to fetch segmentation:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <UsersThree weight="duotone" className="w-4 h-4" />
            Customer Intelligence
          </div>
          <h1 className="text-2xl font-black tracking-tight">CRM Dashboard</h1>
          <p className="text-sm text-muted-foreground">วิเคราะห์ลูกค้าด้วย RFM Segmentation , CLV และ Churn Risk</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        <Card className="p-5 rounded-2xl border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">ลูกค้าทั้งหมด</p>
          <p className="text-2xl font-black mt-1">{totalCustomers}</p>
        </Card>
        <Card className="p-5 rounded-2xl border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">กลุ่มที่พบ</p>
          <p className="text-2xl font-black mt-1">{segments.length}</p>
        </Card>
        <Card className="p-5 rounded-2xl border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">CLV เฉลี่ย</p>
          <p className="text-2xl font-black mt-1 text-emerald-500">
            {analytics ? `฿${analytics.averageCLV.toLocaleString()}` : '—'}
          </p>
        </Card>
        <Card className="p-5 rounded-2xl border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">เสี่ยงสูง</p>
          <p className="text-2xl font-black mt-1 text-amber-500">
            {analytics ? analytics.churnRisk.high : 0}
          </p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 px-2 overflow-x-auto">
        {([
          { id: 'segments' as const, label: 'RFM Segments', icon: ChartPie },
          { id: 'clv' as const, label: 'CLV & Loyalty', icon: CurrencyCircleDollar },
          { id: 'churn' as const, label: 'Churn Risk', icon: ShieldWarning },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap', activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'bg-secondary text-muted-foreground hover:bg-accent')}>
            <tab.icon weight="duotone" className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'segments' && (<>
      {/* Segment Distribution */}
      <Card className="mx-2 rounded-2xl border-border/50 overflow-hidden">
        <CardHeader className="p-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-tight">
            <ChartPie weight="duotone" className="w-5 h-5 text-primary" />
            การกระจายกลุ่มลูกค้า (RFM Analysis)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Visual Bar Distribution */}
          {totalCustomers > 0 && (
            <div className="flex rounded-xl overflow-hidden h-10 mb-6">
              {segments.filter(s => s.count > 0).map((seg) => (
                <div
                  key={seg.segment}
                  className="h-full transition-all hover:opacity-80 cursor-pointer relative group"
                  style={{
                    width: `${(seg.count / totalCustomers) * 100}%`,
                    backgroundColor: seg.label.color,
                    minWidth: seg.count > 0 ? '2px' : '0',
                  }}
                  onClick={() => setExpandedSegment(expandedSegment === seg.segment ? null : seg.segment)}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2 py-1 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {seg.label.th} ({seg.count})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Segment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {segments.map((seg, i) => {
              const SegIcon = SEGMENT_ICONS[seg.segment] || UsersThree;
              const isExpanded = expandedSegment === seg.segment;
              const pct = totalCustomers > 0 ? ((seg.count / totalCustomers) * 100).toFixed(1) : '0';

              return (
                <motion.div
                  key={seg.segment}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={cn(
                      'rounded-2xl border-border/50 cursor-pointer transition-all hover:shadow-md',
                      isExpanded && 'ring-2 ring-primary/30'
                    )}
                    onClick={() => setExpandedSegment(isExpanded ? null : seg.segment)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${seg.label.color}20`, color: seg.label.color }}
                          >
                            <SegIcon weight="duotone" className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{seg.label.th}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{seg.label.en}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black">{seg.count}</p>
                          <p className="text-[10px] text-muted-foreground">{pct}%</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: seg.label.color }}
                        />
                      </div>

                      {/* Expanded: show top customers */}
                      {isExpanded && seg.customers.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 pt-4 border-t border-border/50 space-y-2"
                        >
                          {seg.customers.slice(0, 5).map((c) => (
                            <div key={c.customerId} className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate">{c.fullName}</span>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                                <span>฿{c.totalSpent.toLocaleString()}</span>
                                <span>{c.visitCount} ครั้ง</span>
                              </div>
                            </div>
                          ))}
                          {seg.customers.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                              +{seg.customers.length - 5} คนเพิ่มเติม
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <Card className="mx-2 rounded-2xl border-border/50 bg-gradient-to-r from-primary/5 to-emerald-500/5">
        <CardHeader className="p-6 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-tight">
            <TrendUp weight="duotone" className="w-5 h-5 text-primary" />
            คำแนะนำเชิงกลยุทธ์
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            {
              segment: 'champions',
              action: 'ให้สิทธิพิเศษ VIP และโปรแกรมแนะนำเพื่อน',
              color: '#10B981',
              count: segments.find(s => s.segment === 'champions')?.count || 0,
            },
            {
              segment: 'at_risk',
              action: 'ส่ง SMS/LINE แจ้งโปรโมชันพิเศษเพื่อดึงกลับ',
              color: '#F59E0B',
              count: segments.find(s => s.segment === 'at_risk')?.count || 0,
            },
            {
              segment: 'new_customers',
              action: 'ส่งข้อเสนอ Welcome Package เพื่อสร้างความผูกพัน',
              color: '#8B5CF6',
              count: segments.find(s => s.segment === 'new_customers')?.count || 0,
            },
            {
              segment: 'lost',
              action: 'ส่งแคมเปญ Win-Back พร้อมส่วนลดพิเศษ',
              color: '#6B7280',
              count: segments.find(s => s.segment === 'lost')?.count || 0,
            },
          ].filter(r => r.count > 0).map((rec, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-2xl">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: rec.color }} />
              <div className="flex-1">
                <p className="text-sm font-bold">{rec.action}</p>
                <p className="text-xs text-muted-foreground">{rec.count} ลูกค้าในกลุ่มนี้</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>)}

      {/* CLV Tab */}
      {activeTab === 'clv' && (
        <Card className="mx-2 rounded-2xl border-border/50 overflow-hidden">
          <CardHeader className="p-6 border-b border-border/50 bg-secondary/30">
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-tight">
              <CurrencyCircleDollar weight="duotone" className="w-5 h-5 text-primary" />
              Customer Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 rounded-2xl border-border/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                <CurrencyCircleDollar weight="duotone" className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest">CLV เฉลี่ย</p>
                <p className="text-3xl font-black text-emerald-500 mt-1">{analytics ? `฿${analytics.averageCLV.toLocaleString()}` : '—'}</p>
              </Card>
              <Card className="p-5 rounded-2xl border-border/50 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                <TrendUp weight="duotone" className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest">มูลค่ารวม</p>
                <p className="text-3xl font-black text-blue-500 mt-1">{analytics ? `฿${(analytics.averageCLV * analytics.totalCustomers).toLocaleString()}` : '—'}</p>
              </Card>
              <Card className="p-5 rounded-2xl border-border/50 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                <Medal weight="duotone" className="w-5 h-5 text-purple-500 mb-2" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Premium Members</p>
                <p className="text-3xl font-black text-purple-500 mt-1">{analytics ? (analytics.loyaltyDistribution.gold + analytics.loyaltyDistribution.platinum) : 0}</p>
              </Card>
            </div>
            {analytics && (
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Medal weight="duotone" className="w-4 h-4 text-primary" /> การกระจายระดับสมาชิก</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(analytics.loyaltyDistribution).map(([tier, count]) => (
                    <Card key={tier} className="p-4 rounded-2xl border-border/50 text-center">
                      <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${TIER_COLORS[tier]}30`, color: TIER_COLORS[tier] }}><Medal weight="fill" className="w-5 h-5" /></div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: TIER_COLORS[tier] }}>{tier}</p>
                      <p className="text-2xl font-black mt-1">{count}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Churn Tab */}
      {activeTab === 'churn' && (
        <Card className="mx-2 rounded-2xl border-border/50 overflow-hidden">
          <CardHeader className="p-6 border-b border-border/50 bg-secondary/30">
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-tight">
              <ShieldWarning weight="duotone" className="w-5 h-5 text-primary" />
              Churn Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {analytics ? (<>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 rounded-2xl border-red-500/20 bg-red-500/5">
                  <ShieldWarning weight="duotone" className="w-5 h-5 text-red-500 mb-2" />
                  <p className="text-xs text-muted-foreground uppercase">เสี่ยงสูง</p>
                  <p className="text-3xl font-black text-red-500 mt-1">{analytics.churnRisk.high}</p>
                  <p className="text-xs text-muted-foreground mt-1">ต้องดำเนินการทันที</p>
                </Card>
                <Card className="p-5 rounded-2xl border-amber-500/20 bg-amber-500/5">
                  <Warning weight="duotone" className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="text-xs text-muted-foreground uppercase">เสี่ยงปานกลาง</p>
                  <p className="text-3xl font-black text-amber-500 mt-1">{analytics.churnRisk.medium}</p>
                  <p className="text-xs text-muted-foreground mt-1">ติดตามภายใน 7 วัน</p>
                </Card>
                <Card className="p-5 rounded-2xl border-emerald-500/20 bg-emerald-500/5">
                  <Heart weight="duotone" className="w-5 h-5 text-emerald-500 mb-2" />
                  <p className="text-xs text-muted-foreground uppercase">เสี่ยงต่ำ</p>
                  <p className="text-3xl font-black text-emerald-500 mt-1">{analytics.churnRisk.low}</p>
                  <p className="text-xs text-muted-foreground mt-1">สถานะดี</p>
                </Card>
              </div>
              <div className="flex rounded-xl overflow-hidden h-8">
                {analytics.churnRisk.high > 0 && <div className="bg-red-500 h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${(analytics.churnRisk.high / analytics.totalCustomers) * 100}%`, minWidth: '20px' }}>{analytics.churnRisk.high}</div>}
                {analytics.churnRisk.medium > 0 && <div className="bg-amber-500 h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${(analytics.churnRisk.medium / analytics.totalCustomers) * 100}%`, minWidth: '20px' }}>{analytics.churnRisk.medium}</div>}
                {analytics.churnRisk.low > 0 && <div className="bg-emerald-500 h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${(analytics.churnRisk.low / analytics.totalCustomers) * 100}%`, minWidth: '20px' }}>{analytics.churnRisk.low}</div>}
              </div>
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Lightning weight="duotone" className="w-4 h-4 text-primary" /> แผนรักษาลูกค้า</h3>
                <div className="space-y-3">
                  {analytics.churnRisk.high > 0 && <div className="flex items-center gap-4 p-4 border border-red-500/20 bg-red-500/5 rounded-2xl"><div className="flex-1"><p className="text-sm font-bold text-red-500">เสี่ยงสูง ({analytics.churnRisk.high} คน)</p><p className="text-xs text-muted-foreground">ส่ง SMS/LINE พร้อมส่วนลด 20% ทันที</p></div><ArrowRight className="w-4 h-4 text-muted-foreground" /></div>}
                  {analytics.churnRisk.medium > 0 && <div className="flex items-center gap-4 p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl"><div className="flex-1"><p className="text-sm font-bold text-amber-500">เสี่ยงปานกลาง ({analytics.churnRisk.medium} คน)</p><p className="text-xs text-muted-foreground">ส่งข้อเสนอพิเศษภายใน 7 วัน</p></div><ArrowRight className="w-4 h-4 text-muted-foreground" /></div>}
                  {analytics.churnRisk.low > 0 && <div className="flex items-center gap-4 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl"><div className="flex-1"><p className="text-sm font-bold text-emerald-500">เสี่ยงต่ำ ({analytics.churnRisk.low} คน)</p><p className="text-xs text-muted-foreground">ส่ง Newsletter รายเดือน</p></div><ArrowRight className="w-4 h-4 text-muted-foreground" /></div>}
                </div>
              </div>
            </>) : <p className="text-sm text-muted-foreground text-center py-8">ไม่สามารถโหลดข้อมูลได้</p>}
          </CardContent>
        </Card>
      )}

    </motion.div>
  );
}

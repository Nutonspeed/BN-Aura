'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Brain,
  TrendUp,
  Warning,
  ChatCircle,
  ChartBar,
  Users,
  CurrencyDollar,
  Sparkle,
  SpinnerGap,
  CaretRight,
  Lightning,
  Monitor,
  Pulse,
  ArrowsClockwise
} from '@phosphor-icons/react';
import AIAdvisorChat from '@/components/analytics/AIAdvisorChat';
import InsightCards from '@/components/analytics/InsightCards';
import AlertCenter from '@/components/analytics/AlertCenter';
import PredictiveDashboard from '@/components/analytics/PredictiveDashboard';
import SalesFunnelChart from '@/components/analytics/SalesFunnelChart';
import { useBusinessAdvisor, useBusinessMetrics, useBusinessAlerts } from '@/hooks/useBusinessAdvisor';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'advisor' | 'alerts' | 'predictions'>('overview');
  const [loading, setLoading] = useState(true);
  
  const { metrics, loading: metricsLoading } = useBusinessMetrics();
  const { alerts, criticalCount, highCount } = useBusinessAlerts();

  useEffect(() => {
    if (!metricsLoading) setLoading(false);
  }, [metricsLoading]);

  const tabs = [
    {
      id: 'overview' as const,
      label: 'ภาพรวม',
      icon: ChartBar,
      badge: null
    },
    {
      id: 'advisor' as const,
      label: 'AI Advisor',
      icon: Brain,
      badge: null
    },
    {
      id: 'alerts' as const,
      label: 'การแจ้งเตือน',
      icon: Warning,
      badge: criticalCount + highCount > 0 ? criticalCount + highCount : null
    },
    {
      id: 'predictions' as const,
      label: 'การทำนาย',
      icon: TrendUp,
      badge: null
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="p-6 bg-primary/10 rounded-[32px] border border-primary/20 shadow-inner"
          >
            <Brain weight="duotone" className="w-16 h-16 text-primary" />
          </motion.div>
          <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full z-[-1] animate-pulse" />
        </div>
        <div className="text-center space-y-3">
          <p className="text-xl font-black text-foreground uppercase tracking-widest">
            กำลังสร้าง <span className="text-primary">ระบบข้อมูล</span>
          </p>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">
            กำลังอัปเดตข้อมูล...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Brain weight="duotone" className="w-4 h-4" />
            ระบบข้อมูลเชิงลึกสำหรับผู้บริหาร
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            การวิเคราะห์ <span className="text-primary">ธุรกิจ</span>ด้วย AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic max-w-2xl leading-relaxed"
          >
            การวิเคราะห์เชิงลึก การคาดการณ์รายได้ และการจัดการความเสี่ยงแบบเรียลไทม์
          </motion.p>
        </div>

        {/* Neural Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-4"
        >
          {metrics && (
            <>
              <Card className="px-6 py-4 bg-secondary/30 border-border/50 shadow-inner group overflow-hidden relative min-w-[160px]">
                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <CurrencyDollar weight="fill" className="w-12 h-12 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="text-xl font-black text-primary tabular-nums tracking-tighter">
                    {metrics.revenue?.formatted || '฿0'}
                  </div>
                  <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                    รายได้รายเดือน
                  </div>
                </div>
              </Card>
              <Card className="px-6 py-4 bg-secondary/30 border-border/50 shadow-inner group overflow-hidden relative min-w-[160px]">
                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <Users weight="fill" className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="relative z-10">
                  <div className="text-xl font-black text-emerald-500 tabular-nums tracking-tighter">
                    {metrics.customers?.formatted || '0 คน'}
                  </div>
                  <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                    ลูกค้าใหม่
                  </div>
                </div>
              </Card>
            </>
          )}
          {(criticalCount + highCount) > 0 && (
            <Card className="px-6 py-4 bg-rose-500/5 border-rose-500/20 shadow-inner group overflow-hidden relative min-w-[120px]">
              <div className="absolute top-0 right-0 p-2 opacity-[0.05] group-hover:scale-110 transition-transform">
                <Warning weight="fill" className="w-12 h-12 text-rose-500" />
              </div>
              <div className="relative z-10 text-center">
                <div className="text-xl font-black text-rose-500 tabular-nums tracking-tighter">
                  {criticalCount + highCount}
                </div>
                <div className="text-[8px] font-black text-rose-400/60 uppercase tracking-widest mt-0.5">
                  ความผิดปกติ
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Protocol Navigation Tabs */}
      <div className="px-2">
        <div className="flex bg-secondary/50 border border-border p-1.5 rounded-[24px] w-fit shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap relative",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-premium"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
              )}
            >
              <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-2 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-glow-sm">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Neural Content Hub */}
      <div className="px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-10">
                {/* Global Metrics Node */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">ตัวชี้วัดสำคัญ</h2>
                  </div>
                  <InsightCards />
                </section>

                {/* Risk Mitigation Node */}
                {alerts.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">บันทึกความผิดปกติ</h2>
                      </div>
                      <Badge variant="ghost" className="bg-rose-500/5 text-rose-500 border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">ตรวจจับแบบเรียลไทม์</Badge>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {alerts.slice(0, 4).map((alert, index) => (
                        <Card 
                          key={index}
                          className={cn(
                            "p-6 rounded-[32px] border transition-all hover:shadow-card-hover group/alert cursor-pointer overflow-hidden relative shadow-card",
                            alert.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/20' :
                            alert.severity === 'high' ? 'bg-amber-500/5 border-amber-500/20' :
                            'bg-blue-500/5 border-blue-500/20'
                          )}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/alert:opacity-[0.03] transition-opacity">
                            <Warning weight="fill" className="w-20 h-20" />
                          </div>
                          <div className="flex items-start gap-5 relative z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-inner",
                              alert.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                              alert.severity === 'high' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                              'bg-blue-500/10 border-blue-500/20 text-blue-500'
                            )}>
                              <Warning weight="duotone" className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <h4 className="font-black text-foreground text-base uppercase tracking-tight leading-tight">
                                {alert.title}
                              </h4>
                              <p className="text-xs text-muted-foreground font-medium italic leading-relaxed line-clamp-2">
                                {alert.description}
                              </p>
                            </div>
                            <CaretRight weight="bold" className="w-4 h-4 text-muted-foreground opacity-0 group-hover/alert:opacity-100 group-hover/alert:translate-x-1 transition-all self-center" />
                          </div>
                        </Card>
                      ))}
                    </div>
                    {alerts.length > 4 && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setActiveTab('alerts')}
                          className="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:bg-primary/5 gap-3 rounded-xl px-8 py-4"
                        >
                          เข้าถึงศูนย์แจ้งเตือน ({alerts.length})
                          <CaretRight weight="bold" className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </section>
                )}

                {/* Cognitive Action Nodes */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">การประสานงานข้อมูล</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card 
                      as="button"
                      onClick={() => setActiveTab('advisor')}
                      className="p-8 border-border/50 hover:border-primary/40 hover:shadow-premium transition-all text-left group overflow-hidden relative shadow-card"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
                        <Brain weight="fill" className="w-32 h-32 text-primary" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                          <ChatCircle weight="duotone" className="w-7 h-7" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">ที่ปรึกษา AI</h3>
                          <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">
                            ปรึกษา AI เพื่อวิเคราะห์กลยุทธ์แบบเรียลไทม์
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest pt-2">
                          เริ่มต้น <CaretRight weight="bold" className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>

                    <Card 
                      as="button"
                      className="p-8 border-border/50 hover:border-emerald-500/40 hover:shadow-premium transition-all text-left group overflow-hidden relative shadow-card"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
                        <TrendUp weight="fill" className="w-32 h-32 text-emerald-500" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner">
                          <ChartBar weight="duotone" className="w-7 h-7" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-emerald-500 transition-colors">รายงานทางการเงิน</h3>
                          <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">
                            เข้าถึงรายงานการตรวจสอบและการคาดการณ์รายได้
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest pt-2">
                          สแกนข้อมูล <CaretRight weight="bold" className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>

                    <Card 
                      as="button"
                      className="p-8 border-border/50 hover:border-blue-500/40 hover:shadow-premium transition-all text-left group overflow-hidden relative shadow-card"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
                        <Users weight="fill" className="w-32 h-32 text-blue-500" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-inner">
                          <Users weight="duotone" className="w-7 h-7" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-blue-500 transition-colors">การดูแลพนักงาน</h3>
                          <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">
                            ติดตามประสิทธิภาพพนักงานและจัดการคิวงาน
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest pt-2">
                          เปิดใช้งาน <CaretRight weight="bold" className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'advisor' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
                <AIAdvisorChat />
              </motion.div>
            )}

            {activeTab === 'predictions' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <SalesFunnelChart 
                  data={[
                    { name: 'ผู้มุ่งหวัง', value: 450, percentage: 100 },
                    { name: 'ผ่านเกณฑ์', value: 280, percentage: 62 },
                    { name: 'ปรึกษาแล้ว', value: 195, percentage: 43 },
                    { name: 'เสนอราคา', value: 140, percentage: 31 },
                    { name: 'ปิดการขาย', value: 85, percentage: 19 },
                  ]}
                  period="เดือนนี้"
                />
                <PredictiveDashboard />
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
                <AlertCenter />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

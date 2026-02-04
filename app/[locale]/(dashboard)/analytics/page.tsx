'use client';

import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendUp, 
  Warning, 
  ChatCircle,
  ChartBar,
  Users,
  CurrencyDollar,
  Sparkle,
  SpinnerGap
} from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import AIAdvisorChat from '@/components/analytics/AIAdvisorChat';
import InsightCards from '@/components/analytics/InsightCards';
import AlertCenter from '@/components/analytics/AlertCenter';
import { useBusinessAdvisor, useBusinessMetrics, useBusinessAlerts } from '@/hooks/useBusinessAdvisor';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'advisor' | 'alerts'>('overview');
  const [loading, setLoading] = useState(true);
  
  const { metrics, loading: metricsLoading } = useBusinessMetrics();
  const { alerts, criticalCount, highCount } = useBusinessAlerts();

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const tabs = [
    {
      id: 'overview' as const,
      label: 'ภาพรวม',
      icon: BarChart3,
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
      icon: AlertTriangle,
      badge: criticalCount + highCount > 0 ? criticalCount + highCount : null
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="p-4 bg-primary/20 rounded-2xl"
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">
            กำลังเตรียม Executive Intelligence
          </p>
          <p className="text-sm text-muted-foreground animate-pulse">
            รวบรวมข้อมูลธุรกิจและเตรียม AI Analysis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary text-sm font-bold uppercase tracking-wider"
          >
            <Brain className="w-5 h-5" />
            Executive Intelligence Suite
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            AI <span className="text-primary text-glow">Business</span> Analytics
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic max-w-2xl"
          >
            ระบบวิเคราะห์ธุรกิจด้วย AI ที่ตอบคำถามเป็นภาษาไทย วิเคราะห์แนวโน้ม และแจ้งเตือนความเสี่ยงอัตโนมัติ
            เพื่อการตัดสินใจที่มีประสิทธิภาพสูงสุด
          </motion.p>
        </div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          {metrics && (
            <>
              <div className="text-center p-4 bg-card/50 border border-border rounded-xl">
                <div className="text-2xl font-bold text-primary">
                  {metrics.revenue?.formatted || '฿0'}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  รายได้เดือนนี้
                </div>
              </div>
              <div className="text-center p-4 bg-card/50 border border-border rounded-xl">
                <div className="text-2xl font-bold text-green-500">
                  {metrics.customers?.formatted || '0 คน'}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  ลูกค้าใหม่
                </div>
              </div>
            </>
          )}
          {(criticalCount + highCount) > 0 && (
            <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="text-2xl font-bold text-red-500">
                {criticalCount + highCount}
              </div>
              <div className="text-xs text-red-400 uppercase tracking-wide">
                การแจ้งเตือน
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-2 p-2 bg-card/30 border border-border rounded-2xl backdrop-blur-sm"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Business Metrics Cards */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <ChartBar className="w-5 h-5 text-primary" />
                ข้อมูลสำคัญ
              </h2>
              <InsightCards />
            </section>

            {/* Recent Alerts Summary */}
            {alerts.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Warning className="w-5 h-5 text-orange-500" />
                  การแจ้งเตือนล่าสุด
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {alerts.slice(0, 4).map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${
                        alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                        alert.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                        'bg-yellow-500/10 border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Warning className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          'text-yellow-500'
                        }`} />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-foreground text-sm">
                            {alert.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {alerts.length > 4 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="px-6 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      ดูการแจ้งเตือนทั้งหมด ({alerts.length})
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Quick Access Actions */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-primary" />
                การดำเนินการด่วน
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.button
                  onClick={() => setActiveTab('advisor')}
                  className="p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all text-left group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <ChatCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">ถาม AI Advisor</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ถามคำถามเกี่ยวกับธุรกิจเป็นภาษาไทย
                  </p>
                </motion.button>

                <motion.button
                  className="p-6 bg-card border border-border rounded-2xl hover:border-green-500/50 transition-all text-left group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <TrendUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">ดูรายงาน</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    รายงานประจำเดือนและการวิเคราะห์แนวโน้ม
                  </p>
                </motion.button>

                <motion.button
                  className="p-6 bg-card border border-border rounded-2xl hover:border-blue-500/50 transition-all text-left group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">จัดการทีม</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ดูประสิทธิภาพพนักงานและการมอบหมายงาน
                  </p>
                </motion.button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'advisor' && (
          <div className="max-w-4xl mx-auto">
            <AIAdvisorChat />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="max-w-4xl mx-auto">
            <AlertCenter />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

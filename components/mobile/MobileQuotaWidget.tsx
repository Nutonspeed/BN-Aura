'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  Pulse,
  TrendUp,
  Users,
  ChartBar
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface MobileQuotaData {
  currentUsage: number;
  monthlyQuota: number;
  utilizationRate: number;
  remainingScans: number;
  willIncurCharge: boolean;
  cacheHitRate: number;
  quotaSavedToday: number;
  clinicName: string;
  lastUpdated: string;
}

interface MobileQuotaWidgetProps {
  compact?: boolean;
  showAlerts?: boolean;
  refreshInterval?: number;
}

export default function MobileQuotaWidget({ 
  compact = false, 
  showAlerts = true, 
  refreshInterval = 60000 
}: MobileQuotaWidgetProps) {
  const [quotaData, setQuotaData] = useState<MobileQuotaData>({
    currentUsage: 0,
    monthlyQuota: 0,
    utilizationRate: 0,
    remainingScans: 0,
    willIncurCharge: false,
    cacheHitRate: 0,
    quotaSavedToday: 0,
    clinicName: 'Loading...',
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotaData();
    const interval = setInterval(fetchQuotaData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchQuotaData = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user's clinic info
        const { data: staffData } = await supabase
          .from('clinic_staff')
          .select(`
            clinic_id,
            clinics(name)
          `)
          .eq('user_id', user.id)
          .single();

        if (staffData?.clinic_id) {
          // Fetch quota information
          const quotaResponse = await fetch(`/api/quota/billing-test?action=quota-config&clinicId=${staffData.clinic_id}`);
          const quotaResult = await quotaResponse.json();

          if (quotaResult.success) {
            const quota = quotaResult.data;
            const utilizationRate = (quota.currentUsage / quota.monthlyQuota) * 100;
            
            setQuotaData({
              currentUsage: quota.currentUsage,
              monthlyQuota: quota.monthlyQuota,
              utilizationRate: Math.round(utilizationRate * 10) / 10,
              remainingScans: Math.max(0, quota.monthlyQuota - quota.currentUsage),
              willIncurCharge: utilizationRate >= 100,
              cacheHitRate: 92,
              quotaSavedToday: 5,
              clinicName: (staffData.clinics as any)?.name || 'Clinic',
              lastUpdated: new Date().toISOString()
            });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quota data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (quotaData.utilizationRate >= 95) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (quotaData.utilizationRate >= 80) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  const getStatusText = () => {
    if (quotaData.utilizationRate >= 95) return 'วิกฤต';
    if (quotaData.utilizationRate >= 80) return 'เตือน';
    return 'ปกติ';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto bg-card border border-border/50 rounded-2xl">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto bg-card border border-red-500/20 rounded-2xl">
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <p className="text-sm">โหลดข้อมูลโควต้าไม่สำเร็จ</p>
            <button 
              onClick={fetchQuotaData}
              className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              แตะเพื่อลองใหม่
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-auto"
      >
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pulse weight="duotone" className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">โควต้า</span>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>
            
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black">{quotaData.remainingScans}</span>
                <span className="text-xs text-muted-foreground">คงเหลือ</span>
              </div>
              
              <div className="mt-2">
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      quotaData.utilizationRate >= 95 ? 'bg-red-500' :
                      quotaData.utilizationRate >= 80 ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(quotaData.utilizationRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-border/50 rounded-2xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pulse weight="duotone" className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-bold">สถานะโควต้า AI</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{quotaData.clinicName}</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Quota Display */}
          <div className="text-center">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground">{quotaData.remainingScans}</span>
              <span className="text-sm text-muted-foreground">สแกนคงเหลือ</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quotaData.currentUsage} of {quotaData.monthlyQuota} ใช้ไป ({quotaData.utilizationRate}%)
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  quotaData.utilizationRate >= 95 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  quotaData.utilizationRate >= 80 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${Math.min(quotaData.utilizationRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-muted-foreground">ประสิทธิภาพแคช</span>
              </div>
              <p className="text-sm font-bold mt-1">{quotaData.cacheHitRate}%</p>
            </div>
            
            <div className="bg-card border border-border/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${quotaData.willIncurCharge ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-xs text-muted-foreground">สถานะ</span>
              </div>
              <p className="text-sm font-bold mt-1">{getStatusText()}</p>
            </div>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {showAlerts && (
              <>
                {quotaData.utilizationRate >= 95 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs text-red-600 font-medium">
                      🚨 Quota เกือบหมด! ระวังค่าใช้จ่ายเพิ่ม
                    </span>
                  </motion.div>
                )}

                {quotaData.quotaSavedToday > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-emerald-600 font-medium">
                      🧠 ประหยัด {quotaData.quotaSavedToday} scans วันนี้
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

          {/* Last Updated */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(quotaData.lastUpdated).toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

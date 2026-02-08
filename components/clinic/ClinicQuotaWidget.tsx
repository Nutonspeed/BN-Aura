'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { 
  Lightning,
  Warning,
  TrendUp,
  Brain,
  ArrowsClockwise,
  ShoppingCart
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface ClinicQuotaWidgetProps {
  clinicId: string;
}

export default function ClinicQuotaWidget({ clinicId }: ClinicQuotaWidgetProps) {
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinicId) {
      fetchQuota();
      const interval = setInterval(fetchQuota, 60000);
      return () => clearInterval(interval);
    }
  }, [clinicId]);

  const fetchQuota = async () => {
    try {
      const res = await fetch(`/api/quota/billing-test?action=quota-config&clinicId=${clinicId}`);
      const result = await res.json();
      if (result.success && result.data) {
        const q = result.data;
        const used = q.currentUsage || 0;
        const total = q.monthlyQuota || 200;
        setQuota({
          used,
          total,
          rate: total > 0 ? Math.round((used / total) * 100) : 0,
          remaining: Math.max(0, total - used),
          plan: q.plan || 'professional',
          resetDate: q.resetDate,
          cacheHits: 12,
          quotaSaved: 8
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <Card className="p-6 animate-pulse h-40" />;

  const rate = quota?.rate || 0;
  const color = rate >= 95 ? 'red' : rate >= 80 ? 'amber' : 'emerald';

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Lightning weight="duotone" className="w-5 h-5 text-purple-500" />
            โควต้าการสแกน AI
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px]">{quota?.plan?.toUpperCase()}</Badge>
            <Button variant="ghost" size="sm" onClick={fetchQuota} className="h-6 w-6 p-0">
              <ArrowsClockwise className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-black">{quota?.remaining || 0}</div>
            <div className="text-xs text-muted-foreground">การสแกนคงเหลือ</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-muted-foreground">{quota?.used}/{quota?.total}</div>
            <div className="text-xs text-muted-foreground">ใช้ไปแล้ว</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(rate, 100)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${rate >= 90 ? "bg-red-500" : rate >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>ใช้ไป {rate}%</span>
            <span>Reset: สิ้นเดือน</span>
          </div>
        </div>

        {rate >= 80 && (
          <div className={`p-2 rounded-lg flex items-center gap-2 ${rate >= 90 ? "bg-red-500/10 border border-red-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
            <Warning weight="fill" className={`w-4 h-4 ${rate >= 90 ? "text-red-500" : "text-amber-500"}`} />
            <span className={`text-xs ${rate >= 90 ? "text-red-500" : "text-amber-500"}`}>
              {rate >= 95 ? '🚨 โควตาใกล้หมด! ควรซื้อ Top-up' : '⚠️ ใช้โควตาไปมากแล้ว'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Brain className="w-4 h-4 mx-auto text-purple-500 mb-1" />
            <div className="text-sm font-bold">{quota?.quotaSaved || 0}</div>
            <div className="text-[9px] text-muted-foreground">บันทึกแคช</div>
          </div>
          <Button variant="outline" size="sm" className="h-auto py-2 flex-col gap-1">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[10px]">ซื้อ Top-up</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

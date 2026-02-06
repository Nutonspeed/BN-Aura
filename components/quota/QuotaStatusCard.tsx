'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuotaStatus {
  quotaRemaining: number;
  quotaLimit: number;
  usagePercent: number;
  daysUntilReset: number;
  plan: string;
  willIncurCharge: boolean;
  overageRate: number;
}

interface QuotaStatusCardProps {
  clinicId: string;
  compact?: boolean;
  onUpgradeClick?: () => void;
}

export default function QuotaStatusCard({ clinicId, compact = false, onUpgradeClick }: QuotaStatusCardProps) {
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotaStatus();
  }, [clinicId]);

  const fetchQuotaStatus = async () => {
    try {
      const res = await fetch(`/api/quota/status?clinicId=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        // Fallback mock data
        setStatus({
          quotaRemaining: 155,
          quotaLimit: 200,
          usagePercent: 22.5,
          daysUntilReset: 12,
          plan: 'Professional',
          willIncurCharge: false,
          overageRate: 60,
        });
      }
    } catch {
      // Fallback mock data
      setStatus({
        quotaRemaining: 155,
        quotaLimit: 200,
        usagePercent: 22.5,
        daysUntilReset: 12,
        plan: 'Professional',
        willIncurCharge: false,
        overageRate: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-2' : ''}>
        <CardContent className={compact ? 'p-2' : 'p-4'}>
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const getStatusColor = () => {
    if (status.usagePercent >= 95) return 'text-red-500';
    if (status.usagePercent >= 80) return 'text-amber-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (status.usagePercent >= 95) return 'bg-red-500';
    if (status.usagePercent >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
        <div className={cn('text-lg font-bold', getStatusColor())}>
          {status.quotaRemaining}
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getProgressColor())}
              style={{ width: `${100 - status.usagePercent}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">/{status.quotaLimit}</span>
      </div>
    );
  }

  return (
    <Card className={cn(
      status.usagePercent >= 95 ? 'border-red-500/50 bg-red-500/5' :
      status.usagePercent >= 80 ? 'border-amber-500/50 bg-amber-500/5' :
      'border-green-500/50 bg-green-500/5'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">AI Scan Quota</h3>
            <p className="text-xs text-muted-foreground">{status.plan} Plan</p>
          </div>
          <div className={cn('text-2xl font-bold', getStatusColor())}>
            {status.quotaRemaining}
            <span className="text-sm text-muted-foreground font-normal">/{status.quotaLimit}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={cn('h-full rounded-full transition-all', getProgressColor())}
            style={{ width: `${status.usagePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>ใช้ไป {status.quotaLimit - status.quotaRemaining} ครั้ง ({status.usagePercent.toFixed(1)}%)</span>
          <span>รีเซ็ตใน {status.daysUntilReset} วัน</span>
        </div>

        {/* Warning Messages */}
        {status.usagePercent >= 95 && (
          <div className="p-2 bg-red-500/10 rounded-lg mb-3">
            <p className="text-xs text-red-500 font-medium">
              ⚠️ โควตาใกล้หมด! การสแกนถัดไปจะมีค่าใช้จ่าย ฿{status.overageRate}/ครั้ง
            </p>
          </div>
        )}

        {status.usagePercent >= 80 && status.usagePercent < 95 && (
          <div className="p-2 bg-amber-500/10 rounded-lg mb-3">
            <p className="text-xs text-amber-600">
              ⚡ โควตาเหลือน้อย แนะนำพิจารณาอัปเกรดแพ็กเกจ
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onUpgradeClick}
          >
            อัปเกรด
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            ซื้อเพิ่ม
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

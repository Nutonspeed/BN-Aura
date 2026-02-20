'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Envelope,
  Phone,
  CalendarDots,
  TrendUp,
  Star,
  ChatCircle,
  SpinnerGap,
  ShoppingBag,
  Sparkle,
  User
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import CustomerTimelineView from '@/components/sales/CustomerTimelineView';
import PredictiveAnalyticsView from '@/components/sales/PredictiveAnalyticsView';
import ConversationHistory from '@/components/sales/ConversationHistory';
import type { TimelineEvent, PredictiveAnalytics } from '@/lib/customer/customerIntelligence';

export default function SalesCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [predictive, setPredictive] = useState<PredictiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // Fetch customer details from API
      const res = await fetch(`/api/customers/${customerId}`);
      const result = await res.json();

      if (result.success && result.data) {
        setCustomer(result.data);
        // Build timeline from available data
        buildTimeline(result.data);
        buildPredictiveData(result.data);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (data: any) => {
    const events: TimelineEvent[] = [];

    // Add skin analyses as timeline events
    if (data.skin_analyses && Array.isArray(data.skin_analyses)) {
      data.skin_analyses.forEach((analysis: any, idx: number) => {
        events.push({
          id: analysis.id || `analysis-${idx}`,
          type: 'appointment',
          title: 'การวิเคราะห์ผิวด้วย AI',
          description: analysis.result_summary || 'ดำเนินการวิเคราะห์สภาพผิว',
          date: analysis.created_at,
          metadata: {
            skinType: analysis.skin_type,
            concerns: analysis.concerns
          }
        });
      });
    }

    // Add treatment journeys
    if (data.customer_treatment_journeys && Array.isArray(data.customer_treatment_journeys)) {
      data.customer_treatment_journeys.forEach((journey: any, idx: number) => {
        events.push({
          id: journey.id || `journey-${idx}`,
          type: 'status_change',
          title: `การรักษา: ${journey.current_stage || 'กำลังดำเนินการ'}`,
          description: journey.notes || 'อัปเดตขั้นตอนการรักษา',
          date: journey.updated_at || journey.created_at,
          metadata: {
            stage: journey.current_stage
          }
        });
      });
    }

    // Add commissions as purchase events
    if (data.sales_commissions && Array.isArray(data.sales_commissions)) {
      data.sales_commissions.forEach((commission: any, idx: number) => {
        events.push({
          id: commission.id || `commission-${idx}`,
          type: 'purchase',
          title: `รายการธุรกรรม: ${commission.transaction_type || 'ขายสำเร็จ'}`,
          description: `ส่วนแบ่ง: ฿${Number(commission.commission_amount || 0).toLocaleString()}`,
          date: commission.transaction_date || commission.created_at,
          metadata: {
            price: commission.base_amount,
            commissionRate: commission.commission_rate
          }
        });
      });
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeline(events);
  };

  const buildPredictiveData = (data: any) => {
    const totalSpent = data.metadata?.total_spent || 0;
    const totalPurchases = data.metadata?.total_purchases || 0;
    const hasRecentActivity = data.skin_analyses?.length > 0 || data.customer_treatment_journeys?.length > 0;

    const churnScore = hasRecentActivity ? 15 : totalPurchases > 0 ? 35 : 65;
    const churnLevel = churnScore > 50 ? 'high' : churnScore > 30 ? 'medium' : 'low';
    const factors: string[] = [];
    if (!hasRecentActivity) factors.push('ไม่พบกิจกรรมล่าสุด');
    if (totalPurchases === 0) factors.push('ไม่พบประวัติการซื้อ');
    if (totalSpent === 0) factors.push('ยังไม่มีมูลค่าการซื้อ');
    if (factors.length === 0) factors.push('มีการตอบรับสม่ำเสมอ');

    setPredictive({
      churnRisk: { score: churnScore, level: churnLevel as 'low' | 'medium' | 'high', factors },
      ltv: {
        current: totalSpent,
        predicted: Math.max(totalSpent * 2.5, 15000)
      },
      nextBestAction: {
        action: totalPurchases === 0
          ? 'นัดหมายปรึกษาผิวฟรี'
          : 'แนะนำคอร์สพรีเมียมเพิ่มเติม',
        reason: totalPurchases === 0
          ? 'ลูกค้าใหม่ที่ยังไม่มีประวัติการซื้อ — การปรึกษาฟรีช่วยสร้างความไว้วางใจได้'
          : `Customer has spent ฿${totalSpent.toLocaleString()} — ready for premium upsell based on treatment history.`,
        confidence: hasRecentActivity ? 82 : 68
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">ไม่พบลูกค้า</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> กลับ
        </Button>
      </div>
    );
  }

  const totalSpent = customer.metadata?.total_spent || 0;
  const totalPurchases = customer.metadata?.total_purchases || 0;
  const loyaltyPoints = Array.isArray(customer.loyalty_points)
    ? customer.loyalty_points.reduce((sum: number, lp: any) => sum + (lp.points || 0), 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft weight="bold" className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {customer.full_name || 'ไม่ระบุชื่อ'}
          </h1>
          <p className="text-sm text-muted-foreground">ข้อมูลส่วนบุคคล</p>
        </div>
        <Button
          onClick={() => router.push(`/th/sales/chat?customerId=${customerId}`)}
          className="gap-2"
        >
          <ChatCircle weight="bold" className="w-4 h-4" />
          แชทคุยกับลูกค้า
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black">
              {(customer.full_name || '?').charAt(0)}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">ข้อมูลติดต่อ</h3>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Envelope className="w-4 h-4 text-muted-foreground" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {customer.phone}
                  </div>
                )}
                {customer.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDots className="w-4 h-4 text-muted-foreground" />
                    {new Date(customer.date_of_birth).toLocaleDateString('th-TH')}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">มูลค่าลูกค้า</h3>
                <div className="flex items-center gap-2">
                  <TrendUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-lg font-bold">฿{totalSpent.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">ยอดซื้อสะสม</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">{totalPurchases}</span>
                  <span className="text-xs text-muted-foreground">จำนวนครั้งที่ซื้อ</span>
                </div>
                {loyaltyPoints > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">{loyaltyPoints}</span>
                    <span className="text-xs text-muted-foreground">คะแนนสะสม</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">สถานะ</h3>
                <Badge className="bg-primary/10 text-primary">{customer.status || 'active'}</Badge>
                {customer.metadata?.skin_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkle className="w-4 h-4 text-purple-500" />
                    สภาพผิว: {customer.metadata.skin_type}
                  </div>
                )}
                {customer.metadata?.gender && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {customer.metadata.gender}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">ยอดซื้อสะสม</p>
          <p className="text-xl font-bold mt-1">฿{totalSpent.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">จำนวนรายการที่ซื้อ</p>
          <p className="text-xl font-bold mt-1">{totalPurchases}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">คะแนนสะสม</p>
          <p className="text-xl font-bold mt-1">{loyaltyPoints}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">ผลการวิเคราะห์ผิว</p>
          <p className="text-xl font-bold mt-1">{customer.skin_analyses?.length || 0}</p>
        </Card>
      </div>

      {/* Predictive Analytics */}
      {predictive && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendUp weight="duotone" className="w-6 h-6 text-emerald-500" />
              การวิเคราะห์เชิงลึกโดย AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PredictiveAnalyticsView data={predictive} />
          </CardContent>
        </Card>
      )}

      {/* ประวัติกิจกรรมลูกค้า */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CalendarDots weight="duotone" className="w-6 h-6 text-primary" />
            ประวัติกิจกรรมลูกค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerTimelineView events={timeline} />
        </CardContent>
      </Card>

      {/* ประวัติการแชท */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ChatCircle weight="duotone" className="w-6 h-6 text-blue-500" />
            ประวัติการแชท
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConversationHistory customerId={customerId} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

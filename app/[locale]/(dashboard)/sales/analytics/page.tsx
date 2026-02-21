'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import UnifiedCommissionTracker from '@/components/sales/UnifiedCommissionTracker';
import AICoachInsights from '@/components/sales/AICoachInsights';
import AICoachLeaderboard from '@/components/sales/AICoachLeaderboard';
import { 
  TrendUp, 
  Users, 
  Coins, 
  ChartBar, 
  ChartPie, 
  Pulse, 
  Sparkle, 
  Trophy,
  ChartLine 
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function SalesAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    dailyRevenue: [],
    customerGrowth: [],
    conversionRates: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const generateAnalyticsData = (customers: any[], transactions: any[]) => {
    const dailyRevenue: any[] = [];
    const customerGrowth: any[] = [];
    const conversionRates: any[] = [];
    
    // Generate last 7 days data
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      
      // Revenue data
      const dayRevenue = transactions
        .filter(t => {
          const tDate = new Date(t.created_at);
          return tDate.getDate() === date.getDate() && tDate.getMonth() === date.getMonth();
        })
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
        
      dailyRevenue.push({
        date: dateStr,
        revenue: dayRevenue,
        target: 5000 // Mock target for visualization
      });
      
      // Customer growth data
      const dayCustomers = customers.filter(c => {
        const cDate = new Date(c.created_at);
        return cDate.getDate() === date.getDate() && cDate.getMonth() === date.getMonth();
      }).length;
      
      const dayConverted = customers.filter(c => {
        const cDate = new Date(c.created_at);
        return cDate.getDate() === date.getDate() && cDate.getMonth() === date.getMonth() && c.status === 'converted';
      }).length;
      
      customerGrowth.push({
        date: dateStr,
        total: dayCustomers,
        converted: dayConverted
      });
    }

    // Conversion rates by urgency
    const urgencyLevels = ['High', 'Medium', 'Low'];
    urgencyLevels.forEach((level, idx) => {
      conversionRates.push({
        urgency: level === 'High' ? 'ด่วนมาก (>70%)' : level === 'Medium' ? 'ปานกลาง (40-70%)' : 'ทั่วไป (<40%)',
        rate: level === 'High' ? 85 : level === 'Medium' ? 45 : 15,
        count: level === 'High' ? 12 : level === 'Medium' ? 25 : 48
      });
    });

    // Performance metrics
    const performanceMetrics = {
      avgDealSize: transactions.length > 0 
        ? Math.round(transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0) / transactions.length) 
        : 0,
      conversionTime: 14, // Days
      customerLifetime: 8, // Months
      retentionRate: 78 // Percent
    };

    return {
      dailyRevenue,
      customerGrowth,
      conversionRates,
      performanceMetrics
    };
  };

  const fetchAnalyticsData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch customers
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .eq('assigned_sales_id', user.id);
          
        if (customers) {
          // Fetch transactions
          const { data: assignedCustomers } = await supabase
            .from('customers')
            .select('id')
            .eq('assigned_sales_id', user.id);
            
          const customerIds = assignedCustomers?.map(c => c.id) || [];
          let transactionsData: any[] = [];
          
          if (customerIds.length > 0) {
            const { data } = await supabase
              .from('pos_transactions')
              .select('*')
              .in('customer_id', customerIds)
              .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
              .order('created_at', { ascending: false });
            transactionsData = data || [];
          }
          
          setAnalyticsData(generateAnalyticsData(customers, transactionsData));
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <ChartBar weight="duotone" className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-black uppercase tracking-tight">Analytics & รายได้</h1>
      </div>

      {/* Commission Tracker Section */}
      <Card className="rounded-2xl border-border/50">
        <UnifiedCommissionTracker />
      </Card>

      {/* Advanced Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-3">
          <ChartLine weight="duotone" className="w-6 h-6 text-primary" />
          การวิเคราะห์ข้อมูลและสถิติยอดขาย
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <Card className="p-6 rounded-2xl border-border/50">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-3">
                <TrendUp weight="duotone" className="w-5 h-5 text-emerald-500" />
                สถิติรายได้รายวัน
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={analyticsData.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `฿${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: any) => [
                        `฿${value.toLocaleString()}`, 
                        name === 'revenue' ? 'รายได้' : 'เป้าหมายประจำวัน'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Customer Growth Chart */}
          <Card className="p-6 rounded-2xl border-border/50">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-3">
                <Users weight="duotone" className="w-5 h-5 text-blue-500" />
                อัตราการเพิ่มขึ้นของลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={analyticsData.customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: any) => [
                        value, 
                        name === 'total' ? 'จำนวนลูกค้าทั้งหมด' : 'ปิดการขายสำเร็จ'
                      ]}
                    />
                    <Bar dataKey="total" fill="#3B82F6" opacity={0.8} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="converted" fill="#10B981" opacity={0.9} radius={[2, 2, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">ยอดซื้อเฉลี่ยต่อบิล</p>
                <p className="text-xl font-bold mt-1">
                  ฿{analyticsData.performanceMetrics.avgDealSize?.toLocaleString() || '0'}
                </p>
              </div>
              <Coins className="w-6 h-6 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">ระยะเวลาปิดการขายเฉลี่ย</p>
                <p className="text-xl font-bold mt-1">
                  {analyticsData.performanceMetrics.conversionTime != null ? `${analyticsData.performanceMetrics.conversionTime} วัน` : <span className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</span>}
                </p>
              </div>
              <Pulse className="w-6 h-6 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">อายุการเป็นลูกค้า (Lifetime Value)</p>
                <p className="text-xl font-bold mt-1">
                  {analyticsData.performanceMetrics.customerLifetime != null ? `${analyticsData.performanceMetrics.customerLifetime} เดือน` : <span className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</span>}
                </p>
              </div>
              <ChartPie className="w-6 h-6 text-amber-500" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-rose-500/5 to-pink-500/5 border-rose-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">อัตราการกลับมาซื้อซ้ำ</p>
                <p className="text-xl font-bold mt-1">
                  {analyticsData.performanceMetrics.retentionRate != null ? `${analyticsData.performanceMetrics.retentionRate}%` : <span className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</span>}
                </p>
              </div>
              <TrendUp className="w-6 h-6 text-rose-500" />
            </div>
          </Card>
        </div>

        {/* Conversion Rate by Urgency */}
        <Card className="p-6 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-3">
              <ChartBar weight="duotone" className="w-5 h-5 text-purple-500" />
              อัตราปิดการขายตามความสำคัญ
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              {analyticsData.conversionRates.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-semibold text-sm">{item.urgency}</p>
                      <p className="text-xs text-muted-foreground">{item.count} ราย</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkle weight="duotone" className="w-6 h-6 text-purple-400" />
              บทวิเคราะห์ประสิทธิภาพโดย AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AICoachInsights />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy weight="duotone" className="w-6 h-6 text-amber-400" />
              อันดับที่ปรึกษาฝ่ายขาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AICoachLeaderboard />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

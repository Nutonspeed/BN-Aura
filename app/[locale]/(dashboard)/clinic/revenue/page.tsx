'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CurrencyDollar, TrendUp, ChartBar, Wallet } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function RevenueAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <CurrencyDollar weight="duotone" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Revenue Analytics</h1>
          <p className="text-sm text-muted-foreground">Financial Intelligence Center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '฿0', icon: CurrencyDollar, color: 'text-emerald-500' },
          { title: 'Growth', value: '+0%', icon: TrendUp, color: 'text-blue-500' },
          { title: 'Avg Transaction', value: '฿0', icon: ChartBar, color: 'text-primary' },
          { title: 'Balance', value: '฿0', icon: Wallet, color: 'text-amber-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 rounded-2xl border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
              </div>
              <stat.icon weight="duotone" className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Analytics & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <ChartBar weight="duotone" className="w-6 h-6 text-primary" />
              Financial Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Advanced financial analytics active</p>
                <p className="text-sm mt-2">Real-time revenue tracking and insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <TrendUp weight="duotone" className="w-6 h-6 text-emerald-500" />
              Enhanced Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Enhanced reporting capabilities</p>
                <p className="text-sm mt-2">Comprehensive financial intelligence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Sparkles, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClinicDashboard() {
  const stats = [
    { 
      label: 'Monthly Revenue', 
      value: '฿425,000', 
      change: '+12.5%', 
      trend: 'up',
      icon: TrendingUp 
    },
    { 
      label: 'Total Scans', 
      value: '1,284', 
      change: '+18.2%', 
      trend: 'up',
      icon: Sparkles 
    },
    { 
      label: 'Active Customers', 
      value: '856', 
      change: '+5.4%', 
      trend: 'up',
      icon: Users 
    },
    { 
      label: 'Appointments', 
      value: '42', 
      change: '-2.1%', 
      trend: 'down',
      icon: Calendar 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground font-light italic">Welcome back to BN-Aura Management Suite.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
            Download Report
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-premium hover:brightness-110 transition-all">
            + New Appointment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <stat.icon className="w-12 h-12 text-primary" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <p className="text-sm font-light text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className={cn(
                  "text-xs font-medium flex items-center",
                  stat.trend === 'up' ? "text-emerald-400" : "text-rose-400"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 glass-card p-8 rounded-3xl min-h-[400px] flex flex-col justify-center items-center text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-white">Revenue Analytics</h3>
          <p className="text-muted-foreground max-w-xs font-light">
            Interactive charts will be integrated here using Recharts in the next phase.
          </p>
        </motion.div>

        {/* AI Usage Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 rounded-3xl space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">AI Quota (BN-Aura)</h3>
            <Zap className="w-5 h-5 text-primary animate-pulse" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Scans</span>
                <span className="text-white font-medium">784 / 1,000</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[78.4%] rounded-full" />
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <p className="text-xs text-muted-foreground">Usage tracked via</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">Vercel AI Gateway</span>
              </div>
            </div>

            <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
              Upgrade Plan
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

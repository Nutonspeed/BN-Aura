'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Heart, Sparkle, Clock, CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function TreatmentsManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Heart weight="duotone" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Treatments Management</h1>
          <p className="text-sm text-muted-foreground">Service Protocol Center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Active Treatments', value: '0', icon: Heart, color: 'text-pink-500' },
          { title: 'Completed', value: '0', icon: CheckCircle, color: 'text-emerald-500' },
          { title: 'Pending', value: '0', icon: Clock, color: 'text-amber-500' },
          { title: 'Popular', value: '-', icon: Sparkle, color: 'text-primary' },
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

      {/* Treatment Protocols & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <Sparkle weight="duotone" className="w-6 h-6 text-primary" />
              Treatment Protocols
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Advanced treatment management active</p>
                <p className="text-sm mt-2">Protocol scheduling and tracking system</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-8 rounded-2xl border-border/50">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
              <Clock weight="duotone" className="w-6 h-6 text-amber-500" />
              Scheduling Center
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Enhanced scheduling capabilities</p>
                <p className="text-sm mt-2">Real-time appointment coordination</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

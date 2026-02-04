'use client';

import { motion } from 'framer-motion';
import { Lightning, Buildings } from '@phosphor-icons/react';

interface TopClinicsChartProps {
  data: { clinic: string; scans: number }[];
  formatNumber: (num: number) => string;
}

export default function TopClinicsChart({ data, formatNumber }: TopClinicsChartProps) {
  const maxScans = Math.max(...data.map(item => item.scans));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card p-8 rounded-3xl border border-white/10"
    >
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <Lightning className="w-5 h-5 text-primary" />
        Top AI Usage Clinics
      </h2>
      
      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((item, index) => (
            <motion.div
              key={item.clinic}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex items-center gap-2">
                  <Buildings className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{item.clinic}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Progress Bar */}
                <div className="w-20 bg-white/10 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.scans / maxScans) * 100}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/60"
                  />
                </div>
                
                <span className="font-bold text-white min-w-[80px] text-right">
                  {formatNumber(item.scans)} scans
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightning className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No AI usage data available</p>
        </div>
      )}
    </motion.div>
  );
}

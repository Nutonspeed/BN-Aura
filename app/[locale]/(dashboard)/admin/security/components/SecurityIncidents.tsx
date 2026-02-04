'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from '@phosphor-icons/react';

interface SecurityIncidentsProps {
  resolvedIncidents: number;
  activeIncidents: number;
}

export default function SecurityIncidents({ resolvedIncidents, activeIncidents }: SecurityIncidentsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" />
        Security Incidents
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-emerald-700/80 rounded-lg border-2 border-emerald-600">
          <p className="text-4xl font-bold text-white">{resolvedIncidents}</p>
          <p className="text-base text-gray-200 font-semibold">Resolved</p>
        </div>
        <div className="text-center p-4 bg-red-700/80 rounded-lg border-2 border-red-600">
          <p className="text-4xl font-bold text-white">{activeIncidents}</p>
          <p className="text-base text-gray-200 font-semibold">Active</p>
        </div>
      </div>
    </motion.div>
  );
}

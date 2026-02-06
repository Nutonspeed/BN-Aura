'use client';

import { useSalesPresence } from '@/lib/realtime/salesPresence';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users } from '@phosphor-icons/react';

interface SalesPresenceIndicatorProps {
  clinicId: string;
  userId: string;
}

export default function SalesPresenceIndicator({ clinicId, userId }: SalesPresenceIndicatorProps) {
  const { onlineUsers } = useSalesPresence(clinicId, userId);

  // Filter out self if needed, or show everyone. Let's show everyone including self but distinguish self.
  const othersOnline = onlineUsers.filter(u => u.userId !== userId);
  
  if (onlineUsers.length <= 1) {
    return null; // Don't show if only self is online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {onlineUsers.length} Online
          </span>
        </div>

        <div className="flex -space-x-2">
          <AnimatePresence>
            {othersOnline.slice(0, 3).map((user, i) => (
              <motion.div
                key={user.userId}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                  {/* Initials placeholder if we had names, or generic icon */}
                  <User className="w-3 h-3" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  User {user.userId.slice(0, 4)}...
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {othersOnline.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              +{othersOnline.length - 3}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}